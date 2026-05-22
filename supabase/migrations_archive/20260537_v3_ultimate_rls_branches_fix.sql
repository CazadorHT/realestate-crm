-- ====================================================================
-- 🛡️ V3 ULTIMATE RLS & BRANCHES FIX (DIAMOND GRADE 💎)
-- Target: Resolve empty branches/tenants for Admin and verify V3 RLS policies
-- ====================================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. ROBUST HELPERS (SECURITY DEFINER)
-- ----------------------------------------------------------------

-- Optimized is_system_admin
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')), '') = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized get_user_tenants (V3)
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS uuid[] AS $$
BEGIN
  RETURN COALESCE(
    ARRAY(
      SELECT tenant_id FROM public.tenant_members_v3 WHERE identity_id = auth.uid()
    ),
    '{}'::uuid[]
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_tenant_admin (V3)
CREATE OR REPLACE FUNCTION public.is_tenant_admin(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members_v3
    WHERE identity_id = auth.uid() 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_system_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_tenants() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid) TO anon, authenticated, service_role;

-- ----------------------------------------------------------------
-- 2. V3 TABLES RLS POLICIES (tenants_v3, branches_v3, tenant_members_v3, identities_v3)
-- ----------------------------------------------------------------

-- [tenants_v3]
ALTER TABLE public.tenants_v3 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenants_v3_select" ON public.tenants_v3;
CREATE POLICY "tenants_v3_select" ON public.tenants_v3
FOR SELECT USING (true);

DROP POLICY IF EXISTS "tenants_v3_modify" ON public.tenants_v3;
CREATE POLICY "tenants_v3_modify" ON public.tenants_v3
FOR ALL USING (
    (SELECT public.is_system_admin()) OR 
    public.is_tenant_admin(id)
);

-- [branches_v3]
ALTER TABLE public.branches_v3 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "branches_v3_select" ON public.branches_v3;
CREATE POLICY "branches_v3_select" ON public.branches_v3
FOR SELECT USING (
    is_active = true OR 
    (SELECT public.is_system_admin()) OR 
    tenant_id = ANY (public.get_user_tenants())
);

DROP POLICY IF EXISTS "branches_v3_modify" ON public.branches_v3;
CREATE POLICY "branches_v3_modify" ON public.branches_v3
FOR ALL USING (
    (SELECT public.is_system_admin()) OR 
    public.is_tenant_admin(tenant_id)
);

-- [tenant_members_v3]
ALTER TABLE public.tenant_members_v3 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_members_v3_select" ON public.tenant_members_v3;
CREATE POLICY "tenant_members_v3_select" ON public.tenant_members_v3
FOR SELECT USING (
    identity_id = auth.uid() OR 
    (SELECT public.is_system_admin()) OR 
    tenant_id = ANY (public.get_user_tenants())
);

DROP POLICY IF EXISTS "tenant_members_v3_modify" ON public.tenant_members_v3;
CREATE POLICY "tenant_members_v3_modify" ON public.tenant_members_v3
FOR ALL USING (
    (SELECT public.is_system_admin()) OR 
    public.is_tenant_admin(tenant_id)
);

-- [identities_v3]
ALTER TABLE public.identities_v3 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "identities_v3_select" ON public.identities_v3;
CREATE POLICY "identities_v3_select" ON public.identities_v3
FOR SELECT USING (
    id = auth.uid() OR 
    (SELECT public.is_system_admin()) OR 
    EXISTS (
        SELECT 1 FROM public.tenant_members_v3 tm1
        JOIN public.tenant_members_v3 tm2 ON tm1.tenant_id = tm2.tenant_id
        WHERE tm1.identity_id = auth.uid() AND tm2.identity_id = identities_v3.id
    )
);

DROP POLICY IF EXISTS "identities_v3_modify" ON public.identities_v3;
CREATE POLICY "identities_v3_modify" ON public.identities_v3
FOR ALL USING (
    id = auth.uid() OR 
    (SELECT public.is_system_admin())
);

-- ----------------------------------------------------------------
-- 3. V3 PROPERTIES POLICIES (properties_core, properties_details)
-- ----------------------------------------------------------------

-- [properties_core]
ALTER TABLE public.properties_core ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "properties_core_select" ON public.properties_core;
CREATE POLICY "properties_core_select" ON public.properties_core
FOR SELECT USING (
    (status = 1 AND deleted_at IS NULL) OR -- 1 = Active
    (SELECT public.is_system_admin()) OR 
    tenant_id = ANY (public.get_user_tenants())
);

DROP POLICY IF EXISTS "properties_core_modify" ON public.properties_core;
CREATE POLICY "properties_core_modify" ON public.properties_core
FOR ALL USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id = ANY (public.get_user_tenants())
);

-- [properties_details]
ALTER TABLE public.properties_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "properties_details_select" ON public.properties_details;
CREATE POLICY "properties_details_select" ON public.properties_details
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.properties_core pc
        WHERE pc.id = property_id AND (
            (pc.status = 1 AND pc.deleted_at IS NULL) OR 
            (SELECT public.is_system_admin()) OR 
            pc.tenant_id = ANY (public.get_user_tenants())
        )
    )
);

DROP POLICY IF EXISTS "properties_details_modify" ON public.properties_details;
CREATE POLICY "properties_details_modify" ON public.properties_details
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.properties_core pc
        WHERE pc.id = property_id AND (
            (SELECT public.is_system_admin()) OR 
            pc.tenant_id = ANY (public.get_user_tenants())
        )
    )
);

COMMIT;
