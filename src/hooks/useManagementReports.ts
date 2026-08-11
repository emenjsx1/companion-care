import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Breakdown { key: string; label: string; count: number; total: number }
export interface ManagementReport {
  from: string;
  to: string;
  totalPaid: number;
  totalPending: number;
  paymentCount: number;
  newStudents: number;
  byMethod: Breakdown[];
  byBranch: Breakdown[];
  byCourse: Breakdown[];
  byMonth: Breakdown[];
}

export interface DataQuality {
  noDocument: { id: string; name: string }[];
  noCourse: { id: string; name: string }[];
  noPhone: { id: string; name: string }[];
  noPayments: { id: string; name: string }[];
}

const label = (v: string | null | undefined, fallback = 'Não definido') => (v && v.trim() ? v : fallback);

export const useManagementReport = (from: string, to: string) => {
  return useQuery({
    queryKey: ['management-report', from, to],
    queryFn: async (): Promise<ManagementReport> => {
      const [paymentsRes, studentsRes, coursesRes] = await Promise.all([
        supabase.from('payments').select('student_id, amount, status, payment_method, payment_date, created_at'),
        supabase.from('students').select('id, course_id, branch, enrollment_date'),
        supabase.from('courses').select('id, name'),
      ]);

      const students = studentsRes.data ?? [];
      const studentMap = new Map(students.map((s) => [s.id, s]));
      const courseMap = new Map((coursesRes.data ?? []).map((c) => [c.id, c.name]));

      const inRange = (d: string | null) => !!d && d >= from && d <= `${to}T23:59:59.999`;

      const method = new Map<string, Breakdown>();
      const branch = new Map<string, Breakdown>();
      const course = new Map<string, Breakdown>();
      const month = new Map<string, Breakdown>();
      let totalPaid = 0;
      let totalPending = 0;
      let paymentCount = 0;

      const bump = (map: Map<string, Breakdown>, key: string, amount: number) => {
        const row = map.get(key) ?? { key, label: key, count: 0, total: 0 };
        row.count += 1;
        row.total += amount;
        map.set(key, row);
      };

      for (const p of paymentsRes.data ?? []) {
        const date = p.payment_date ?? p.created_at;
        if (!inRange(date)) continue;
        const amount = Number(p.amount) || 0;
        if (p.status === 'pending') { totalPending += amount; continue; }
        if (p.status !== 'paid') continue;
        totalPaid += amount;
        paymentCount += 1;
        const s = p.student_id ? studentMap.get(p.student_id) : undefined;
        bump(method, label(p.payment_method, 'Sem método'), amount);
        bump(branch, label(s?.branch, 'Sem filial'), amount);
        bump(course, label(s?.course_id ? courseMap.get(s.course_id) : null, 'Sem curso'), amount);
        bump(month, String(date).slice(0, 7), amount);
      }

      const newStudents = students.filter((s) => inRange(s.enrollment_date)).length;
      const sorted = (m: Map<string, Breakdown>) => [...m.values()].sort((a, b) => b.total - a.total);

      return {
        from,
        to,
        totalPaid,
        totalPending,
        paymentCount,
        newStudents,
        byMethod: sorted(method),
        byBranch: sorted(branch),
        byCourse: sorted(course),
        byMonth: [...month.values()].sort((a, b) => a.key.localeCompare(b.key)),
      };
    },
  });
};

export const useDataQuality = () => {
  return useQuery({
    queryKey: ['data-quality'],
    queryFn: async (): Promise<DataQuality> => {
      const [studentsRes, profilesRes, paymentsRes] = await Promise.all([
        supabase.from('students').select('id, user_id, course_id, document_number'),
        supabase.from('profiles').select('user_id, full_name, phone'),
        supabase.from('payments').select('student_id'),
      ]);
      const students = studentsRes.data ?? [];
      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
      const withPayments = new Set((paymentsRes.data ?? []).map((p) => p.student_id));
      const named = (s: { id: string; user_id: string }) => ({
        id: s.id,
        name: profileMap.get(s.user_id)?.full_name ?? 'Desconhecido',
      });
      return {
        noDocument: students.filter((s) => !s.document_number?.trim()).map(named),
        noCourse: students.filter((s) => !s.course_id).map(named),
        noPhone: students.filter((s) => !profileMap.get(s.user_id)?.phone?.trim()).map(named),
        noPayments: students.filter((s) => !withPayments.has(s.id)).map(named),
      };
    },
  });
};
