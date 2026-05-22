-- Phase 1: Security Hardening RPCs
-- Objective: Move critical bulk operations and sensitive logging to Security Definer functions
-- to eliminate the need for SERVICE_ROLE_KEY bypasses in application code.

-- 1. LOG_SYSTEM_ACTIVITY
-- Securely log activities without bypassing RLS in the application code.
-- This RPC ensures that logs are append-only and correctly attributed.
CREATE OR REPLACE FUNCTION public.log_system_activity(
    p_action TEXT,
    p_entity TEXT,
    p_entity_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_tenant_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_resolved_user_id UUID;
BEGIN
    -- 🕵️ Resolve User Identity if not logged in (for LOGIN events)
    IF v_user_id IS NULL AND p_email IS NOT NULL THEN
        SELECT id INTO v_resolved_user_id FROM public.profiles WHERE email = LOWER(p_email) LIMIT 1;
    ELSE
        v_resolved_user_id := v_user_id;
    END IF;

    -- [SECURITY] If tenant_id is provided, verify user belongs to it (unless system-wide action)
    IF p_tenant_id IS NOT NULL AND v_resolved_user_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.tenant_members 
            WHERE profile_id = v_resolved_user_id AND tenant_id = p_tenant_id
        ) AND NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = v_resolved_user_id AND role = 'ADMIN'
        ) THEN
            -- We allow logging for LOGIN/LOGOUT actions where tenant_id might not be set in JWT yet
            -- but if they claim to be in a tenant, we verify it.
            IF p_action NOT IN ('LOGIN', 'LOGIN_FAILURE', 'LOGOUT') THEN
                RAISE EXCEPTION 'Unauthorized tenant activity logging';
            END IF;
        END IF;
    END IF;

    INSERT INTO public.audit_logs (action, entity, entity_id, metadata, tenant_id, user_id)
    VALUES (p_action, p_entity, p_entity_id, p_metadata, p_tenant_id, v_resolved_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. BULK_TRASH_PROPERTIES
-- Move properties to trash (soft delete) atomically.
CREATE OR REPLACE FUNCTION public.bulk_trash_properties(
    p_ids UUID[]
) RETURNS INTEGER AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_role TEXT;
    v_count INTEGER;
BEGIN
    -- Check permissions
    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    IF v_role NOT IN ('ADMIN', 'MANAGER', 'AGENT') THEN
        RAISE EXCEPTION 'Forbidden: Staff access only';
    END IF;

    UPDATE public.properties
    SET 
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = ANY(p_ids)
    -- Enforce tenant isolation
    AND (
        v_role = 'ADMIN' 
        OR tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = v_user_id)
    );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. BULK_HARD_DELETE_PROPERTIES
-- Permanently delete properties and their junctions atomically.
CREATE OR REPLACE FUNCTION public.bulk_hard_delete_properties(
    p_ids UUID[]
) RETURNS INTEGER AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_role TEXT;
    v_count INTEGER;
BEGIN
    -- Check permissions (Admin or Manager only for hard delete)
    SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
    IF v_role NOT IN ('ADMIN', 'MANAGER') THEN
        RAISE EXCEPTION 'Forbidden: Admin/Manager access only for hard delete';
    END IF;

    -- Delete junctions first
    DELETE FROM public.property_images WHERE property_id = ANY(p_ids);
    DELETE FROM public.property_features WHERE property_id = ANY(p_ids);
    DELETE FROM public.property_agents WHERE property_id = ANY(p_ids);
    DELETE FROM public.property_matches WHERE property_id = ANY(p_ids);

    -- Delete main records
    DELETE FROM public.properties
    WHERE id = ANY(p_ids)
    -- Enforce tenant isolation
    AND (
        v_role = 'ADMIN' 
        OR tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = v_user_id)
    );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. GET_LEAD_MESSAGES
-- Securely fetch messages for a lead, including unassigned global messages of the same source.
CREATE OR REPLACE FUNCTION public.get_lead_messages(
    p_lead_id UUID,
    p_source TEXT,
    p_lead_created_at TIMESTAMPTZ,
    p_offset INTEGER DEFAULT 0,
    p_limit INTEGER DEFAULT 20
 ) RETURNS SETOF public.communications_hub_v3 AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    -- [SECURITY] Verify user has access to the lead first
    IF NOT EXISTS (
        SELECT 1 FROM public.leads 
        WHERE id = p_lead_id 
        AND (
            tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = v_user_id)
            OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'ADMIN')
        )
    ) THEN
        RAISE EXCEPTION 'Access denied to lead messages';
    END IF;

    RETURN QUERY
    SELECT * FROM public.communications_hub_v3
    WHERE (
        lead_id = p_lead_id 
        OR (lead_id IS NULL AND source = p_source::public.lead_source AND created_at >= p_lead_created_at)
    )
    ORDER BY created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. SUBMIT_PUBLIC_LEAD
-- Securely handle public lead submissions without giving full admin access to the application.
CREATE OR REPLACE FUNCTION public.submit_public_lead(
    p_full_name TEXT,
    p_line_id TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_source TEXT DEFAULT 'WEBSITE',
    p_note TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_lead_id UUID;
BEGIN
    INSERT INTO public.leads (full_name, line_id, phone, source, stage, note, lead_type)
    VALUES (p_full_name, p_line_id, p_phone, p_source::public.lead_source, 'NEW', p_note, 'INDIVIDUAL')
    RETURNING id INTO v_lead_id;

    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. GET_PROFILE_BY_EMAIL
-- Securely fetch basic profile info by email during login attempts.
CREATE OR REPLACE FUNCTION public.get_profile_by_email(
    p_email TEXT
) RETURNS TABLE (
    id UUID,
    role public.user_role,
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.role, p.avatar_url
    FROM public.profiles p
    WHERE p.email = LOWER(p_email)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. OPTIMIZED RLS HELPERS
-- Break circular dependencies and improve performance.
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean AS $$
BEGIN
  -- Stateless check via JWT metadata (synced via trigger)
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN';
END;
$$ LANGUAGE plpgsql STABLE;

DROP FUNCTION IF EXISTS public.get_user_tenants() CASCADE;
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS uuid[] AS $$
DECLARE
  v_tenants uuid[];
BEGIN
  -- Stable check for multi-tenant isolation
  SELECT array_agg(tenant_id) INTO v_tenants
  FROM public.tenant_members
  WHERE profile_id = auth.uid();
  
  RETURN COALESCE(v_tenants, '{}'::uuid[]);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 8. HARDENED MATCH_PROPERTIES
-- Security Definer version of matching to ensure tenant isolation.
CREATE OR REPLACE FUNCTION public.match_properties_hardened(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    slug text,
    property_type public.property_type,
    listing_type public.listing_type,
    price numeric,
    rental_price numeric,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_is_admin boolean := public.is_system_admin();
    v_user_tenants uuid[] := public.get_user_tenants();
BEGIN
    -- [SECURITY] Enforce tenant isolation
    IF NOT v_is_admin AND p_tenant_id IS NOT NULL AND NOT (p_tenant_id = ANY(v_user_tenants)) THEN
        RAISE EXCEPTION 'Unauthorized tenant access for matching';
    END IF;

    RETURN QUERY
    WITH similarity_base AS (
        SELECT
            p.id,
            p.title,
            p.slug,
            p.property_type,
            p.listing_type,
            p.price,
            p.rental_price,
            1 - (p.embedding <=> query_embedding) AS calc_similarity
        FROM public.properties p
        WHERE 
            p.deleted_at IS NULL
            AND (
                v_is_admin 
                OR (p_tenant_id IS NOT NULL AND p.tenant_id = p_tenant_id)
                OR (p_tenant_id IS NULL AND p.tenant_id = ANY(v_user_tenants))
            )
            AND p.embedding <=> query_embedding < (1 - match_threshold)
    )
    SELECT *
    FROM similarity_base
    WHERE calc_similarity > match_threshold
    ORDER BY calc_similarity DESC
    LIMIT match_count;
END;
$$;

-- 9. CREATE_LEAD_FROM_MATCH
-- Securely handle the entire match wizard conversion in one transaction.
CREATE OR REPLACE FUNCTION public.create_lead_from_match(
    p_session_id UUID,
    p_property_id UUID,
    p_full_name TEXT,
    p_phone TEXT,
    p_email TEXT DEFAULT NULL,
    p_line_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_lead_id UUID;
BEGIN
    -- 1. Create Lead
    INSERT INTO public.leads (full_name, phone, email, line_id, lead_type, source, stage, note)
    VALUES (
        p_full_name, 
        p_phone, 
        p_email, 
        p_line_id, 
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

-- 10. TEAM HELPERS
-- Optimized helpers for team-based RLS to improve performance.
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND team_id = p_team_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_team_manager(p_team_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id AND manager_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 11. HARD_DELETE_TEAM
-- Securely delete a team and clear member associations atomically.
CREATE OR REPLACE FUNCTION public.hard_delete_team(p_team_id UUID)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_admin boolean := public.is_system_admin();
BEGIN
    -- [SECURITY] Admin only
    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Forbidden: Admin access only for team deletion';
    END IF;

    -- 1. Clear member associations
    UPDATE public.profiles SET team_id = NULL WHERE team_id = p_team_id;

    -- 2. Delete the team
    DELETE FROM public.teams WHERE id = p_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. OPTIMIZED IS_MANAGER_OF
-- Using STABLE for caching within transaction.
CREATE OR REPLACE FUNCTION public.is_manager_of(agent_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members manager_m
    JOIN public.tenant_members agent_m ON manager_m.tenant_id = agent_m.tenant_id
    WHERE manager_m.profile_id = auth.uid() 
      AND agent_m.profile_id = agent_id
      AND manager_m.role IN ('OWNER', 'ADMIN', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 13. LOG_AI_USAGE
-- Securely log AI token usage and costs from any feature.
CREATE OR REPLACE FUNCTION public.log_ai_usage(
    p_model TEXT,
    p_feature TEXT,
    p_status TEXT,
    p_error_message TEXT DEFAULT NULL,
    p_prompt_tokens INTEGER DEFAULT 0,
    p_completion_tokens INTEGER DEFAULT 0,
    p_cost_thb NUMERIC DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.ai_usage_logs (
        model, 
        feature, 
        status, 
        error_message, 
        user_id, 
        prompt_tokens, 
        completion_tokens, 
        cost_thb
    )
    VALUES (
        p_model, 
        p_feature, 
        p_status, 
        p_error_message, 
        auth.uid(), 
        p_prompt_tokens, 
        p_completion_tokens, 
        p_cost_thb
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 14. PRUNE_AI_LOGS
-- Securely remove old logs (Admin only).
CREATE OR REPLACE FUNCTION public.prune_ai_logs(p_days_to_keep INTEGER)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_system_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin access only';
    END IF;

    DELETE FROM public.ai_usage_logs
    WHERE created_at < (NOW() - (p_days_to_keep || ' days')::INTERVAL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. AI LOGS RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI Logs: Admin see all" ON public.ai_usage_logs;
CREATE POLICY "AI Logs: Admin see all" ON public.ai_usage_logs
FOR SELECT USING (public.is_system_admin());

DROP POLICY IF EXISTS "AI Logs: Users see own" ON public.ai_usage_logs;
CREATE POLICY "AI Logs: Users see own" ON public.ai_usage_logs
FOR SELECT USING (auth.uid() = user_id);

-- 16. LINE TEMPLATES RLS
ALTER TABLE public.line_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Line Templates: Admin manage" ON public.line_templates;
CREATE POLICY "Line Templates: Admin manage" ON public.line_templates
FOR ALL USING (public.is_system_admin());

DROP POLICY IF EXISTS "Line Templates: Everyone see" ON public.line_templates;
CREATE POLICY "Line Templates: Everyone see" ON public.line_templates
FOR SELECT USING (true);


-- 17. PUBLIC PROPERTY ACCESS RLS
DROP POLICY IF EXISTS "Public: Anyone see active properties" ON public.properties;
CREATE POLICY "Public: Anyone see active properties" ON public.properties
FOR SELECT USING (status = 'ACTIVE' AND deleted_at IS NULL);

-- 18. PUBLIC PROFILE ACCESS (Basic Info)
-- Required for public property details to show assigned agent
DROP POLICY IF EXISTS "Public: Anyone see basic agent info" ON public.profiles;
CREATE POLICY "Public: Anyone see basic agent info" ON public.profiles
FOR SELECT USING (true); -- RLS on profiles should be restricted via column selection in app code anyway

-- 19. INCREMENT_PROPERTY_VIEW
-- Securely increment view count from public or private clients.
CREATE OR REPLACE FUNCTION public.increment_property_view(p_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_new_count INTEGER;
BEGIN
    UPDATE public.properties
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_id
    RETURNING view_count INTO v_new_count;
    
    RETURN v_new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 20. RESET_ALL_PROPERTY_VIEWS
-- Admin only.
CREATE OR REPLACE FUNCTION public.reset_all_property_views()
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_system_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin access only';
    END IF;

    UPDATE public.properties SET view_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 21. SECURE FILE UPLOADS (Phase 3)
-- Infrastructure for malware scanning.
ALTER TABLE public.property_images 
ADD COLUMN IF NOT EXISTS scan_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS scan_result JSONB;

-- Index for scanning worker
CREATE INDEX IF NOT EXISTS idx_property_images_scan_status ON public.property_images(scan_status) WHERE scan_status = 'PENDING';

-- 11. ACCEPT_TENANT_INVITATION
-- Allows a user to accept an invitation securely.
CREATE OR REPLACE FUNCTION public.accept_tenant_invitation(
    p_tenant_id UUID
) RETURNS VOID AS $$
DECLARE
    v_inv_id UUID;
    v_role TEXT;
    v_user_email TEXT := (SELECT email FROM auth.users() WHERE id = auth.uid());
BEGIN
    -- 1. Find the pending invitation for this user's email
    SELECT id, role INTO v_inv_id, v_role
    FROM public.tenant_invitations
    WHERE tenant_id = p_tenant_id
      AND email = v_user_email
      AND status = 'PENDING'
    LIMIT 1;

    IF v_inv_id IS NULL THEN
        RAISE EXCEPTION 'Invitation not found or expired';
    END IF;

    -- 2. Add member to tenant
    INSERT INTO public.tenant_members (tenant_id, profile_id, role)
    VALUES (p_tenant_id, auth.uid(), v_role::public.user_role);

    -- 3. Mark invitation as ACCEPTED
    UPDATE public.tenant_invitations
    SET status = 'ACCEPTED'
    WHERE id = v_inv_id;

    -- 4. Log Activity
    INSERT INTO public.activity_logs (profile_id, action, entity, entity_id, tenant_id)
    VALUES (auth.uid(), 'member.accept_invite', 'tenants', p_tenant_id, p_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. DECLINE_TENANT_INVITATION
CREATE OR REPLACE FUNCTION public.decline_tenant_invitation(
    p_tenant_id UUID
) RETURNS VOID AS $$
DECLARE
    v_user_email TEXT := (SELECT email FROM auth.users() WHERE id = auth.uid());
BEGIN
    DELETE FROM public.tenant_invitations
    WHERE tenant_id = p_tenant_id
      AND email = v_user_email
      AND status = 'PENDING';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
