-- 20260425181000_fix_admin_branch_visibility.sql
-- Goal: Ensure System Admins can see all branches and members even if they aren't explicitly added as members.

-- 1. Update Tenants Visibility
DROP POLICY IF EXISTS "System Admin Manage tenants" ON public.tenants;
CREATE POLICY "System Admin Manage tenants" ON public.tenants
FOR ALL USING (is_system_admin() OR id IN (SELECT unnest(get_user_tenants())));

-- 2. Update Tenant Members Visibility
DROP POLICY IF EXISTS "View Members in Same Tenant" ON public.tenant_members;
CREATE POLICY "Admin and Members View" ON public.tenant_members
FOR SELECT USING (
    is_system_admin() 
    OR tenant_id = ANY(get_user_tenants())
);

DROP POLICY IF EXISTS "System Admin Manage tenant_members" ON public.tenant_members;
CREATE POLICY "System Admin Manage tenant_members" ON public.tenant_members
FOR ALL USING (is_system_admin());
