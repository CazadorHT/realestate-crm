-- ====================================================================
-- 📦 Dynamic Cleanup of Public Storage SELECT Policies
-- ====================================================================
-- Description: Automatically finds and drops any legacy or custom SELECT policy 
-- on storage.objects that targets public/anon roles, resolving Supabase
-- "Clients can list all files in this bucket" security advisory regardless of policy name.
-- ====================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
          AND schemaname = 'storage'
          AND cmd = 'SELECT'
          AND (
            roles = '{public}' 
            OR roles = '{anon}' 
            OR roles IS NULL 
            OR 'public' = ANY(roles) 
            OR 'anon' = ANY(roles)
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
        RAISE NOTICE 'Dropped legacy public storage policy: %', pol.policyname;
    END LOOP;
END $$;

-- Re-create clean authenticated-only SELECT policies
DROP POLICY IF EXISTS "Staff viewing: property-images" ON storage.objects;
CREATE POLICY "Staff viewing: property-images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Staff viewing: service-images" ON storage.objects;
CREATE POLICY "Staff viewing: service-images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'service-images');

DROP POLICY IF EXISTS "Staff viewing: avatars" ON storage.objects;
CREATE POLICY "Staff viewing: avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Staff viewing: blog-images" ON storage.objects;
CREATE POLICY "Staff viewing: blog-images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'blog-images');
