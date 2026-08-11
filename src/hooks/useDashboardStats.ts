import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalActiveStudents: number;
  studentsThisMonth: number;
  monthlyRevenue: number;
  pendingExams: number;
  pendingPayments: number;
  pendingAmount: number;
}

export interface MonthlyData {
  month: string;
  year: number;
  students: number;
  revenue: number;
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Count active students
      const { count: activeCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Count students this month
      const { count: monthCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth);

      // Get students with courses to calculate real pending values
      const { data: students } = await supabase
        .from('students')
        .select('id, course_id');
      
      const courseIds = [...new Set(students?.map(s => s.course_id).filter(Boolean))] as string[];
      const { data: courses } = await supabase
        .from('courses')
        .select('id, price')
        .in('id', courseIds.length > 0 ? courseIds : ['no-match']);

      // Sum monthly revenue - use updated_at as fallback when payment_date is NULL
      const { data: payments } = await supabase
        .from('payments')
        .select('student_id, amount, status, payment_date, updated_at');

      // Filter payments by month in-memory (payment_date can be NULL)
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const paidPayments = payments?.filter(p => p.status === 'paid') || [];
      
      const monthlyRevenue = paidPayments.filter(p => {
        const payDate = p.payment_date || p.updated_at?.split('T')[0];
        if (!payDate) return false;
        const date = new Date(payDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }).reduce((sum, p) => sum + Number(p.amount), 0);

      // Count pending exams
      const { count: pendingExams } = await supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      // Calculate pending amount as: sum of (coursePrice - totalPaid) for each student
      let pendingAmount = 0;
      let studentsWithDebt = 0;
      
      for (const student of students || []) {
        const course = courses?.find(c => c.id === student.course_id);
        const coursePrice = course ? Number(course.price) : 0;
        
        const studentPaidPayments = paidPayments.filter(p => p.student_id === student.id);
        const totalPaid = studentPaidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        
        // Calculate remaining balance
        const remaining = Math.max(0, coursePrice - totalPaid);
        
        if (remaining > 0) {
          pendingAmount += remaining;
          studentsWithDebt++;
        }
      }

      return {
        totalActiveStudents: activeCount || 0,
        studentsThisMonth: monthCount || 0,
        monthlyRevenue,
        pendingExams: pendingExams || 0,
        pendingPayments: studentsWithDebt,
        pendingAmount,
      };
    },
  });
};

export const useMonthlyChartData = () => {
  return useQuery({
    queryKey: ['monthly-chart-data'],
    queryFn: async (): Promise<{ studentsData: MonthlyData[], revenueData: MonthlyData[] }> => {
      const now = new Date();
      const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      // Get students created in last 12 months
      const { data: students } = await supabase
        .from('students')
        .select('created_at')
        .gte('created_at', twelveMonthsAgo.toISOString());

      // Get paid payments - fetch all and filter in memory since payment_date can be NULL
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_date, updated_at')
        .eq('status', 'paid');

      // Generate last 12 months
      const months: MonthlyData[] = [];
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Count students for this month
        const studentCount = students?.filter(s => {
          const createdDate = new Date(s.created_at);
          return createdDate.getFullYear() === date.getFullYear() && 
                 createdDate.getMonth() === date.getMonth();
        }).length || 0;

        // Sum revenue for this month - use updated_at as fallback
        const monthRevenue = payments?.filter(p => {
          const payDate = p.payment_date || p.updated_at?.split('T')[0];
          if (!payDate) return false;
          const paymentDate = new Date(payDate);
          return paymentDate.getFullYear() === date.getFullYear() && 
                 paymentDate.getMonth() === date.getMonth();
        }).reduce((sum, p) => sum + Number(p.amount), 0) || 0;

        months.push({
          month: monthNames[date.getMonth()],
          year: date.getFullYear(),
          students: studentCount,
          revenue: monthRevenue,
        });
      }

      return {
        studentsData: months,
        revenueData: months,
      };
    },
  });
};

export const useRecentAlerts = () => {
  return useQuery({
    queryKey: ['recent-alerts'],
    queryFn: async () => {
      // Get recent pending payments to show as reminders
      const { data: pendingPayments } = await supabase
        .from('payments')
        .select('id, amount, student_id, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!pendingPayments || pendingPayments.length === 0) return [];

      // Get student IDs to fetch names
      const studentIds = pendingPayments.map(p => p.student_id);

      // Fetch student user_ids
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id')
        .in('id', studentIds);

      // Fetch profiles
      const userIds = students?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const getStudentName = (studentId: string) => {
        const student = students?.find(s => s.id === studentId);
        const profile = profiles?.find(p => p.user_id === student?.user_id);
        return profile?.full_name || 'Aluno';
      };

      const alerts = pendingPayments.map(p => ({
        type: 'info' as const,
        message: `${getStudentName(p.student_id)} - Pagamento pendente (${formatCurrency(Number(p.amount))})`,
        date: `Criado em ${new Date(p.created_at).toLocaleDateString('pt-MZ')}`,
      }));

      return alerts;
    },
  });
};

// Helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
