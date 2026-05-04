-- Migration: Setup Blog Storage Bucket
-- Description: Creates the blog-images bucket and sets up RLS policies for secure access.
-- Created: 2026-05-03

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on the bucket (Standard Supabase behavior)
-- 3. Set up policies

-- Allow only authenticated staff to list/select images (Security Hardening)
-- Public can still view images via direct URL because the bucket is 'public'
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Staff Select Access" ON storage.objects
FOR SELECT TO authenticated
USING (
    bucket_id = 'blog-images' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'MANAGER', 'AGENT')
    )
);

-- Allow authenticated staff (ADMIN, MANAGER, AGENT) to upload images
DROP POLICY IF EXISTS "Staff Upload Access" ON storage.objects;
CREATE POLICY "Staff Upload Access" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'blog-images' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'MANAGER', 'AGENT')
    )
);

-- Allow staff to update/delete their own uploads (or all blog images if they are staff)
DROP POLICY IF EXISTS "Staff Manage Access" ON storage.objects;
CREATE POLICY "Staff Manage Access" ON storage.objects
FOR ALL TO authenticated
USING (
    bucket_id = 'blog-images' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'MANAGER', 'AGENT')
    )
);
