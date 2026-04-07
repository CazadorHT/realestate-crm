-- 20260408_blog_images_storage.sql
-- Goal: Create a dedicated bucket for blog images and set professional RLS policies.

-- 1. Create the bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Public Read Access: Blog Images
-- Allows anyone to view the images on the website.
CREATE POLICY "Public Read Access: Blog Images" ON storage.objects
FOR SELECT USING (bucket_id = 'blog-images');

-- 3. Staff Manage: Blog Images
-- Allows Admin, Manager, and Agent to upload/manage images.
CREATE POLICY "Staff Manage: Blog Images" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'blog-images'
    -- Simplified for blog images: just check role
    AND (
        is_system_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'MANAGER', 'AGENT')
        )
    )
)
WITH CHECK (
    bucket_id = 'blog-images'
    AND (
        is_system_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('ADMIN', 'MANAGER', 'AGENT')
        )
    )
);
