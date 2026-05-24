-- Fix storage policies for blog-images bucket to allow authenticated staff members
-- to upload and manage blog post images without requiring tenant UUID prefix matching.

DROP POLICY IF EXISTS "Staff insert: blog-images" ON storage.objects;
CREATE POLICY "Staff insert: blog-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'blog-images' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('ADMIN', 'MANAGER', 'AGENT')
  )
);

DROP POLICY IF EXISTS "Staff update: blog-images" ON storage.objects;
CREATE POLICY "Staff update: blog-images" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'blog-images' 
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MANAGER')
    )
  )
);

DROP POLICY IF EXISTS "Staff delete: blog-images" ON storage.objects;
CREATE POLICY "Staff delete: blog-images" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'blog-images' 
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'MANAGER')
    )
  )
);
