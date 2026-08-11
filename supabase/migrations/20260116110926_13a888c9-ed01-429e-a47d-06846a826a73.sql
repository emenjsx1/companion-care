-- Add more course categories to the enum
ALTER TYPE public.course_category ADD VALUE IF NOT EXISTS 'A1';
ALTER TYPE public.course_category ADD VALUE IF NOT EXISTS 'A2';
ALTER TYPE public.course_category ADD VALUE IF NOT EXISTS 'C1';
ALTER TYPE public.course_category ADD VALUE IF NOT EXISTS 'CE';