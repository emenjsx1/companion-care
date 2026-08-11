-- Allow storing WhatsApp send history + fix CRM student creation (admin can insert profiles)

-- 1) WhatsApp message logs
CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error TEXT,
  campaign_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_created_at
  ON public.whatsapp_message_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_status
  ON public.whatsapp_message_logs (status);

ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view WhatsApp logs" ON public.whatsapp_message_logs;
CREATE POLICY "Admins can view WhatsApp logs"
  ON public.whatsapp_message_logs
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert WhatsApp logs" ON public.whatsapp_message_logs;
CREATE POLICY "Admins can insert WhatsApp logs"
  ON public.whatsapp_message_logs
  FOR INSERT
  WITH CHECK (is_admin());

-- 2) Fix: admin can insert CRM student profiles
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (is_admin());
