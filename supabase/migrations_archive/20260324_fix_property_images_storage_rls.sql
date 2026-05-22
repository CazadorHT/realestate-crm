-- 20260324_fix_property_images_storage_rls.sql
-- Goal: Restore public read access to property images and fix tenant isolation for storage management.

-- 1. Drop the broken policy that blocks all non-admin access due to UUID cast error
DROP POLICY IF EXISTS "Tenant Isolation: Property Images Manage" ON storage.objects;

-- 2. Restore Public Read Access
-- This ensures that general users and Next.js Image Optimization can fetch images via public URLs.
CREATE POLICY "Public Read Access: Property Images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

-- 3. Fix Property Images Management (Staff/Tenant Isolation)
-- Expected path structure: properties/<property_id>/<file_name>
-- This allows staff to manage images for properties belonging to their tenant.
CREATE POLICY "Staff Manage: Property Images" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = 'properties'
    AND (
        is_system_admin()
        OR EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND p.tenant_id IN (SELECT get_user_tenants())
        )
    )
)
WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = 'properties'
    AND (
        is_system_admin()
        OR EXISTS (
            SELECT 1 FROM public.properties p
            WHERE p.id::text = (storage.foldername(name))[2]
            AND p.tenant_id IN (SELECT get_user_tenants())
        )
    )
);

-- 4. Management for Site Assets (Branding)
-- Expected path structure: site-assets/<folder>/<file_name>
-- Restrict branding changes to System Admins only.
CREATE POLICY "Admin Manage: Site Assets" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = 'site-assets'
    AND is_system_admin()
)
WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = 'site-assets'
    AND is_system_admin()
);

-- 5. Fallback for any other folders in property-images (if any)
-- System Admin can manage everything else.
CREATE POLICY "Admin Manage: Other property-images" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] NOT IN ('properties', 'site-assets')
    AND is_system_admin()
)
WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] NOT IN ('properties', 'site-assets')
    AND is_system_admin()
);
