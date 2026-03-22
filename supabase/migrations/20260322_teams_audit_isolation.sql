-- supabase/migrations/20260322_teams_audit_isolation.sql
-- Add tenant_id to teams and audit_logs for strict branch isolation

-- 1. Hardening Teams
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
COMMENT ON COLUMN public.teams.tenant_id IS 'Branch/Tenant the team belongs to';

-- 2. Hardening Audit Logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
COMMENT ON COLUMN public.audit_logs.tenant_id IS 'Branch/Tenant context of the activity';

-- 3. Enable RLS on Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 4. Teams RLS Policies
DROP POLICY IF EXISTS "Teams are visible to branch members" ON public.teams;
CREATE POLICY "Teams are visible to branch members" ON public.teams
FOR SELECT USING (
  tenant_id IS NULL OR 
  tenant_id = (SELECT auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID OR
  is_admin()
);

DROP POLICY IF EXISTS "Teams are manageable by branch admins" ON public.teams;
CREATE POLICY "Teams are manageable by branch admins" ON public.teams
FOR ALL USING (
  is_admin() OR
  (tenant_id = (SELECT auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID AND is_tenant_admin(tenant_id))
);

-- 5. Enable RLS on Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Audit Logs RLS Policies
DROP POLICY IF EXISTS "Audit logs are visible to branch admins" ON public.audit_logs;
CREATE POLICY "Audit logs are visible to branch admins" ON public.audit_logs
FOR SELECT USING (
  is_admin() OR
  (tenant_id = (SELECT auth.jwt() -> 'user_metadata' ->> 'tenant_id')::UUID AND is_tenant_admin(tenant_id))
);

DROP POLICY IF EXISTS "Audit logs creation is handled by system" ON public.audit_logs;
CREATE POLICY "Audit logs creation is handled by system" ON public.audit_logs
FOR INSERT WITH CHECK (true); -- Usually inserts are server-side via admin client anyway

-- 7. Populate tenant_id for existing teams (best effort)
-- For teams with a manager, assume they belong to the manager's tenant
UPDATE public.teams t
SET tenant_id = tm.tenant_id
FROM public.tenant_members tm
WHERE t.manager_id = tm.profile_id
AND t.tenant_id IS NULL;

-- 8. Populate tenant_id for existing audit_logs (best effort)
-- For logs with a user, assume they belong to the user's tenant
UPDATE public.audit_logs al
SET tenant_id = tm.tenant_id
FROM public.tenant_members tm
WHERE al.user_id = tm.profile_id
AND al.tenant_id IS NULL;
