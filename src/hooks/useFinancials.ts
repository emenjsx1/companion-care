import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeTotalDue } from '@/lib/ledger';

export interface FinancialSummary {
  totalRevenue: number;
  totalPending: number;
  totalExpenses: number;
  netBalance: number;
  studentsWithDebt: number;
}

export interface StudentDebt {
  studentId: string;
  studentName: string;
  phone: string | null;
  email: string;
  courseName: string | null;
  coursePrice: number;
  totalPaid: number;
  totalDebt: number; // This is now: coursePrice - totalPaid
  pendingPayments: number;
  lastPaymentDate: string | null;
}

export interface MonthlyFinancial {
  month: string;
  year: number;
  revenue: number;
  pending: number;
}

export const useFinancialSummary = (filters?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['financial-summary', filters],
    queryFn: async (): Promise<FinancialSummary> => {
      // Get students with courses to calculate real values
      const { data: students } = await supabase
        .from('students')
        .select('id, course_id, agreed_fee, discount');
      
      const courseIds = [...new Set(students?.map(s => s.course_id).filter(Boolean))] as string[];
      const { data: courses } = await supabase
        .from('courses')
        .select('id, price')
        .in('id', courseIds);

      const { data: allPayments } = await supabase
        .from('payments')
        .select('student_id, amount, status');

      // Calculate real values based on course prices and payments
      let totalRevenue = 0; // Total paid
      let totalPending = 0; // Total remaining (coursePrice - totalPaid for each student)
      let studentsWithDebt = 0;

      for (const student of students || []) {
        const course = courses?.find(c => c.id === student.course_id);
        const coursePrice = course ? Number(course.price) : 0;
        
        const studentPayments = allPayments?.filter(p => p.student_id === student.id) || [];
        const paidPayments = studentPayments.filter(p => p.status === 'paid');
        const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        
        // Add to total revenue
        totalRevenue += totalPaid;
        
        // Calculate remaining balance
        const totalDue = computeTotalDue(student.agreed_fee, coursePrice, student.discount);
        const remaining = Math.max(0, totalDue - totalPaid);
        
        if (remaining > 0) {
          totalPending += remaining;
          studentsWithDebt++;
        }
      }

      const totalExpenses = 0;
      const netBalance = totalRevenue - totalExpenses;

      return {
        totalRevenue,
        totalPending,
        totalExpenses,
        netBalance,
        studentsWithDebt,
      };
    },
  });
};

export const useStudentsWithDebt = () => {
  return useQuery({
    queryKey: ['students-with-debt'],
    queryFn: async (): Promise<StudentDebt[]> => {
      // Fetch all students
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, course_id, agreed_fee, discount');

      if (!students || students.length === 0) return [];

      // Fetch profiles
      const userIds = students.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email')
        .in('user_id', userIds);

      // Fetch courses
      const courseIds = students.map(s => s.course_id).filter(Boolean) as string[];
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name, price')
        .in('id', courseIds);

      // Fetch all payments including created_at for fallback
      const studentIds = students.map(s => s.id);
      const { data: payments } = await supabase
        .from('payments')
        .select('student_id, amount, status, payment_date, created_at')
        .in('student_id', studentIds);

      // Calculate debt for each student: coursePrice - totalPaid
      const result: StudentDebt[] = students.map(student => {
        const profile = profiles?.find(p => p.user_id === student.user_id);
        const course = courses?.find(c => c.id === student.course_id);
        const studentPayments = payments?.filter(p => p.student_id === student.id) || [];
        
        const totalPaid = studentPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const coursePrice = course ? Number(course.price) : 0;
        
        const totalDue = computeTotalDue(student.agreed_fee, coursePrice, student.discount);
        const totalDebt = Math.max(0, totalDue - totalPaid);

        // Find last payment date - use payment_date if available, fallback to created_at
        const paidPayments = studentPayments.filter(p => p.status === 'paid');
        let lastPaymentDate: string | null = null;
        
        if (paidPayments.length > 0) {
          // Sort by payment_date first (if exists), then by created_at
          const sorted = paidPayments.sort((a, b) => {
            const dateA = a.payment_date || '';
            const dateB = b.payment_date || '';
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          lastPaymentDate = sorted[0].payment_date || null;
        }

        return {
          studentId: student.id,
          studentName: profile?.full_name || 'Desconhecido',
          phone: profile?.phone || null,
          email: profile?.email || '',
          courseName: course?.name || null,
          coursePrice,
          totalPaid,
          totalDebt,
          pendingPayments: studentPayments.filter(p => p.status === 'pending').length,
          lastPaymentDate,
        };
      }).filter(s => s.totalDebt > 0); // Show students with remaining balance

      return result.sort((a, b) => b.totalDebt - a.totalDebt);
    },
  });
};

// NEW: Get ALL students financial (including those fully paid)
export const useAllStudentsFinancial = () => {
  return useQuery({
    queryKey: ['all-students-financial'],
    queryFn: async (): Promise<StudentDebt[]> => {
      // Fetch all students
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, course_id, agreed_fee, discount');

      if (!students || students.length === 0) return [];

      // Fetch profiles
      const userIds = students.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email')
        .in('user_id', userIds);

      // Fetch courses
      const courseIds = students.map(s => s.course_id).filter(Boolean) as string[];
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name, price')
        .in('id', courseIds);

      // Fetch all payments
      const studentIds = students.map(s => s.id);
      const { data: payments } = await supabase
        .from('payments')
        .select('student_id, amount, status, payment_date, created_at')
        .in('student_id', studentIds);

      // Calculate for each student
      const result: StudentDebt[] = students.map(student => {
        const profile = profiles?.find(p => p.user_id === student.user_id);
        const course = courses?.find(c => c.id === student.course_id);
        const studentPayments = payments?.filter(p => p.student_id === student.id) || [];
        
        const totalPaid = studentPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        const coursePrice = course ? Number(course.price) : 0;
        const totalDue = computeTotalDue(student.agreed_fee, coursePrice, student.discount);
        const totalDebt = Math.max(0, totalDue - totalPaid);

        const paidPayments = studentPayments.filter(p => p.status === 'paid');
        let lastPaymentDate: string | null = null;
        
        if (paidPayments.length > 0) {
          const sorted = paidPayments.sort((a, b) => {
            const dateA = a.payment_date || '';
            const dateB = b.payment_date || '';
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          lastPaymentDate = sorted[0].payment_date || null;
        }

        return {
          studentId: student.id,
          studentName: profile?.full_name || 'Desconhecido',
          phone: profile?.phone || null,
          email: profile?.email || '',
          courseName: course?.name || null,
          coursePrice,
          totalPaid,
          totalDebt,
          pendingPayments: studentPayments.filter(p => p.status === 'pending').length,
          lastPaymentDate,
        };
      });

      // Sort: students with debt first, then by debt amount
      return result.sort((a, b) => {
        if (a.totalDebt > 0 && b.totalDebt === 0) return -1;
        if (a.totalDebt === 0 && b.totalDebt > 0) return 1;
        return b.totalDebt - a.totalDebt;
      });
    },
  });
};

export const useMonthlyFinancials = (year?: number) => {
  return useQuery({
    queryKey: ['monthly-financials', year],
    queryFn: async (): Promise<MonthlyFinancial[]> => {
      const targetYear = year || new Date().getFullYear();
      const startDate = `${targetYear}-01-01`;
      const endDate = `${targetYear}-12-31`;

      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, payment_date, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      return monthNames.map((month, index) => {
        const monthPayments = payments?.filter(p => {
          const dateStr = p.payment_date || p.created_at;
          const date = new Date(dateStr);
          return date.getMonth() === index;
        }) || [];

        return {
          month,
          year: targetYear,
          revenue: monthPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
          pending: monthPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
        };
      });
    },
  });
};

export interface PaymentEvolution {
  month: string;
  monthIndex: number;
  received: number;
  cumulativeReceived: number;
}

export const usePaymentEvolution = (year?: number) => {
  return useQuery({
    queryKey: ['payment-evolution', year],
    queryFn: async (): Promise<PaymentEvolution[]> => {
      const targetYear = year || new Date().getFullYear();

      // Fetch ALL paid payments and filter in-memory (payment_date can be NULL)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, payment_date, updated_at')
        .eq('status', 'paid');

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      let cumulative = 0;
      return monthNames.map((month, index) => {
        const monthPayments = payments?.filter(p => {
          // Use payment_date if available, otherwise use updated_at
          const payDate = p.payment_date || p.updated_at?.split('T')[0];
          if (!payDate) return false;
          const date = new Date(payDate);
          return date.getFullYear() === targetYear && date.getMonth() === index;
        }) || [];

        const received = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        cumulative += received;

        return {
          month,
          monthIndex: index,
          received,
          cumulativeReceived: cumulative,
        };
      });
    },
  });
};

export const useStudentFinancialDetails = (studentId: string | null) => {
  return useQuery({
    queryKey: ['student-financial-details', studentId],
    queryFn: async () => {
      if (!studentId) return null;

      const { data: student } = await supabase
        .from('students')
        .select('id, user_id, course_id')
        .eq('id', studentId)
        .single();

      if (!student) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('user_id', student.user_id)
        .single();

      const { data: course } = student.course_id ? await supabase
        .from('courses')
        .select('name, price')
        .eq('id', student.course_id)
        .single() : { data: null };

      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      const totalPaid = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalPending = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const coursePrice = course ? Number(course.price) : 0;

      return {
        student,
        profile,
        course,
        payments: payments || [],
        totalPaid,
        totalPending,
        coursePrice,
        remaining: Math.max(0, coursePrice - totalPaid),
      };
    },
    enabled: !!studentId,
  });
};
