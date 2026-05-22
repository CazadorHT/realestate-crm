-- 20260322_security_ultimate_rls_enable.sql
-- Goal: 10,000% Security. Ensure NO table in 'public' has RLS disabled.

DO $$
DECLARE
    row RECORD;
BEGIN
    -- 1. Enable RLS on ALL public tables that have it disabled
    FOR row IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            SELECT relname 
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE n.nspname = 'public' AND c.relrowsecurity = false
        )
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', row.tablename);
        
        -- Add a default "Deny All" or "System Admin Manage" to avoid complete lockout if needed,
        -- but safety first: Enable RLS makes it default deny.
        EXECUTE format('DROP POLICY IF EXISTS "System Admin Manage %s" ON public.%I', row.tablename, row.tablename);
        EXECUTE format('CREATE POLICY "System Admin Manage %s" ON public.%I FOR ALL USING (is_system_admin())', row.tablename, row.tablename);
        
        -- Special cases for public read tables
        IF row.tablename IN ('features', 'line_templates', 'property_features', 'services') THEN
            EXECUTE format('CREATE POLICY "Public Read %s" ON public.%I FOR SELECT USING (true)', row.tablename, row.tablename);
        END IF;
    END LOOP;
END $$;

-- 2. Lockdown 'property_agents' (it was enabled but had no policies)
DROP POLICY IF EXISTS "Staff View Property Agents" ON public.property_agents;
CREATE POLICY "Staff View Property Agents" ON public.property_agents
FOR SELECT USING (is_staff());

DROP POLICY IF EXISTS "Admin Manage Property Agents" ON public.property_agents;
CREATE POLICY "Admin Manage Property Agents" ON public.property_agents
FOR ALL USING (is_system_admin()); -- Simple admin lock for now as it lacks direct tenant_id

-- 3. Lockdown 'teams' (was disabled, now enabled by loop above)
-- Since 'teams' lacks 'tenant_id', we use System Admin only (handled by loop).
-- We can add specific policies for teams here if needed in the future.

-- 4. Re-verify lead_activities and rental_contracts (just in case)
DROP POLICY IF EXISTS "Tenant Isolation: Rental Contracts" ON public.rental_contracts;
CREATE POLICY "Tenant Isolation: Rental Contracts" ON public.rental_contracts
FOR ALL USING (
    is_system_admin()
    OR tenant_id IN (SELECT get_user_tenants())
);
