-- 20260324_fix_property_images_storage_rls_v2.sql
-- Goal: Simplify management RLS for property images to support dynamic path structures (uploads + duplicates).

-- 1. Drop the over-restrictive policy
DROP POLICY IF EXISTS "Staff Manage: Property Images" ON storage.objects;

-- 2. Create simplified Management Policy
-- Allows Authenticated Staff to manage any file within the 'properties/' folder.
-- We rely on the CRM application logic to enforce specific property ownership before calling Storage APIs.
CREATE POLICY "Staff Manage: Property Images" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = 'properties'
    AND is_staff()
)
WITH CHECK (
    bucket_id = 'property-images'
    AND (storage.foldername(name))[1] = 'properties'
    AND is_staff()
);

-- Ensure public select still exists and is correct
DROP POLICY IF EXISTS "Public Read Access: Property Images" ON storage.objects;
CREATE POLICY "Public Read Access: Property Images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');
