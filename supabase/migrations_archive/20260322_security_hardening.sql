-- 20260322_security_hardening.sql
-- Goal: Consolidate and harden RLS logic for strict multi-tenant isolation.
-- This script replaces global role-based bypasses with tenant-aware checks.

-- 1. Clean up Old Policies (MUST BE FIRST to avoid dependency errors with functions)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND (
            policyname ILIKE '%Staff can manage%' 
            OR policyname ILIKE '%Deals select auth%' 
            OR policyname ILIKE '%lead_activities_select_auth%'
            OR policyname ILIKE '%Enterprise Access%' -- Catching Leads, Properties, Deals
            OR policyname ILIKE '%Tenant Isolation%'
            OR policyname ILIKE '%audit_logs_select_admin%'
            OR policyname ILIKE '%Allow authenticated to update site_settings%'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 2. Hardened Helper Functions
DROP FUNCTION IF EXISTS public.is_system_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role = 'ADMIN'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.is_tenant_member(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE profile_id = auth.uid() AND tenant_id = target_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.is_tenant_staff(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.is_tenant_staff(target_tenant_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE profile_id = auth.uid() 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN', 'MANAGER', 'AGENT')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.is_tenant_admin(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.is_tenant_admin(target_tenant_id UUID)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE profile_id = auth.uid() 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-implement missing 'ghost' functions
DROP FUNCTION IF EXISTS public.is_manager_of(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.is_manager_of(agent_id UUID)
RETURNS boolean AS $$
BEGIN
  -- Logic: Current user is a MANAGER/ADMIN in a tenant where the agent_id is also a member
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members manager_m
    JOIN public.tenant_members agent_m ON manager_m.tenant_id = agent_m.tenant_id
    WHERE manager_m.profile_id = auth.uid() 
      AND agent_m.profile_id = agent_id
      AND manager_m.role IN ('OWNER', 'ADMIN', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_isolation_setting(TEXT) CASCADE;
CREATE OR REPLACE FUNCTION public.get_isolation_setting(setting_key TEXT)
RETURNS boolean AS $$
DECLARE
    setting_value boolean;
BEGIN
    SELECT (value->>setting_key)::boolean INTO setting_value
    FROM public.site_settings
    WHERE key = 'system_config';
    RETURN COALESCE(setting_value, true); -- Default to strict isolation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply Hardened Policies

-- PROPERTIES
DROP POLICY IF EXISTS "Properties Enterprise Access" ON public.properties;
CREATE POLICY "Properties Enterprise Access" ON public.properties
FOR ALL USING (
    is_system_admin() 
    OR (
        tenant_id IN (SELECT get_user_tenants())
        AND (
            is_tenant_admin(tenant_id) -- Admins see all in tenant
            OR (NOT get_isolation_setting('isolation_properties_enabled')) -- Global view enabled for tenant
            OR (created_by = auth.uid()) -- Owner sees own
            OR (assigned_to = auth.uid()) -- Agent sees assigned
            OR is_manager_of(created_by) -- Manager sees team data
        )
    )
);

-- LEADS
DROP POLICY IF EXISTS "Leads Enterprise Access" ON public.leads;
CREATE POLICY "Leads Enterprise Access" ON public.leads
FOR ALL USING (
    is_system_admin()
    OR (
        tenant_id IN (SELECT get_user_tenants())
        AND (
            is_tenant_admin(tenant_id)
            OR (NOT get_isolation_setting('isolation_leads_enabled'))
            OR (created_by = auth.uid())
            OR (assigned_to = auth.uid())
            OR is_manager_of(created_by)
            OR is_manager_of(assigned_to)
        )
    )
);

-- DEALS
DROP POLICY IF EXISTS "Deals Enterprise Access" ON public.deals;
CREATE POLICY "Deals Enterprise Access" ON public.deals
FOR ALL USING (
    is_system_admin()
    OR (
        tenant_id IN (SELECT get_user_tenants())
        AND (
            is_tenant_admin(tenant_id)
            OR (NOT get_isolation_setting('isolation_deals_enabled'))
            OR (created_by = auth.uid())
            OR is_manager_of(created_by)
        )
    )
);

-- OWNERS
DROP POLICY IF EXISTS "Tenant Isolation: Owners" ON public.owners;
CREATE POLICY "Tenant Isolation: Owners" ON public.owners
FOR ALL USING (
    is_system_admin()
    OR (tenant_id IN (SELECT get_user_tenants()))
);

-- AUDIT LOGS
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_hardened" ON public.audit_logs
FOR SELECT USING (
    is_system_admin()
    OR (auth.uid() = user_id) -- User sees own activity
    OR (is_manager_of(user_id)) -- Manager sees staff activity
);

-- SITE SETTINGS (Restrict Update)
DROP POLICY IF EXISTS "Allow authenticated to update site_settings" ON public.site_settings;
CREATE POLICY "Admin manage site settings" ON public.site_settings
FOR ALL USING (is_system_admin());

-- 4. Backfill Integrity Check
-- This ensures any orphaned data belongs to the main office instead of being invisible.
DO $$
DECLARE
    main_tenant_id UUID;
BEGIN
    SELECT id INTO main_tenant_id FROM public.tenants WHERE slug = 'main-office' LIMIT 1;
    IF main_tenant_id IS NOT NULL THEN
        UPDATE public.properties SET tenant_id = main_tenant_id WHERE tenant_id IS NULL;
        UPDATE public.leads SET tenant_id = main_tenant_id WHERE tenant_id IS NULL;
        UPDATE public.deals SET tenant_id = main_tenant_id WHERE tenant_id IS NULL;
        UPDATE public.owners SET tenant_id = main_tenant_id WHERE tenant_id IS NULL;
    END IF;
END $$;
