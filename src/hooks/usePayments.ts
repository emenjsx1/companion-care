import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  payment_date: string | null;
  due_date: string | null;
  description: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  student_name?: string;
}

export interface PaymentInsert {
  student_id: string;
  amount: number;
  status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  payment_date?: string;
  description?: string;
  payment_method?: string;
}

export interface PaymentReport {
  totalRevenue: number;
  totalPending: number;
  byMonth: Array<{
    month: string;
    revenue: number;
    pending: number;
  }>;
}

export const usePayments = (filters?: { startDate?: string; endDate?: string; studentId?: string }) => {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter on the effective date of the payment (payment_date when set,
      // otherwise created_at). Dates are inclusive on both ends.
      const start = filters?.startDate;
      const end = filters?.endDate;
      if (start || end) {
        const startTs = start ? `${start}T00:00:00` : '1900-01-01T00:00:00';
        const endTs = end ? `${end}T23:59:59.999` : '2999-12-31T23:59:59';
        const startDay = start || '1900-01-01';
        const endDay = end || '2999-12-31';
        query = query.or(
          `and(payment_date.gte.${startDay},payment_date.lte.${endDay}),` +
          `and(payment_date.is.null,created_at.gte.${startTs},created_at.lte.${endTs})`
        );
      }
      if (filters?.studentId) {
        query = query.eq('student_id', filters.studentId);
      }

      const { data: payments, error: paymentsError } = await query;

      if (paymentsError) throw paymentsError;

      const studentIds = [...new Set(payments.map(p => p.student_id))];
      const { data: students } = studentIds.length
        ? await supabase.from('students').select('id, user_id').in('id', studentIds)
        : { data: [] as { id: string; user_id: string }[] };

      const userIds = [...new Set((students ?? []).map(s => s.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds)
        : { data: [] as { user_id: string; full_name: string }[] };

      const studentMap = new Map((students ?? []).map(s => [s.id, s]));
      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

      const result = payments.map(payment => {
        const student = studentMap.get(payment.student_id);
        const profile = student ? profileMap.get(student.user_id) : undefined;
        return {
          ...payment,
          student_name: profile?.full_name || 'Desconhecido',
        };
      });

      return result as Payment[];
    },
  });
};

export const usePaymentReport = (year?: number) => {
  return useQuery({
    queryKey: ['payment-report', year],
    queryFn: async (): Promise<PaymentReport> => {
      const targetYear = year || new Date().getFullYear();
      const startDate = `${targetYear}-01-01`;
      const endDate = `${targetYear}-12-31`;

      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, payment_date, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const totalRevenue = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalPending = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Group by month using payment_date or created_at
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const byMonth = monthNames.map((month, index) => {
        const monthPayments = payments?.filter(p => {
          const dateStr = p.payment_date || p.created_at;
          const date = new Date(dateStr);
          return date.getMonth() === index;
        }) || [];

        return {
          month,
          revenue: monthPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
          pending: monthPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
        };
      });

      return { totalRevenue, totalPending, byMonth };
    },
  });
};

export const useStudentDebt = (studentId: string | null) => {
  return useQuery({
    queryKey: ['student-debt', studentId],
    queryFn: async () => {
      if (!studentId) return { total: 0, payments: [] };

      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      const total = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return { total, payments: payments || [] };
    },
    enabled: !!studentId,
  });
};

export interface CreatePaymentOptions {
  autoCreatePending?: boolean; // Auto-create pending payment for remaining balance
}

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ payment, options }: { payment: PaymentInsert; options?: CreatePaymentOptions }) => {
      // Auto-fill payment_date when status is 'paid' and no date provided
      const paymentData = { ...payment };
      if (payment.status === 'paid' && !payment.payment_date) {
        paymentData.payment_date = new Date().toISOString().split('T')[0];
      }
      
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;

      // REMOVED: Auto-create pending payment logic
      // User will manually register payments as needed

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-history'] });
      queryClient.invalidateQueries({ queryKey: ['students-with-debt'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({ title: 'Pagamento registado!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao registar pagamento', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, student_name: _student_name, ...payment }: Partial<Payment> & { id: string }) => {
      // Auto-fill payment_date when status changes to 'paid' and no date provided
      const paymentData = { ...payment };
      if (payment.status === 'paid' && !payment.payment_date) {
        paymentData.payment_date = new Date().toISOString().split('T')[0];
      }
      
      const { data, error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-history'] });
      queryClient.invalidateQueries({ queryKey: ['students-with-debt'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast({ title: 'Pagamento atualizado!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao atualizar', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-history'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['all-students-financial'] });
      queryClient.invalidateQueries({ queryKey: ['student-financial-details'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-financials'] });
      queryClient.invalidateQueries({ queryKey: ['students-with-debt'] });
      queryClient.invalidateQueries({ queryKey: ['payment-evolution'] });
      toast({ title: 'Pagamento eliminado!' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao eliminar', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

// Export to CSV
export const exportPaymentsToCSV = (payments: Payment[]) => {
  const headers = ['Aluno', 'Valor', 'Data Pagamento', 'Método', 'Estado', 'Descrição'];
  const rows = payments.map(p => [
    p.student_name,
    p.amount.toString(),
    p.payment_date || '',
    p.payment_method || '',
    p.status,
    p.description || '',
  ]);

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pagamentos_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
