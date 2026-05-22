-- ====================================================================
-- 🛡️ V3 Security Architecture: Public RLS Property Access Fix
-- ====================================================================
-- This migration fixes permission errors and allows public/anonymous
-- visitors to view active properties and their associated media.

BEGIN;

-- 1. Grant execute on helper functions used in RLS policies to PUBLIC/anon
-- Since these helper functions internally check auth.uid(), they are safe 
-- to execute by any role (they will just return false/empty array for anonymous users).
GRANT EXECUTE ON FUNCTION public.is_system_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_tenants() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_staff(uuid) TO anon, authenticated, service_role;

-- 2. Redefine the restrictive "Tenant Isolation Policy" on properties_core
-- to allow active properties (status = 1) to be accessed publicly.
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.properties_core;
CREATE POLICY "Tenant Isolation Policy" ON public.properties_core
    AS RESTRICTIVE
    USING (
        status = 1 OR 
        is_system_admin() OR 
        tenant_id = ((SELECT auth.jwt())->>'tenant_id')::uuid
    );

-- 3. Create a public select policy on property_media_v3 
-- to allow visitors to load images/media for active properties.
DROP POLICY IF EXISTS "Public Select: V3 Media" ON public.property_media_v3;
CREATE POLICY "Public Select: V3 Media" ON public.property_media_v3
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.properties_core p
            WHERE p.id = property_id AND p.status = 1 AND p.deleted_at IS NULL
        )
    );

-- 4. Force reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
