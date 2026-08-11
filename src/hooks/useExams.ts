import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MESSAGE_TEMPLATES, replaceTemplateVariables } from '@/hooks/useEvolutionApi';

export interface Exam {
  id: string;
  student_id: string;
  exam_type: string;
  exam_date: string;
  status: 'scheduled' | 'passed' | 'failed' | 'cancelled';
  score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  student_name?: string;
}

export interface ExamInsert {
  student_id: string;
  exam_type: string;
  exam_date: string;
  status?: 'scheduled' | 'passed' | 'failed' | 'cancelled';
  score?: number;
  notes?: string;
}

export const useExams = () => {
  return useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .order('exam_date', { ascending: false });

      if (examsError) throw examsError;

      const studentIds = [...new Set(exams.map(e => e.student_id))];
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id')
        .in('id', studentIds);

      const userIds = students?.map(s => s.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const result = exams.map(exam => {
        const student = students?.find(s => s.id === exam.student_id);
        const profile = profiles?.find(p => p.user_id === student?.user_id);
        return {
          ...exam,
          student_name: profile?.full_name || 'Desconhecido',
        };
      });

      return result as Exam[];
    },
  });
};

export const useStudentExams = (studentId: string | null) => {
  return useQuery({
    queryKey: ['student-exams', studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('student_id', studentId)
        .order('exam_date', { ascending: false });

      if (error) throw error;
      return data as Exam[];
    },
    enabled: !!studentId,
  });
};

// Helper function to send WhatsApp notification for exam
const sendExamNotification = async (
  studentId: string, 
  examType: string, 
  examDate: string,
  templateId: string = 'exam_scheduled',
  campaignName: string = 'Exame Marcado'
) => {
  try {
    console.log(`[Exam Notification] Starting notification for student ${studentId}`);
    console.log(`[Exam Notification] Template ID: ${templateId}, Campaign: ${campaignName}`);
    console.log(`[Exam Notification] Exam Type: ${examType}, Date: ${examDate}`);

    // Get student info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.error('[Exam Notification] Error fetching student:', studentError);
      return;
    }

    if (!student) {
      console.log('[Exam Notification] Student not found');
      return;
    }

    // Get profile with phone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('user_id', student.user_id)
      .single();

    if (profileError) {
      console.error('[Exam Notification] Error fetching profile:', profileError);
      return;
    }

    if (!profile?.phone) {
      console.log('[Exam Notification] Student has no phone number, skipping WhatsApp notification');
      return;
    }

    console.log(`[Exam Notification] Student: ${profile.full_name}, Phone: ${profile.phone}`);

    // Get the template - IMPORTANT: Ensure we get the correct template
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      console.error(`[Exam Notification] Template "${templateId}" not found in MESSAGE_TEMPLATES`);
      console.log('[Exam Notification] Available templates:', MESSAGE_TEMPLATES.map(t => t.id));
      return;
    }

    console.log(`[Exam Notification] Using template: ${template.name}`);
    console.log(`[Exam Notification] Template message preview: ${template.message.substring(0, 100)}...`);

    // Format date for message
    const formattedDate = new Date(examDate).toLocaleDateString('pt-MZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Determine exam type label - handle all possible values
    const examTypeNormalized = examType.toLowerCase();
    let tipoExame: string;
    
    if (examTypeNormalized === 'codigo' || examTypeNormalized === 'código' || examTypeNormalized === 'teorico' || examTypeNormalized === 'teórico') {
      tipoExame = 'Código';
    } else if (examTypeNormalized === 'conducao' || examTypeNormalized === 'condução' || examTypeNormalized === 'pratico' || examTypeNormalized === 'prático') {
      tipoExame = 'Condução';
    } else {
      tipoExame = examType;
    }

    console.log(`[Exam Notification] Exam type normalized: "${examTypeNormalized}" -> "${tipoExame}"`);

    // Replace template variables
    const variables = {
      nome: profile.full_name,
      tipo: tipoExame,
      data: formattedDate,
    };
    
    console.log('[Exam Notification] Variables for template:', variables);
    
    const message = replaceTemplateVariables(template.message, variables);
    
    console.log(`[Exam Notification] Final message preview: ${message.substring(0, 150)}...`);

    // Send WhatsApp message
    const { error } = await supabase.functions.invoke('send-whatsapp', {
      body: { 
        phone: profile.phone, 
        message,
        logMessage: true,
        campaignName,
      },
    });

    if (error) {
      console.error('[Exam Notification] Failed to send WhatsApp notification:', error);
    } else {
      console.log(`[Exam Notification] WhatsApp notification sent successfully for ${templateId}`);
    }
  } catch (error) {
    console.error('[Exam Notification] Error sending exam notification:', error);
  }
};

export const useCreateExam = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (exam: ExamInsert) => {
      const { data, error } = await supabase
        .from('exams')
        .insert(exam)
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp notification after successful creation
      // Always use 'exam_scheduled' for new exams
      await sendExamNotification(
        exam.student_id, 
        exam.exam_type, 
        exam.exam_date,
        'exam_scheduled',
        'Exame Marcado'
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-history'] });
      toast({ 
        title: 'Exame agendado!',
        description: 'Notificação enviada ao aluno via WhatsApp',
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao agendar exame', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useUpdateExam = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...exam }: Partial<Exam> & { id: string }) => {
      const { data, error } = await supabase
        .from('exams')
        .update(exam)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['student-history'] });
      toast({ title: 'Exame atualizado!' });
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

export const useUpdateExamResult = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, score }: { id: string; status: 'passed' | 'failed'; score?: number }) => {
      console.log(`[useUpdateExamResult] Updating exam ${id} to status: ${status}`);
      
      // First get the exam details
      const { data: exam, error: fetchError } = await supabase
        .from('exams')
        .select('student_id, exam_type, exam_date')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('[useUpdateExamResult] Error fetching exam:', fetchError);
        throw fetchError;
      }

      console.log('[useUpdateExamResult] Exam details:', exam);

      // Update the exam
      const { data, error } = await supabase
        .from('exams')
        .update({ status, score })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateExamResult] Error updating exam:', error);
        throw error;
      }

      // Send WhatsApp notification for the result
      // CRITICAL: Use correct template based on status
      if (exam) {
        const templateId = status === 'passed' ? 'exam_passed' : 'exam_failed';
        const campaignName = status === 'passed' ? 'Exame Aprovado' : 'Exame Reprovado';
        
        console.log(`[useUpdateExamResult] Sending notification with template: ${templateId}`);
        
        await sendExamNotification(
          exam.student_id, 
          exam.exam_type, 
          exam.exam_date, 
          templateId, 
          campaignName
        );
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['student-history'] });
      toast({ 
        title: variables.status === 'passed' ? 'Exame aprovado!' : 'Exame reprovado',
        description: 'Notificação enviada ao aluno via WhatsApp',
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Erro ao registar resultado', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};
