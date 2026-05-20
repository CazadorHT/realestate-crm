-- ====================================================================
-- ⚡ V3 Ultimate Enterprise Architecture: RLS & Index Micro-Optimizations
-- Target: public.cms_content_v3, public.tenant_invitations_v3, etc.
-- Added: 2026-05-20
-- ====================================================================

BEGIN;

-- 1. Create a High-Performance Partial Index for Published CMS Content
-- This speeds up front-end/anonymous queries for blogs, FAQs, and services.
CREATE INDEX IF NOT EXISTS idx_cms_content_v3_published
ON public.cms_content_v3 (content_type)
WHERE status IN ('published', 'PUBLISHED');

-- 2. Optimize cms_content_v3 policies by removing subquery wrappers on is_system_admin()
DROP POLICY IF EXISTS "Staff Manage: CMS Content" ON public.cms_content_v3;
CREATE POLICY "Staff Manage: CMS Content" ON public.cms_content_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
);

-- 3. Optimize crm_leads_v3 policies
DROP POLICY IF EXISTS "leads_v3_tenant_isolation" ON public.crm_leads_v3;
CREATE POLICY "leads_v3_tenant_isolation" ON public.crm_leads_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
);

-- 4. Optimize communications_hub_v3 policies
DROP POLICY IF EXISTS "communications_hub_v3_tenant_isolation" ON public.communications_hub_v3;
CREATE POLICY "communications_hub_v3_tenant_isolation" ON public.communications_hub_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
);

-- 5. Optimize activity_timeline_v3 policies
DROP POLICY IF EXISTS "activity_timeline_v3_tenant_isolation" ON public.activity_timeline_v3;
CREATE POLICY "activity_timeline_v3_tenant_isolation" ON public.activity_timeline_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
);

-- 6. Optimize notifications_v3 policies
DROP POLICY IF EXISTS "notifications_v3_user_isolation" ON public.notifications_v3;
CREATE POLICY "notifications_v3_user_isolation" ON public.notifications_v3
FOR ALL TO authenticated
USING (
    user_id = auth.uid()
    OR public.is_system_admin()
)
WITH CHECK (
    user_id = auth.uid()
    OR public.is_system_admin()
);

-- 7. Optimize teams_v3 policies
DROP POLICY IF EXISTS "teams_v3_tenant_isolation" ON public.teams_v3;
CREATE POLICY "teams_v3_tenant_isolation" ON public.teams_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR public.is_system_admin()
);

-- 8. Optimize tenant_invitations_v3 policies
DROP POLICY IF EXISTS "tenant_invitations_v3_isolation" ON public.tenant_invitations_v3;
CREATE POLICY "tenant_invitations_v3_isolation" ON public.tenant_invitations_v3
FOR ALL TO authenticated
USING (
    email = (auth.jwt()->>'email')
    OR public.is_tenant_staff(tenant_id)
    OR public.is_system_admin()
)
WITH CHECK (
    public.is_tenant_staff(tenant_id)
    OR public.is_system_admin()
);

-- 9. Optimize ref_master_data policies
DROP POLICY IF EXISTS "ref_master_data_admin_manage" ON public.ref_master_data;
CREATE POLICY "ref_master_data_admin_manage" ON public.ref_master_data
FOR ALL TO authenticated
USING (
    public.is_system_admin()
)
WITH CHECK (
    public.is_system_admin()
);

-- 10. Optimize system_settings_v3 policies
DROP POLICY IF EXISTS "system_settings_v3_tenant_isolation" ON public.system_settings_v3;
CREATE POLICY "system_settings_v3_tenant_isolation" ON public.system_settings_v3
FOR SELECT TO authenticated
USING (
    tenant_id = ANY (public.get_user_tenants())
    OR public.is_system_admin()
);

DROP POLICY IF EXISTS "system_settings_v3_tenant_manage" ON public.system_settings_v3;
CREATE POLICY "system_settings_v3_tenant_manage" ON public.system_settings_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_staff(tenant_id)
    OR public.is_system_admin()
)
WITH CHECK (
    public.is_tenant_staff(tenant_id)
    OR public.is_system_admin()
);

-- Reload PostgREST cache
NOTIFY pgrst, 'reload schema';

COMMIT;
