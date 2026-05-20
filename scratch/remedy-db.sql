-- =============================================================================
-- Remedy Database RPCs & Smart Match Tables for V3 Schema Alignment
-- Created: 2026-05-20
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create Smart Match Wizard Session Tables (if missing)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_search_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT,
    purpose TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    preferred_area TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    lead_id UUID,
    converted_at TIMESTAMPTZ,
    near_transit BOOLEAN DEFAULT false,
    transit_station_name TEXT,
    transit_type TEXT,
    transit_distance_meters INTEGER,
    preferred_property_type TEXT
);

CREATE TABLE IF NOT EXISTS public.property_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.property_search_sessions(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties_core(id) ON DELETE CASCADE,
    match_score NUMERIC,
    match_reasons JSONB,
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint for lead_id to crm_leads_v3 if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_property_search_sessions_lead'
    ) THEN
        ALTER TABLE public.property_search_sessions 
        ADD CONSTRAINT fk_property_search_sessions_lead 
        FOREIGN KEY (lead_id) REFERENCES public.crm_leads_v3(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Enable RLS & Add Public Access Policies
ALTER TABLE public.property_search_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Manage property_search_sessions" ON public.property_search_sessions;
CREATE POLICY "Public Manage property_search_sessions" ON public.property_search_sessions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Manage property_matches" ON public.property_matches;
CREATE POLICY "Public Manage property_matches" ON public.property_matches
    FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Define increment_property_view (V3 compatible)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_property_view(p_id UUID)
RETURNS VOID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- 1. Get tenant_id from properties_core
    SELECT tenant_id INTO v_tenant_id FROM public.properties_core WHERE id = p_id;

    -- 2. Update view_count in properties_details
    UPDATE public.properties_details
    SET meta_data = jsonb_set(
        COALESCE(meta_data, '{}'::jsonb),
        '{view_count}',
        (COALESCE((meta_data->>'view_count')::int, 0) + 1)::text::jsonb
    )
    WHERE property_id = p_id;

    -- 3. Insert log into traffic_views_v3
    INSERT INTO public.traffic_views_v3 (tenant_id, target_type, target_id, identity_id)
    VALUES (v_tenant_id, 'property', p_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_property_view(UUID) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Define submit_public_lead (V3 compatible)
-- ─────────────────────────────────────────────────────────────────────────────
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
)
RETURNS UUID AS $$
DECLARE
    v_identity_id UUID;
    v_lead_id UUID;
    v_tenant_id UUID;
BEGIN
    -- Resolve tenant_id from property or fall back
    IF p_property_id IS NOT NULL THEN
        SELECT tenant_id INTO v_tenant_id FROM public.properties_core WHERE id = p_property_id;
    END IF;
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.tenants_v3 LIMIT 1;
    END IF;

    -- 1. Create Identity
    INSERT INTO public.identities_v3 (
        tenant_id,
        category,
        role,
        display_name,
        email,
        phone,
        line_id,
        social_links,
        is_active
    )
    VALUES (
        v_tenant_id,
        2, -- External/Client
        'LEAD',
        p_full_name,
        p_email,
        p_phone,
        p_line_id,
        jsonb_build_object(
            'wechat_id', p_wechat_id,
            'whatsapp', p_whatsapp,
            'utm_medium', p_utm_medium,
            'utm_campaign', p_utm_campaign,
            'utm_content', p_utm_content,
            'utm_term', p_utm_term,
            'referral_url', p_referral_url
        ),
        true
    )
    RETURNING id INTO v_identity_id;

    -- 2. Create Identity Secret (PDPA Encrypted full name)
    INSERT INTO public.identity_secrets_v3 (
        identity_id,
        full_name_encrypted,
        updated_at
    )
    VALUES (
        v_identity_id,
        p_full_name,
        now()
    );

    -- 3. Create Lead
    INSERT INTO public.crm_leads_v3 (
        tenant_id,
        identity_id,
        status,
        stage,
        source,
        utm_data,
        ai_score,
        ai_summary
    )
    VALUES (
        v_tenant_id,
        v_identity_id,
        'ACTIVE',
        'NEW',
        p_source,
        jsonb_build_object(
            'utm_source', p_utm_source,
            'property_id', p_property_id,
            'note', p_note
        ),
        p_ai_score,
        p_ai_status_label
    )
    RETURNING id INTO v_lead_id;

    -- 4. Create Activity Timeline
    INSERT INTO public.activity_timeline_v3 (
        tenant_id,
        target_id,
        target_entity,
        activity_type,
        description,
        created_at
    )
    VALUES (
        v_tenant_id,
        v_lead_id,
        'leads',
        'SYSTEM',
        'ลูกค้าติดต่อสอบถามข้อมูลผ่านหน้าเว็บไซต์ (Inquiry RPC)',
        now()
    );

    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, uuid, text, text, text, text, text, text, text, text, integer, text) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Define create_deposit_lead (V3 compatible)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_deposit_lead(
    p_full_name TEXT,
    p_full_name_hash TEXT,
    p_phone TEXT,
    p_phone_hash TEXT,
    p_email TEXT DEFAULT NULL,
    p_email_hash TEXT DEFAULT NULL,
    p_line_id TEXT DEFAULT NULL,
    p_line_id_hash TEXT DEFAULT NULL,
    p_wechat_id TEXT DEFAULT NULL,
    p_whatsapp TEXT DEFAULT NULL,
    p_property_type TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_identity_id UUID;
    v_lead_id UUID;
    v_tenant_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants_v3 LIMIT 1;

    -- 1. Create Identity
    INSERT INTO public.identities_v3 (
        tenant_id,
        category,
        role,
        display_name,
        email,
        phone,
        line_id,
        social_links,
        is_active
    )
    VALUES (
        v_tenant_id,
        2, -- External
        'LEAD',
        p_full_name,
        p_email,
        p_phone,
        p_line_id,
        jsonb_build_object('wechat_id', p_wechat_id, 'whatsapp', p_whatsapp),
        true
    )
    RETURNING id INTO v_identity_id;

    -- 2. Create Secret
    INSERT INTO public.identity_secrets_v3 (
        identity_id,
        full_name_encrypted,
        updated_at
    )
    VALUES (
        v_identity_id,
        p_full_name,
        now()
    );

    -- 3. Create Lead
    INSERT INTO public.crm_leads_v3 (
        tenant_id,
        identity_id,
        status,
        stage,
        source,
        utm_data
    )
    VALUES (
        v_tenant_id,
        v_identity_id,
        'ACTIVE',
        'NEW',
        'WEBSITE',
        jsonb_build_object('property_type', p_property_type, 'note_encrypted', p_note)
    )
    RETURNING id INTO v_lead_id;

    -- 4. Log Timeline Activity
    INSERT INTO public.activity_timeline_v3 (
        tenant_id,
        target_id,
        target_entity,
        activity_type,
        description,
        created_at
    )
    VALUES (
        v_tenant_id,
        v_lead_id,
        'leads',
        'SYSTEM',
        'ลูกค้าแจ้งฝากทรัพย์ผ่านหน้าเว็บไซต์ (Secure RPC)',
        now()
    );

    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_deposit_lead(text, text, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Define create_lead_from_match (V3 compatible)
-- ─────────────────────────────────────────────────────────────────────────────
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
)
RETURNS UUID AS $$
DECLARE
    v_identity_id UUID;
    v_lead_id UUID;
    v_tenant_id UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM public.properties_core WHERE id = p_property_id;
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id FROM public.tenants_v3 LIMIT 1;
    END IF;

    -- 1. Create Identity
    INSERT INTO public.identities_v3 (
        tenant_id,
        category,
        role,
        display_name,
        email,
        phone,
        line_id,
        social_links,
        is_active
    )
    VALUES (
        v_tenant_id,
        2, -- External
        'LEAD',
        p_full_name,
        p_email,
        p_phone,
        p_line_id,
        jsonb_build_object('wechat_id', p_wechat_id, 'whatsapp', p_whatsapp),
        true
    )
    RETURNING id INTO v_identity_id;

    -- 2. Create Secret
    INSERT INTO public.identity_secrets_v3 (
        identity_id,
        full_name_encrypted,
        updated_at
    )
    VALUES (
        v_identity_id,
        p_full_name,
        now()
    );

    -- 3. Create Lead
    INSERT INTO public.crm_leads_v3 (
        tenant_id,
        identity_id,
        status,
        stage,
        source,
        utm_data
    )
    VALUES (
        v_tenant_id,
        v_identity_id,
        'ACTIVE',
        'NEW',
        'WEBSITE',
        jsonb_build_object(
            'session_id', p_session_id,
            'property_id', p_property_id,
            'note', 'Auto-generated from Smart Match Wizard'
        )
    )
    RETURNING id INTO v_lead_id;

    -- 4. Link search session to the created lead
    UPDATE public.property_search_sessions
    SET lead_id = v_lead_id, converted_at = now()
    WHERE id = p_session_id;

    -- 5. Create Activity Timeline
    INSERT INTO public.activity_timeline_v3 (
        tenant_id,
        target_id,
        target_entity,
        activity_type,
        description,
        created_at
    )
    VALUES (
        v_tenant_id,
        v_lead_id,
        'leads',
        'SYSTEM',
        format('บันทึกความสนใจทรัพย์สินผ่าน Smart Match Wizard. รหัสทรัพย์: %s', p_property_id),
        now()
    );

    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_lead_from_match(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Define log_ai_usage (V3 compatible)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_ai_usage(
    p_model TEXT,
    p_feature TEXT,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_prompt_tokens INTEGER DEFAULT 0,
    p_completion_tokens INTEGER DEFAULT 0,
    p_cost_thb NUMERIC DEFAULT 0
) RETURNS VOID AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM public.tenants_v3 LIMIT 1;

    INSERT INTO public.ai_token_ledgers (
        tenant_id,
        user_id,
        feature,
        model,
        prompt_tokens,
        completion_tokens,
        cost_thb
    )
    VALUES (
        v_tenant_id,
        auth.uid(),
        p_feature,
        p_model,
        p_prompt_tokens,
        p_completion_tokens,
        p_cost_thb
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.log_ai_usage(text, text, text, text, integer, integer, numeric) TO authenticated, service_role;
