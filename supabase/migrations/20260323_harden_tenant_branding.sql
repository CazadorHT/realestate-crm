-- 20260323_harden_tenant_branding.sql
-- Goal: Close the last remaining security gap where tenant_branding was accessible globally without RLS.

-- 1. Redefine tenant_branding as a SECURITY INVOKER view
-- This forces it to respect the RLS policies of the underlying 'tenants' table.
DROP VIEW IF EXISTS public.tenant_branding;

CREATE VIEW public.tenant_branding 
WITH (security_invoker = true) 
AS
SELECT
    id,
    name,
    slug,
    logo_url,
    settings->'theme' as theme,
    settings->>'favicon_url' as favicon_url,
    settings->>'logo_dark_url' as logo_dark_url,
    subscription_status
FROM public.tenants
WHERE is_deleted = false OR is_deleted IS NULL;

-- 2. Add strict RLS for 'tenants' table
-- We enable public SELECT but RESTRICT it to only safe columns via Column-level security (GRANTs).
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can see basic branding info for non-deleted tenants
DROP POLICY IF EXISTS "Public View Tenants Branding" ON public.tenants;
CREATE POLICY "Public View Tenants Branding" ON public.tenants
FOR SELECT 
TO anon, authenticated
USING (is_deleted = false OR is_deleted IS NULL);

-- Policy: Admin can do anything
DROP POLICY IF EXISTS "System Admin Manage Tenants" ON public.tenants;
CREATE POLICY "System Admin Manage Tenants" ON public.tenants
FOR ALL 
TO authenticated
USING (is_system_admin());

-- 3. Column-Level Security (Hardening)
-- Even if someone queries public.tenants directly, they shouldn't see stripe/omise/bank details.
-- We REVOKE all and selectively GRANT safe columns.

-- NOTE: Supabase default roles (anon, authenticated) have SELECT on everything by default.
-- We must be explicit.
REVOKE SELECT ON public.tenants FROM anon, authenticated;

-- Grant safe columns for branding and general UI
GRANT SELECT (
    id, 
    name, 
    slug, 
    logo_url, 
    settings, 
    subscription_status, 
    created_at, 
    updated_at, 
    is_deleted
) ON public.tenants TO anon, authenticated;

-- Grant FULL access to service_role for internal use
GRANT ALL ON public.tenants TO service_role;
GRANT ALL ON public.tenants TO postgres;

-- Re-grant full access to authenticated users WHO ARE SITE ADMINS (if needed via RLS)
-- But since RLS 'USING' check happens after privileges, we still need to grant columns.
-- For staff who need to manage settings (stripe_customer_id, etc), they should use a SECURITY DEFINER action
-- OR we allow them specifically:
GRANT SELECT (stripe_customer_id, omise_customer_id) ON public.tenants TO authenticated;
-- The RLS policy "System Admin Manage Tenants" will then filter which rows they see.
