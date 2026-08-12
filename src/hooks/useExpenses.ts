import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert {
  amount: number;
  reason: string;
  expense_date: string;
  notes?: string | null;
}

export const useExpenses = (filters?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async (): Promise<Expense[]> => {
      let query = supabase.from('expenses').select('*').order('expense_date', { ascending: false });
      if (filters?.startDate) query = query.gte('expense_date', filters.startDate);
      if (filters?.endDate) query = query.lte('expense_date', filters.endDate);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) as Expense[];
    },
  });
};

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: ExpenseInsert) => {
      const { data, error } = await supabase.from('expenses').insert(expense).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Saída registada!');
    },
    onError: (e: Error) => toast.error(`Erro ao registar saída: ${e.message}`),
  });
};

export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...expense }: Partial<ExpenseInsert> & { id: string }) => {
      const { error } = await supabase.from('expenses').update(expense).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Saída actualizada!');
    },
    onError: (e: Error) => toast.error(`Erro ao actualizar: ${e.message}`),
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Saída eliminada!');
    },
    onError: (e: Error) => toast.error(`Erro ao eliminar: ${e.message}`),
  });
};
