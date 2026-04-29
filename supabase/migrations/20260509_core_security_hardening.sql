-- ==========================================
-- 🚀 CORE SECURITY HARDENING: PART 1
-- Description: Core functions and high-priority tables RLS optimization
-- ==========================================

BEGIN;

-- 1. FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN';
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

-- 2. PROFILES
DROP POLICY IF EXISTS "profiles_select_optimized" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_optimized" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete_agents" ON public.profiles;
DROP POLICY IF EXISTS "Public: Anyone see basic agent info" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Public Minimal View" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Staff Network View" ON public.profiles;

CREATE POLICY "profiles_select_optimized" ON public.profiles
FOR SELECT USING (
    id = (SELECT auth.uid()) OR 
    (SELECT public.is_system_admin()) OR 
    role IN ('AGENT', 'MANAGER') OR 
    id IN (
        SELECT tm2.profile_id 
        FROM public.tenant_members tm1 
        JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id 
        WHERE tm1.profile_id = (SELECT auth.uid())
    )
);

CREATE POLICY "profiles_update_optimized" ON public.profiles
FOR UPDATE USING (
    id = (SELECT auth.uid()) OR 
    (SELECT public.is_system_admin())
);

CREATE POLICY "profiles_admin_delete_agents" ON public.profiles
FOR DELETE USING (
    (SELECT public.is_system_admin())
);

-- 3. PROPERTIES
DROP POLICY IF EXISTS "properties_public_select_optimized" ON public.properties;
DROP POLICY IF EXISTS "properties_insert_optimized" ON public.properties;
DROP POLICY IF EXISTS "properties_update_optimized" ON public.properties;
DROP POLICY IF EXISTS "properties_delete_optimized" ON public.properties;
DROP POLICY IF EXISTS "Properties: Public Search" ON public.properties;
DROP POLICY IF EXISTS "Properties: Staff Full Access" ON public.properties;
DROP POLICY IF EXISTS "Public: Anyone see active properties" ON public.properties;

CREATE POLICY "properties_public_select_optimized" ON public.properties
FOR SELECT USING (
    (status = 'ACTIVE' AND deleted_at IS NULL) OR 
    (SELECT public.is_system_admin()) OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

CREATE POLICY "properties_insert_optimized" ON public.properties
FOR INSERT WITH CHECK (
    (SELECT public.is_system_admin()) OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

CREATE POLICY "properties_update_optimized" ON public.properties
FOR UPDATE USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

CREATE POLICY "properties_delete_optimized" ON public.properties
FOR DELETE USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

-- 4. TEAMS
DROP POLICY IF EXISTS "teams_select_optimized" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_optimized" ON public.teams;
DROP POLICY IF EXISTS "teams_update_optimized" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_optimized" ON public.teams;
DROP POLICY IF EXISTS "Secure: Team visibility" ON public.teams;
DROP POLICY IF EXISTS "Secure: Team management" ON public.teams;
DROP POLICY IF EXISTS "System Admin Manage teams" ON public.teams;

CREATE POLICY "teams_select_optimized" ON public.teams
FOR SELECT USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

CREATE POLICY "teams_insert_optimized" ON public.teams FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "teams_update_optimized" ON public.teams FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "teams_delete_optimized" ON public.teams FOR DELETE USING ((SELECT public.is_system_admin()));

-- 5. TENANTS
DROP POLICY IF EXISTS "tenants_update_optimized" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select_optimized" ON public.tenants;
DROP POLICY IF EXISTS "Public View Tenants Branding" ON public.tenants;
DROP POLICY IF EXISTS "System Admin Manage Tenants" ON public.tenants;

CREATE POLICY "tenants_select_optimized" ON public.tenants
FOR SELECT USING (true);

CREATE POLICY "tenants_update_optimized" ON public.tenants
FOR UPDATE USING (
    id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()) AND role IN ('OWNER', 'ADMIN'))
    OR (SELECT public.is_system_admin())
);

-- 6. TENANT_INVITATIONS
DROP POLICY IF EXISTS "tenant_invitations_admin_optimized" ON public.tenant_invitations;

CREATE POLICY "tenant_invitations_admin_optimized" ON public.tenant_invitations
FOR ALL USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()) AND role IN ('OWNER', 'ADMIN'))
);

COMMIT;
