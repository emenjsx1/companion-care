-- Fix the permissive INSERT policy on contact_messages
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_messages;

-- Create a more restrictive policy that still allows anonymous submissions
-- but with rate limiting considerations (handled at application level)
CREATE POLICY "Public can submit contact form" ON public.contact_messages
  FOR INSERT WITH CHECK (
    -- Allow insert but validate required fields are present
    name IS NOT NULL AND 
    email IS NOT NULL AND 
    message IS NOT NULL
  );