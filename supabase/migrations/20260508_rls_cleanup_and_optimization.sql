-- ==========================================
-- 🚀 PERFORMANCE HARDENING: Phase 2 (RLS Cleanup)
-- Description: Fix auth_rls_initplan and Multiple Permissive Policies
-- ==========================================

BEGIN;

-- 1. PROFILES CONSOLIDATION (Cleaning up 8+ redundant policies)
-- Drop all known redundant select policies
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_matching_tenant" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Public Minimal View" ON public.profiles;
DROP POLICY IF EXISTS "Public View Agent Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public: Anyone see basic agent info" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles for audit" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: Staff Network View" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- Create ONE optimized select policy for profiles
CREATE POLICY "profiles_select_optimized" ON public.profiles
FOR SELECT USING (
    id = (SELECT auth.uid()) OR -- Own profile
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'ADMIN' OR -- Admin bypass
    role IN ('AGENT', 'MANAGER') OR -- Public/Staff can see agent info
    id IN ( -- Staff can see members in the same tenant
        SELECT tm2.profile_id 
        FROM public.tenant_members tm1 
        JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id 
        WHERE tm1.profile_id = (SELECT auth.uid())
    )
);

-- Profiles Update Consolidation
DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_agent_update_self" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "profiles_update_optimized" ON public.profiles
FOR UPDATE USING (
    id = (SELECT auth.uid()) OR 
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'ADMIN'
);

-- 2. PROPERTIES CONSOLIDATION (Cleaning up 6+ redundant policies)
DROP POLICY IF EXISTS "Allow public read access to active properties" ON public.properties;
DROP POLICY IF EXISTS "Properties: Public Search" ON public.properties;
DROP POLICY IF EXISTS "Public View Active Properties" ON public.properties;
DROP POLICY IF EXISTS "Public view active properties" ON public.properties;
DROP POLICY IF EXISTS "Public: Anyone see active properties" ON public.properties;
DROP POLICY IF EXISTS "Public can read ACTIVE properties" ON public.properties;

CREATE POLICY "properties_public_select_optimized" ON public.properties
FOR SELECT USING (
    (status = 'ACTIVE' AND deleted_at IS NULL) OR 
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('ADMIN', 'MANAGER', 'AGENT')
);

-- 3. CO_BROKERS CONSOLIDATION
DROP POLICY IF EXISTS "Co-brokers: Manage shared tenant directory" ON public.co_brokers;
DROP POLICY IF EXISTS "Co-brokers: View shared tenant directory" ON public.co_brokers;
DROP POLICY IF EXISTS "External Agents: Manage members of their tenant" ON public.co_brokers;
DROP POLICY IF EXISTS "External Agents: View members of their tenant" ON public.co_brokers;
DROP POLICY IF EXISTS "view_co_brokers_optimized" ON public.co_brokers;
DROP POLICY IF EXISTS "insert_co_brokers" ON public.co_brokers;
DROP POLICY IF EXISTS "update_co_brokers" ON public.co_brokers;
DROP POLICY IF EXISTS "hard_delete_co_brokers" ON public.co_brokers;

CREATE POLICY "co_brokers_select_optimized" ON public.co_brokers
FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    AND (deleted_at IS NULL OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) IN ('ADMIN', 'MANAGER'))
);

CREATE POLICY "co_brokers_all_optimized" ON public.co_brokers
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

-- 4. NOTIFICATIONS CLEANUP
DROP POLICY IF EXISTS "Users can see their own notifications" ON public.notifications;
-- Already have optimized "Users can view their own notifications" from previous migration.

-- 5. BACKGROUND_TASKS CONSOLIDATION
DROP POLICY IF EXISTS "Admins can see all background tasks" ON public.background_tasks;
DROP POLICY IF EXISTS "Users can see their own tenant tasks" ON public.background_tasks;

CREATE POLICY "background_tasks_select_optimized" ON public.background_tasks
FOR SELECT USING (
    (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'ADMIN' OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

-- 6. REMAINING AUTH_RLS_INITPLAN FIXES
-- Audit Logs
DROP POLICY IF EXISTS "audit_logs_insert_own" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own" ON public.audit_logs
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- Contract Templates
DROP POLICY IF EXISTS "Allow admins to manage templates" ON public.contract_templates;
CREATE POLICY "contract_templates_admin_optimized" ON public.contract_templates
FOR ALL USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = 'ADMIN');

-- Property Image Uploads
DROP POLICY IF EXISTS "piu_insert_own" ON public.property_image_uploads;
CREATE POLICY "piu_insert_own_optimized" ON public.property_image_uploads
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

COMMIT;
