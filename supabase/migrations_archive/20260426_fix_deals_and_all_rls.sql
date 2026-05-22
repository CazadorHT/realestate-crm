-- Fix for Missing Deals and Leads (RLS Compatibility)
-- This restores visibility by using the correct SETOF syntax for the restored get_user_tenants function.

-- 1. Restore get_user_tenants() to SETOF uuid (Just in case, ensure it's correct)
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update all tables that were locked down with the wrong syntax
DO $$
DECLARE
    tbl TEXT;
    has_tenant_id BOOLEAN;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('leads', 'deals', 'property_agents', 'rental_contracts', 'documents', 'audit_logs', 'co_broker_documents', 'owners', 'properties')
    LOOP
        -- Check if column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = tbl 
            AND column_name = 'tenant_id'
        ) INTO has_tenant_id;

        -- Drop incompatible policies
        EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation %s" ON public.%I', tbl, tbl);
        
        -- Handle special tables or standard isolation
        IF tbl = 'owners' THEN
            DROP POLICY IF EXISTS "Owners: Tenant Isolation" ON public.owners;
            CREATE POLICY "Owners: Tenant Isolation" ON public.owners
            FOR ALL USING (is_system_admin() OR tenant_id IN (SELECT get_user_tenants()));
        ELSIF tbl = 'properties' THEN
            DROP POLICY IF EXISTS "Properties: Staff Full Access" ON public.properties;
            CREATE POLICY "Properties: Staff Full Access" ON public.properties
            FOR ALL USING (is_system_admin() OR tenant_id IN (SELECT get_user_tenants()));
        ELSIF has_tenant_id THEN
            EXECUTE format('CREATE POLICY "Tenant Isolation %s" ON public.%I FOR ALL USING (is_system_admin() OR tenant_id IN (SELECT get_user_tenants()))', tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- 3. Fix Property Agents special isolation
DROP POLICY IF EXISTS "Property Agents: Join Isolation" ON public.property_agents;
CREATE POLICY "Property Agents: Join Isolation" ON public.property_agents
FOR ALL USING (
    is_system_admin()
    OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id = property_agents.property_id
        AND p.tenant_id IN (SELECT get_user_tenants())
    )
);

-- 4. Fix Omni Messages (just to be safe and consistent)
DROP POLICY IF EXISTS "Tenant Isolation: Omni Messages" ON public.omni_messages;
CREATE POLICY "Tenant Isolation: Omni Messages" ON public.omni_messages
FOR ALL USING (
    is_system_admin()
    OR tenant_id IN (SELECT get_user_tenants())
);
