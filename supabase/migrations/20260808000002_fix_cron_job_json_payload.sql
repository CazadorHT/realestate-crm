-- Migration: Fix pg_cron HTTP post body JSON casting issue in cleanup-property-temp-uploads-job
-- Fixes: "invalid input syntax for type json (Token 'https' is invalid.)" (Log 9)
-- Date: 2026-08-08

DO $$
BEGIN
  -- Unschedule existing job if present
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-property-temp-uploads-job');
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-property-temp-uploads-job',
      '0 17 * * *',
      $cron_body$
      DO $do$
      DECLARE
        v_project_url text := 'https://qaihjhvdwfafawezxivb.supabase.co';
        v_service_key text;
      BEGIN
        -- Get service role key securely from vault
        SELECT decrypted_secret INTO v_service_key 
        FROM vault.decrypted_secrets 
        WHERE name = 'service_role_key' LIMIT 1;
        
        -- Async HTTP POST to edge function with proper JSONB payload
        PERFORM net.http_post(
          url := v_project_url || '/functions/v1/cleanup-property-temp-uploads',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(v_service_key, '')
          ),
          body := jsonb_build_object('cutoffHours', 24, 'limit', 500, 'dryRun', false)
        );
      END;
      $do$;
      $cron_body$
    );
  END IF;
END;
$$;
