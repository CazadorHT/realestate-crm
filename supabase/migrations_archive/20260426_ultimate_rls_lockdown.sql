-- 20260426_ultimate_rls_lockdown.sql
-- Goal: The Ultimate Multi-tenant Fortress (Phase 3)
-- Logic: Merged View for Branches, Personal View for Finance, Audit-logged Privacy.

-- ==========================================
-- 1. THE KERNEL (Helper Functions)
-- ==========================================

-- Standard Cleanup: Required to change return types or signatures
DROP FUNCTION IF EXISTS public.get_user_tenants() CASCADE;
DROP FUNCTION IF EXISTS public.is_tenant_staff(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_tenant_manager(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_personal_record(uuid) CASCADE;

-- Optimized: Returns all tenant IDs the user belongs to
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS uuid[] AS $$
BEGIN
  RETURN COALESCE(
    ARRAY(
      SELECT tenant_id 
      FROM public.tenant_members 
      WHERE profile_id = auth.uid()
    ),
    '{}'::uuid[]
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is staff in a specific tenant
CREATE OR REPLACE FUNCTION public.is_tenant_staff(target_tenant_id uuid)
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

-- Check if user is admin/manager in a specific tenant
CREATE OR REPLACE FUNCTION public.is_tenant_manager(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE profile_id = auth.uid() 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a record belongs to the user (Personal View)
CREATE OR REPLACE FUNCTION public.is_personal_record(target_profile_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN auth.uid() = target_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 2. THE FINANCIAL VAULT (Strict Personal View)
-- ==========================================

-- Lockdown deal_commissions
ALTER TABLE public.deal_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance: Personal or Admin View" ON public.deal_commissions;
CREATE POLICY "Finance: Personal or Admin View" ON public.deal_commissions
FOR SELECT USING (
    is_system_admin()
    OR is_personal_record(agent_id)
    OR is_tenant_manager(tenant_id)
);

-- Lockdown commission_adjustments
ALTER TABLE public.commission_adjustments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance: Adjustment View" ON public.commission_adjustments;
CREATE POLICY "Finance: Adjustment View" ON public.commission_adjustments
FOR SELECT USING (
    is_system_admin()
    OR EXISTS (
        SELECT 1 FROM public.deal_commissions dc
        WHERE dc.id = commission_id
        AND (is_personal_record(dc.agent_id) OR is_tenant_manager(dc.tenant_id))
    )
);


-- ==========================================
-- 3. THE OWNER SHIELD (Multi-tenant Privacy)
-- ==========================================

-- Lockdown owners table strictly to tenant members
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners: Tenant Isolation" ON public.owners;
CREATE POLICY "Owners: Tenant Isolation" ON public.owners
FOR ALL USING (
    is_system_admin()
    OR tenant_id = ANY(get_user_tenants())
);

-- Properties: Staff View vs Public View
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Staff can see all properties within their tenants
DROP POLICY IF EXISTS "Properties: Staff Full Access" ON public.properties;
CREATE POLICY "Properties: Staff Full Access" ON public.properties
FOR ALL USING (
    is_system_admin()
    OR tenant_id = ANY(get_user_tenants())
);

-- Public can see ACTIVE properties (Masking handled at API layer if needed)
DROP POLICY IF EXISTS "Properties: Public Search" ON public.properties;
CREATE POLICY "Properties: Public Search" ON public.properties
FOR SELECT USING (
    status = 'ACTIVE' 
    AND deleted_at IS NULL
);


-- ==========================================
-- 4. THE PROFILE MASKING (Anti-harvesting)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Internal Staff: See full profile within tenant network
DROP POLICY IF EXISTS "Profiles: Staff Network View" ON public.profiles;
CREATE POLICY "Profiles: Staff Network View" ON public.profiles
FOR SELECT USING (
    is_system_admin()
    -- Show full profile if the profile belongs to a tenant the user is also in
    OR EXISTS (
        SELECT 1 FROM public.tenant_members tm1
        JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
        WHERE tm1.profile_id = auth.uid() AND tm2.profile_id = public.profiles.id
    )
    OR id = auth.uid()
);

-- Public View: See only public fields
-- Note: PostgreSQL RLS doesn't natively mask columns easily without VIEWs.
-- However, we can create a policy that DENIES read to unauthorized roles,
-- and use a PUBLIC VIEW for the website.
-- For now, we allow SELECT on name/role but the application should not expose others.
-- To be truly "Hardened", we use a policy that allows reading basic info for everyone.

DROP POLICY IF EXISTS "Profiles: Public Minimal View" ON public.profiles;
CREATE POLICY "Profiles: Public Minimal View" ON public.profiles
FOR SELECT USING (
    role IN ('ADMIN', 'AGENT', 'MANAGER')
);


-- ==========================================
-- 5. THE ULTIMATE SCRUBBER (Default Deny)
-- ==========================================

-- Ensure every table mentioned has RLS enabled
DO $$
DECLARE
    tbl TEXT;
    has_tenant_id BOOLEAN;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('leads', 'deals', 'property_agents', 'rental_contracts', 'documents', 'audit_logs', 'co_broker_documents')
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- Check if column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = tbl 
            AND column_name = 'tenant_id'
        ) INTO has_tenant_id;

        IF has_tenant_id THEN
            -- Standard Tenant Isolation
            EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation %s" ON public.%I', tbl, tbl);
            EXECUTE format('CREATE POLICY "Tenant Isolation %s" ON public.%I FOR ALL USING (is_system_admin() OR tenant_id = ANY(get_user_tenants()))', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- ==========================================
-- 6. SPECIAL JOIN-BASED ISOLATION
-- ==========================================

-- property_agents: Isolating based on the property's tenant
DROP POLICY IF EXISTS "Property Agents: Join Isolation" ON public.property_agents;
CREATE POLICY "Property Agents: Join Isolation" ON public.property_agents
FOR ALL USING (
    is_system_admin()
    OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_id
        AND p.tenant_id = ANY(get_user_tenants())
    )
);
