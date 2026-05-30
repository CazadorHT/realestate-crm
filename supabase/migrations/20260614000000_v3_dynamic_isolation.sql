-- 🛠️ V3 Dynamic Isolation Policies Implementation

-- 1. Helper to fetch isolation setting
CREATE OR REPLACE FUNCTION public.get_isolation_setting(setting_key TEXT)
RETURNS boolean AS $$
DECLARE
    setting_value boolean;
    active_tenant_id uuid;
BEGIN
    -- Get current tenant id from context or fallback to user's first tenant
    active_tenant_id := NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
    
    IF active_tenant_id IS NULL THEN
        -- Fallback to the first tenant of the logged in user
        SELECT tenant_id INTO active_tenant_id 
        FROM public.tenant_members_v3 
        WHERE identity_id = auth.uid() 
        LIMIT 1;
    END IF;

    -- Query system_settings_v3
    SELECT (value->>setting_key)::boolean INTO setting_value
    FROM public.system_settings_v3
    WHERE (tenant_id = active_tenant_id OR (tenant_id IS NULL AND active_tenant_id IS NULL))
      AND key = 'system_config';

    -- Fallback: If not found in system_config json, try to query key directly
    IF setting_value IS NULL THEN
        SELECT (value)::boolean INTO setting_value
        FROM public.system_settings_v3
        WHERE (tenant_id = active_tenant_id OR (tenant_id IS NULL AND active_tenant_id IS NULL))
          AND key = setting_key;
    END IF;

    RETURN COALESCE(setting_value, false); -- Default to false (no isolation)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper to check manager/admin role
CREATE OR REPLACE FUNCTION public.is_tenant_manager_or_admin(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members_v3
    WHERE identity_id = auth.uid() 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. DROP old policies if any conflicts, and CREATE RESTRICTIVE isolation policies

-- 3.1 Properties Isolation
DROP POLICY IF EXISTS "Properties RLS Restrictive Isolation" ON public.properties_core;
CREATE POLICY "Properties RLS Restrictive Isolation" ON public.properties_core AS RESTRICTIVE
USING (
  is_system_admin()
  -- If isolation is disabled, allow all tenant staff
  OR NOT get_isolation_setting('isolation_properties_enabled')
  -- If isolation is enabled, enforce strict checks
  OR is_tenant_manager_or_admin(tenant_id)
  OR created_by = auth.uid()
  OR assigned_to = auth.uid()
  -- Allow public select for Active listings (so public search and detail pages work)
  OR (auth.role() = 'anon' AND status = 1)
);

-- 3.2 Leads Isolation
DROP POLICY IF EXISTS "Leads RLS Restrictive Isolation" ON public.crm_leads_v3;
CREATE POLICY "Leads RLS Restrictive Isolation" ON public.crm_leads_v3 AS RESTRICTIVE
USING (
  is_system_admin()
  OR NOT get_isolation_setting('isolation_leads_enabled')
  OR is_tenant_manager_or_admin(tenant_id)
  OR assigned_to = auth.uid()
);

-- 3.3 Deals Isolation
DROP POLICY IF EXISTS "Deals RLS Restrictive Isolation" ON public.crm_deals_v3;
CREATE POLICY "Deals RLS Restrictive Isolation" ON public.crm_deals_v3 AS RESTRICTIVE
USING (
  is_system_admin()
  OR NOT get_isolation_setting('isolation_deals_enabled')
  OR is_tenant_manager_or_admin(tenant_id)
  OR created_by = auth.uid()
  OR agent_id = auth.uid()
);
