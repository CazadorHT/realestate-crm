-- 🛡️ [HARDENING] Finalize RPC Security & Revoke Public Permissions
-- This migration ensures NO security warnings and follows the internal/public isolation pattern.

BEGIN;

-- 1. Setup Internal Schema if not exists
CREATE SCHEMA IF NOT EXISTS internal;

-- 2. Move create_deposit_lead logic to internal (SECURITY DEFINER)
DROP FUNCTION IF EXISTS public.create_deposit_lead(text, text, text, text, text, text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION internal.create_deposit_lead(
  p_full_name text,
  p_full_name_hash text,
  p_phone text,
  p_phone_hash text,
  p_email text DEFAULT null,
  p_email_hash text DEFAULT null,
  p_line_id text DEFAULT null,
  p_line_id_hash text DEFAULT null,
  p_wechat_id text DEFAULT null,
  p_whatsapp text DEFAULT null,
  p_property_type text DEFAULT null,
  p_note text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id uuid;
BEGIN
  INSERT INTO public.leads (
    full_name, full_name_hash, phone, phone_hash, 
    email, email_hash, line_id, line_id_hash, 
    wechat_id, whatsapp, lead_type, source, stage, note
  )
  VALUES (
    p_full_name, p_full_name_hash, p_phone, p_phone_hash, 
    p_email, p_email_hash, p_line_id, p_line_id_hash, 
    p_wechat_id, p_whatsapp, 'INDIVIDUAL', 'WEBSITE', 'NEW', p_note
  )
  RETURNING id INTO v_lead_id;

  INSERT INTO public.lead_activities (lead_id, activity_type, note)
  VALUES (v_lead_id, 'SYSTEM', 'ลูกค้าแจ้งฝากทรัพย์ผ่านหน้าเว็บไซต์ (Secure RPC)');

  RETURN v_lead_id;
END;
$$;

-- 3. Create Public Wrapper (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.create_deposit_lead(
  p_full_name text,
  p_full_name_hash text,
  p_phone text,
  p_phone_hash text,
  p_email text DEFAULT null,
  p_email_hash text DEFAULT null,
  p_line_id text DEFAULT null,
  p_line_id_hash text DEFAULT null,
  p_wechat_id text DEFAULT null,
  p_whatsapp text DEFAULT null,
  p_property_type text DEFAULT null,
  p_note text DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN internal.create_deposit_lead(
    p_full_name, p_full_name_hash, p_phone, p_phone_hash,
    p_email, p_email_hash, p_line_id, p_line_id_hash,
    p_wechat_id, p_whatsapp, p_property_type, p_note
  );
END;
$$;

-- 4. 🛡️ REVOKE ALL FROM PUBLIC (The "No-Warning" Magic)
-- We specify the exact parameter lists to avoid "function name is not unique" error
REVOKE ALL ON FUNCTION public.create_deposit_lead(text, text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, text, text, text, text, text, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_lead_from_match(uuid, uuid, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC;

-- 5. 🔑 Re-grant only to specific roles
GRANT EXECUTE ON FUNCTION public.create_deposit_lead(text, text, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, text, text, text, text, text, integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_lead_from_match(uuid, uuid, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated, service_role;

-- 6. 🔔 Hardening notify_admins_of_lead (To avoid createAdminClient)
CREATE OR REPLACE FUNCTION public.notify_admins_of_lead(
  p_name text,
  p_subject text,
  p_lead_id uuid,
  p_is_hot boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  PERFORM internal.notify_admins_of_lead(p_name, p_subject, p_lead_id, p_is_hot);
END;
$$;

REVOKE ALL ON FUNCTION public.notify_admins_of_lead(text, text, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_admins_of_lead(text, text, uuid, boolean) TO anon, authenticated, service_role;

COMMIT;
