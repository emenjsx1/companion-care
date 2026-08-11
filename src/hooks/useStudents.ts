import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Student {
  id: string;
  user_id: string;
  course_id: string | null;
  enrollment_date: string;
  license_number: string | null;
  birth_date: string | null;
  address: string | null;
  city: string | null;
  status: string;
  document_number: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
  course?: {
    name: string;
    category: string;
  } | null;
}

export interface StudentHistory {
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    due_date: string;
    payment_date: string | null;
    description: string | null;
  }>;
  exams: Array<{
    id: string;
    exam_type: string;
    exam_date: string;
    status: string;
    score: number | null;
  }>;
  totalPaid: number;
  totalDebt: number;
}

// CRM Pure model - no password required
export interface StudentInsert {
  email: string;
  full_name: string;
  phone?: string;
  course_id?: string;
  birth_date?: string;
  address?: string;
  city?: string;
  document_number?: string;
  enrollment_date?: string;
}

// Checks whether a student already exists (email, BI/document or phone)
export const findDuplicateStudent = async (student: {
  email: string;
  phone?: string;
  document_number?: string;
  full_name?: string;
}): Promise<string | null> => {
  const email = student.email?.trim().toLowerCase();
  if (email) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, email')
      .ilike('email', email)
      .limit(1);
    if (data && data.length > 0) {
      return `Já existe um aluno registado com o email ${student.email}.`;
    }
  }

  const doc = student.document_number?.trim();
  if (doc) {
    const { data } = await supabase
      .from('students')
      .select('id')
      .ilike('document_number', doc)
      .limit(1);
    if (data && data.length > 0) {
      return `Já existe um aluno registado com o documento (BI) ${doc}.`;
    }
  }

  const phone = student.phone?.trim();
  if (phone) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phone)
      .limit(1);
    if (data && data.length > 0) {
      return `Já existe um aluno registado com o telefone ${phone}.`;
    }
  }

  return null;
};

export const useStudents = () => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      const userIds = [...new Set(students.map(s => s.user_id))];
      const courseIds = [...new Set(students.map(s => s.course_id).filter(Boolean))] as string[];

      // Run both lookups in parallel instead of waiting one after the other
      const [{ data: profiles }, { data: courses }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, email, phone').in('user_id', userIds),
        courseIds.length
          ? supabase.from('courses').select('id, name, category').in('id', courseIds)
          : Promise.resolve({ data: [] as { id: string; name: string; category: string }[] }),
      ]);

      // O(1) lookups instead of a full scan per student
      const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));
      const courseMap = new Map((courses ?? []).map(c => [c.id, c]));

      const result = students.map(student => ({
        ...student,
        profile: profileMap.get(student.user_id) || null,
        course: student.course_id ? courseMap.get(student.course_id) || null : null,
      }));

      return result as Student[];
    },
  });
};

export const useStudentHistory = (studentId: string | null) => {
  return useQuery({
    queryKey: ['student-history', studentId],
    queryFn: async (): Promise<StudentHistory | null> => {
      if (!studentId) return null;

      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, status, due_date, payment_date, description')
        .eq('student_id', studentId)
        .order('due_date', { ascending: false });

      const { data: exams } = await supabase
        .from('exams')
        .select('id, exam_type, exam_date, status, score')
        .eq('student_id', studentId)
        .order('exam_date', { ascending: false });

      const totalPaid = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalDebt = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        payments: payments || [],
        exams: exams || [],
        totalPaid,
        totalDebt,
      };
    },
    enabled: !!studentId,
  });
};

export const useStudentDebts = () => {
  return useQuery({
    queryKey: ['student-debts'],
    queryFn: async () => {
      const { data: payments } = await supabase
        .from('payments')
        .select('student_id, amount')
        .eq('status', 'pending');

      if (!payments) return {};

      // Group by student and sum
      const debts: Record<string, number> = {};
      payments.forEach(p => {
        debts[p.student_id] = (debts[p.student_id] || 0) + Number(p.amount);
      });

      return debts;
    },
  });
};

// CRM Pure - Create student WITHOUT auth account
export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: StudentInsert) => {
      // Block duplicated students before creating anything
      const duplicate = await findDuplicateStudent(student);
      if (duplicate) {
        throw new Error(`${duplicate} Verifique a lista de alunos antes de registar novamente.`);
      }

      // Generate a UUID for user_id without creating an auth account
      // This makes students pure CRM records without login capability
      const userId = crypto.randomUUID();

      // Insert into profiles first
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        full_name: student.full_name,
        email: student.email,
        phone: student.phone || null,
      });

      if (profileError) {
        console.error('Profile insert error:', profileError);
        throw new Error(`Erro ao criar perfil: ${profileError.message}`);
      }

      // Insert into students
      const { data, error } = await supabase
        .from('students')
        .insert({
          user_id: userId,
          course_id: student.course_id || null,
          birth_date: student.birth_date || null,
          address: student.address || null,
          city: student.city || null,
          document_number: student.document_number || null,
          ...(student.enrollment_date ? { enrollment_date: student.enrollment_date } : {}),
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Student insert error:', error);
        throw new Error(`Erro ao criar aluno: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno registado com sucesso');
    },
    onError: (error: Error) => {
      console.error('Create student error:', error);
      toast.error(error.message);
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, profileUpdate, ...student }: Partial<Student> & { 
      id: string;
      profileUpdate?: { full_name?: string; phone?: string };
    }) => {
      // Update student record
      const { data, error } = await supabase
        .from('students')
        .update({
          course_id: student.course_id,
          birth_date: student.birth_date,
          address: student.address,
          city: student.city,
          status: student.status,
          license_number: student.license_number,
          document_number: student.document_number,
          ...(student.enrollment_date ? { enrollment_date: student.enrollment_date } : {}),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update profile if provided
      if (profileUpdate && data.user_id) {
        await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('user_id', data.user_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno actualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao actualizar: ${error.message}`);
    },
  });
};

export const useUpdateStudentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('students')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Estado actualizado!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao actualizar estado: ${error.message}`);
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (student: { id: string; user_id: string }) => {
      // Delete student first
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (studentError) throw studentError;

      // Then delete associated profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', student.user_id);

      // Profile deletion might fail if there's no profile, that's ok
      if (profileError) {
        console.warn('Could not delete profile:', profileError.message);
      }

      return student.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Aluno eliminado com sucesso');
    },
    onError: (error: Error) => {
      console.error('Delete student error:', error);
      toast.error(`Erro ao eliminar aluno: ${error.message}`);
    },
  });
};
