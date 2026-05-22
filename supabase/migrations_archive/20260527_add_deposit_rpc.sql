-- 🛡️ [HARDENING] Add create_deposit_lead RPC for Secure Public Submissions
-- This RPC handles PII encryption indirectly by accepting encrypted values from the server action 
-- or by being called with standard parameters.

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
SECURITY DEFINER -- 🔑 Necessary for public submission without exposing table RLS
SET search_path = public -- 🛡️ Prevent search path attacks (Required for SECURITY DEFINER)
AS $$
DECLARE
  v_lead_id uuid;
BEGIN
  -- 🛡️ Insert into leads table
  INSERT INTO public.leads (
    full_name,
    full_name_hash,
    phone,
    phone_hash,
    email,
    email_hash,
    line_id,
    line_id_hash,
    wechat_id,
    whatsapp,
    lead_type,
    source,
    stage,
    note
  )
  VALUES (
    p_full_name,
    p_full_name_hash,
    p_phone,
    p_phone_hash,
    p_email,
    p_email_hash,
    p_line_id,
    p_line_id_hash,
    p_wechat_id,
    p_whatsapp,
    'INDIVIDUAL',
    'WEBSITE',
    'NEW',
    p_note
  )
  RETURNING id INTO v_lead_id;

  -- 📝 Log Activity
  INSERT INTO public.lead_activities (
    lead_id,
    activity_type,
    note
  )
  VALUES (
    v_lead_id,
    'SYSTEM',
    'ลูกค้าแจ้งฝากทรัพย์ผ่านหน้าเว็บไซต์ (Secure RPC)'
  );

  RETURN v_lead_id;
END;
$$;

-- 🔐 [LINTER FIX] Revoke default execute from public and grant only to necessary roles
REVOKE ALL ON FUNCTION public.create_deposit_lead FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_deposit_lead TO anon, authenticated, service_role;
