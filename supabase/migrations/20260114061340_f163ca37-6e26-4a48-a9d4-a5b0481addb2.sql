-- Create school_settings table to store configuration
CREATE TABLE IF NOT EXISTS public.school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on school_settings
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage school settings
CREATE POLICY "Admins can manage school settings"
  ON public.school_settings
  FOR ALL
  USING (is_admin());

CREATE POLICY "Admins can view school settings"
  ON public.school_settings
  FOR SELECT
  USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_school_settings_updated_at
  BEFORE UPDATE ON public.school_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings for daily report
INSERT INTO public.school_settings (key, value) VALUES
  ('daily_report', '{"enabled": false, "time": "18:00", "timezone": "Africa/Maputo", "phone": "", "instance_name": ""}'::jsonb),
  ('school_info', '{"name": "Rodauto - Escola de Condução", "nuit": "500123456", "address": "Av. Samora Machel nº 81, Quelimane", "phone": "+258 24 21 39 97", "email": "rodauto@gmail.com"}'::jsonb)
ON CONFLICT (key) DO NOTHING;