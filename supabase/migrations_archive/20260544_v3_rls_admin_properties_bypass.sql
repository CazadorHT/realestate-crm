-- ====================================================================
-- 🔒 V3 Security Architecture: Admin RLS Bypass Alignment
-- ====================================================================
-- This migration ensures that users with the 'ADMIN' role (system administrators)
-- can manage properties and media across all branches, bypassing restrictive tenant-isolation.

-- 1. Redefine "Tenant Isolation Policy" on properties_core to allow admins
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.properties_core;
CREATE POLICY "Tenant Isolation Policy" ON public.properties_core
    AS RESTRICTIVE
    USING (is_system_admin() OR tenant_id = ((SELECT auth.jwt())->>'tenant_id')::uuid);

-- 2. Create a permissive policy on property_media_v3 for system administrators
DROP POLICY IF EXISTS "Admin Manage: V3 Media" ON public.property_media_v3;
CREATE POLICY "Admin Manage: V3 Media" ON public.property_media_v3
    FOR ALL
    TO public
    USING (is_system_admin());
