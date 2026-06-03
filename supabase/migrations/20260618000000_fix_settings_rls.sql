-- 1. Drop the old select policy
DROP POLICY IF EXISTS system_settings_v3_tenant_isolation ON public.system_settings_v3;

-- 2. Create the updated policy allowing users to read global settings (tenant_id IS NULL)
CREATE POLICY system_settings_v3_tenant_isolation ON public.system_settings_v3
FOR SELECT
TO authenticated
USING (
    tenant_id IS NULL 
    OR tenant_id = ANY (public.get_user_tenants()) 
    OR public.is_system_admin()
);
