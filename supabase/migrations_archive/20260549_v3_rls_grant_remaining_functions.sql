-- ====================================================================
-- 🛡️ V3 Security: Fix remaining function permissions for public access
-- ====================================================================
-- The security advisor remediation revoked execute on is_tenant_admin
-- and is_tenant_admin_or_manager from anon. But these functions are
-- used inside RLS policies on identities_v3, tenants_v3, branches_v3 etc.
-- Without execute permission, anon queries that touch these tables fail.
-- These functions are safe (parameterized, auth.uid() based, return false for anon).

BEGIN;

GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin_or_manager(text) TO anon, authenticated, service_role;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
