-- Fix CRM-only students: remove FK to auth.users on students.user_id
ALTER TABLE public.students
DROP CONSTRAINT IF EXISTS students_user_id_fkey;

CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
