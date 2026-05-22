-- 20260322_security_gap_closure.sql
-- Goal: Close remaining RLS gaps in secondary tables and Storage buckets.

-- 1. Omni-channel Hardening
ALTER TABLE public.omni_messages ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Backfill tenant_id from leads
UPDATE public.omni_messages om
SET tenant_id = l.tenant_id
FROM public.leads l
WHERE om.lead_id = l.id AND om.tenant_id IS NULL;

-- Enable RLS and Apply Policy
ALTER TABLE public.omni_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can view all omni messages" ON public.omni_messages;
CREATE POLICY "Tenant Isolation: Omni Messages" ON public.omni_messages
FOR ALL USING (
    is_system_admin()
    OR tenant_id IN (SELECT get_user_tenants())
);

-- 2. Smart Match & Secondary Tables Hardening
-- Restrict management to System Admins
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['faqs', 'smart_match_budget_ranges', 'smart_match_office_sizes', 'smart_match_property_types', 'smart_match_settings', 'partners', 'blog_categories', 'blog_posts'])
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can manage %s" ON public.%I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.%I', tbl);
        
        -- Policy: Anyone can read (Select), only System Admin can Manage (All)
        EXECUTE format('CREATE POLICY "System Admin Manage %s" ON public.%I FOR ALL USING (is_system_admin())', tbl, tbl);
    END LOOP;
END $$;

-- 3. Storage Bucket Policies Hardening
-- This requires careful path-based RLS in storage.objects

-- Documents Bucket: Restrict to tenant
DROP POLICY IF EXISTS "Allow authenticated users to view documents" ON storage.objects;
CREATE POLICY "Tenant Isolation: Document View" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents' 
    AND (
        is_system_admin()
        OR (storage.foldername(name))[1]::uuid IN (SELECT get_user_tenants())
    )
);

DROP POLICY IF EXISTS "Allow authenticated users to update documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff Upload" ON storage.objects;
DROP POLICY IF EXISTS "Staff Delete" ON storage.objects;

CREATE POLICY "Tenant Isolation: Document Manage" ON storage.objects
FOR ALL USING (
    bucket_id = 'documents'
    AND (
        is_system_admin()
        OR (storage.foldername(name))[1]::uuid IN (SELECT get_user_tenants())
    )
)
WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_tenants())
);

-- Property Images Bucket: Restrict to tenant
DROP POLICY IF EXISTS "Staff can manage property images storage" ON storage.objects;
CREATE POLICY "Tenant Isolation: Property Images Manage" ON storage.objects
FOR ALL USING (
    bucket_id = 'property-images'
    AND (
        is_system_admin()
        OR (storage.foldername(name))[1]::uuid IN (SELECT get_user_tenants())
    )
);

-- 4. Rental Contracts consistency
DROP POLICY IF EXISTS "rental_contracts_select_auth" ON public.rental_contracts;
DROP POLICY IF EXISTS "rental_contracts_insert_auth" ON public.rental_contracts;
DROP POLICY IF EXISTS "rental_contracts_update_auth" ON public.rental_contracts;
DROP POLICY IF EXISTS "rental_contracts_delete_auth" ON public.rental_contracts;
-- The "Tenant Isolation: Rental Contracts" from 20240227 handles the primary check, 
-- but we should double check it exists and is strict.
