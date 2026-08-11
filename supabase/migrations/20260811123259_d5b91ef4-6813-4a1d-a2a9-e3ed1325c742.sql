ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS agreed_fee numeric,
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_day integer;

CREATE INDEX IF NOT EXISTS idx_payments_student_status ON public.payments (student_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON public.students (course_id);