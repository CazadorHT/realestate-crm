-- 1. Create a Secure View for Public Branding
-- This prevents exposing sensitive columns (tax ID, phone, etc.) to the public.
DROP VIEW IF EXISTS public.tenant_branding;
CREATE OR REPLACE VIEW public.tenant_branding AS
SELECT 
    id, 
    name, 
    slug, 
    logo_url, 
    settings->'theme' as theme,
    settings->>'favicon_url' as favicon_url,
    settings->>'logo_dark_url' as logo_dark_url,
    subscription_status
FROM public.tenants;

-- Grant access to the view for anonymous users
GRANT SELECT ON public.tenant_branding TO anon;
GRANT SELECT ON public.tenant_branding TO authenticated;

-- 2. Allow Anyone (Public/Anon) to see ACTIVE properties only
-- This ensures DRAFT or SOLD properties are hidden from the public portal.
DROP POLICY IF EXISTS "Allow public read access to active properties" ON public.properties;
CREATE POLICY "Allow public read access to active properties"
ON public.properties FOR SELECT
USING (status = 'ACTIVE');

-- 3. Allow ADMIN และ MANAGER แก้ไขข้อมูล Tenant ของตัวเองได้
DROP POLICY IF EXISTS "Allow owners and admins to select their tenant" ON public.tenants;
CREATE POLICY "Allow members to select their tenant"
ON public.tenants FOR SELECT
USING (
    id IN (
        SELECT tenant_id 
        FROM public.tenant_members 
        WHERE profile_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Allow owners and admins to update their tenant" ON public.tenants;
DROP POLICY IF EXISTS "Allow admins and managers to update their tenant" ON public.tenants;
CREATE POLICY "Allow admins and managers to update their tenant"
ON public.tenants FOR UPDATE
USING (
    id IN (
        SELECT tenant_id 
        FROM public.tenant_members 
        WHERE profile_id = auth.uid() 
        AND role IN ('ADMIN', 'MANAGER')
    )
)
WITH CHECK (
    id IN (
        SELECT tenant_id 
        FROM public.tenant_members 
        WHERE profile_id = auth.uid() 
        AND role IN ('ADMIN', 'MANAGER')
    )
);
