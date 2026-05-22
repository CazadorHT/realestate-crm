-- ==========================================
-- 🛡️ V3 ULTIMATE RLS EMERGENCY FIX (V3 PURE GRADE 💎)
-- Target: Fix 'permission denied' for V3 tables and enable Media Uploads
-- ==========================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. UPDATE HELPERS TO SUPPORT V3 IDENTITY
-- ----------------------------------------------------------------

-- Optimized get_user_tenants (V3 Only)
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS uuid[] AS $$
BEGIN
  RETURN COALESCE(
    ARRAY(
      SELECT tenant_id FROM public.tenant_members_v3 WHERE identity_id = auth.uid()
    ),
    '{}'::uuid[]
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_tenant_staff (V3 Only)
CREATE OR REPLACE FUNCTION public.is_tenant_staff(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members_v3
    WHERE identity_id = auth.uid() 
      AND tenant_id = target_tenant_id
      AND LOWER(role) IN ('owner', 'admin', 'manager', 'agent')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Optimized is_tenant_member (V3 Only)
CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members_v3
    WHERE identity_id = auth.uid() AND tenant_id = target_tenant_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------
-- 2. GRANT PERMISSIONS ON V3 TABLES
-- ----------------------------------------------------------------
GRANT ALL ON public.tenants_v3 TO authenticated, service_role;
GRANT ALL ON public.branches_v3 TO authenticated, service_role;
GRANT ALL ON public.properties_core TO authenticated, service_role;
GRANT ALL ON public.properties_details TO authenticated, service_role;
GRANT ALL ON public.property_media_v3 TO authenticated, service_role;
GRANT ALL ON public.tenant_members_v3 TO authenticated, service_role;
GRANT ALL ON public.identities_v3 TO authenticated, service_role;

-- ----------------------------------------------------------------
-- 3. ENABLE RLS & DEFINE POLICIES FOR V3 MEDIA
-- ----------------------------------------------------------------
ALTER TABLE public.property_media_v3 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff Manage: V3 Media" ON public.property_media_v3;
CREATE POLICY "Staff Manage: V3 Media" ON public.property_media_v3
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.properties_core p
        WHERE p.id = property_id
        AND public.is_tenant_member(p.tenant_id)
    )
);

-- ----------------------------------------------------------------
-- 4. FIX STORAGE POLICIES FOR V3
-- ----------------------------------------------------------------
-- Allow staff to manage their tenant's property images
DROP POLICY IF EXISTS "V3 Staff Manage: Property Images" ON storage.objects;
CREATE POLICY "V3 Staff Manage: Property Images" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'property-images' AND
    (
        -- Check if user belongs to ANY tenant in V3
        EXISTS (SELECT 1 FROM public.tenant_members_v3 WHERE identity_id = auth.uid())
    )
)
WITH CHECK (
    bucket_id = 'property-images'
);

-- Public Read Access for V3
DROP POLICY IF EXISTS "V3 Public Read: Property Images" ON storage.objects;
CREATE POLICY "V3 Public Read: Property Images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'property-images');

COMMIT;
