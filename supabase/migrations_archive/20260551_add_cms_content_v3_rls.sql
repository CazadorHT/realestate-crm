-- ====================================================================
-- 🔒 V3 Ultimate Enterprise Architecture: CMS Content RLS Policies
-- Target: public.cms_content_v3
-- Added: 2026-05-20
-- ====================================================================

-- 1. Ensure RLS is enabled (already done by dynamic lockdown loop, but keep for consistency)
ALTER TABLE public.cms_content_v3 ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Public: Read Published CMS Content" ON public.cms_content_v3;
DROP POLICY IF EXISTS "Staff Manage: CMS Content" ON public.cms_content_v3;

-- 2. Grant permissions so PostgREST/anon can perform select queries
GRANT SELECT ON public.cms_content_v3 TO anon, authenticated;

-- 3. Policy: Allow anyone (unauthenticated and authenticated) to read published CMS content
CREATE POLICY "Public: Read Published CMS Content" ON public.cms_content_v3
FOR SELECT
TO anon, authenticated
USING (
    status IN ('published', 'PUBLISHED')
);

-- 4. Policy: Allow staff/admins to manage CMS content for their respective tenant
CREATE POLICY "Staff Manage: CMS Content" ON public.cms_content_v3
FOR ALL
TO authenticated
USING (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
)
WITH CHECK (
    public.is_tenant_member(tenant_id)
    OR (SELECT public.is_system_admin())
);
