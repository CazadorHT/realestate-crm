-- Phase 4.2: Update RPCs to support Blind Index (Hashing) - FIXED VERSION
-- This ensures that leads created via RPCs (Public Form, Smart Match) 
-- also have their search indexes generated correctly.

-- 1. Update SUBMIT_PUBLIC_LEAD
CREATE OR REPLACE FUNCTION public.submit_public_lead(
    p_full_name TEXT,
    p_full_name_hash TEXT DEFAULT NULL,
    p_line_id TEXT DEFAULT NULL,
    p_line_id_hash TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_phone_hash TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_email_hash TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'WEBSITE',
    p_note TEXT DEFAULT NULL,
    p_utm_source TEXT DEFAULT NULL,
    p_utm_medium TEXT DEFAULT NULL,
    p_utm_campaign TEXT DEFAULT NULL,
    p_utm_content TEXT DEFAULT NULL,
    p_utm_term TEXT DEFAULT NULL,
    p_referral_url TEXT DEFAULT NULL,
    p_ai_score INTEGER DEFAULT 0,
    p_ai_status_label TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_lead_id UUID;
BEGIN
    INSERT INTO public.leads (
        full_name, full_name_hash, 
        line_id, line_id_hash, 
        phone, phone_hash, 
        email, email_hash,
        source, stage, note, lead_type,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, referral_url,
        ai_score, ai_status_label, last_viewed_at
    )
    VALUES (
        p_full_name, p_full_name_hash, 
        p_line_id, p_line_id_hash, 
        p_phone, p_phone_hash, 
        p_email, p_email_hash,
        p_source::public.lead_source, 'NEW', p_note, 'INDIVIDUAL',
        p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, p_referral_url,
        p_ai_score, p_ai_status_label, NOW()
    )
    RETURNING id INTO v_lead_id;

    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update CREATE_LEAD_FROM_MATCH
CREATE OR REPLACE FUNCTION public.create_lead_from_match(
    p_session_id UUID,
    p_property_id UUID,
    p_full_name TEXT,
    p_phone TEXT,
    p_full_name_hash TEXT DEFAULT NULL,
    p_phone_hash TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_email_hash TEXT DEFAULT NULL,
    p_line_id TEXT DEFAULT NULL,
    p_line_id_hash TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_lead_id UUID;
BEGIN
    -- 1. Create Lead
    INSERT INTO public.leads (
        full_name, full_name_hash,
        phone, phone_hash,
        email, email_hash,
        line_id, line_id_hash,
        lead_type, source, stage, note
    )
    VALUES (
        p_full_name, p_full_name_hash,
        p_phone, p_phone_hash,
        p_email, p_email_hash,
        p_line_id, p_line_id_hash,
        'INDIVIDUAL', 
        'WEBSITE', 
        'NEW', 
        format('Auto-generated from Smart Match Wizard. SessionID: %s', p_session_id)
    )
    RETURNING id INTO v_lead_id;

    -- 2. Link with search session
    UPDATE public.property_search_sessions
    SET lead_id = v_lead_id, converted_at = NOW()
    WHERE id = p_session_id;

    -- 3. Create Activity
    INSERT INTO public.lead_activities (lead_id, activity_type, note)
    VALUES (
        v_lead_id, 
        'SYSTEM', 
        format('บันทึกความสนใจทรัพย์สินผ่าน Smart Match Wizard. รหัสทรัพย์: %s', p_property_id)
    );

    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- 4. Update INCREMENT_PROPERTY_VIEW to return tenant_id for branch isolation
DROP FUNCTION IF EXISTS public.increment_property_view(uuid, text, uuid);

CREATE OR REPLACE FUNCTION public.increment_property_view(
    p_property_id uuid,
    p_visitor_id text DEFAULT NULL,
    p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    success boolean,
    trigger_proactive_agent boolean,
    tenant_id uuid
) AS $$
DECLARE
  v_tenant_id uuid;
  v_view_count bigint;
  v_last_trigger_at timestamptz;
BEGIN
  -- Get the tenant_id first
  SELECT tenant_id INTO v_tenant_id 
  FROM public.properties 
  WHERE id = p_property_id;

  -- 1. Increment total view_count on property
  UPDATE public.properties 
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = now()
  WHERE id = p_property_id;

  -- 2. Log the individual view event with identity
  INSERT INTO public.property_views_log (property_id, tenant_id, visitor_id, user_id, created_at)
  VALUES (p_property_id, v_tenant_id, p_visitor_id, p_user_id, now());

  -- 3. Check Cool-down Period (e.g., 2 hours)
  SELECT triggered_at INTO v_last_trigger_at
  FROM public.proactive_agent_triggers
  WHERE property_id = p_property_id
    AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND visitor_id = p_visitor_id)
    )
  ORDER BY triggered_at DESC
  LIMIT 1;

  -- If we triggered recently, don't trigger again
  IF v_last_trigger_at IS NOT NULL AND v_last_trigger_at > now() - interval '2 hours' THEN
    RETURN QUERY SELECT true, false, v_tenant_id;
    RETURN;
  END IF;

  -- 4. Check for Proactive Threshold (e.g., 3 views in last 24h)
  SELECT count(*) INTO v_view_count
  FROM public.property_views_log
  WHERE property_id = p_property_id
    AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND visitor_id = p_visitor_id)
    )
    AND created_at > now() - interval '24 hours';

  -- 5. Trigger and Record if threshold met
  IF v_view_count >= 3 THEN
    INSERT INTO public.proactive_agent_triggers (property_id, visitor_id, user_id, triggered_at)
    VALUES (p_property_id, p_visitor_id, p_user_id, now());
    
    RETURN QUERY SELECT true, true, v_tenant_id;
  ELSE
    RETURN QUERY SELECT true, false, v_tenant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
