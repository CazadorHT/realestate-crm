-- ====================================================================
-- 🔒 V3 Ultimate Enterprise Architecture: Missing RLS Policies Remediation
-- Target: public.crm_leads_v3, public.communications_hub_v3,
--         public.activity_timeline_v3, public.notifications_v3,
--         public.teams_v3, public.tenant_invitations_v3,
--         public.system_settings_v3, public.ref_master_data
-- Added: 2026-05-20
-- ====================================================================

BEGIN;

-- 1. Grant general authenticated & service_role access to CRM & Core V3 Tables
GRANT ALL ON public.crm_leads_v3 TO authenticated, service_role;
GRANT ALL ON public.communications_hub_v3 TO authenticated, service_role;
GRANT ALL ON public.activity_timeline_v3 TO authenticated, service_role;
GRANT ALL ON public.notifications_v3 TO authenticated, service_role;
GRANT ALL ON public.teams_v3 TO authenticated, service_role;
GRANT ALL ON public.tenant_invitations_v3 TO authenticated, service_role;
GRANT ALL ON public.system_settings_v3 TO authenticated, service_role;
GRANT ALL ON public.ref_master_data TO authenticated, service_role;

-- 2. CRM LEADS
DROP POLICY IF EXISTS "leads_v3_tenant_isolation" ON public.crm_leads_v3;
CREATE POLICY "leads_v3_tenant_isolation" ON public.crm_leads_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
);

-- 3. OMNI-CHANNEL COMMUNICATIONS HUB
DROP POLICY IF EXISTS "communications_hub_v3_tenant_isolation" ON public.communications_hub_v3;
CREATE POLICY "communications_hub_v3_tenant_isolation" ON public.communications_hub_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
);

-- 4. ACTIVITY TIMELINE
DROP POLICY IF EXISTS "activity_timeline_v3_tenant_isolation" ON public.activity_timeline_v3;
CREATE POLICY "activity_timeline_v3_tenant_isolation" ON public.activity_timeline_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
);

-- 5. NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_v3_user_isolation" ON public.notifications_v3;
CREATE POLICY "notifications_v3_user_isolation" ON public.notifications_v3
FOR ALL TO authenticated
USING (
    user_id = auth.uid()
    OR (SELECT public.is_system_admin())
)
WITH CHECK (
    user_id = auth.uid()
    OR (SELECT public.is_system_admin())
);

-- 6. TEAMS
DROP POLICY IF EXISTS "teams_v3_tenant_isolation" ON public.teams_v3;
CREATE POLICY "teams_v3_tenant_isolation" ON public.teams_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
);

-- 7. TENANT INVITATIONS
DROP POLICY IF EXISTS "tenant_invitations_v3_isolation" ON public.tenant_invitations_v3;
CREATE POLICY "tenant_invitations_v3_isolation" ON public.tenant_invitations_v3
FOR ALL TO authenticated
USING (
    email = (SELECT auth.jwt()->>'email')
    OR public.is_tenant_staff(tenant_id)
    OR (SELECT public.is_system_admin())
)
WITH CHECK (
    public.is_tenant_staff(tenant_id)
    OR (SELECT public.is_system_admin())
);

-- 8. SYSTEM & TENANT SETTINGS
DROP POLICY IF EXISTS "system_settings_v3_tenant_isolation" ON public.system_settings_v3;
CREATE POLICY "system_settings_v3_tenant_isolation" ON public.system_settings_v3
FOR SELECT TO authenticated
USING (
    tenant_id = ANY (public.get_user_tenants())
    OR (SELECT public.is_system_admin())
);

DROP POLICY IF EXISTS "system_settings_v3_tenant_manage" ON public.system_settings_v3;
CREATE POLICY "system_settings_v3_tenant_manage" ON public.system_settings_v3
FOR ALL TO authenticated
USING (
    public.is_tenant_staff(tenant_id)
    OR (SELECT public.is_system_admin())
)
WITH CHECK (
    public.is_tenant_staff(tenant_id)
    OR (SELECT public.is_system_admin())
);

-- 9. MASTER REFERENCE DATA
GRANT SELECT ON public.ref_master_data TO anon, authenticated;

DROP POLICY IF EXISTS "ref_master_data_public_read" ON public.ref_master_data;
CREATE POLICY "ref_master_data_public_read" ON public.ref_master_data
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "ref_master_data_admin_manage" ON public.ref_master_data;
CREATE POLICY "ref_master_data_admin_manage" ON public.ref_master_data
FOR ALL TO authenticated
USING (
    (SELECT public.is_system_admin())
)
WITH CHECK (
    (SELECT public.is_system_admin())
);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';

COMMIT;
