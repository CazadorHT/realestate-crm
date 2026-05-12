-- ====================================================================
-- 🛡️ Real Estate CRM Database V2 (Phase 3: RLS Hardening & Isolation)
-- ====================================================================

-- 1. Optimized RLS Helpers (Fallback-ready)
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
DECLARE
    _tid UUID;
BEGIN
    _tid := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    IF _tid IS NULL THEN
        SELECT tenant_id INTO _tid FROM public.tenant_members WHERE profile_id = auth.uid() LIMIT 1;
    END IF;
    RETURN _tid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    _role TEXT;
BEGIN
    _role := (auth.jwt() -> 'app_metadata' ->> 'role');
    IF _role IS NULL THEN
        SELECT role::text INTO _role FROM public.profiles WHERE id = auth.uid();
    END IF;
    RETURN _role = 'ADMIN';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 2. Applying RLS with Performance Optimization (Subquery Pattern)

-- 2.1 Tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_access_own ON tenants;
CREATE POLICY tenant_access_own ON tenants
    FOR SELECT USING (id = (SELECT get_my_tenant_id()));

-- 2.2 Branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS branch_isolation ON branches;
CREATE POLICY branch_isolation ON branches
    FOR ALL USING (tenant_id = (SELECT get_my_tenant_id()));

-- 3. Applying RLS to Identities (User 360)

-- 3.1 Identities
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS identity_tenant_isolation ON identities;
CREATE POLICY identity_tenant_isolation ON identities
    FOR ALL USING (tenant_id = (SELECT get_my_tenant_id()));

-- 3.2 Identity Secrets
ALTER TABLE identity_secrets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS identity_secrets_isolation ON identity_secrets;
CREATE POLICY identity_secrets_isolation ON identity_secrets
    FOR SELECT USING (
        identity_id IN (
            SELECT id FROM identities 
            WHERE tenant_id = (SELECT get_my_tenant_id())
            AND ((SELECT is_admin()) OR id = (SELECT auth.uid()))
        )
    );

-- 4. Applying RLS to Business Data

-- 4.1 Properties V2
ALTER TABLE properties_v2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS properties_tenant_isolation ON properties_v2;
CREATE POLICY properties_tenant_isolation ON properties_v2
    FOR ALL USING (tenant_id = (SELECT get_my_tenant_id()));

-- 5. Audit & Media Assets
ALTER TABLE audit_logs_v2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_isolation ON audit_logs_v2;
CREATE POLICY audit_logs_isolation ON audit_logs_v2
    FOR SELECT USING (tenant_id = (SELECT get_my_tenant_id()));

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS media_assets_isolation ON media_assets;
CREATE POLICY media_assets_isolation ON media_assets
    FOR ALL USING (tenant_id = (SELECT get_my_tenant_id()));

-- Hardening
REVOKE EXECUTE ON FUNCTION get_my_tenant_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC;
