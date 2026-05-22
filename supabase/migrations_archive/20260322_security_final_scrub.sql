-- 20260322_security_final_scrub.sql
-- Goal: 1000% Security. Revoke ALL legacy permissive policies that might bypass tenant isolation.

DO $$
DECLARE
    row RECORD;
BEGIN
    -- List of tables to strictly isolate
    FOR row IN 
        SELECT tablename, policyname 
        FROM (
            VALUES 
            ('deals', 'deals_select_auth'), ('deals', 'deals_insert_auth'), ('deals', 'deals_update_auth'), ('deals', 'deals_delete_auth'),
            ('leads', 'leads_select_auth'), ('leads', 'leads_insert_auth'), ('leads', 'leads_update_auth'), ('leads', 'leads_delete_auth'),
            ('properties', 'properties_select_auth'), ('properties', 'properties_insert_auth'), ('properties', 'properties_update_auth'), ('properties', 'properties_delete_auth'),
            ('owners', 'owners_select_auth'), ('owners', 'owners_insert_auth'), ('owners', 'owners_update_auth'), ('owners', 'owners_delete_auth'),
            ('rental_contracts', 'rental_contracts_select_auth'), ('rental_contracts', 'rental_contracts_insert_auth'), ('rental_contracts', 'rental_contracts_update_auth'), ('rental_contracts', 'rental_contracts_delete_auth'),
            ('documents', 'documents_select_auth'), ('documents', 'documents_insert_auth'), ('documents', 'documents_update_auth'), ('documents', 'documents_delete_auth'),
            ('lead_activities', 'lead_activities_select_auth'), ('lead_activities', 'lead_activities_insert_auth'), ('lead_activities', 'lead_activities_update_auth'), ('lead_activities', 'lead_activities_delete_auth'),
            ('lead_activities', 'authenticated_all_lead_activities'),
            ('communications_hub_v3', 'System can insert omni messages'),
            ('communications_hub_v3', 'Staff can view all omni messages'),
            ('property_image_uploads', 'authenticated_manage_all_piu'),
            ('deal_commissions', 'Admins can manage commissions'),
            ('deal_commissions', 'Users can view their own tenant''s commissions'),
            ('blog_categories', 'Authenticated users can manage categories'),
            ('blog_posts', 'Authenticated users can manage posts'),
            ('popular_areas', 'Allow authenticated insert'),
            ('profiles', 'Authenticated users can view all profiles'),
            ('property_agents', 'Allow read access for authenticated users'),
            ('property_agents', 'Allow insert for authenticated users'),
            ('property_agents', 'Allow delete for authenticated users'),
            ('rent_notification_rules', 'Enable all access for authenticated users'),
            ('smart_match_budget_ranges', 'Allow authenticated users to manage budget ranges'),
            ('smart_match_office_sizes', 'Allow authenticated users to manage office sizes'),
            ('smart_match_property_types', 'Allow authenticated users to manage property types'),
            ('smart_match_settings', 'Allow authenticated users to manage settings'),
            ('site_settings', 'Allow authenticated to read site_settings'),
            ('site_settings', 'Allow authenticated to update site_settings')
        ) AS t(tablename, policyname)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', row.policyname, row.tablename);
    END LOOP;
END $$;

-- 2. Storage Scrubbing (Crucial)
-- These are in schema 'storage'
DROP POLICY IF EXISTS "Staff Select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff Upload" ON storage.objects;
DROP POLICY IF EXISTS "Staff Delete" ON storage.objects;

-- 3. Fix Deal Commissions RLS
ALTER TABLE public.deal_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant Isolation: Deal Commissions" ON public.deal_commissions;
CREATE POLICY "Tenant Isolation: Deal Commissions" ON public.deal_commissions
FOR ALL USING (
    is_system_admin()
    OR tenant_id IN (SELECT get_user_tenants())
);

-- 4. Fix Profile Enumeration Leak
DROP POLICY IF EXISTS "profiles_select_matching_tenant" ON public.profiles;
CREATE POLICY "profiles_select_matching_tenant" ON public.profiles
FOR SELECT USING (
    id = auth.uid() -- Can see self
    OR id IN ( -- Can see members of same tenant
        SELECT tm2.profile_id 
        FROM tenant_members tm1
        JOIN tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
        WHERE tm1.profile_id = auth.uid()
    )
    OR role = 'ADMIN' -- System admins might need to be visible (optional, but safer)
);

-- 5. Final lead_activities check
DROP POLICY IF EXISTS "Tenant Isolation: Rental Contracts" ON public.rental_contracts;
CREATE POLICY "Tenant Isolation: Rental Contracts" ON public.rental_contracts
FOR ALL USING (
    is_system_admin()
    OR tenant_id IN (SELECT get_user_tenants())
);
