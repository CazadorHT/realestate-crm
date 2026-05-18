-- Migration to create user-assets bucket and setup HARDENED RLS policies
-- Created at: 2026-05-14
-- Refined based on Enterprise Security Best Practices

-- 1. Create the bucket with smart limits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-assets', 
  'user-assets', 
  true, 
  5242880, -- 5MB Limit (รองรับรูปจากมือถือความละเอียดสูง)
  ARRAY['image/jpeg', 'image/png', 'image/webp'] -- Removed GIF for security/size
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,   
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Setup RLS Policies

-- Policy: Public Access for Profiles (Safe for public viewing)
CREATE POLICY "Public Access for Profiles"
ON storage.objects FOR SELECT
USING ( 
  bucket_id = 'user-assets' AND 
  (storage.foldername(name))[1] = 'user-profiles'
);

-- Policy: Private Access for Signatures (Owner Only or Signed URL)
CREATE POLICY "Private Access for Signatures"
ON storage.objects FOR SELECT
TO authenticated
USING ( 
  bucket_id = 'user-assets' AND 
  (storage.foldername(name))[1] = 'user-signatures' AND
  (storage.foldername(name))[2] = (auth.uid())::text
);

-- Policy: Strict Upload Control (Owner only + Exact Folder Depth)
CREATE POLICY "Users can upload their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-assets' AND
  array_length(storage.foldername(name), 1) = 2 AND -- Strict folder depth
  (storage.foldername(name))[1] IN ('user-profiles', 'user-signatures') AND
  (storage.foldername(name))[2] = (auth.uid())::text
);

-- Policy: Strict Management Control (Owner only)
CREATE POLICY "Users can manage their own assets"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'user-assets' AND
  (storage.foldername(name))[2] = (auth.uid())::text
);
