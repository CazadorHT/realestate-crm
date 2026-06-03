-- ==========================================================
-- 🏗️ V3 CORE BASELINE - Generated from remote schema dump
-- Generated: 2026-05-20T07:08:11.826Z
-- Source: Supabase project qaihjhvdwfafawezxivb
-- This is the SINGLE SOURCE OF TRUTH baseline.
-- ALL subsequent changes must be new migration files.
-- ==========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

CREATE OR REPLACE FUNCTION "public"."accept_tenant_invitation"("p_tenant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invitation record;
  v_identity_id uuid;
  v_email text;
BEGIN
  v_identity_id := auth.uid();

  -- Get the caller's email from identities_v3
  SELECT email INTO v_email FROM identities_v3 WHERE id = v_identity_id;

  -- Find the pending invitation
  SELECT * INTO v_invitation
  FROM tenant_invitations_v3
  WHERE tenant_id = p_tenant_id
    AND email = v_email
    AND status = 'PENDING'
    AND expires_at > now()
  LIMIT 1;

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'No valid pending invitation found';
  END IF;

  -- Create membership
  INSERT INTO tenant_members_v3 (identity_id, tenant_id, role, joined_at)
  VALUES (v_identity_id, p_tenant_id, v_invitation.role, now())
  ON CONFLICT (identity_id, tenant_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE tenant_invitations_v3
  SET status = 'ACCEPTED'
  WHERE id = v_invitation.id;

  -- Audit
  INSERT INTO system_audit_logs_v3 (action, entity_table, entity_id, actor_id, new_data)
  VALUES (
    'ACCEPT_INVITATION',
    'tenant_invitations_v3',
    v_invitation.id::text,
    v_identity_id::text,
    jsonb_build_object('tenant_id', p_tenant_id, 'role', v_invitation.role)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."bulk_delete_deals_atomic"("p_deal_ids" "uuid"[], "p_tenant_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    UPDATE public.properties_core p
    SET status = 1, updated_at = NOW()
    FROM public.crm_deals_v3 d
    WHERE d.id = ANY(p_deal_ids) AND d.tenant_id = p_tenant_id
      AND d.status = 'CLOSED_WIN' AND d.property_id = p.id;

    DELETE FROM public.crm_deals_v3
    WHERE id = ANY(p_deal_ids) AND tenant_id = p_tenant_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."calculate_net_commission_v3"("p_amount" numeric, "p_tax_rate" numeric DEFAULT 3, "p_vat_rate" numeric DEFAULT 0) RETURNS TABLE("gross_amount" numeric, "wht_amount" numeric, "vat_amount" numeric, "net_amount" numeric)
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN QUERY SELECT 
        p_amount AS gross_amount,
        (p_amount * p_tax_rate / 100) AS wht_amount,
        (p_amount * p_vat_rate / 100) AS vat_amount,
        (p_amount + (p_amount * p_vat_rate / 100) - (p_amount * p_tax_rate / 100)) AS net_amount;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."capture_daily_snapshots"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
BEGIN
    INSERT INTO public.branch_daily_snapshots (tenant_id, branch_id, snapshot_date, metrics)
    SELECT 
        tenant_id,
        branch_id,
        today_date,
        jsonb_build_object(
            'total_properties', total_properties,
            'active_properties', active_properties,
            'active_for_sale', active_for_sale,
            'active_for_rent', active_for_rent,
            'total_inventory_value', total_inventory_value
        )
    FROM public.mv_executive_dashboard
    ON CONFLICT (branch_id, snapshot_date) 
    DO UPDATE SET metrics = EXCLUDED.metrics;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."create_deposit_lead"("p_full_name" "text", "p_full_name_hash" "text", "p_phone" "text", "p_phone_hash" "text", "p_email" "text" DEFAULT NULL::"text", "p_email_hash" "text" DEFAULT NULL::"text", "p_line_id" "text" DEFAULT NULL::"text", "p_line_id_hash" "text" DEFAULT NULL::"text", "p_wechat_id" "text" DEFAULT NULL::"text", "p_whatsapp" "text" DEFAULT NULL::"text", "p_property_type" "text" DEFAULT NULL::"text", "p_note" "text" DEFAULT NULL::"text") RETURNS "uuid"
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
$$;

CREATE OR REPLACE FUNCTION "public"."create_lead_from_match"("p_session_id" "uuid", "p_property_id" "uuid", "p_full_name" "text", "p_phone" "text", "p_full_name_hash" "text" DEFAULT NULL::"text", "p_phone_hash" "text" DEFAULT NULL::"text", "p_email" "text" DEFAULT NULL::"text", "p_email_hash" "text" DEFAULT NULL::"text", "p_line_id" "text" DEFAULT NULL::"text", "p_line_id_hash" "text" DEFAULT NULL::"text", "p_wechat_id" "text" DEFAULT NULL::"text", "p_whatsapp" "text" DEFAULT NULL::"text") RETURNS "uuid"
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
$$;

CREATE OR REPLACE FUNCTION "public"."decline_tenant_invitation"("p_tenant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invitation_id uuid;
  v_identity_id uuid;
  v_email text;
BEGIN
  v_identity_id := auth.uid();

  SELECT email INTO v_email FROM identities_v3 WHERE id = v_identity_id;

  -- Find and decline
  UPDATE tenant_invitations_v3
  SET status = 'DECLINED'
  WHERE tenant_id = p_tenant_id
    AND email = v_email
    AND status = 'PENDING'
  RETURNING id INTO v_invitation_id;

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'No valid pending invitation found';
  END IF;

  -- Audit
  INSERT INTO system_audit_logs_v3 (action, entity_table, entity_id, actor_id, new_data)
  VALUES (
    'DECLINE_INVITATION',
    'tenant_invitations_v3',
    v_invitation_id::text,
    v_identity_id::text,
    jsonb_build_object('tenant_id', p_tenant_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."fn_audit_log_changes_v3"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    -- พยายามดึง actor_id จาก session ถ้าดึงผ่าน Supabase Auth API
    BEGIN
        v_actor_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_actor_id := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.system_audit_logs_v3 (tenant_id, actor_id, action, entity_table, entity_id, old_data)
        VALUES (OLD.tenant_id, v_actor_id, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.system_audit_logs_v3 (tenant_id, actor_id, action, entity_table, entity_id, old_data, new_data)
        VALUES (NEW.tenant_id, v_actor_id, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_popular_areas_with_counts"("target_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "name" "text", "name_en" "text", "name_cn" "text", "name_ru" "text", "province" "text", "slug" "text", "image_url" "text", "is_active" boolean, "sort_order" integer, "featured" boolean, "created_at" timestamp with time zone, "property_count" bigint)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    COALESCE(pa.name->>'th', pa.name->>'default', '')::TEXT as name,
    (pa.name->>'en')::TEXT as name_en,
    (pa.name->>'cn')::TEXT as name_cn,
    (pa.name->>'ru')::TEXT as name_ru,
    pa.province,
    pa.slug,
    pa.image_url,
    pa.is_active,
    pa.sort_order,
    pa.featured,
    pa.created_at,
    COUNT(c.id)::BIGINT as property_count
  FROM public.popular_areas_v3 pa
  LEFT JOIN public.properties_details pd 
    ON COALESCE(pa.name->>'th', pa.name->>'default', '') = pd.address_info->>'popular_area'
  LEFT JOIN public.properties_core c 
    ON c.id = pd.property_id 
    AND c.status = 1 -- Active
    AND c.deleted_at IS NULL 
    AND (target_tenant_id IS NULL OR c.tenant_id = target_tenant_id)
  WHERE (target_tenant_id IS NULL OR pa.tenant_id = target_tenant_id)
  GROUP BY pa.id
  ORDER BY pa.sort_order ASC;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_properties_without_notification_rules_v3"("p_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("id" "uuid", "title" "text", "image_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        (pd.title->>'th')::TEXT as title,
        (SELECT m.url FROM public.property_media_v3 m WHERE m.property_id = p.id AND m.is_cover = true LIMIT 1) as image_url
    FROM public.properties_core p
    JOIN public.properties_details pd ON p.id = pd.property_id
    WHERE p.status = 1 
      AND p.deleted_at IS NULL -- เพิ่มการตรวจเช็ค Soft Delete เพื่อความถูกต้องของข้อมูล
      AND p.listing_type IN (2, 3) 
      AND (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
      -- เปลี่ยนจาก NOT IN เป็น NOT EXISTS เพื่อรีด Performance สแกนด้วย Index 100%
      AND NOT EXISTS (
          SELECT 1 
          FROM public.rent_notification_rules_v3 r
          WHERE r.property_id = p.id
            AND (p_tenant_id IS NULL OR r.tenant_id = p_tenant_id)
      )
    ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."get_user_tenants"() RETURNS "uuid"[]
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN COALESCE(
    ARRAY(
      SELECT tenant_id FROM public.tenant_members_v3 WHERE identity_id = auth.uid()
    ),
    '{}'::uuid[]
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', new.email),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'USER'
  )
  ON CONFLICT (id) DO UPDATE SET
    last_login_at = NOW(),
    email = EXCLUDED.email;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."increment_property_view"("p_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;

CREATE OR REPLACE FUNCTION "public"."increment_service_view"("p_service_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_ip_hash" "text" DEFAULT NULL::"text", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
    UPDATE cms_content_v3
    SET meta_data = jsonb_set(
        COALESCE(meta_data, '{}'::jsonb),
        '{view_count}',
        (COALESCE((meta_data->>'view_count')::int, 0) + 1)::text::jsonb
    )
    WHERE id = p_service_id
    AND content_type = 'service';
END;
$$;

CREATE OR REPLACE FUNCTION "public"."is_member_of_tenant"("tenant_id_param" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  is_member boolean;
BEGIN
  IF NOT public.is_valid_uuid(tenant_id_param) THEN RETURN false; END IF;

  SELECT true INTO is_member 
  FROM public.tenant_members_v3 
  WHERE identity_id = auth.uid() 
    AND tenant_id = tenant_id_param::uuid 
  LIMIT 1;
  
  RETURN COALESCE(is_member, false);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."is_system_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN COALESCE((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')), '') = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."is_tenant_admin"("target_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members_v3
    WHERE identity_id = auth.uid() 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN')
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."is_tenant_admin_or_manager"("tenant_id_param" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  user_role text;
  has_access boolean;
BEGIN
  IF NOT public.is_valid_uuid(tenant_id_param) THEN RETURN false; END IF;

  -- ดึงบทบาทจากตารางหลัก identities_v3 ที่มี id เป็น Unique (ป้องกัน Cardinality Crash)
  SELECT role INTO user_role FROM public.identities_v3 WHERE id = auth.uid();
  
  -- แอดมินสูงสุดผ่านตลอด (ตรวจสอบทั้ง JWT claims และตาราง identities_v3 เพื่อความมั่นใจ)
  IF user_role = 'ADMIN' OR COALESCE((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')), '') = 'ADMIN' THEN 
    RETURN true; 
  END IF;

  -- ตรวจสอบสิทธิ์ระดับสาขาใน tenant_members_v3
  SELECT true INTO has_access 
  FROM public.tenant_members_v3 
  WHERE identity_id = auth.uid() 
    AND tenant_id = tenant_id_param::uuid 
    AND role IN ('OWNER', 'MANAGER')
  LIMIT 1;
  
  RETURN COALESCE(has_access, false);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."is_tenant_member"("target_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.tenant_members_v3 WHERE identity_id = auth.uid() AND tenant_id = target_tenant_id);
END;
$$;

CREATE OR REPLACE FUNCTION "public"."is_tenant_staff"("target_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.tenant_members_v3 WHERE identity_id = auth.uid() AND tenant_id = target_tenant_id AND LOWER(role) IN ('owner', 'admin', 'manager', 'agent'));
END;
$$;

CREATE OR REPLACE FUNCTION "public"."is_valid_uuid"("uuid_to_test" "text") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $_$
BEGIN
  RETURN uuid_to_test ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$_$;

CREATE OR REPLACE FUNCTION "public"."log_ai_usage"("p_model" "text", "p_feature" "text", "p_status" "text", "p_error_message" "text" DEFAULT NULL::"text", "p_prompt_tokens" integer DEFAULT 0, "p_completion_tokens" integer DEFAULT 0, "p_cost_thb" numeric DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;

CREATE OR REPLACE FUNCTION "public"."log_system_activity"("p_action" "text", "p_email" "text" DEFAULT NULL::"text", "p_entity" "text" DEFAULT NULL::"text", "p_entity_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
    INSERT INTO public.system_audit_logs_v3 (action, entity_table, entity_id, new_data, actor_id)
    VALUES (p_action, COALESCE(p_entity, 'unknown'), p_entity_id, p_metadata || jsonb_build_object('email', p_email), auth.uid());
EXCEPTION WHEN OTHERS THEN 
    -- Fail silently to not block the main process
END;
$$;

CREATE OR REPLACE FUNCTION "public"."match_properties_v3"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "p_tenant_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("property_id" "uuid", "tenant_id" "uuid", "status" smallint, "price" numeric, "bedrooms" integer, "similarity" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as property_id,
        c.tenant_id,
        c.status,
        c.sale_price as price,
        (c.bedrooms)::int as bedrooms,
        1 - (ai.description_embedding <=> query_embedding) AS similarity
    FROM public.properties_ai ai
    JOIN public.properties_core c ON c.id = ai.property_id
    WHERE 
        (p_tenant_id IS NULL OR c.tenant_id = p_tenant_id)
        AND c.status = 1 -- 1 = Active/Available
        AND c.deleted_at IS NULL
        AND 1 - (ai.description_embedding <=> query_embedding) > match_threshold
    ORDER BY ai.description_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."branches_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "name" "jsonb" NOT NULL,
    "location" "public"."geography"(Point,4326),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "name_cn" "text",
    "name_ru" "text",
    "icon_key" "text",
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "display_name" "text",
    "email" "text",
    "avatar_url" "text",
    "phone" "text",
    "role" "text" DEFAULT 'USER'::"text",
    "bio" "text",
    "line_id" "text",
    "line_user_id" "text",
    "telegram_id" "text",
    "facebook_url" "text",
    "whatsapp_id" "text",
    "wechat_id" "text",
    "tax_id" "text",
    "tax_address" "text",
    "bank_code" "text",
    "bank_account_no" "text",
    "bank_account_name" "text",
    "other_bank_name" "text",
    "notification_preferences" "jsonb" DEFAULT '{"line": true, "email": true, "system": true, "browser": true}'::"jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "last_seen_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "last_login_at" timestamp with time zone,
    "last_ip" "text",
    "nickname" "text",
    "signature_url" "text",
    "wechat_user_id" "text",
    "whatsapp_user_id" "text"
);

COMMENT ON COLUMN "public"."profiles"."nickname" IS 'ชื่อเล่นของพนักงาน';

COMMENT ON COLUMN "public"."profiles"."signature_url" IS 'URL รูปภาพลายเซ็นดิจิทัล (Transparent PNG)';

COMMENT ON COLUMN "public"."profiles"."wechat_user_id" IS 'ID สำหรับเชื่อมต่อ WeChat (ใช้ในหน้า Agent Profile)';

COMMENT ON COLUMN "public"."profiles"."whatsapp_user_id" IS 'ID สำหรับเชื่อมต่อ WhatsApp (ใช้ในหน้า Agent Profile)';

CREATE TABLE IF NOT EXISTS "public"."properties_core" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "branch_id" "uuid",
    "status" smallint DEFAULT 0,
    "listing_type" smallint NOT NULL,
    "property_type" smallint NOT NULL,
    "sale_price" numeric,
    "rent_price" numeric,
    "currency" character varying(3) DEFAULT 'THB'::character varying,
    "price_per_sqm" numeric,
    "bedrooms" smallint,
    "bathrooms" smallint,
    "floor_area" numeric,
    "land_area" numeric,
    "h3_index_res8" "text",
    "location" "public"."geography"(Point,4326),
    "fingerprint" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "owner_id" "uuid",
    "assigned_to" "uuid",
    "created_by" "uuid",
    "co_broker_id" "uuid",
    "is_exclusive" boolean DEFAULT false,
    "is_hot_deal" boolean DEFAULT false,
    "verified" boolean DEFAULT false,
    "search_vector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"simple"'::"regconfig", (("fingerprint" || ' '::"text") || ("id")::"text"))) STORED,
    "slug" "text",
    "posted_to_facebook_at" timestamp with time zone,
    "posted_to_instagram_at" timestamp with time zone,
    "posted_to_line_at" timestamp with time zone,
    "posted_to_tiktok_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "public"."properties_details" (
    "property_id" "uuid" NOT NULL,
    "title" "jsonb" NOT NULL,
    "description" "jsonb",
    "amenities" "jsonb" DEFAULT '{}'::"jsonb",
    "pricing_details" "jsonb" DEFAULT '{}'::"jsonb",
    "address_info" "jsonb" DEFAULT '{}'::"jsonb",
    "transit_info" "jsonb" DEFAULT '[]'::"jsonb",
    "meta_data" "jsonb" DEFAULT '{}'::"jsonb"
);

CREATE TABLE IF NOT EXISTS "public"."property_features" (
    "property_id" "uuid" NOT NULL,
    "feature_id" "text" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."property_media_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid",
    "media_type" "text" DEFAULT 'image'::"text",
    "storage_path" "text" NOT NULL,
    "url" "text" NOT NULL,
    "is_cover" boolean DEFAULT false,
    "sort_order" smallint DEFAULT 0,
    "ai_scan_status" "text" DEFAULT 'pending'::"text",
    "ai_scan_result" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."tenants_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "global_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "logo_url" "text",
    "is_deleted" boolean DEFAULT false
);

CREATE OR REPLACE VIEW "public"."properties" WITH ("security_invoker"='true') AS
 SELECT "c"."id",
    "c"."tenant_id",
    "c"."branch_id",
    "c"."status" AS "status_int",
        CASE
            WHEN ("c"."status" = 0) THEN 'DRAFT'::"text"
            WHEN ("c"."status" = 1) THEN 'ACTIVE'::"text"
            WHEN ("c"."status" = 2) THEN 'UNDER_OFFER'::"text"
            WHEN ("c"."status" = 3) THEN 'RESERVED'::"text"
            WHEN ("c"."status" = 4) THEN 'SOLD'::"text"
            WHEN ("c"."status" = 5) THEN 'RENTED'::"text"
            WHEN ("c"."status" = 6) THEN 'ARCHIVED'::"text"
            ELSE 'DRAFT'::"text"
        END AS "status",
    "c"."listing_type" AS "listing_type_int",
        CASE
            WHEN ("c"."listing_type" = 0) THEN 'SALE'::"text"
            WHEN ("c"."listing_type" = 1) THEN 'RENT'::"text"
            WHEN ("c"."listing_type" = 2) THEN 'SALE_AND_RENT'::"text"
            ELSE 'SALE'::"text"
        END AS "listing_type",
    "c"."property_type" AS "property_type_int",
        CASE
            WHEN ("c"."property_type" = 1) THEN 'CONDO'::"text"
            WHEN ("c"."property_type" = 2) THEN 'HOUSE'::"text"
            WHEN ("c"."property_type" = 3) THEN 'TOWNHOME'::"text"
            WHEN ("c"."property_type" = 4) THEN 'LAND'::"text"
            WHEN ("c"."property_type" = 5) THEN 'COMMERCIAL_BUILDING'::"text"
            WHEN ("c"."property_type" = 6) THEN 'WAREHOUSE'::"text"
            WHEN ("c"."property_type" = 7) THEN 'OFFICE_BUILDING'::"text"
            WHEN ("c"."property_type" = 8) THEN 'VILLA'::"text"
            WHEN ("c"."property_type" = 9) THEN 'POOL_VILLA'::"text"
            ELSE 'OTHER'::"text"
        END AS "property_type",
    "c"."sale_price" AS "price",
    "c"."rent_price" AS "rental_price",
    "c"."currency",
    "c"."bedrooms",
    "c"."bathrooms",
    "c"."floor_area" AS "size_sqm",
    "c"."land_area" AS "land_size_sqwah",
    "c"."location",
    "c"."created_at",
    "c"."updated_at",
    "c"."deleted_at",
    "c"."assigned_to",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN "c"."owner_id"
            ELSE NULL::"uuid"
        END AS "owner_id",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN "c"."created_by"
            ELSE NULL::"uuid"
        END AS "created_by",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'co_agent_name'::"text")
            ELSE NULL::"text"
        END AS "co_agent_name",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'co_agent_phone'::"text")
            ELSE NULL::"text"
        END AS "co_agent_phone",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'co_agent_sale_commission_percent'::"text"))::numeric
            ELSE NULL::numeric
        END AS "co_agent_sale_commission_percent",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'commission_sale_percentage'::"text"))::numeric
            ELSE NULL::numeric
        END AS "commission_sale_percentage",
        CASE
            WHEN (("auth"."role"() = 'authenticated'::"text") OR "public"."is_system_admin"()) THEN ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'commission_rent_months'::"text"))::numeric
            ELSE NULL::numeric
        END AS "commission_rent_months",
    "c"."posted_to_facebook_at",
    "c"."posted_to_instagram_at",
    "c"."posted_to_line_at",
    "c"."posted_to_tiktok_at",
    COALESCE("c"."is_hot_deal", false) AS "is_hot_deal",
    COALESCE("c"."is_exclusive", false) AS "is_exclusive",
    COALESCE("c"."verified", false) AS "verified",
    "c"."co_broker_id",
    "c"."slug",
    (COALESCE("d"."title", '{}'::"jsonb") ->> 'th'::"text") AS "title",
    (COALESCE("d"."title", '{}'::"jsonb") ->> 'en'::"text") AS "title_en",
    (COALESCE("d"."title", '{}'::"jsonb") ->> 'cn'::"text") AS "title_cn",
    (COALESCE("d"."title", '{}'::"jsonb") ->> 'ru'::"text") AS "title_ru",
    (COALESCE("d"."description", '{}'::"jsonb") ->> 'th'::"text") AS "description",
    (COALESCE("d"."description", '{}'::"jsonb") ->> 'en'::"text") AS "description_en",
    (COALESCE("d"."description", '{}'::"jsonb") ->> 'cn'::"text") AS "description_cn",
    (COALESCE("d"."description", '{}'::"jsonb") ->> 'ru'::"text") AS "description_ru",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'subdistrict'::"text") AS "subdistrict",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'district'::"text") AS "district",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'province'::"text") AS "province",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'popular_area'::"text") AS "popular_area",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'popular_area_en'::"text") AS "popular_area_en",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'popular_area_cn'::"text") AS "popular_area_cn",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'popular_area_ru'::"text") AS "popular_area_ru",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'address_line1'::"text") AS "address_line1",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'address_line1_en'::"text") AS "address_line1_en",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'address_line1_cn'::"text") AS "address_line1_cn",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'address_line1_ru'::"text") AS "address_line1_ru",
    (COALESCE("d"."address_info", '{}'::"jsonb") ->> 'postal_code'::"text") AS "postal_code",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'original_price'::"text"))::numeric AS "original_price",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'original_rental_price'::"text"))::numeric AS "original_rental_price",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'min_contract_months'::"text"))::integer AS "min_contract_months",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'price_per_sqm'::"text"))::numeric AS "price_per_sqm",
    ((COALESCE("d"."pricing_details", '{}'::"jsonb") ->> 'rent_price_per_sqm'::"text"))::numeric AS "rent_price_per_sqm",
    (COALESCE("d"."meta_data", '{}'::"jsonb") -> 'meta_keywords'::"text") AS "meta_keywords",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'parking_slots'::"text"))::integer AS "parking_slots",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'floor'::"text"))::integer AS "floor",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'total_units'::"text"))::integer AS "total_units",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'sold_units'::"text"))::integer AS "sold_units",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'ceiling_height'::"text"))::numeric AS "ceiling_height",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'office_capacity'::"text"))::integer AS "office_capacity",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'orientation'::"text") AS "orientation",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'parking_type'::"text") AS "parking_type",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'property_source'::"text") AS "property_source",
    COALESCE((("d"."amenities" ->> 'is_fully_furnished'::"text"))::boolean, false) AS "is_fully_furnished",
    COALESCE((("d"."amenities" ->> 'is_bare_shell'::"text"))::boolean, false) AS "is_bare_shell",
    COALESCE((("d"."amenities" ->> 'is_pet_friendly'::"text"))::boolean, false) AS "is_pet_friendly",
    COALESCE((("d"."amenities" ->> 'is_corner_unit'::"text"))::boolean, false) AS "is_corner_unit",
    COALESCE((("d"."amenities" ->> 'is_renovated'::"text"))::boolean, false) AS "is_renovated",
    COALESCE((("d"."amenities" ->> 'is_selling_with_tenant'::"text"))::boolean, false) AS "is_selling_with_tenant",
    COALESCE((("d"."amenities" ->> 'is_foreigner_quota'::"text"))::boolean, false) AS "is_foreigner_quota",
    COALESCE((("d"."amenities" ->> 'is_tax_registered'::"text"))::boolean, false) AS "is_tax_registered",
    COALESCE((("d"."meta_data" ->> 'requires_ai_review'::"text"))::boolean, false) AS "requires_ai_review",
    COALESCE((("d"."meta_data" ->> 'is_featured'::"text"))::boolean, false) AS "is_featured",
    COALESCE((("d"."meta_data" ->> 'has_city_view'::"text"))::boolean, false) AS "has_city_view",
    COALESCE((("d"."meta_data" ->> 'has_pool_view'::"text"))::boolean, false) AS "has_pool_view",
    COALESCE((("d"."meta_data" ->> 'has_garden_view'::"text"))::boolean, false) AS "has_garden_view",
    COALESCE((("d"."amenities" ->> 'has_private_pool'::"text"))::boolean, false) AS "has_private_pool",
    COALESCE((("d"."meta_data" ->> 'has_river_view'::"text"))::boolean, false) AS "has_river_view",
    COALESCE((("d"."meta_data" ->> 'has_unblocked_view'::"text"))::boolean, false) AS "has_unblocked_view",
    COALESCE((("d"."meta_data" ->> 'allow_smoking'::"text"))::boolean, false) AS "allow_smoking",
    COALESCE((("d"."amenities" ->> 'is_high_ceiling'::"text"))::boolean, false) AS "is_high_ceiling",
    COALESCE((("d"."amenities" ->> 'is_column_free'::"text"))::boolean, false) AS "is_column_free",
    COALESCE((("d"."amenities" ->> 'is_grade_a'::"text"))::boolean, false) AS "is_grade_a",
    COALESCE((("d"."amenities" ->> 'is_grade_b'::"text"))::boolean, false) AS "is_grade_b",
    COALESCE((("d"."amenities" ->> 'is_grade_c'::"text"))::boolean, false) AS "is_grade_c",
    COALESCE((("d"."amenities" ->> 'has_raised_floor'::"text"))::boolean, false) AS "has_raised_floor",
    COALESCE((("d"."amenities" ->> 'is_central_air'::"text"))::boolean, false) AS "is_central_air",
    COALESCE((("d"."amenities" ->> 'is_split_air'::"text"))::boolean, false) AS "is_split_air",
    COALESCE((("d"."amenities" ->> 'has_247_access'::"text"))::boolean, false) AS "has_247_access",
    COALESCE((("d"."amenities" ->> 'has_fiber_optic'::"text"))::boolean, false) AS "has_fiber_optic",
    COALESCE((("d"."amenities" ->> 'has_multi_parking'::"text"))::boolean, false) AS "has_multi_parking",
    COALESCE((("d"."amenities" ->> 'facing_east'::"text"))::boolean, false) AS "facing_east",
    COALESCE((("d"."amenities" ->> 'facing_north'::"text"))::boolean, false) AS "facing_north",
    COALESCE((("d"."amenities" ->> 'facing_south'::"text"))::boolean, false) AS "facing_south",
    COALESCE((("d"."amenities" ->> 'facing_west'::"text"))::boolean, false) AS "facing_west",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'ai_summary_content'::"text") AS "ai_summary_content",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'ai_reviewed_at'::"text") AS "ai_reviewed_at",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'ai_reviewed_by'::"text") AS "ai_reviewed_by",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'google_maps_link'::"text") AS "google_maps_link",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'version'::"text"))::integer AS "version",
    ( SELECT "tenants_v3"."name"
           FROM "public"."tenants_v3"
          WHERE ("tenants_v3"."id" = "c"."tenant_id")) AS "tenant_name",
    ( SELECT "branches_v3"."name"
           FROM "public"."branches_v3"
          WHERE ("branches_v3"."id" = "c"."branch_id")) AS "branch_name",
    COALESCE((("d"."transit_info" ->> 'near_transit'::"text"))::boolean, false) AS "near_transit",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_type'::"text") AS "transit_type",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name'::"text") AS "transit_station_name",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name_en'::"text") AS "transit_station_name_en",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name_cn'::"text") AS "transit_station_name_cn",
    (COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_station_name_ru'::"text") AS "transit_station_name_ru",
    ((COALESCE("d"."transit_info", '{}'::"jsonb") ->> 'transit_distance_meters'::"text"))::numeric AS "transit_distance_meters",
    "d"."amenities",
    "d"."pricing_details",
    "d"."meta_data",
    "d"."address_info",
    "d"."transit_info",
    ( SELECT ("jsonb_agg"("property_media_v3"."url" ORDER BY "property_media_v3"."sort_order"))::"text" AS "jsonb_agg"
           FROM "public"."property_media_v3"
          WHERE ("property_media_v3"."property_id" = "c"."id")) AS "images",
    (COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'structured_data'::"text") AS "structured_data",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'view_count'::"text"))::integer AS "view_count",
    ((COALESCE("d"."meta_data", '{}'::"jsonb") ->> 'trust_score'::"text"))::numeric AS "trust_score",
    COALESCE((("d"."meta_data" ->> 'has_nearby_places'::"text"))::boolean, false) AS "has_nearby_places",
    COALESCE(("d"."address_info" -> 'nearby_places'::"text"), '[]'::"jsonb") AS "nearby_places",
    COALESCE(("d"."transit_info" -> 'nearby_transits'::"text"), '[]'::"jsonb") AS "nearby_transits",
    ( SELECT "jsonb_agg"("jsonb_build_object"('id', "f"."id", 'name', "f"."name", 'name_en', "f"."name_en", 'name_cn', "f"."name_cn", 'name_ru', "f"."name_ru", 'icon_key', "f"."icon_key", 'category', "f"."category")) AS "jsonb_agg"
           FROM ("public"."property_features" "pf"
             JOIN "public"."features" "f" ON (("pf"."feature_id" = "f"."id")))
          WHERE ("pf"."property_id" = "c"."id")) AS "features",
    ( SELECT "property_media_v3"."url"
           FROM "public"."property_media_v3"
          WHERE (("property_media_v3"."property_id" = "c"."id") AND ("property_media_v3"."is_cover" = true))
          ORDER BY "property_media_v3"."sort_order"
         LIMIT 1) AS "main_image"
   FROM ("public"."properties_core" "c"
     LEFT JOIN "public"."properties_details" "d" ON (("c"."id" = "d"."property_id")));

CREATE OR REPLACE FUNCTION "public"."profiles"("property" "public"."properties") RETURNS SETOF "public"."profiles"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT * FROM public.profiles WHERE id = property.assigned_to;
$$;

CREATE OR REPLACE FUNCTION "public"."refresh_executive_dashboard"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_executive_dashboard;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."submit_public_lead"("p_full_name" "text", "p_full_name_hash" "text" DEFAULT NULL::"text", "p_line_id" "text" DEFAULT NULL::"text", "p_line_id_hash" "text" DEFAULT NULL::"text", "p_phone" "text" DEFAULT NULL::"text", "p_phone_hash" "text" DEFAULT NULL::"text", "p_email" "text" DEFAULT NULL::"text", "p_email_hash" "text" DEFAULT NULL::"text", "p_wechat_id" "text" DEFAULT NULL::"text", "p_whatsapp" "text" DEFAULT NULL::"text", "p_property_id" "uuid" DEFAULT NULL::"uuid", "p_source" "text" DEFAULT 'WEBSITE'::"text", "p_note" "text" DEFAULT NULL::"text", "p_utm_source" "text" DEFAULT NULL::"text", "p_utm_medium" "text" DEFAULT NULL::"text", "p_utm_campaign" "text" DEFAULT NULL::"text", "p_utm_content" "text" DEFAULT NULL::"text", "p_utm_term" "text" DEFAULT NULL::"text", "p_referral_url" "text" DEFAULT NULL::"text", "p_ai_score" integer DEFAULT 0, "p_ai_status_label" "text" DEFAULT NULL::"text") RETURNS "uuid"
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
$$;

CREATE OR REPLACE FUNCTION "public"."swap_property_stock_atomic"("p_old_property_id" "uuid", "p_new_property_id" "uuid", "p_old_deal_type" "text", "p_new_deal_type" "text", "p_tenant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF p_old_property_id IS NOT NULL AND p_old_property_id != '00000000-0000-0000-0000-000000000000'::uuid THEN
        PERFORM public.sync_property_inventory_atomic(p_old_property_id, -1, p_old_deal_type, p_tenant_id);
    END IF;
    IF p_new_property_id IS NOT NULL AND p_new_property_id != '00000000-0000-0000-0000-000000000000'::uuid THEN
        PERFORM public.sync_property_inventory_atomic(p_new_property_id, 1, p_new_deal_type, p_tenant_id);
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."sync_property_inventory_atomic"("p_property_id" "uuid", "p_adjustment" integer, "p_deal_type" "text", "p_tenant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_new_status INTEGER;
BEGIN
    -- V3 Logic: Mapping from labels.ts: ACTIVE (1), SOLD (4), RENTED (5)
    IF p_adjustment > 0 THEN
        IF p_deal_type = 'RENT' THEN v_new_status := 5;
        ELSE v_new_status := 4; END IF;
    ELSE
        v_new_status := 1;
    END IF;

    UPDATE public.properties_core
    SET status = v_new_status, updated_at = NOW()
    WHERE id = p_property_id AND tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."transfer_lead_to_tenant_v3"("p_lead_id" "uuid", "p_target_tenant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
    v_source_tenant_id UUID;
    v_is_authorized BOOLEAN;
BEGIN
    -- 1. Get current tenant of the lead
    SELECT tenant_id INTO v_source_tenant_id
    FROM public.crm_leads_v3
    WHERE id = p_lead_id;

    IF v_source_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Lead not found or invalid ID.';
    END IF;

    -- 2. Check authorization: User must be OWNER/MANAGER of source tenant, or System Admin
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_members_v3
        WHERE identity_id = auth.uid()
          AND tenant_id = v_source_tenant_id
          AND LOWER(role) IN ('owner', 'admin', 'manager')
    ) OR public.is_system_admin() INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Access Denied: Only Branch Owner, Manager, or System Admin can transfer leads.';
    END IF;

    -- 3. Verify target tenant exists
    IF NOT EXISTS (SELECT 1 FROM public.tenants_v3 WHERE id = p_target_tenant_id) THEN
        RAISE EXCEPTION 'Target tenant/branch does not exist.';
    END IF;

    -- 4. Perform the update
    UPDATE public.crm_leads_v3
    SET tenant_id = p_target_tenant_id,
        updated_at = NOW()
    WHERE id = p_lead_id;

    -- 5. Log transfer in the activity timeline for audit trail
    INSERT INTO public.activity_timeline_v3 (
        tenant_id,
        actor_id,
        target_entity,
        target_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        p_target_tenant_id,
        auth.uid(),
        'lead',
        p_lead_id,
        'transferred',
        'Lead transferred from tenant ' || v_source_tenant_id || ' to ' || p_target_tenant_id,
        jsonb_build_object(
            'source_tenant_id', v_source_tenant_id,
            'target_tenant_id', p_target_tenant_id,
            'transferred_by', auth.uid()
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."transfer_property_to_tenant_v3"("p_property_id" "uuid", "p_target_tenant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
    v_source_tenant_id UUID;
    v_is_authorized BOOLEAN;
BEGIN
    -- 1. Get current tenant of the property
    SELECT tenant_id INTO v_source_tenant_id
    FROM public.properties_core
    WHERE id = p_property_id;

    IF v_source_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Property not found or invalid ID.';
    END IF;

    -- 2. Check authorization: User must be OWNER/MANAGER of source tenant, or System Admin
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_members_v3
        WHERE identity_id = auth.uid()
          AND tenant_id = v_source_tenant_id
          AND LOWER(role) IN ('owner', 'admin', 'manager')
    ) OR public.is_system_admin() INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Access Denied: Only Branch Owner, Manager, or System Admin can transfer properties.';
    END IF;

    -- 3. Verify target tenant exists
    IF NOT EXISTS (SELECT 1 FROM public.tenants_v3 WHERE id = p_target_tenant_id) THEN
        RAISE EXCEPTION 'Target tenant/branch does not exist.';
    END IF;

    -- 4. Perform the update
    UPDATE public.properties_core
    SET tenant_id = p_target_tenant_id,
        updated_at = NOW()
    WHERE id = p_property_id;

    -- 5. Log transfer in the activity timeline for audit trail
    INSERT INTO public.activity_timeline_v3 (
        tenant_id,
        actor_id,
        target_entity,
        target_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        p_target_tenant_id,
        auth.uid(),
        'property',
        p_property_id,
        'transferred',
        'Property transferred from tenant ' || v_source_tenant_id || ' to ' || p_target_tenant_id,
        jsonb_build_object(
            'source_tenant_id', v_source_tenant_id,
            'target_tenant_id', p_target_tenant_id,
            'transferred_by', auth.uid()
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."transfer_tenant_member"("p_profile_id" "uuid", "p_from_tenant_id" "uuid", "p_to_tenant_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_identity_id uuid;
  v_member_role text;
BEGIN
  -- Resolve identity_id from auth user id (p_profile_id maps to identities_v3.id)
  v_identity_id := p_profile_id;

  -- Get current role from source tenant
  SELECT role INTO v_member_role
  FROM tenant_members_v3
  WHERE identity_id = v_identity_id AND tenant_id = p_from_tenant_id;

  IF v_member_role IS NULL THEN
    RAISE EXCEPTION 'Member not found in source tenant';
  END IF;

  -- Remove from source tenant
  DELETE FROM tenant_members_v3
  WHERE identity_id = v_identity_id AND tenant_id = p_from_tenant_id;

  -- Add to target tenant (keep same role)
  INSERT INTO tenant_members_v3 (identity_id, tenant_id, role, joined_at)
  VALUES (v_identity_id, p_to_tenant_id, v_member_role, now())
  ON CONFLICT (identity_id, tenant_id) DO UPDATE SET role = EXCLUDED.role;

  -- Audit log
  INSERT INTO system_audit_logs_v3 (action, entity_table, entity_id, actor_id, old_data, new_data)
  VALUES (
    'TRANSFER_MEMBER',
    'tenant_members_v3',
    v_identity_id::text,
    auth.uid()::text,
    jsonb_build_object('from_tenant', p_from_tenant_id),
    jsonb_build_object('to_tenant', p_to_tenant_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION "public"."trig_owners_view_dml"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
    v_identity_id UUID;
BEGIN
    -- 1. กรณี UPDATE (แก้ไขข้อมูลโปรไฟล์ หรือ ย้ายสาขา/เปลี่ยน Role)
    IF TG_OP = 'UPDATE' THEN
        -- 1.1 อัปเดตข้อมูลส่วนตัวใน identities_v3
        UPDATE public.identities_v3
        SET 
            display_name = COALESCE(NEW.full_name, display_name),
            email = COALESCE(NEW.email, email),
            phone = COALESCE(NEW.phone, phone),
            avatar_url = COALESCE(NEW.avatar_url, avatar_url),
            updated_at = now()
        WHERE id = OLD.id;

        -- 1.2 อัปเดตข้อมูลสิทธิ์สาขาใน tenant_members_v3
        UPDATE public.tenant_members_v3
        SET 
            tenant_id = COALESCE(NEW.tenant_id, tenant_id),
            role = COALESCE(NEW.role, role)
        WHERE identity_id = OLD.id AND role = OLD.role;

        RETURN NEW;

    -- 2. กรณี INSERT (สร้าง Owner ใหม่จากหน้าเว็บ)
    ELSIF TG_OP = 'INSERT' THEN
        -- 2.1 กำหนด UUID หรือใช้ค่าที่ส่งมา
        v_identity_id := COALESCE(NEW.id, extensions.uuid_generate_v4());

        -- 2.2 บันทึกข้อมูลลง identities_v3 (หากมีอยู่แล้วให้อัปเดต)
        INSERT INTO public.identities_v3 (id, display_name, email, phone, avatar_url, role, created_at, updated_at)
        VALUES (
            v_identity_id,
            NEW.full_name,
            NEW.email,
            NEW.phone,
            NEW.avatar_url,
            COALESCE(NEW.role, 'OWNER'),
            COALESCE(NEW.created_at, now()),
            COALESCE(NEW.updated_at, now())
        )
        ON CONFLICT (id) DO UPDATE 
        SET 
            display_name = EXCLUDED.display_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = now();

        NEW.id := v_identity_id;

        -- 2.3 บันทึกสิทธิ์ลง tenant_members_v3 (ตรวจสอบก่อนเพื่อความปลอดภัยไม่ให้ซ้ำ)
        IF EXISTS (SELECT 1 FROM public.tenant_members_v3 WHERE identity_id = v_identity_id AND tenant_id = NEW.tenant_id) THEN
            UPDATE public.tenant_members_v3
            SET role = COALESCE(NEW.role, 'OWNER')
            WHERE identity_id = v_identity_id AND tenant_id = NEW.tenant_id;
        ELSE
            INSERT INTO public.tenant_members_v3 (id, identity_id, tenant_id, role, joined_at)
            VALUES (
                extensions.uuid_generate_v4(),
                v_identity_id,
                NEW.tenant_id,
                COALESCE(NEW.role, 'OWNER'),
                now()
            );
        END IF;

        RETURN NEW;

    -- 3. กรณี DELETE (ลบ Owner หรือถอดสิทธิ์)
    ELSIF TG_OP = 'DELETE' THEN
        -- ลบสิทธิ์ออกจาก tenant_members_v3 (เพื่อไม่ให้กระทบประวัติอื่นๆ ใน identities_v3)
        DELETE FROM public.tenant_members_v3
        WHERE identity_id = OLD.id AND role = OLD.role;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."update_v3_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION "public"."v3_approve_identity"("target_user_id" "uuid", "new_role" "text", "actor_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- 1. หา Tenant ID ของผู้ใช้งาน
    SELECT tenant_id INTO v_tenant_id 
    FROM public.tenant_members_v3 
    WHERE identity_id = target_user_id 
    LIMIT 1;

    -- 2. อัปเดตบทบาท (ระบุ cast ให้ชัดเจนเพื่อกันเหนียว)
    UPDATE public.identities_v3
    SET role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- 3. บันทึก Audit Log
    INSERT INTO public.system_audit_logs_v3 (
        action,
        entity_table,
        entity_id,
        new_data,
        tenant_id,
        actor_id
    ) VALUES (
        'ADMIN_APPROVE_USER',
        'identities_v3',
        target_user_id,
        jsonb_build_object(
            'new_role', new_role, 
            'method', 'ONE_CLICK_RPC_V3'
        ),
        v_tenant_id,
        actor_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', v_tenant_id
    );
END;
$$;

CREATE TABLE IF NOT EXISTS "public"."activity_timeline_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "actor_id" "uuid",
    "target_entity" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "activity_type" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."ai_token_ledgers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "user_id" "uuid",
    "feature" "text" NOT NULL,
    "model" "text" NOT NULL,
    "prompt_tokens" integer DEFAULT 0,
    "completion_tokens" integer DEFAULT 0,
    "cost_thb" numeric(10,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
)
PARTITION BY RANGE ("created_at");

CREATE TABLE IF NOT EXISTS "public"."ai_token_ledgers_2026q3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "user_id" "uuid",
    "feature" "text" NOT NULL,
    "model" "text" NOT NULL,
    "prompt_tokens" integer DEFAULT 0,
    "completion_tokens" integer DEFAULT 0,
    "cost_thb" numeric(10,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."system_audit_logs_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "entity_table" "text" NOT NULL,
    "entity_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "client_ip" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
)
PARTITION BY RANGE ("created_at");

CREATE TABLE IF NOT EXISTS "public"."audit_logs_v3_2026_05" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "actor_id" "uuid",
    "action" "text" NOT NULL,
    "entity_table" "text" NOT NULL,
    "entity_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "client_ip" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."cms_content_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "content_type" "text" NOT NULL,
    "title" "jsonb" NOT NULL,
    "slug" "text" NOT NULL,
    "content" "jsonb",
    "cover_image" "text",
    "meta_data" "jsonb" DEFAULT '{}'::"jsonb",
    "seo_score" smallint,
    "author_id" "uuid",
    "status" "text" DEFAULT 'draft'::"text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE OR REPLACE VIEW "public"."blog_posts" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    "slug",
    ("title" ->> 'th'::"text") AS "title",
    ("title" ->> 'en'::"text") AS "title_en",
    ("title" ->> 'cn'::"text") AS "title_cn",
    ("title" ->> 'ru'::"text") AS "title_ru",
    ("content" ->> 'th'::"text") AS "content",
    ("content" ->> 'en'::"text") AS "content_en",
    ("content" ->> 'cn'::"text") AS "content_cn",
    ("content" ->> 'ru'::"text") AS "content_ru",
    ("meta_data" ->> 'excerpt'::"text") AS "excerpt",
    ("meta_data" ->> 'excerpt_en'::"text") AS "excerpt_en",
    ("meta_data" ->> 'excerpt_cn'::"text") AS "excerpt_cn",
    ("meta_data" ->> 'excerpt_ru'::"text") AS "excerpt_ru",
    "cover_image",
    ("meta_data" ->> 'category'::"text") AS "category",
    ("status" = 'PUBLISHED'::"text") AS "is_published",
    "published_at",
    "created_at",
    "updated_at",
    "author_id"
   FROM "public"."cms_content_v3"
  WHERE ("content_type" = 'BLOG'::"text");

CREATE TABLE IF NOT EXISTS "public"."branch_daily_snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "branch_id" "uuid",
    "snapshot_date" "date" NOT NULL,
    "metrics" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."communications_hub_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "branch_id" "uuid",
    "identity_id" "uuid",
    "platform" "text" NOT NULL,
    "external_thread_id" "text",
    "external_message_id" "text",
    "direction" smallint NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text",
    "content" "text",
    "payload" "jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE OR REPLACE VIEW "public"."contract_templates" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    ("title" ->> 'th'::"text") AS "name",
    ("content" ->> 'th'::"text") AS "content",
    ("meta_data" ->> 'excerpt'::"text") AS "description",
    ("meta_data" ->> 'category'::"text") AS "type",
    ("status" = 'PUBLISHED'::"text") AS "is_active",
    "author_id" AS "created_by",
    "created_at",
    "updated_at"
   FROM "public"."cms_content_v3"
  WHERE ("content_type" = 'CONTRACT_TEMPLATE'::"text");

CREATE TABLE IF NOT EXISTS "public"."crm_deal_commissions_v3" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deal_id" "uuid",
    "tenant_id" "uuid" NOT NULL,
    "recipient_id" "uuid",
    "recipient_role" "text" NOT NULL,
    "percentage" numeric(5,2) DEFAULT 0,
    "amount" numeric(15,2) DEFAULT 0,
    "tax_rate" numeric(5,2) DEFAULT 0,
    "tax_amount" numeric(15,2) DEFAULT 0,
    "net_amount" numeric(15,2) DEFAULT 0,
    "status" "text" DEFAULT 'UNPAID'::"text",
    "paid_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."crm_deals_v3" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "branch_id" "uuid",
    "lead_id" "uuid",
    "property_id" "uuid",
    "agent_id" "uuid",
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'NEGOTIATING'::"text" NOT NULL,
    "deal_type" "text" NOT NULL,
    "currency" "text" DEFAULT 'THB'::"text",
    "total_amount" numeric(15,2) DEFAULT 0,
    "commission_total" numeric(15,2) DEFAULT 0,
    "vat_amount" numeric(15,2) DEFAULT 0,
    "wht_amount" numeric(15,2) DEFAULT 0,
    "net_received" numeric(15,2) DEFAULT 0,
    "transaction_date" "date",
    "transaction_end_date" "date",
    "closed_at" timestamp with time zone,
    "undetermined_date" boolean DEFAULT false,
    "co_agent_name" "text",
    "co_agent_contact" "text",
    "co_agent_online" "text",
    "partner_co_broker_id" "uuid",
    "source" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."crm_leads_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "identity_id" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "status" "text" DEFAULT 'new'::"text",
    "stage" "text" DEFAULT 'awareness'::"text",
    "budget_min" numeric,
    "budget_max" numeric,
    "min_bedrooms" smallint,
    "preferred_locations" "text"[],
    "requirements_embedding" "extensions"."vector"(1536),
    "ai_score" numeric(5,2),
    "ai_summary" "text",
    "source" "text",
    "utm_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."data_sources" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "api_endpoint" "text",
    "trust_score" numeric DEFAULT 1.0
);

CREATE OR REPLACE VIEW "public"."deal_commissions" WITH ("security_invoker"='true') AS
 SELECT "id",
    "deal_id",
    "tenant_id",
    "recipient_id",
    "recipient_role",
    "percentage",
    "amount",
    "tax_rate",
    "tax_amount",
    "net_amount",
    "status",
    "paid_at",
    "metadata",
    "created_at",
    "recipient_id" AS "agent_id"
   FROM "public"."crm_deal_commissions_v3" "c";

CREATE OR REPLACE VIEW "public"."deals" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    "branch_id",
    "lead_id",
    "property_id",
    "agent_id",
    "title",
    "status",
    "deal_type",
    "currency",
    "total_amount",
    "commission_total",
    "vat_amount",
    "wht_amount",
    "net_received",
    "transaction_date",
    "transaction_end_date",
    "closed_at",
    "undetermined_date",
    "co_agent_name",
    "co_agent_contact",
    "co_agent_online",
    "partner_co_broker_id",
    "source",
    "metadata",
    "created_by",
    "created_at",
    "updated_at",
    (("metadata" ->> 'commission_amount'::"text"))::numeric AS "commission_amount",
    (("metadata" ->> 'commission_percent'::"text"))::numeric AS "commission_percent"
   FROM "public"."crm_deals_v3" "d";

CREATE TABLE IF NOT EXISTS "public"."documents_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "owner_entity" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "document_type" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "is_encrypted" boolean DEFAULT false,
    "esign_envelope_id" "text",
    "esign_provider" "text",
    "esign_status" "text",
    "esign_signed_at" timestamp with time zone,
    "ai_summary" "text",
    "ai_verified_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE OR REPLACE VIEW "public"."documents" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    "owner_entity" AS "owner_type",
    "owner_id",
    "document_type",
    "file_name",
    "storage_path",
    "is_encrypted",
    "esign_envelope_id",
    "esign_provider",
    "esign_status",
    "esign_signed_at",
    "ai_summary",
    "ai_verified_status",
    "created_at",
    NULL::"text" AS "mime_type",
    (0)::bigint AS "size_bytes",
    1 AS "version",
    NULL::"uuid" AS "parent_id"
   FROM "public"."documents_v3";

CREATE TABLE IF NOT EXISTS "public"."financial_ledger_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "branch_id" "uuid",
    "transaction_type" "text" NOT NULL,
    "reference_entity" "text",
    "reference_id" "uuid",
    "from_identity_id" "uuid",
    "to_identity_id" "uuid",
    "amount_net" numeric NOT NULL,
    "tax_amount" numeric DEFAULT 0,
    "wht_amount" numeric DEFAULT 0,
    "amount_total" numeric NOT NULL,
    "currency" character varying(3) DEFAULT 'THB'::character varying,
    "status" "text" DEFAULT 'pending'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."identities_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "category" smallint DEFAULT 2,
    "role" "text" DEFAULT 'USER'::"text",
    "display_name" "text",
    "avatar_url" "text",
    "email" "text",
    "phone" "text",
    "line_id" "text",
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "nickname" "text"
);

CREATE TABLE IF NOT EXISTS "public"."identity_match_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "source_identity_a" "uuid",
    "source_identity_b" "uuid",
    "matched_master_id" "uuid",
    "match_reason" "text",
    "ai_confidence" double precision,
    "status" smallint DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."identity_secrets_v3" (
    "identity_id" "uuid" NOT NULL,
    "full_name_encrypted" "text",
    "id_card_encrypted" "text",
    "bank_account_encrypted" "text",
    "tax_info" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."identity_sources_map" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "master_identity_id" "uuid",
    "source_id" "text",
    "external_user_id" "text" NOT NULL,
    "external_user_name" "text",
    "external_phone" "text",
    "confidence_score" numeric DEFAULT 1.0,
    "linked_at" timestamp with time zone DEFAULT "now"()
);

CREATE OR REPLACE VIEW "public"."invoices" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    "reference_id" AS "deal_id",
    "amount_net" AS "subtotal",
    "tax_amount" AS "vat_amount",
    "wht_amount",
    "amount_total" AS "total",
    "status",
    "created_at"
   FROM "public"."financial_ledger_v3" "f"
  WHERE ("transaction_type" = 'INVOICE_ISSUED'::"text");

CREATE OR REPLACE VIEW "public"."leads" WITH ("security_invoker"='true') AS
 SELECT "l"."id",
    "l"."tenant_id",
    "i"."display_name" AS "full_name",
    "i"."email",
    "i"."phone",
    "l"."status",
    "l"."stage",
    "l"."budget_max" AS "max_budget",
    "l"."source",
    "l"."assigned_to",
    "l"."created_at"
   FROM ("public"."crm_leads_v3" "l"
     JOIN "public"."identities_v3" "i" ON (("l"."identity_id" = "i"."id")));

CREATE TABLE IF NOT EXISTS "public"."line_templates" (
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "config" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);

CREATE MATERIALIZED VIEW "public"."mv_executive_dashboard" AS
 SELECT "t"."id" AS "tenant_id",
    "b"."id" AS "branch_id",
    ("b"."name" ->> 'th'::"text") AS "branch_name",
    "count"("p"."id") AS "total_properties",
    "count"("p"."id") FILTER (WHERE ("p"."status" = 1)) AS "active_properties",
    "count"("p"."id") FILTER (WHERE (("p"."listing_type" = 0) AND ("p"."status" = 1))) AS "active_for_sale",
    "count"("p"."id") FILTER (WHERE (("p"."listing_type" = 1) AND ("p"."status" = 1))) AS "active_for_rent",
    "sum"("p"."sale_price") FILTER (WHERE ("p"."status" = 1)) AS "total_inventory_value"
   FROM (("public"."tenants_v3" "t"
     LEFT JOIN "public"."branches_v3" "b" ON (("t"."id" = "b"."tenant_id")))
     LEFT JOIN "public"."properties_core" "p" ON ((("b"."id" = "p"."branch_id") AND ("p"."deleted_at" IS NULL))))
  GROUP BY "t"."id", "b"."id", "b"."name"
  WITH NO DATA;

CREATE TABLE IF NOT EXISTS "public"."notification_channels_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "platform" "text" NOT NULL,
    "external_channel_id" "text" NOT NULL,
    "channel_name" "text",
    "picture_url" "text",
    "is_active" boolean DEFAULT true,
    "tenant_id" "uuid" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_channels_v3_platform_check" CHECK (("platform" = ANY (ARRAY['LINE'::"text", 'TELEGRAM'::"text", 'WHATSAPP'::"text", 'WECHAT'::"text", 'SLACK'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."notifications_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text",
    "link" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

CREATE TABLE IF NOT EXISTS "public"."tenant_members_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "identity_id" "uuid" NOT NULL,
    "team_id" "uuid",
    "role" "text" DEFAULT 'agent'::"text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "joined_at" timestamp with time zone DEFAULT "now"()
);

CREATE OR REPLACE VIEW "public"."owners" WITH ("security_invoker"='true') AS
 SELECT "i"."id",
    "m"."tenant_id",
    "i"."display_name" AS "full_name",
    "i"."email",
    "i"."phone",
    "i"."avatar_url",
    "m"."role",
    "i"."created_at",
    "i"."updated_at"
   FROM ("public"."identities_v3" "i"
     JOIN "public"."tenant_members_v3" "m" ON (("i"."id" = "m"."identity_id")))
  WHERE ("m"."role" = 'OWNER'::"text");

CREATE TABLE IF NOT EXISTS "public"."popular_areas_v3" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "province" "text" DEFAULT 'กรุงเทพมหานคร'::"text",
    "slug" "text",
    "image_url" "text",
    "is_active" boolean DEFAULT true,
    "featured" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "tenant_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);

COMMENT ON TABLE "public"."popular_areas_v3" IS 'V3 popular areas with JSONB i18n names. Replaces legacy popular_areas table.';

COMMENT ON COLUMN "public"."popular_areas_v3"."name" IS 'Multilingual name: {"th":"...","en":"...","cn":"...","ru":"..."}';

CREATE OR REPLACE VIEW "public"."popular_areas" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    "province",
    "slug",
    "image_url",
    "is_active",
    "featured",
    "sort_order",
    "created_at",
    "updated_at",
    ("name" ->> 'th'::"text") AS "name",
    ("name" ->> 'en'::"text") AS "name_en",
    ("name" ->> 'cn'::"text") AS "name_cn",
    ("name" ->> 'ru'::"text") AS "name_ru"
   FROM "public"."popular_areas_v3";

CREATE TABLE IF NOT EXISTS "public"."properties_ai" (
    "property_id" "uuid" NOT NULL,
    "description_embedding" "extensions"."vector"(1536),
    "image_embedding" "extensions"."vector"(1536),
    "ai_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "last_embedded_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "public"."property_agents" (
    "property_id" "uuid" NOT NULL,
    "agent_id" "uuid" NOT NULL
);

CREATE TABLE IF NOT EXISTS "public"."property_image_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "property_id" "uuid",
    "storage_path" "text" NOT NULL,
    "status" "text" DEFAULT 'TEMP'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

CREATE OR REPLACE VIEW "public"."property_images" WITH ("security_invoker"='true') AS
 SELECT "id",
    "property_id",
    "url",
    "url" AS "image_url",
    "storage_path",
    "is_cover",
    "sort_order",
    "media_type",
    "ai_scan_status",
    "ai_scan_result",
    "created_at"
   FROM "public"."property_media_v3";

COMMENT ON VIEW "public"."property_images" IS '@foreignKey (property_id) references public.properties (id)';

CREATE TABLE IF NOT EXISTS "public"."property_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "property_id" "uuid",
    "match_score" numeric,
    "match_reasons" "jsonb",
    "rank" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."property_price_history_v3" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid",
    "tenant_id" "uuid",
    "price" numeric NOT NULL,
    "currency" character varying(3) DEFAULT 'THB'::character varying,
    "changed_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."property_search_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_token" "text",
    "purpose" "text",
    "budget_min" numeric,
    "budget_max" numeric,
    "preferred_area" "text",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "lead_id" "uuid",
    "converted_at" timestamp with time zone,
    "near_transit" boolean DEFAULT false,
    "transit_station_name" "text",
    "transit_type" "text",
    "transit_distance_meters" integer,
    "preferred_property_type" "text"
);

CREATE TABLE IF NOT EXISTS "public"."property_syndication_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid",
    "portal_name" "text" NOT NULL,
    "external_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "last_sync_at" timestamp with time zone,
    "sync_error" "text"
);

CREATE TABLE IF NOT EXISTS "public"."raw_ingestions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "source_id" "text",
    "external_reference_id" "text",
    "raw_payload" "jsonb" NOT NULL,
    "ingested_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text"
);

CREATE TABLE IF NOT EXISTS "public"."ref_master_data" (
    "type" "text" NOT NULL,
    "code" "text" NOT NULL,
    "label" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "sort_order" smallint DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);

COMMENT ON COLUMN "public"."ref_master_data"."metadata" IS 'Extended properties: {"color":"#hex", "icon":"lucide-key", ...}';

CREATE TABLE IF NOT EXISTS "public"."rent_notification_history_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "rule_id" "uuid",
    "property_id" "uuid",
    "channel_id" "uuid",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "status" "text",
    "error_message" "text",
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rent_notification_history_v3_status_check" CHECK (("status" = ANY (ARRAY['SUCCESS'::"text", 'FAILED'::"text", 'PENDING'::"text"])))
);

CREATE TABLE IF NOT EXISTS "public"."rent_notification_rules_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid" NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "notification_day" integer,
    "notification_hour" integer,
    "language" "text" DEFAULT 'th'::"text",
    "is_active" boolean DEFAULT true,
    "last_sent_at" timestamp with time zone,
    "tenant_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rent_notification_rules_v3_language_check" CHECK (("language" = ANY (ARRAY['th'::"text", 'en'::"text", 'zh'::"text", 'ru'::"text"]))),
    CONSTRAINT "rent_notification_rules_v3_notification_day_check" CHECK ((("notification_day" >= 1) AND ("notification_day" <= 31))),
    CONSTRAINT "rent_notification_rules_v3_notification_hour_check" CHECK ((("notification_hour" >= 0) AND ("notification_hour" <= 23)))
);

CREATE TABLE IF NOT EXISTS "public"."system_settings_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "category" "text" NOT NULL,
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);

CREATE OR REPLACE VIEW "public"."site_settings" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    "category",
    "key",
    "value",
    "updated_at",
    "updated_by"
   FROM "public"."system_settings_v3";

CREATE TABLE IF NOT EXISTS "public"."smart_match_budget_ranges" (
    "id" "text" NOT NULL,
    "purpose" "text" NOT NULL,
    "label" "text" NOT NULL,
    "label_en" "text",
    "label_cn" "text",
    "label_ru" "text",
    "min_value" numeric NOT NULL,
    "max_value" numeric NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."smart_match_office_sizes" (
    "id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "label_en" "text",
    "label_cn" "text",
    "label_ru" "text",
    "min_sqm" numeric NOT NULL,
    "max_sqm" numeric NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."smart_match_property_types" (
    "id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "label_en" "text",
    "label_cn" "text",
    "label_ru" "text",
    "value" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."smart_match_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

CREATE TABLE IF NOT EXISTS "public"."system_task_queue" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "task_name" "text" NOT NULL,
    "payload" "jsonb",
    "priority" smallint DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text",
    "error_log" "text",
    "run_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "public"."teams_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "branch_id" "uuid",
    "name" "text" NOT NULL,
    "manager_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE OR REPLACE VIEW "public"."teams" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    "branch_id",
    "name",
    "manager_id",
    "created_at"
   FROM "public"."teams_v3";

CREATE TABLE IF NOT EXISTS "public"."tenant_invitations_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "token" "text" NOT NULL,
    "invited_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

CREATE OR REPLACE VIEW "public"."tenant_invitations" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    "email",
    "role",
    "token",
    "invited_by",
    "status",
    "expires_at",
    "created_at"
   FROM "public"."tenant_invitations_v3" "i";

CREATE OR REPLACE VIEW "public"."tenant_members" WITH ("security_invoker"='true') AS
 SELECT "id",
    "tenant_id",
    "identity_id" AS "profile_id",
    "role",
    "team_id",
    "joined_at" AS "created_at"
   FROM "public"."tenant_members_v3" "m";

CREATE OR REPLACE VIEW "public"."tenants" WITH ("security_invoker"='true') AS
 SELECT "id",
    "name",
    "slug",
    "logo_url",
    "is_deleted",
    "created_at"
   FROM "public"."tenants_v3" "t";

CREATE TABLE IF NOT EXISTS "public"."traffic_views_v3" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "visitor_session_id" "text",
    "identity_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
)
PARTITION BY RANGE ("created_at");

CREATE TABLE IF NOT EXISTS "public"."traffic_views_v3_2026_05" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "visitor_session_id" "text",
    "identity_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."ai_token_ledgers" ATTACH PARTITION "public"."ai_token_ledgers_2026q3" FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

ALTER TABLE ONLY "public"."system_audit_logs_v3" ATTACH PARTITION "public"."audit_logs_v3_2026_05" FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

ALTER TABLE ONLY "public"."traffic_views_v3" ATTACH PARTITION "public"."traffic_views_v3_2026_05" FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

ALTER TABLE ONLY "public"."activity_timeline_v3"
    ADD CONSTRAINT "activity_timeline_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ai_token_ledgers"
    ADD CONSTRAINT "ai_token_ledgers_pkey" PRIMARY KEY ("id", "created_at");

ALTER TABLE ONLY "public"."ai_token_ledgers_2026q3"
    ADD CONSTRAINT "ai_token_ledgers_2026q3_pkey" PRIMARY KEY ("id", "created_at");

ALTER TABLE ONLY "public"."system_audit_logs_v3"
    ADD CONSTRAINT "system_audit_logs_v3_pkey" PRIMARY KEY ("id", "created_at");

ALTER TABLE ONLY "public"."audit_logs_v3_2026_05"
    ADD CONSTRAINT "audit_logs_v3_2026_05_pkey" PRIMARY KEY ("id", "created_at");

ALTER TABLE ONLY "public"."branch_daily_snapshots"
    ADD CONSTRAINT "branch_daily_snapshots_branch_id_snapshot_date_key" UNIQUE ("branch_id", "snapshot_date");

ALTER TABLE ONLY "public"."branch_daily_snapshots"
    ADD CONSTRAINT "branch_daily_snapshots_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."branches_v3"
    ADD CONSTRAINT "branches_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."cms_content_v3"
    ADD CONSTRAINT "cms_content_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."cms_content_v3"
    ADD CONSTRAINT "cms_content_v3_tenant_id_content_type_slug_key" UNIQUE ("tenant_id", "content_type", "slug");

ALTER TABLE ONLY "public"."communications_hub_v3"
    ADD CONSTRAINT "communications_hub_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."crm_deal_commissions_v3"
    ADD CONSTRAINT "crm_deal_commissions_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."crm_deals_v3"
    ADD CONSTRAINT "crm_deals_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."crm_leads_v3"
    ADD CONSTRAINT "crm_leads_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."data_sources"
    ADD CONSTRAINT "data_sources_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."documents_v3"
    ADD CONSTRAINT "documents_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."financial_ledger_v3"
    ADD CONSTRAINT "financial_ledger_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."identities_v3"
    ADD CONSTRAINT "identities_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."identity_match_logs"
    ADD CONSTRAINT "identity_match_logs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."identity_secrets_v3"
    ADD CONSTRAINT "identity_secrets_v3_pkey" PRIMARY KEY ("identity_id");

ALTER TABLE ONLY "public"."identity_sources_map"
    ADD CONSTRAINT "identity_sources_map_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."identity_sources_map"
    ADD CONSTRAINT "identity_sources_map_source_id_external_user_id_key" UNIQUE ("source_id", "external_user_id");

ALTER TABLE ONLY "public"."line_templates"
    ADD CONSTRAINT "line_templates_pkey" PRIMARY KEY ("key");

ALTER TABLE ONLY "public"."notification_channels_v3"
    ADD CONSTRAINT "notification_channels_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."notification_channels_v3"
    ADD CONSTRAINT "notification_channels_v3_platform_external_channel_id_tenan_key" UNIQUE ("platform", "external_channel_id", "tenant_id");

ALTER TABLE ONLY "public"."notifications_v3"
    ADD CONSTRAINT "notifications_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."popular_areas_v3"
    ADD CONSTRAINT "popular_areas_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."popular_areas_v3"
    ADD CONSTRAINT "popular_areas_v3_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."properties_ai"
    ADD CONSTRAINT "properties_ai_pkey" PRIMARY KEY ("property_id");

ALTER TABLE ONLY "public"."properties_core"
    ADD CONSTRAINT "properties_core_fingerprint_key" UNIQUE ("fingerprint");

ALTER TABLE ONLY "public"."properties_core"
    ADD CONSTRAINT "properties_core_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."properties_details"
    ADD CONSTRAINT "properties_details_pkey" PRIMARY KEY ("property_id");

ALTER TABLE ONLY "public"."property_agents"
    ADD CONSTRAINT "property_agents_pkey" PRIMARY KEY ("property_id", "agent_id");

ALTER TABLE ONLY "public"."property_features"
    ADD CONSTRAINT "property_features_pkey" PRIMARY KEY ("property_id", "feature_id");

ALTER TABLE ONLY "public"."property_image_uploads"
    ADD CONSTRAINT "property_image_uploads_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."property_matches"
    ADD CONSTRAINT "property_matches_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."property_media_v3"
    ADD CONSTRAINT "property_media_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."property_price_history_v3"
    ADD CONSTRAINT "property_price_history_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."property_search_sessions"
    ADD CONSTRAINT "property_search_sessions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."property_syndication_v3"
    ADD CONSTRAINT "property_syndication_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."property_syndication_v3"
    ADD CONSTRAINT "property_syndication_v3_property_id_portal_name_key" UNIQUE ("property_id", "portal_name");

ALTER TABLE ONLY "public"."raw_ingestions"
    ADD CONSTRAINT "raw_ingestions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."ref_master_data"
    ADD CONSTRAINT "ref_master_data_pkey" PRIMARY KEY ("type", "code");

ALTER TABLE ONLY "public"."rent_notification_history_v3"
    ADD CONSTRAINT "rent_notification_history_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."rent_notification_rules_v3"
    ADD CONSTRAINT "rent_notification_rules_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."rent_notification_rules_v3"
    ADD CONSTRAINT "rent_notification_rules_v3_property_id_channel_id_key" UNIQUE ("property_id", "channel_id");

ALTER TABLE ONLY "public"."smart_match_budget_ranges"
    ADD CONSTRAINT "smart_match_budget_ranges_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."smart_match_office_sizes"
    ADD CONSTRAINT "smart_match_office_sizes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."smart_match_property_types"
    ADD CONSTRAINT "smart_match_property_types_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."smart_match_settings"
    ADD CONSTRAINT "smart_match_settings_pkey" PRIMARY KEY ("key");

ALTER TABLE ONLY "public"."system_settings_v3"
    ADD CONSTRAINT "system_settings_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."system_settings_v3"
    ADD CONSTRAINT "system_settings_v3_tenant_id_category_key_key" UNIQUE ("tenant_id", "category", "key");

ALTER TABLE ONLY "public"."system_task_queue"
    ADD CONSTRAINT "system_task_queue_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."teams_v3"
    ADD CONSTRAINT "teams_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tenant_invitations_v3"
    ADD CONSTRAINT "tenant_invitations_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tenant_invitations_v3"
    ADD CONSTRAINT "tenant_invitations_v3_token_key" UNIQUE ("token");

ALTER TABLE ONLY "public"."tenant_members_v3"
    ADD CONSTRAINT "tenant_members_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tenant_members_v3"
    ADD CONSTRAINT "tenant_members_v3_tenant_id_identity_id_key" UNIQUE ("tenant_id", "identity_id");

ALTER TABLE ONLY "public"."tenants_v3"
    ADD CONSTRAINT "tenants_v3_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tenants_v3"
    ADD CONSTRAINT "tenants_v3_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."traffic_views_v3"
    ADD CONSTRAINT "traffic_views_v3_pkey" PRIMARY KEY ("id", "created_at");

ALTER TABLE ONLY "public"."traffic_views_v3_2026_05"
    ADD CONSTRAINT "traffic_views_v3_2026_05_pkey" PRIMARY KEY ("id", "created_at");

CREATE INDEX "idx_activity_target" ON "public"."activity_timeline_v3" USING "btree" ("target_entity", "target_id");

CREATE INDEX "idx_cms_content_v3_content_type" ON "public"."cms_content_v3" USING "btree" ("content_type");

CREATE INDEX "idx_cms_content_v3_published" ON "public"."cms_content_v3" USING "btree" ("content_type") WHERE ("status" = ANY (ARRAY['published'::"text", 'PUBLISHED'::"text"]));

CREATE INDEX "idx_cms_content_v3_tenant_id" ON "public"."cms_content_v3" USING "btree" ("tenant_id");

CREATE INDEX "idx_cms_content_v3_title_en_trgm" ON "public"."cms_content_v3" USING "gin" ((("title" ->> 'en'::"text")) "public"."gin_trgm_ops");

CREATE INDEX "idx_cms_content_v3_title_th_trgm" ON "public"."cms_content_v3" USING "gin" ((("title" ->> 'th'::"text")) "public"."gin_trgm_ops");

CREATE INDEX "idx_comms_hub_identity" ON "public"."communications_hub_v3" USING "btree" ("identity_id");

CREATE INDEX "idx_comms_hub_tenant" ON "public"."communications_hub_v3" USING "btree" ("tenant_id");

CREATE INDEX "idx_comms_hub_thread" ON "public"."communications_hub_v3" USING "btree" ("external_thread_id");

CREATE INDEX "idx_crm_deals_v3_lead_id" ON "public"."crm_deals_v3" USING "btree" ("lead_id");

CREATE INDEX "idx_crm_deals_v3_property_id" ON "public"."crm_deals_v3" USING "btree" ("property_id");

CREATE INDEX "idx_crm_deals_v3_tenant_status" ON "public"."crm_deals_v3" USING "btree" ("tenant_id", "status");

CREATE INDEX "idx_crm_leads_v3_active_cqrs" ON "public"."crm_leads_v3" USING "btree" ("tenant_id", "status", "stage");

CREATE INDEX "idx_crm_leads_v3_utm_data_gin" ON "public"."crm_leads_v3" USING "gin" ("utm_data");

CREATE INDEX "idx_id_sources_map_master" ON "public"."identity_sources_map" USING "btree" ("master_identity_id");

CREATE INDEX "idx_identities_v3_email" ON "public"."identities_v3" USING "btree" ("email") WHERE ("email" IS NOT NULL);

CREATE INDEX "idx_identities_v3_phone" ON "public"."identities_v3" USING "btree" ("phone") WHERE ("phone" IS NOT NULL);

CREATE INDEX "idx_identities_v3_tenant" ON "public"."identities_v3" USING "btree" ("tenant_id");

CREATE INDEX "idx_ledger_v3_ref" ON "public"."financial_ledger_v3" USING "btree" ("reference_entity", "reference_id");

CREATE INDEX "idx_ledger_v3_tenant" ON "public"."financial_ledger_v3" USING "btree" ("tenant_id");

CREATE INDEX "idx_media_v3_prop" ON "public"."property_media_v3" USING "btree" ("property_id", "sort_order");

CREATE UNIQUE INDEX "idx_mv_exec_dash_branch" ON "public"."mv_executive_dashboard" USING "btree" ("branch_id");

CREATE INDEX "idx_notif_channels_tenant" ON "public"."notification_channels_v3" USING "btree" ("tenant_id");

CREATE INDEX "idx_popular_areas_v3_featured" ON "public"."popular_areas_v3" USING "btree" ("featured", "is_active") WHERE ("is_active" = true);

CREATE INDEX "idx_popular_areas_v3_name_coalesce" ON "public"."popular_areas_v3" USING "btree" (COALESCE(("name" ->> 'th'::"text"), ("name" ->> 'default'::"text"), ''::"text"));

CREATE INDEX "idx_popular_areas_v3_slug" ON "public"."popular_areas_v3" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);

CREATE INDEX "idx_prop_ai_vector" ON "public"."properties_ai" USING "hnsw" ("description_embedding" "extensions"."vector_cosine_ops");

CREATE INDEX "idx_prop_core_assigned" ON "public"."properties_core" USING "btree" ("assigned_to") WHERE ("assigned_to" IS NOT NULL);

CREATE INDEX "idx_prop_core_cobroker" ON "public"."properties_core" USING "btree" ("co_broker_id") WHERE ("co_broker_id" IS NOT NULL);

CREATE INDEX "idx_prop_core_geo" ON "public"."properties_core" USING "gist" ("location");

CREATE INDEX "idx_prop_core_h3" ON "public"."properties_core" USING "btree" ("h3_index_res8");

CREATE INDEX "idx_prop_core_owner" ON "public"."properties_core" USING "btree" ("owner_id") WHERE ("owner_id" IS NOT NULL);

CREATE INDEX "idx_prop_core_rent_price" ON "public"."properties_core" USING "btree" ("rent_price");

CREATE INDEX "idx_prop_core_sale_price" ON "public"."properties_core" USING "btree" ("sale_price");

CREATE INDEX "idx_prop_core_search_vec" ON "public"."properties_core" USING "gin" ("search_vector");

CREATE INDEX "idx_prop_core_tenant" ON "public"."properties_core" USING "btree" ("tenant_id") WHERE ("deleted_at" IS NULL);

CREATE INDEX "idx_prop_details_address" ON "public"."properties_details" USING "gin" ("address_info");

CREATE INDEX "idx_prop_details_amenities" ON "public"."properties_details" USING "gin" ("amenities");

CREATE INDEX "idx_prop_price_hist_v3" ON "public"."property_price_history_v3" USING "btree" ("property_id", "changed_at" DESC);

CREATE INDEX "idx_properties_core_active_cqrs" ON "public"."properties_core" USING "btree" ("tenant_id", "status", "sale_price") WHERE (("deleted_at" IS NULL) AND ("status" = 1));

CREATE INDEX "idx_properties_core_active_tenant" ON "public"."properties_core" USING "btree" ("tenant_id", "status") WHERE (("deleted_at" IS NULL) AND ("status" = 1));

CREATE INDEX "idx_properties_core_slug" ON "public"."properties_core" USING "btree" ("slug") WHERE ("deleted_at" IS NULL);

CREATE INDEX "idx_properties_details_desc_en_trgm" ON "public"."properties_details" USING "gin" ((("description" ->> 'en'::"text")) "public"."gin_trgm_ops");

CREATE INDEX "idx_properties_details_desc_th_trgm" ON "public"."properties_details" USING "gin" ((("description" ->> 'th'::"text")) "public"."gin_trgm_ops");

CREATE INDEX "idx_properties_details_popular_area_expr" ON "public"."properties_details" USING "btree" ((("address_info" ->> 'popular_area'::"text")));

CREATE INDEX "idx_properties_details_title_en_trgm" ON "public"."properties_details" USING "gin" ((("title" ->> 'en'::"text")) "public"."gin_trgm_ops");

CREATE INDEX "idx_properties_details_title_th_trgm" ON "public"."properties_details" USING "gin" ((("title" ->> 'th'::"text")) "public"."gin_trgm_ops");

CREATE INDEX "idx_property_image_uploads_cleanup_temp" ON "public"."property_image_uploads" USING "btree" ("created_at") WHERE ("status" = 'TEMP'::"text");

CREATE INDEX "idx_rent_history_tenant" ON "public"."rent_notification_history_v3" USING "btree" ("tenant_id");

CREATE INDEX "idx_rent_rules_channel" ON "public"."rent_notification_rules_v3" USING "btree" ("channel_id");

CREATE INDEX "idx_rent_rules_property" ON "public"."rent_notification_rules_v3" USING "btree" ("property_id");

CREATE INDEX "idx_rent_rules_schedule" ON "public"."rent_notification_rules_v3" USING "btree" ("notification_day", "notification_hour") WHERE ("is_active" = true);

CREATE INDEX "idx_rent_rules_tenant" ON "public"."rent_notification_rules_v3" USING "btree" ("tenant_id");

CREATE INDEX "idx_snapshots_date" ON "public"."branch_daily_snapshots" USING "btree" ("snapshot_date" DESC);

CREATE INDEX "idx_snapshots_tenant" ON "public"."branch_daily_snapshots" USING "btree" ("tenant_id");

CREATE INDEX "idx_task_queue_status" ON "public"."system_task_queue" USING "btree" ("status", "run_at");

CREATE INDEX "idx_tenant_members_v3_security_gate" ON "public"."tenant_members_v3" USING "btree" ("identity_id", "tenant_id", "role");

CREATE INDEX "idx_v3_commissions_deal" ON "public"."crm_deal_commissions_v3" USING "btree" ("deal_id");

CREATE INDEX "idx_v3_commissions_recipient" ON "public"."crm_deal_commissions_v3" USING "btree" ("recipient_id");

CREATE INDEX "idx_v3_deals_agent" ON "public"."crm_deals_v3" USING "btree" ("agent_id");

ALTER INDEX "public"."ai_token_ledgers_pkey" ATTACH PARTITION "public"."ai_token_ledgers_2026q3_pkey";

ALTER INDEX "public"."system_audit_logs_v3_pkey" ATTACH PARTITION "public"."audit_logs_v3_2026_05_pkey";

ALTER INDEX "public"."traffic_views_v3_pkey" ATTACH PARTITION "public"."traffic_views_v3_2026_05_pkey";

CREATE OR REPLACE TRIGGER "trg_audit_ledger" AFTER DELETE OR UPDATE ON "public"."financial_ledger_v3" FOR EACH ROW EXECUTE FUNCTION "public"."fn_audit_log_changes_v3"();

CREATE OR REPLACE TRIGGER "trg_set_updated_at_identities" BEFORE UPDATE ON "public"."identities_v3" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

CREATE OR REPLACE TRIGGER "trig_owners_view_dml_trigger" INSTEAD OF INSERT OR DELETE OR UPDATE ON "public"."owners" FOR EACH ROW EXECUTE FUNCTION "public"."trig_owners_view_dml"();

CREATE OR REPLACE TRIGGER "trigger_identities_v3_updated_at" BEFORE UPDATE ON "public"."identities_v3" FOR EACH ROW EXECUTE FUNCTION "public"."update_v3_updated_at"();

ALTER TABLE ONLY "public"."activity_timeline_v3"
    ADD CONSTRAINT "activity_timeline_v3_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."activity_timeline_v3"
    ADD CONSTRAINT "activity_timeline_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE "public"."ai_token_ledgers"
    ADD CONSTRAINT "ai_token_ledgers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id");

ALTER TABLE "public"."ai_token_ledgers"
    ADD CONSTRAINT "ai_token_ledgers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."branch_daily_snapshots"
    ADD CONSTRAINT "branch_daily_snapshots_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."branch_daily_snapshots"
    ADD CONSTRAINT "branch_daily_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."branches_v3"
    ADD CONSTRAINT "branches_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."cms_content_v3"
    ADD CONSTRAINT "cms_content_v3_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."cms_content_v3"
    ADD CONSTRAINT "cms_content_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."communications_hub_v3"
    ADD CONSTRAINT "communications_hub_v3_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches_v3"("id");

ALTER TABLE ONLY "public"."communications_hub_v3"
    ADD CONSTRAINT "communications_hub_v3_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."communications_hub_v3"
    ADD CONSTRAINT "communications_hub_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."crm_deal_commissions_v3"
    ADD CONSTRAINT "crm_deal_commissions_v3_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."crm_deals_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."crm_deal_commissions_v3"
    ADD CONSTRAINT "crm_deal_commissions_v3_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."crm_deals_v3"
    ADD CONSTRAINT "crm_deals_v3_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."identities_v3"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."crm_deals_v3"
    ADD CONSTRAINT "crm_deals_v3_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."crm_deals_v3"
    ADD CONSTRAINT "crm_deals_v3_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."crm_leads_v3"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."crm_deals_v3"
    ADD CONSTRAINT "crm_deals_v3_partner_co_broker_id_fkey" FOREIGN KEY ("partner_co_broker_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."crm_deals_v3"
    ADD CONSTRAINT "crm_deals_v3_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."crm_leads_v3"
    ADD CONSTRAINT "crm_leads_v3_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."crm_leads_v3"
    ADD CONSTRAINT "crm_leads_v3_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."crm_leads_v3"
    ADD CONSTRAINT "crm_leads_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."documents_v3"
    ADD CONSTRAINT "documents_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."financial_ledger_v3"
    ADD CONSTRAINT "financial_ledger_v3_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches_v3"("id");

ALTER TABLE ONLY "public"."financial_ledger_v3"
    ADD CONSTRAINT "financial_ledger_v3_from_identity_id_fkey" FOREIGN KEY ("from_identity_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."financial_ledger_v3"
    ADD CONSTRAINT "financial_ledger_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."financial_ledger_v3"
    ADD CONSTRAINT "financial_ledger_v3_to_identity_id_fkey" FOREIGN KEY ("to_identity_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."property_search_sessions"
    ADD CONSTRAINT "fk_property_search_sessions_lead" FOREIGN KEY ("lead_id") REFERENCES "public"."crm_leads_v3"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."identities_v3"
    ADD CONSTRAINT "identities_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."identity_match_logs"
    ADD CONSTRAINT "identity_match_logs_matched_master_id_fkey" FOREIGN KEY ("matched_master_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."identity_secrets_v3"
    ADD CONSTRAINT "identity_secrets_v3_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "public"."identities_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."identity_sources_map"
    ADD CONSTRAINT "identity_sources_map_master_identity_id_fkey" FOREIGN KEY ("master_identity_id") REFERENCES "public"."identities_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."identity_sources_map"
    ADD CONSTRAINT "identity_sources_map_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id");

ALTER TABLE ONLY "public"."notification_channels_v3"
    ADD CONSTRAINT "notification_channels_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."notifications_v3"
    ADD CONSTRAINT "notifications_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."notifications_v3"
    ADD CONSTRAINT "notifications_v3_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."popular_areas_v3"
    ADD CONSTRAINT "popular_areas_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_identity_v3_fkey" FOREIGN KEY ("id") REFERENCES "public"."identities_v3"("id") ON DELETE CASCADE;

COMMENT ON CONSTRAINT "profiles_id_identity_v3_fkey" ON "public"."profiles" IS 'Links staff profile to the master identity hub (V3 Architecture)';

ALTER TABLE ONLY "public"."properties_ai"
    ADD CONSTRAINT "properties_ai_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."properties_core"
    ADD CONSTRAINT "properties_core_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."identities_v3"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."properties_core"
    ADD CONSTRAINT "properties_core_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches_v3"("id");

ALTER TABLE ONLY "public"."properties_core"
    ADD CONSTRAINT "properties_core_co_broker_id_fkey" FOREIGN KEY ("co_broker_id") REFERENCES "public"."identities_v3"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."properties_core"
    ADD CONSTRAINT "properties_core_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."identities_v3"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."properties_core"
    ADD CONSTRAINT "properties_core_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."identities_v3"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."properties_core"
    ADD CONSTRAINT "properties_core_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id");

ALTER TABLE ONLY "public"."properties_details"
    ADD CONSTRAINT "properties_details_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_agents"
    ADD CONSTRAINT "property_agents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."identities_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_agents"
    ADD CONSTRAINT "property_agents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_features"
    ADD CONSTRAINT "property_features_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_features"
    ADD CONSTRAINT "property_features_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_image_uploads"
    ADD CONSTRAINT "property_image_uploads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_matches"
    ADD CONSTRAINT "property_matches_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_matches"
    ADD CONSTRAINT "property_matches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."property_search_sessions"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_media_v3"
    ADD CONSTRAINT "property_media_v3_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_price_history_v3"
    ADD CONSTRAINT "property_price_history_v3_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_price_history_v3"
    ADD CONSTRAINT "property_price_history_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."property_syndication_v3"
    ADD CONSTRAINT "property_syndication_v3_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."raw_ingestions"
    ADD CONSTRAINT "raw_ingestions_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."data_sources"("id");

ALTER TABLE ONLY "public"."rent_notification_history_v3"
    ADD CONSTRAINT "rent_notification_history_v3_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."notification_channels_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."rent_notification_history_v3"
    ADD CONSTRAINT "rent_notification_history_v3_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."rent_notification_history_v3"
    ADD CONSTRAINT "rent_notification_history_v3_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."rent_notification_rules_v3"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."rent_notification_history_v3"
    ADD CONSTRAINT "rent_notification_history_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."rent_notification_rules_v3"
    ADD CONSTRAINT "rent_notification_rules_v3_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."notification_channels_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."rent_notification_rules_v3"
    ADD CONSTRAINT "rent_notification_rules_v3_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties_core"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."rent_notification_rules_v3"
    ADD CONSTRAINT "rent_notification_rules_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."system_settings_v3"
    ADD CONSTRAINT "system_settings_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."system_settings_v3"
    ADD CONSTRAINT "system_settings_v3_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."teams_v3"
    ADD CONSTRAINT "teams_v3_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "public"."branches_v3"("id");

ALTER TABLE ONLY "public"."teams_v3"
    ADD CONSTRAINT "teams_v3_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."teams_v3"
    ADD CONSTRAINT "teams_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tenant_invitations_v3"
    ADD CONSTRAINT "tenant_invitations_v3_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."tenant_invitations_v3"
    ADD CONSTRAINT "tenant_invitations_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."tenant_members_v3"
    ADD CONSTRAINT "tenant_members_v3_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "public"."identities_v3"("id");

ALTER TABLE ONLY "public"."tenant_members_v3"
    ADD CONSTRAINT "tenant_members_v3_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams_v3"("id");

ALTER TABLE ONLY "public"."tenant_members_v3"
    ADD CONSTRAINT "tenant_members_v3_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants_v3"("id") ON DELETE CASCADE;

CREATE POLICY "Admin Manage: V3 Media" ON "public"."property_media_v3" USING ("public"."is_system_admin"());

CREATE POLICY "Allow individual read" ON "public"."tenant_members_v3" FOR SELECT USING (("auth"."uid"() = "identity_id"));

CREATE POLICY "Allow individual read" ON "public"."tenants_v3" FOR SELECT USING (true);

CREATE POLICY "Everyone can see tenants" ON "public"."tenants_v3" FOR SELECT USING (true);

CREATE POLICY "Members can see their tenants" ON "public"."tenants_v3" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members_v3"
  WHERE (("tenant_members_v3"."tenant_id" = "tenants_v3"."id") AND ("tenant_members_v3"."identity_id" = "auth"."uid"())))));

CREATE POLICY "Public Manage property_matches" ON "public"."property_matches" USING (true) WITH CHECK (true);

CREATE POLICY "Public Manage property_search_sessions" ON "public"."property_search_sessions" USING (true) WITH CHECK (true);

CREATE POLICY "Public Select: V3 Media" ON "public"."property_media_v3" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties_core" "p"
  WHERE (("p"."id" = "property_media_v3"."property_id") AND ("p"."status" = 1) AND ("p"."deleted_at" IS NULL)))));

CREATE POLICY "Public read assigned agents" ON "public"."identities_v3" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties_core" "pc"
  WHERE (("pc"."assigned_to" = "identities_v3"."id") AND ("pc"."status" = 1) AND ("pc"."deleted_at" IS NULL)))));

CREATE POLICY "Public read features" ON "public"."features" FOR SELECT USING (true);

CREATE POLICY "Public read property_agents" ON "public"."property_agents" FOR SELECT USING (true);

CREATE POLICY "Public read property_features" ON "public"."property_features" FOR SELECT USING (true);

CREATE POLICY "Public: Read Published CMS Content" ON "public"."cms_content_v3" FOR SELECT TO "authenticated", "anon" USING (("status" = ANY (ARRAY['published'::"text", 'PUBLISHED'::"text"])));

CREATE POLICY "Staff Manage property_image_uploads" ON "public"."property_image_uploads" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."identities_v3"
  WHERE (("identities_v3"."id" = "auth"."uid"()) AND ("identities_v3"."role" = 'ADMIN'::"text"))))));

CREATE POLICY "Staff Manage: CMS Content" ON "public"."cms_content_v3" TO "authenticated" USING (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"()));

CREATE POLICY "Staff Manage: Contacts" ON "public"."identities_v3" USING ((("auth"."uid"() = "id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."tenant_members_v3"
  WHERE ("tenant_members_v3"."identity_id" = "auth"."uid"())))));

CREATE POLICY "Staff Manage: Properties" ON "public"."properties_core" USING (("public"."is_tenant_staff"("tenant_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"text")));

CREATE POLICY "Staff Manage: V3 Documents" ON "public"."documents_v3" USING (("public"."is_tenant_staff"("tenant_id") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'ADMIN'::"text")));

CREATE POLICY "Staff Manage: V3 Media" ON "public"."property_media_v3" USING ((EXISTS ( SELECT 1
   FROM "public"."properties_core" "p"
  WHERE (("p"."id" = "property_media_v3"."property_id") AND "public"."is_tenant_member"("p"."tenant_id")))));

CREATE POLICY "Staff write property_agents" ON "public"."property_agents" TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "Staff write property_features" ON "public"."property_features" TO "authenticated" USING (true) WITH CHECK (true);

CREATE POLICY "Tenant Isolation Policy" ON "public"."properties_core" AS RESTRICTIVE USING ((("status" = 1) OR "public"."is_system_admin"() OR ("tenant_id" = ((( SELECT "auth"."jwt"() AS "jwt") ->> 'tenant_id'::"text"))::"uuid")));

CREATE POLICY "Tenant isolation for notification_channels_v3" ON "public"."notification_channels_v3" USING (("tenant_id" = (NULLIF("current_setting"('app.current_tenant_id'::"text", true), ''::"text"))::"uuid"));

CREATE POLICY "Tenant isolation for rent_notification_history_v3" ON "public"."rent_notification_history_v3" USING (("tenant_id" = (NULLIF("current_setting"('app.current_tenant_id'::"text", true), ''::"text"))::"uuid"));

CREATE POLICY "Tenant isolation for rent_notification_rules_v3" ON "public"."rent_notification_rules_v3" USING (("tenant_id" = (NULLIF("current_setting"('app.current_tenant_id'::"text", true), ''::"text"))::"uuid"));

CREATE POLICY "Users can see their own identity" ON "public"."identities_v3" FOR SELECT USING (("auth"."uid"() = "id"));

CREATE POLICY "Users can see their own memberships" ON "public"."tenant_members_v3" FOR SELECT USING (("auth"."uid"() = "identity_id"));

ALTER TABLE "public"."activity_timeline_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_timeline_v3_tenant_isolation" ON "public"."activity_timeline_v3" TO "authenticated" USING (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"()));

ALTER TABLE "public"."ai_token_ledgers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ai_token_ledgers_2026q3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."audit_logs_v3_2026_05" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."branch_daily_snapshots" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."branches_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_v3_modify" ON "public"."branches_v3" USING ((( SELECT "public"."is_system_admin"() AS "is_system_admin") OR "public"."is_tenant_admin"("tenant_id")));

CREATE POLICY "branches_v3_select" ON "public"."branches_v3" FOR SELECT USING ((("is_active" = true) OR ( SELECT "public"."is_system_admin"() AS "is_system_admin") OR ("tenant_id" = ANY ("public"."get_user_tenants"()))));

ALTER TABLE "public"."cms_content_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commissions_v3_tenant_isolation" ON "public"."crm_deal_commissions_v3" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members_v3"
  WHERE (("tenant_members_v3"."tenant_id" = "crm_deal_commissions_v3"."tenant_id") AND ("tenant_members_v3"."identity_id" = "auth"."uid"())))));

ALTER TABLE "public"."communications_hub_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communications_hub_v3_tenant_isolation" ON "public"."communications_hub_v3" TO "authenticated" USING (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"()));

ALTER TABLE "public"."crm_deal_commissions_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."crm_deals_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."crm_leads_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."data_sources" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_v3_tenant_isolation" ON "public"."crm_deals_v3" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members_v3"
  WHERE (("tenant_members_v3"."tenant_id" = "crm_deals_v3"."tenant_id") AND ("tenant_members_v3"."identity_id" = "auth"."uid"())))));

ALTER TABLE "public"."documents_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."features" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "features_delete" ON "public"."features" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "features_insert" ON "public"."features" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "features_select" ON "public"."features" FOR SELECT USING (true);

CREATE POLICY "features_update" ON "public"."features" FOR UPDATE TO "authenticated" USING (true);

ALTER TABLE "public"."financial_ledger_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."identities_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "identities_v3_modify" ON "public"."identities_v3" USING ((("id" = "auth"."uid"()) OR ( SELECT "public"."is_system_admin"() AS "is_system_admin")));

CREATE POLICY "identities_v3_select" ON "public"."identities_v3" FOR SELECT USING ((("id" = "auth"."uid"()) OR ( SELECT "public"."is_system_admin"() AS "is_system_admin") OR (EXISTS ( SELECT 1
   FROM ("public"."tenant_members_v3" "tm1"
     JOIN "public"."tenant_members_v3" "tm2" ON (("tm1"."tenant_id" = "tm2"."tenant_id")))
  WHERE (("tm1"."identity_id" = "auth"."uid"()) AND ("tm2"."identity_id" = "identities_v3"."id"))))));

ALTER TABLE "public"."identity_match_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."identity_secrets_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."identity_sources_map" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_v3_tenant_isolation" ON "public"."crm_leads_v3" TO "authenticated" USING (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"()));

ALTER TABLE "public"."line_templates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "line_templates_delete_optimized" ON "public"."line_templates" FOR DELETE USING (( SELECT "public"."is_system_admin"() AS "is_system_admin"));

CREATE POLICY "line_templates_insert_optimized" ON "public"."line_templates" FOR INSERT WITH CHECK (( SELECT "public"."is_system_admin"() AS "is_system_admin"));

CREATE POLICY "line_templates_select_optimized" ON "public"."line_templates" FOR SELECT USING (true);

CREATE POLICY "line_templates_update_optimized" ON "public"."line_templates" FOR UPDATE USING (( SELECT "public"."is_system_admin"() AS "is_system_admin"));

ALTER TABLE "public"."notification_channels_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notifications_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_v3_user_isolation" ON "public"."notifications_v3" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_system_admin"())) WITH CHECK ((("user_id" = "auth"."uid"()) OR "public"."is_system_admin"()));

CREATE POLICY "piu_insert_optimized" ON "public"."property_image_uploads" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."identities_v3"
  WHERE (("identities_v3"."id" = "auth"."uid"()) AND ("identities_v3"."role" = 'ADMIN'::"text"))))));

ALTER TABLE "public"."popular_areas_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "popular_areas_v3_admin_write" ON "public"."popular_areas_v3" USING ((EXISTS ( SELECT 1
   FROM "public"."identities_v3"
  WHERE (("identities_v3"."id" = "auth"."uid"()) AND ("identities_v3"."role" = ANY (ARRAY['ADMIN'::"text", 'SUPER_ADMIN'::"text"]))))));

CREATE POLICY "popular_areas_v3_read_all" ON "public"."popular_areas_v3" FOR SELECT USING (true);

CREATE POLICY "price_history_read_all" ON "public"."property_price_history_v3" FOR SELECT USING (true);

CREATE POLICY "price_history_write_tenant" ON "public"."property_price_history_v3" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members_v3"
  WHERE (("tenant_members_v3"."identity_id" = "auth"."uid"()) AND ("tenant_members_v3"."tenant_id" = "property_price_history_v3"."tenant_id")))));

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON "public"."profiles" FOR SELECT USING (true);

CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));

ALTER TABLE "public"."properties_ai" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."properties_core" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_core_modify" ON "public"."properties_core" USING ((( SELECT "public"."is_system_admin"() AS "is_system_admin") OR ("tenant_id" = ANY ("public"."get_user_tenants"()))));

CREATE POLICY "properties_core_select" ON "public"."properties_core" FOR SELECT USING (((("status" = 1) AND ("deleted_at" IS NULL)) OR ( SELECT "public"."is_system_admin"() AS "is_system_admin") OR ("tenant_id" = ANY ("public"."get_user_tenants"()))));

ALTER TABLE "public"."properties_details" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "properties_details_modify" ON "public"."properties_details" USING ((EXISTS ( SELECT 1
   FROM "public"."properties_core" "pc"
  WHERE (("pc"."id" = "properties_details"."property_id") AND (( SELECT "public"."is_system_admin"() AS "is_system_admin") OR ("pc"."tenant_id" = ANY ("public"."get_user_tenants"())))))));

CREATE POLICY "properties_details_select" ON "public"."properties_details" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."properties_core" "pc"
  WHERE (("pc"."id" = "properties_details"."property_id") AND ((("pc"."status" = 1) AND ("pc"."deleted_at" IS NULL)) OR ( SELECT "public"."is_system_admin"() AS "is_system_admin") OR ("pc"."tenant_id" = ANY ("public"."get_user_tenants"())))))));

ALTER TABLE "public"."property_agents" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."property_features" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."property_image_uploads" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."property_matches" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."property_media_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."property_price_history_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."property_search_sessions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."property_syndication_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."raw_ingestions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ref_master_data" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ref_master_data_admin_manage" ON "public"."ref_master_data" TO "authenticated" USING ("public"."is_system_admin"()) WITH CHECK ("public"."is_system_admin"());

CREATE POLICY "ref_master_data_public_read" ON "public"."ref_master_data" FOR SELECT TO "authenticated", "anon" USING (true);

ALTER TABLE "public"."rent_notification_history_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rent_notification_rules_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."smart_match_budget_ranges" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smart_match_budget_ranges_select" ON "public"."smart_match_budget_ranges" FOR SELECT USING (true);

ALTER TABLE "public"."smart_match_office_sizes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smart_match_office_sizes_select" ON "public"."smart_match_office_sizes" FOR SELECT USING (true);

ALTER TABLE "public"."smart_match_property_types" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smart_match_property_types_select" ON "public"."smart_match_property_types" FOR SELECT USING (true);

ALTER TABLE "public"."smart_match_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smart_match_settings_select" ON "public"."smart_match_settings" FOR SELECT USING (true);

ALTER TABLE "public"."system_audit_logs_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."system_settings_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_settings_v3_tenant_isolation" ON "public"."system_settings_v3" FOR SELECT TO "authenticated" USING ((("tenant_id" = ANY ("public"."get_user_tenants"())) OR "public"."is_system_admin"()));

CREATE POLICY "system_settings_v3_tenant_manage" ON "public"."system_settings_v3" TO "authenticated" USING (("public"."is_tenant_staff"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_staff"("tenant_id") OR "public"."is_system_admin"()));

ALTER TABLE "public"."system_task_queue" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."teams_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_v3_tenant_isolation" ON "public"."teams_v3" TO "authenticated" USING (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_member"("tenant_id") OR "public"."is_system_admin"()));

ALTER TABLE "public"."tenant_invitations_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_invitations_v3_isolation" ON "public"."tenant_invitations_v3" TO "authenticated" USING ((("email" = ("auth"."jwt"() ->> 'email'::"text")) OR "public"."is_tenant_staff"("tenant_id") OR "public"."is_system_admin"())) WITH CHECK (("public"."is_tenant_staff"("tenant_id") OR "public"."is_system_admin"()));

ALTER TABLE "public"."tenant_members_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_v3_modify" ON "public"."tenant_members_v3" USING ((( SELECT "public"."is_system_admin"() AS "is_system_admin") OR "public"."is_tenant_admin"("tenant_id")));

CREATE POLICY "tenant_members_v3_select" ON "public"."tenant_members_v3" FOR SELECT USING ((("identity_id" = "auth"."uid"()) OR ( SELECT "public"."is_system_admin"() AS "is_system_admin") OR ("tenant_id" = ANY ("public"."get_user_tenants"()))));

ALTER TABLE "public"."tenants_v3" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_v3_modify" ON "public"."tenants_v3" USING ((( SELECT "public"."is_system_admin"() AS "is_system_admin") OR "public"."is_tenant_admin"("id")));

CREATE POLICY "tenants_v3_select" ON "public"."tenants_v3" FOR SELECT USING (true);

ALTER TABLE "public"."traffic_views_v3" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."traffic_views_v3_2026_05" ENABLE ROW LEVEL SECURITY;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
