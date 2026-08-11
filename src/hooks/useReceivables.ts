import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LedgerRow {
  studentId: string;
  userId: string;
  name: string;
  phone: string | null;
  email: string | null;
  branch: string | null;
  courseName: string | null;
  coursePrice: number;
  agreedFee: number | null;
  discount: number;
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  balance: number;
  lastPaymentDate: string | null;
  daysSinceLastPayment: number | null;
  paymentCount: number;
  enrollmentDate: string | null;
}

const daysBetween = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

export const useReceivables = () => {
  return useQuery({
    queryKey: ['receivables'],
    queryFn: async (): Promise<LedgerRow[]> => {
      const [studentsRes, profilesRes, coursesRes, paymentsRes] = await Promise.all([
        supabase.from('students').select('id, user_id, course_id, branch, enrollment_date, agreed_fee, discount'),
        supabase.from('profiles').select('user_id, full_name, phone, email'),
        supabase.from('courses').select('id, name, price'),
        supabase.from('payments').select('student_id, amount, status, payment_date, created_at'),
      ]);

      const students = studentsRes.data ?? [];
      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
      const courseMap = new Map((coursesRes.data ?? []).map((c) => [c.id, c]));

      const payMap = new Map<string, { paid: number; pending: number; count: number; last: string | null }>();
      for (const p of paymentsRes.data ?? []) {
        if (!p.student_id) continue;
        const agg = payMap.get(p.student_id) ?? { paid: 0, pending: 0, count: 0, last: null };
        const amount = Number(p.amount) || 0;
        if (p.status === 'paid') {
          agg.paid += amount;
          agg.count += 1;
          const date = p.payment_date ?? p.created_at;
          if (date && (!agg.last || date > agg.last)) agg.last = date;
        } else if (p.status === 'pending') {
          agg.pending += amount;
        }
        payMap.set(p.student_id, agg);
      }

      return students.map((s) => {
        const profile = profileMap.get(s.user_id);
        const course = s.course_id ? courseMap.get(s.course_id) : undefined;
        const coursePrice = course ? Number(course.price) : 0;
        const agreedFee = s.agreed_fee !== null && s.agreed_fee !== undefined ? Number(s.agreed_fee) : null;
        const discount = Number(s.discount) || 0;
        const totalDue = Math.max(0, (agreedFee ?? coursePrice) - discount);
        const agg = payMap.get(s.id) ?? { paid: 0, pending: 0, count: 0, last: null };

        return {
          studentId: s.id,
          userId: s.user_id,
          name: profile?.full_name ?? 'Desconhecido',
          phone: profile?.phone ?? null,
          email: profile?.email ?? null,
          branch: s.branch ?? null,
          courseName: course?.name ?? null,
          coursePrice,
          agreedFee,
          discount,
          totalDue,
          totalPaid: agg.paid,
          totalPending: agg.pending,
          balance: totalDue - agg.paid,
          lastPaymentDate: agg.last,
          daysSinceLastPayment: agg.last ? daysBetween(agg.last) : null,
          paymentCount: agg.count,
          enrollmentDate: s.enrollment_date ?? null,
        };
      });
    },
  });
};

export const useUpdateStudentFee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, agreedFee, discount }: { studentId: string; agreedFee: number | null; discount: number }) => {
      const { error } = await supabase
        .from('students')
        .update({ agreed_fee: agreedFee, discount })
        .eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receivables'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export interface OrphanProfile {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  isStaff: boolean;
}

export const useOrphanProfiles = () => {
  return useQuery({
    queryKey: ['orphan-profiles'],
    queryFn: async (): Promise<OrphanProfile[]> => {
      const [profilesRes, studentsRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email, phone, created_at'),
        supabase.from('students').select('user_id'),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      const studentIds = new Set((studentsRes.data ?? []).map((s) => s.user_id));
      const staffIds = new Set((rolesRes.data ?? []).filter((r) => r.role !== 'student').map((r) => r.user_id));
      return (profilesRes.data ?? [])
        .filter((p) => !studentIds.has(p.user_id))
        .map((p) => ({
          userId: p.user_id,
          name: p.full_name,
          email: p.email,
          phone: p.phone ?? null,
          createdAt: p.created_at,
          isStaff: staffIds.has(p.user_id),
        }));
    },
  });
};
