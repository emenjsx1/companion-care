-- Remove FK constraint from profiles.user_id to allow CRM-only students
-- (students without auth accounts)

ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Add index for performance since we removed FK
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);