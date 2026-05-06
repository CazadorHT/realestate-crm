-- ==========================================
-- 🚀 ADD WECHAT & WHATSAPP TO LEAD RPC
-- Description: Updating submit_public_lead to support international contact fields and property linking.
-- ==========================================

BEGIN;

-- 1. Update INTERNAL function
-- Drop all possible signatures to ensure a clean slate
DROP FUNCTION IF EXISTS internal.submit_public_lead(text, text, text, text, text);
DROP FUNCTION IF EXISTS internal.submit_public_lead(text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, text, text, text, text, text, integer, text);
DROP FUNCTION IF EXISTS internal.submit_public_lead(text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, text, text, text, text, text, integer);

CREATE OR REPLACE FUNCTION internal.submit_public_lead(
    p_full_name TEXT,
    p_full_name_hash TEXT DEFAULT NULL,
    p_line_id TEXT DEFAULT NULL,
    p_line_id_hash TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_phone_hash TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_email_hash TEXT DEFAULT NULL,
    p_wechat_id TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_property_id UUID DEFAULT NULL,
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
DECLARE v_lead_id UUID;
BEGIN
    INSERT INTO public.leads (
        full_name, full_name_hash, 
        line_id, line_id_hash, 
        phone, phone_hash, 
        email, email_hash,
        wechat_id, whatsapp,
        property_id,
        source, stage, note, lead_type,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, referral_url,
        ai_score, ai_status_label, last_viewed_at
    )
    VALUES (
        p_full_name, p_full_name_hash, 
        p_line_id, p_line_id_hash, 
        p_phone, p_phone_hash, 
        p_email, p_email_hash,
        p_wechat_id, p_whatsapp,
        p_property_id,
        p_source::public.lead_source, 'NEW', p_note, 'INDIVIDUAL',
        p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term, p_referral_url,
        p_ai_score, p_ai_status_label, NOW()
    )
    RETURNING id INTO v_lead_id;
    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update PUBLIC wrapper
DROP FUNCTION IF EXISTS public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, text, text, text, text, text, integer, text);
DROP FUNCTION IF EXISTS public.submit_public_lead(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.submit_public_lead(
    p_full_name TEXT,
    p_full_name_hash TEXT DEFAULT NULL,
    p_line_id TEXT DEFAULT NULL,
    p_line_id_hash TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_phone_hash TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_email_hash TEXT DEFAULT NULL,
    p_wechat_id TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_property_id UUID DEFAULT NULL,
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
BEGIN 
    RETURN internal.submit_public_lead(
        p_full_name => p_full_name,
        p_full_name_hash => p_full_name_hash,
        p_line_id => p_line_id,
        p_line_id_hash => p_line_id_hash,
        p_phone => p_phone,
        p_phone_hash => p_phone_hash,
        p_email => p_email,
        p_email_hash => p_email_hash,
        p_wechat_id => p_wechat_id,
        p_whatsapp => p_whatsapp,
        p_property_id => p_property_id,
        p_source => p_source,
        p_note => p_note,
        p_utm_source => p_utm_source,
        p_utm_medium => p_utm_medium,
        p_utm_campaign => p_utm_campaign,
        p_utm_content => p_utm_content,
        p_utm_term => p_utm_term,
        p_referral_url => p_referral_url,
        p_ai_score => p_ai_score,
        p_ai_status_label => p_ai_status_label
    ); 
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 3. Update CREATE_LEAD_FROM_MATCH
DROP FUNCTION IF EXISTS internal.create_lead_from_match(uuid, uuid, text, text, text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS internal.create_lead_from_match(uuid, uuid, text, text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION internal.create_lead_from_match(
    p_session_id UUID,
    p_property_id UUID,
    p_full_name TEXT,
    p_full_name_hash TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_phone_hash TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_email_hash TEXT DEFAULT NULL,
    p_line_id TEXT DEFAULT NULL,
    p_line_id_hash TEXT DEFAULT NULL,
    p_wechat_id TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_lead_id UUID;
BEGIN
    INSERT INTO public.leads (
        full_name, full_name_hash,
        phone, phone_hash,
        email, email_hash,
        line_id, line_id_hash,
        wechat_id, whatsapp,
        lead_type, source, stage, note,
        property_id
    )
    VALUES (
        p_full_name, p_full_name_hash,
        p_phone, p_phone_hash,
        p_email, p_email_hash,
        p_line_id, p_line_id_hash,
        p_wechat_id, p_whatsapp,
        'INDIVIDUAL', 
        'WEBSITE', 
        'NEW', 
        format('Auto-generated from Smart Match Wizard. SessionID: %s', p_session_id),
        p_property_id
    )
    RETURNING id INTO v_lead_id;

    UPDATE public.property_search_sessions SET lead_id = v_lead_id, converted_at = NOW() WHERE id = p_session_id;

    INSERT INTO public.lead_activities (lead_id, activity_type, note)
    VALUES (v_lead_id, 'SYSTEM', format('บันทึกความสนใจทรัพย์สินผ่าน Smart Match Wizard. รหัสทรัพย์: %s', p_property_id));

    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS public.create_lead_from_match(uuid, uuid, text, text, text, text, text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.create_lead_from_match(uuid, uuid, text, text, text, text, text, text, text, text);

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
    p_line_id_hash TEXT DEFAULT NULL,
    p_wechat_id TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL
) RETURNS UUID AS $$
BEGIN 
    RETURN internal.create_lead_from_match(
        p_session_id => p_session_id,
        p_property_id => p_property_id,
        p_full_name => p_full_name,
        p_phone => p_phone,
        p_full_name_hash => p_full_name_hash,
        p_phone_hash => p_phone_hash,
        p_email => p_email,
        p_email_hash => p_email_hash,
        p_line_id => p_line_id,
        p_line_id_hash => p_line_id_hash,
        p_wechat_id => p_wechat_id,
        p_whatsapp => p_whatsapp
    ); 
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 4. Restore Permissions (Using explicit signatures to avoid ambiguity)
GRANT EXECUTE ON FUNCTION public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, text, text, text, text, text, integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_lead_from_match(uuid, uuid, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated, service_role;

COMMIT;
