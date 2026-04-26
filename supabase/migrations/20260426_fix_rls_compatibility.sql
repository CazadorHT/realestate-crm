-- 20260426_fix_rls_compatibility.sql
-- Goal: Restore get_user_tenants() to SETOF uuid for backward compatibility with existing policies.
-- Also ensures omni_messages has the ultimate lockdown isolation.

-- 1. Restore function to SETOF uuid
DROP FUNCTION IF EXISTS public.get_user_tenants() CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
    SELECT tenant_id 
    FROM public.tenant_members 
    WHERE profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-apply Ultimate Lockdown for tables that were using = ANY() logic
-- This will now use IN (SELECT ...) for maximum compatibility with SETOF.
DO $$
DECLARE
    tbl TEXT;
    has_tenant_id BOOLEAN;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('leads', 'deals', 'property_agents', 'rental_contracts', 'documents', 'audit_logs', 'co_broker_documents', 'omni_messages')
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
            -- Standard Tenant Isolation (Using IN SELECT for SETOF compatibility)
            EXECUTE format('DROP POLICY IF EXISTS "Tenant Isolation %s" ON public.%I', tbl, tbl);
            EXECUTE format('CREATE POLICY "Tenant Isolation %s" ON public.%I FOR ALL USING (is_system_admin() OR tenant_id IN (SELECT get_user_tenants()))', tbl, tbl);
            
            -- Also drop the old "Tenant Isolation: Omni Messages" if it exists for omni_messages
            IF tbl = 'omni_messages' THEN
                DROP POLICY IF EXISTS "Tenant Isolation: Omni Messages" ON public.omni_messages;
                DROP POLICY IF EXISTS "Staff can view all omni messages" ON public.omni_messages;
            END IF;
        END IF;
    END LOOP;
END $$;

-- 3. Fix other policies that might have been affected in the lockdown migration
DROP POLICY IF EXISTS "Owners: Tenant Isolation" ON public.owners;
CREATE POLICY "Owners: Tenant Isolation" ON public.owners
FOR ALL USING (
    is_system_admin()
    OR tenant_id IN (SELECT get_user_tenants())
);

DROP POLICY IF EXISTS "Properties: Staff Full Access" ON public.properties;
CREATE POLICY "Properties: Staff Full Access" ON public.properties
FOR ALL USING (
    is_system_admin()
    OR tenant_id IN (SELECT get_user_tenants())
);

-- Profiles Join Isolation
DROP POLICY IF EXISTS "Profiles: Staff Network View" ON public.profiles;
CREATE POLICY "Profiles: Staff Network View" ON public.profiles
FOR SELECT USING (
    is_system_admin()
    OR EXISTS (
        SELECT 1 FROM public.tenant_members tm1
        JOIN public.tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
        WHERE tm1.profile_id = auth.uid() AND tm2.profile_id = public.profiles.id
    )
    OR id = auth.uid()
);
