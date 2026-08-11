// Types for the driving school management system

export type StudentStatus = 'ativo' | 'em_formacao' | 'concluido' | 'desistente';

export type CourseCategory = 'A' | 'A1' | 'A2' | 'B' | 'C' | 'D' | 'BE' | 'CE';

export type PaymentMethod = 'dinheiro' | 'transferencia' | 'mbway' | 'multibanco' | 'cheque';

export type PaymentStatus = 'pago' | 'pendente' | 'em_atraso';

export type ExamType = 'codigo' | 'conducao';

export type ExamStatus = 'pendente' | 'agendado' | 'realizado';

export type ExamResult = 'aprovado' | 'reprovado' | null;

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  nif: string;
  address: string;
  birth_date: string;
  course_id: string | null;
  status: StudentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  category: CourseCategory;
  price: number;
  duration: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string | null;
  created_at: string;
}

export interface ExamRequest {
  id: string;
  student_id: string;
  exam_type: ExamType;
  status: ExamStatus;
  scheduled_date: string | null;
  result: ExamResult;
  notes: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SchoolSettings {
  id: string;
  school_name: string;
  address: string;
  phone: string;
  email: string;
  nif: string;
  updated_at: string;
}

export interface DashboardStats {
  totalActiveStudents: number;
  studentsThisMonth: number;
  monthlyRevenue: number;
  pendingExams: number;
}
