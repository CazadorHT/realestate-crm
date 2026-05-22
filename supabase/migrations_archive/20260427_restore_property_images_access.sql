-- 🛡️ Phase 3.5: Restore Public Property Image Access (Supabase Compliant)
-- Goal: Fix "Images not showing" while respecting Supabase storage permissions.

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Public Read Access: Property Images
-- Standard policy to allow non-logged-in users to see property photos.
DROP POLICY IF EXISTS "Public Read Access: Property Images" ON storage.objects;
CREATE POLICY "Public Read Access: Property Images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'property-images');

-- Note: We REMOVED the 'ALTER TABLE storage.objects' statement as it requires 
-- superuser/owner privileges not available via standard Supabase migrations.
-- Storage RLS is enabled by default in Supabase.
