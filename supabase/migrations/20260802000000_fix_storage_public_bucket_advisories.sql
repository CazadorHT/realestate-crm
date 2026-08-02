-- ====================================================================
-- 📦 Storage Security Advisory Remediation for Public Buckets
-- ====================================================================
-- Description: Restricts SELECT policies on storage.objects for public buckets
-- (property-images, service-images, avatars, blog-images) to authenticated users,
-- while relying on public bucket CDN direct URLs for public image serving.
-- This resolves the "Clients can list all files in this bucket" warning.
-- ====================================================================

-- 1. [property-images]
drop policy if exists "Public viewing: property-images" on storage.objects;
drop policy if exists "Staff viewing: property-images" on storage.objects;
create policy "Staff viewing: property-images" on storage.objects for select to authenticated using (bucket_id = 'property-images');

-- 2. [service-images]
drop policy if exists "Public viewing: service-images" on storage.objects;
drop policy if exists "Staff viewing: service-images" on storage.objects;
create policy "Staff viewing: service-images" on storage.objects for select to authenticated using (bucket_id = 'service-images');

-- 3. [avatars]
drop policy if exists "Public viewing: avatars" on storage.objects;
drop policy if exists "Staff viewing: avatars" on storage.objects;
create policy "Staff viewing: avatars" on storage.objects for select to authenticated using (bucket_id = 'avatars');

-- 4. [blog-images]
drop policy if exists "Public viewing: blog-images" on storage.objects;
drop policy if exists "Staff viewing: blog-images" on storage.objects;
create policy "Staff viewing: blog-images" on storage.objects for select to authenticated using (bucket_id = 'blog-images');
