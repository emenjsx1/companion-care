import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeTotalDue } from '@/lib/ledger';

export interface StudentFinancialSummary {
  studentId: string;
  studentName: string;
  courseId: string | null;
  courseName: string | null;
  coursePrice: number;
  totalPaid: number;
  totalPending: number;
  remainingBalance: number;
  paymentCount: number;
  phone: string | null;
}

// Get financial summary for a single student
export const useStudentFinancialSummary = (studentId: string | null) => {
  return useQuery({
    queryKey: ['student-financial-summary', studentId],
    queryFn: async (): Promise<StudentFinancialSummary | null> => {
      if (!studentId) return null;

      // Get student with course and profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, user_id, course_id, agreed_fee, discount')
        .eq('id', studentId)
        .single();

      if (studentError || !student) return null;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', student.user_id)
        .single();

      // Get course price
      let coursePrice = 0;
      let courseName = null;
      if (student.course_id) {
        const { data: course } = await supabase
          .from('courses')
          .select('name, price')
          .eq('id', student.course_id)
          .single();
        
        if (course) {
          coursePrice = Number(course.price);
          courseName = course.name;
        }
      }

      // Get all payments for this student
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('student_id', studentId);

      const totalPaid = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalPending = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalDue = computeTotalDue(student.agreed_fee, coursePrice, student.discount);
      const remainingBalance = Math.max(0, totalDue - totalPaid);

      return {
        studentId,
        studentName: profile?.full_name || 'Desconhecido',
        courseId: student.course_id,
        courseName,
        coursePrice: totalDue,
        totalPaid,
        totalPending,
        remainingBalance,
        paymentCount: payments?.filter(p => p.status === 'paid').length || 0,
        phone: profile?.phone || null,
      };
    },
    enabled: !!studentId,
  });
};

// Get financial summary for all students (for debt tracking)
export const useAllStudentsFinancialSummary = () => {
  return useQuery({
    queryKey: ['all-students-financial-summary'],
    queryFn: async (): Promise<StudentFinancialSummary[]> => {
      // Get all students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, user_id, course_id');

      if (studentsError || !students) return [];

      // Get all profiles
      const userIds = students.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone')
        .in('user_id', userIds);

      // Get all courses
      const courseIds = students.map(s => s.course_id).filter(Boolean) as string[];
      const { data: courses } = await supabase
        .from('courses')
        .select('id, name, price')
        .in('id', courseIds);

      // Get all payments
      const studentIds = students.map(s => s.id);
      const { data: allPayments } = await supabase
        .from('payments')
        .select('student_id, amount, status')
        .in('student_id', studentIds);

      // Build summary for each student
      const summaries: StudentFinancialSummary[] = students.map(student => {
        const profile = profiles?.find(p => p.user_id === student.user_id);
        const course = courses?.find(c => c.id === student.course_id);
        const payments = allPayments?.filter(p => p.student_id === student.id) || [];
        
        const coursePrice = course ? Number(course.price) : 0;
        const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
        const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
        const totalDue = computeTotalDue(student.agreed_fee, coursePrice, student.discount);
      const remainingBalance = Math.max(0, totalDue - totalPaid);

        return {
          studentId: student.id,
          studentName: profile?.full_name || 'Desconhecido',
          courseId: student.course_id,
          courseName: course?.name || null,
          coursePrice,
          totalPaid,
          totalPending,
          remainingBalance,
          paymentCount: payments.filter(p => p.status === 'paid').length,
          phone: profile?.phone || null,
        };
      });

      // Return only students with remaining balance > 0
      return summaries.filter(s => s.remainingBalance > 0 || s.totalPending > 0);
    },
  });
};
