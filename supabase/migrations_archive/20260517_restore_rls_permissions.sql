-- ==========================================
-- 🔓 FINAL SECURITY & PERFORMANCE HARDENING (DIAMOND GRADE 💎)
-- Description:
-- 1. Restore EXECUTE privileges for all critical helper functions.
-- 2. Resolve auth_rls_initplan by wrapping auth calls in subqueries.
-- 3. Consolidate multiple permissive policies to improve query performance.
-- 4. Optimize core RLS helper functions for maximum speed.
-- ==========================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. OPTIMIZE CORE HELPERS (STABLE & CACHED)
-- ----------------------------------------------------------------

-- Optimized is_system_admin
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean AS $$
BEGIN
  -- Stateless check via JWT metadata for sub-millisecond response
  RETURN (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'ADMIN';
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized get_auth_uid
CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT auth.uid());
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized get_user_tenants
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS uuid[] AS $$
BEGIN
  RETURN COALESCE(
    ARRAY(
      SELECT tenant_id 
      FROM public.tenant_members 
      WHERE profile_id = (SELECT auth.uid())
    ),
    '{}'::uuid[]
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_tenant_staff
CREATE OR REPLACE FUNCTION public.is_tenant_staff(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE profile_id = (SELECT auth.uid()) 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN', 'MANAGER', 'AGENT')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_tenant_manager
CREATE OR REPLACE FUNCTION public.is_tenant_manager(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE profile_id = (SELECT auth.uid()) 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_tenant_admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE profile_id = (SELECT auth.uid()) 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_tenant_member
CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE profile_id = (SELECT auth.uid()) 
      AND tenant_id = target_tenant_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_manager_of
CREATE OR REPLACE FUNCTION public.is_manager_of(agent_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members manager_m
    JOIN public.tenant_members agent_m ON manager_m.tenant_id = agent_m.tenant_id
    WHERE manager_m.profile_id = (SELECT auth.uid()) 
      AND agent_m.profile_id = agent_id
      AND manager_m.role IN ('OWNER', 'ADMIN', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_personal_record
CREATE OR REPLACE FUNCTION public.is_personal_record(target_profile_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT auth.uid()) = target_profile_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Optimized is_team_member
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND team_id = p_team_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_team_manager
CREATE OR REPLACE FUNCTION public.is_team_manager(p_team_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id AND manager_id = (SELECT auth.uid())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------
-- 2. RESTORE EXECUTE PRIVILEGES
-- ----------------------------------------------------------------

-- Grant EXECUTE to authenticated and anon for core helpers
GRANT EXECUTE ON FUNCTION public.is_system_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_tenants() TO authenticated, service_role;

-- Grant EXECUTE for other critical staff helpers
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_manager(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_personal_record(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_manager_of(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_manager(uuid) TO authenticated, service_role;

-- Grant EXECUTE for critical RPCs (Wrappers)
GRANT EXECUTE ON FUNCTION public.submit_public_lead(text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_ai_usage(text, text, text, text, integer, integer, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_system_activity(text, text, text, jsonb, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_tenant_invitation(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decline_tenant_invitation(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_lead_from_match(uuid, uuid, text, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bulk_trash_properties(uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bulk_hard_delete_properties(uuid[]) TO authenticated, service_role;

-- ----------------------------------------------------------------
-- 3. OPTIMIZE & CONSOLIDATE POLICIES (Performance & Linter)
-- ----------------------------------------------------------------

-- [PROFILES]
DROP POLICY IF EXISTS "profiles_select_optimized" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_optimized" ON public.profiles;
CREATE POLICY "profiles_select_optimized" ON public.profiles
FOR SELECT USING (
    id = (SELECT public.get_auth_uid()) OR 
    (SELECT public.is_system_admin()) OR 
    role IN ('AGENT', 'MANAGER') OR 
    id IN (
        SELECT tm2.profile_id 
        FROM public.tenant_members tm1 
        JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id 
        WHERE tm1.profile_id = (SELECT public.get_auth_uid())
    )
);

CREATE POLICY "profiles_update_optimized" ON public.profiles
FOR UPDATE USING (
    id = (SELECT public.get_auth_uid()) OR 
    (SELECT public.is_system_admin())
);

-- [LEADS]
DROP POLICY IF EXISTS "leads_select_optimized" ON public.leads;
DROP POLICY IF EXISTS "Leads Enterprise Access" ON public.leads;
DROP POLICY IF EXISTS "Tenant Isolation: Leads" ON public.leads;
CREATE POLICY "leads_select_optimized" ON public.leads
FOR SELECT USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id = ANY (public.get_user_tenants())
);

-- [PROPERTIES]
DROP POLICY IF EXISTS "properties_select_optimized" ON public.properties;
DROP POLICY IF EXISTS "properties_public_select_optimized" ON public.properties;
DROP POLICY IF EXISTS "Properties: Staff Full Access" ON public.properties;
DROP POLICY IF EXISTS "Properties: Public Search" ON public.properties;
CREATE POLICY "properties_select_optimized" ON public.properties
FOR SELECT USING (
    (status = 'ACTIVE' AND deleted_at IS NULL) OR 
    (SELECT public.is_system_admin()) OR 
    tenant_id = ANY (public.get_user_tenants())
);

-- [DEALS]
DROP POLICY IF EXISTS "deals_all_optimized" ON public.deals;
DROP POLICY IF EXISTS "deals_select_optimized" ON public.deals;
DROP POLICY IF EXISTS "Deals Enterprise Access" ON public.deals;
CREATE POLICY "deals_select_optimized" ON public.deals
FOR SELECT USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id = ANY (public.get_user_tenants())
);

-- [AUDIT_LOGS & PARTITIONS]
DO $$
DECLARE
    p_tbl TEXT;
BEGIN
    FOR p_tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE tablename LIKE 'audit_logs%' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "audit_logs_select_optimized" ON public.%I', p_tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Audit logs isolation" ON public.%I', p_tbl);
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON public.%I', p_tbl);
        EXECUTE format('CREATE POLICY "audit_logs_select_optimized" ON public.%I FOR SELECT USING ((SELECT public.is_system_admin()) OR tenant_id = ANY (public.get_user_tenants()) OR user_id = (SELECT public.get_auth_uid()))', p_tbl);
    END LOOP;
END $$;

-- [COMMUNICATIONS_HUB_V3]
DROP POLICY IF EXISTS "Tenant Isolation: Omni Messages" ON public.communications_hub_v3;
DROP POLICY IF EXISTS "omni_messages_select_optimized" ON public.communications_hub_v3;
CREATE POLICY "omni_messages_select_optimized" ON public.communications_hub_v3
FOR SELECT USING (
  (SELECT public.is_system_admin()) OR 
  tenant_id = ANY (public.get_user_tenants())
);

-- [OWNERS]
DROP POLICY IF EXISTS "owners_all_optimized" ON public.owners;
DROP POLICY IF EXISTS "owners_select_optimized" ON public.owners;
DROP POLICY IF EXISTS "Owners: Tenant Isolation" ON public.owners;
CREATE POLICY "owners_select_optimized" ON public.owners
FOR SELECT USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id = ANY (public.get_user_tenants())
);

-- [FINANCE: COMMISSIONS]
DROP POLICY IF EXISTS "deal_commissions_all_optimized" ON public.deal_commissions;
DROP POLICY IF EXISTS "deal_commissions_select_optimized" ON public.deal_commissions;
DROP POLICY IF EXISTS "Finance: Personal or Admin View" ON public.deal_commissions;
CREATE POLICY "deal_commissions_select_optimized" ON public.deal_commissions
FOR SELECT USING (
    (SELECT public.is_system_admin()) OR 
    agent_id = (SELECT public.get_auth_uid()) OR
    public.is_tenant_manager(tenant_id)
);

DROP POLICY IF EXISTS "Finance: Adjustment View" ON public.commission_adjustments;
DROP POLICY IF EXISTS "commission_adjustments_select_optimized" ON public.commission_adjustments;
CREATE POLICY "commission_adjustments_select_optimized" ON public.commission_adjustments
FOR SELECT USING (
    (SELECT public.is_system_admin()) OR 
    EXISTS (
        SELECT 1 FROM public.deal_commissions dc
        WHERE dc.id = commission_id
        AND (dc.agent_id = (SELECT public.get_auth_uid()) OR public.is_tenant_manager(dc.tenant_id))
    )
);

-- [TEAMS]
DROP POLICY IF EXISTS "teams_select_optimized" ON public.teams;
DROP POLICY IF EXISTS "Secure: Team visibility" ON public.teams;
CREATE POLICY "teams_select_optimized" ON public.teams
FOR SELECT USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id = ANY (public.get_user_tenants())
);

-- [TENANTS]
DROP POLICY IF EXISTS "tenants_select_optimized" ON public.tenants;
DROP POLICY IF EXISTS "Public View Tenants Branding" ON public.tenants;
CREATE POLICY "tenants_select_optimized" ON public.tenants
FOR SELECT USING (true);

-- [CO_BROKERS]
DROP POLICY IF EXISTS "co_brokers_select_optimized" ON public.co_brokers;
DROP POLICY IF EXISTS "view_co_brokers_optimized" ON public.co_brokers;
CREATE POLICY "co_brokers_select_optimized" ON public.co_brokers
FOR SELECT USING (
    tenant_id = ANY (public.get_user_tenants()) AND 
    (deleted_at IS NULL OR (SELECT public.is_system_admin()))
);

COMMIT;


