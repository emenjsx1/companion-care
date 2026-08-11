-- Habilitar extensões necessárias para agendamento
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar função que verifica configurações e chama a edge function de relatório diário
CREATE OR REPLACE FUNCTION public.trigger_daily_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  settings_value jsonb;
  report_phone text;
  report_instance text;
  is_enabled boolean;
  supabase_url text := 'https://xzvafzivobwdknvivxwi.supabase.co';
  service_role_key text;
BEGIN
  -- Buscar configurações do relatório diário
  SELECT value::jsonb INTO settings_value
  FROM school_settings
  WHERE key = 'daily_report';
  
  -- Verificar se está habilitado
  IF settings_value IS NULL THEN
    RAISE NOTICE 'Daily report settings not found';
    RETURN;
  END IF;
  
  is_enabled := COALESCE((settings_value->>'enabled')::boolean, false);
  
  IF NOT is_enabled THEN
    RAISE NOTICE 'Daily report is disabled';
    RETURN;
  END IF;
  
  report_phone := settings_value->>'phone';
  report_instance := settings_value->>'instance_name';
  
  IF report_phone IS NULL OR report_instance IS NULL THEN
    RAISE NOTICE 'Phone or instance not configured';
    RETURN;
  END IF;
  
  -- Buscar service role key
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Chamar edge function via pg_net
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/daily-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object(
      'phone', report_phone,
      'instanceName', report_instance
    )
  );
  
  RAISE NOTICE 'Daily report triggered for phone: %', report_phone;
END;
$$;

-- Agendar o cron job para executar às 18:00 UTC (20:00 Maputo)
-- O pg_cron usa UTC, então 18:00 UTC = 20:00 Africa/Maputo (GMT+2)
SELECT cron.schedule(
  'daily-report-job',
  '0 18 * * *',
  'SELECT public.trigger_daily_report()'
);

-- Adicionar comentário explicativo
COMMENT ON FUNCTION public.trigger_daily_report() IS 'Função que dispara o relatório diário via WhatsApp. Executada automaticamente às 20:00 hora de Maputo.';