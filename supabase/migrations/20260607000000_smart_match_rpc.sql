-- Migration: 20260607000000_smart_match_rpc.sql

-- 1. update submit_public_lead to save blind index hashes in identities_v3.social_links
CREATE OR REPLACE FUNCTION "public"."submit_public_lead"(
    "p_full_name" "text", 
    "p_full_name_hash" "text" DEFAULT NULL::"text", 
    "p_line_id" "text" DEFAULT NULL::"text", 
    "p_line_id_hash" "text" DEFAULT NULL::"text", 
    "p_phone" "text" DEFAULT NULL::"text", 
    "p_phone_hash" "text" DEFAULT NULL::"text", 
    "p_email" "text" DEFAULT NULL::"text", 
    "p_email_hash" "text" DEFAULT NULL::"text", 
    "p_wechat_id" "text" DEFAULT NULL::"text", 
    "p_whatsapp" "text" DEFAULT NULL::"text", 
    "p_property_id" "uuid" DEFAULT NULL::"uuid", 
    "p_source" "text" DEFAULT 'WEBSITE'::"text", 
    "p_note" "text" DEFAULT NULL::"text", 
    "p_utm_source" "text" DEFAULT NULL::"text", 
    "p_utm_medium" "text" DEFAULT NULL::"text", 
    "p_utm_campaign" "text" DEFAULT NULL::"text", 
    "p_utm_content" "text" DEFAULT NULL::"text", 
    "p_utm_term" "text" DEFAULT NULL::"text", 
    "p_referral_url" "text" DEFAULT NULL::"text", 
    "p_ai_score" integer DEFAULT 0, 
    "p_ai_status_label" "text" DEFAULT NULL::"text"
) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
            'referral_url', p_referral_url,
            'line_id_hash', p_line_id_hash,
            'full_name_hash', p_full_name_hash,
            'phone_hash', p_phone_hash,
            'email_hash', p_email_hash
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
$$;

-- 2. update create_deposit_lead
CREATE OR REPLACE FUNCTION "public"."create_deposit_lead"(
    "p_full_name" "text", 
    "p_full_name_hash" "text", 
    "p_phone" "text", 
    "p_phone_hash" "text", 
    "p_email" "text" DEFAULT NULL::"text", 
    "p_email_hash" "text" DEFAULT NULL::"text", 
    "p_line_id" "text" DEFAULT NULL::"text", 
    "p_line_id_hash" "text" DEFAULT NULL::"text", 
    "p_wechat_id" "text" DEFAULT NULL::"text", 
    "p_whatsapp" "text" DEFAULT NULL::"text", 
    "p_property_type" "text" DEFAULT NULL::"text", 
    "p_note" "text" DEFAULT NULL::"text"
) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
        jsonb_build_object(
            'wechat_id', p_wechat_id, 
            'whatsapp', p_whatsapp,
            'line_id_hash', p_line_id_hash,
            'full_name_hash', p_full_name_hash,
            'phone_hash', p_phone_hash,
            'email_hash', p_email_hash
        ),
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

    RETURN v_lead_id;
END;
$$;

-- 3. update create_lead_from_match
CREATE OR REPLACE FUNCTION "public"."create_lead_from_match"(
    "p_session_id" "uuid", 
    "p_property_id" "uuid", 
    "p_full_name" "text", 
    "p_phone" "text", 
    "p_full_name_hash" "text" DEFAULT NULL::"text", 
    "p_phone_hash" "text" DEFAULT NULL::"text", 
    "p_email" "text" DEFAULT NULL::"text", 
    "p_email_hash" "text" DEFAULT NULL::"text", 
    "p_line_id" "text" DEFAULT NULL::"text", 
    "p_line_id_hash" "text" DEFAULT NULL::"text", 
    "p_wechat_id" "text" DEFAULT NULL::"text", 
    "p_whatsapp" "text" DEFAULT NULL::"text"
) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
        jsonb_build_object(
            'wechat_id', p_wechat_id, 
            'whatsapp', p_whatsapp,
            'line_id_hash', p_line_id_hash,
            'full_name_hash', p_full_name_hash,
            'phone_hash', p_phone_hash,
            'email_hash', p_email_hash
        ),
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
        jsonb_build_object('session_id', p_session_id, 'property_id', p_property_id)
    )
    RETURNING id INTO v_lead_id;

    RETURN v_lead_id;
END;
$$;

-- 4. Define match_properties to return id, title, price, rental_price, similarity
CREATE OR REPLACE FUNCTION public.match_properties(
    query_embedding extensions.vector,
    match_threshold double precision,
    match_count integer,
    p_tenant_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE (
    id uuid,
    title text,
    price numeric,
    rental_price numeric,
    similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        (d.title->>'th')::text AS title,
        c.sale_price AS price,
        c.rent_price AS rental_price,
        1 - (ai.description_embedding <=> query_embedding) AS similarity
    FROM public.properties_ai ai
    JOIN public.properties_core c ON c.id = ai.property_id
    LEFT JOIN public.properties_details d ON c.id = d.property_id
    WHERE 
        (p_tenant_id IS NULL OR c.tenant_id = p_tenant_id)
        AND c.status = 1 -- 1 = Active/Available
        AND c.deleted_at IS NULL
        AND 1 - (ai.description_embedding <=> query_embedding) > match_threshold
    ORDER BY ai.description_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant permissions for match_properties
REVOKE ALL ON FUNCTION public.match_properties(extensions.vector, double precision, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_properties(extensions.vector, double precision, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_properties(extensions.vector, double precision, integer, uuid) TO service_role;

-- 5. Define match_properties_hardened to return id, title, slug, property_type, listing_type, price, rental_price, similarity
CREATE OR REPLACE FUNCTION public.match_properties_hardened(
    query_embedding extensions.vector,
    match_threshold double precision,
    match_count integer,
    p_tenant_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE (
    id uuid,
    title text,
    slug text,
    property_type text,
    listing_type text,
    price numeric,
    rental_price numeric,
    similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        (d.title->>'th')::text AS title,
        c.slug,
        CASE
            WHEN (c.property_type = 1) THEN 'CONDO'::text
            WHEN (c.property_type = 2) THEN 'HOUSE'::text
            WHEN (c.property_type = 3) THEN 'TOWNHOME'::text
            WHEN (c.property_type = 4) THEN 'LAND'::text
            WHEN (c.property_type = 5) THEN 'COMMERCIAL_BUILDING'::text
            WHEN (c.property_type = 6) THEN 'WAREHOUSE'::text
            WHEN (c.property_type = 7) THEN 'OFFICE_BUILDING'::text
            WHEN (c.property_type = 8) THEN 'VILLA'::text
            WHEN (c.property_type = 9) THEN 'POOL_VILLA'::text
            ELSE 'OTHER'::text
        END AS property_type,
        CASE
            WHEN (c.listing_type = 0) THEN 'SALE'::text
            WHEN (c.listing_type = 1) THEN 'RENT'::text
            WHEN (c.listing_type = 2) THEN 'SALE_AND_RENT'::text
            ELSE 'SALE'::text
        END AS listing_type,
        c.sale_price AS price,
        c.rent_price AS rental_price,
        1 - (ai.description_embedding <=> query_embedding) AS similarity
    FROM public.properties_ai ai
    JOIN public.properties_core c ON c.id = ai.property_id
    LEFT JOIN public.properties_details d ON c.id = d.property_id
    WHERE 
        (p_tenant_id IS NULL OR c.tenant_id = p_tenant_id)
        AND c.status = 1 -- 1 = Active/Available
        AND c.deleted_at IS NULL
        AND 1 - (ai.description_embedding <=> query_embedding) > match_threshold
    ORDER BY ai.description_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Grant permissions for match_properties_hardened
REVOKE ALL ON FUNCTION public.match_properties_hardened(extensions.vector, double precision, integer, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_properties_hardened(extensions.vector, double precision, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_properties_hardened(extensions.vector, double precision, integer, uuid) TO service_role;
