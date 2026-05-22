-- ====================================================================
-- 📦 Setup Storage Buckets and Policies
-- ====================================================================
-- Description: Creates and configures storage buckets, and sets up
-- explicit per-bucket RLS policies, including site-assets upload support for admins/managers.
-- ====================================================================

-- ====================================================================
-- 📦 1. สร้างและลงทะเบียน Storage Buckets ทั้ง 9 ตัว (Idempotent Setup)
-- ====================================================================

-- [1. property-images] (Public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];

-- [2. user-assets] (Public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-assets', 'user-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- [3. service-images] (Public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('service-images', 'service-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- [4. avatars] (Public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

-- [5. blog-images] (Public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- [6. payout-slips] (Private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payout-slips', 'payout-slips', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- [7. documents] (Private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 20971520, array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = 20971520, allowed_mime_types = array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

-- [8. co-broker-documents] (Private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('co-broker-documents', 'co-broker-documents', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 20971520, allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- [9. finance] (Private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('finance', 'finance', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880, allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- ====================================================================
-- 🛡️ 2. นโยบายความปลอดภัย RLS (Explicit Per-Bucket Policies)
-- ====================================================================

-- ลบนโยบายเก่าออกก่อนเพื่อป้องกันการซ้ำซ้อน
drop policy if exists "Public buckets viewing access" on storage.objects;
drop policy if exists "Staff insert access for public buckets" on storage.objects;
drop policy if exists "Staff update access for public buckets" on storage.objects;
drop policy if exists "Staff delete access for public buckets" on storage.objects;
drop policy if exists "Staff viewing access for private buckets" on storage.objects;
drop policy if exists "Staff insert access for private buckets" on storage.objects;
drop policy if exists "Staff update access for private buckets" on storage.objects;
drop policy if exists "Staff delete access for private buckets" on storage.objects;
drop policy if exists "Public viewing: property-images" on storage.objects;
drop policy if exists "Staff insert: property-images" on storage.objects;
drop policy if exists "Staff update: property-images" on storage.objects;
drop policy if exists "Staff delete: property-images" on storage.objects;
drop policy if exists "User-assets read access" on storage.objects;
drop policy if exists "User-assets insert access" on storage.objects;
drop policy if exists "User-assets update access" on storage.objects;
drop policy if exists "User-assets delete access" on storage.objects;
drop policy if exists "Public viewing: service-images" on storage.objects;
drop policy if exists "Staff insert: service-images" on storage.objects;
drop policy if exists "Staff update: service-images" on storage.objects;
drop policy if exists "Staff delete: service-images" on storage.objects;
drop policy if exists "Public viewing: avatars" on storage.objects;
drop policy if exists "Staff insert: avatars" on storage.objects;
drop policy if exists "Staff update: avatars" on storage.objects;
drop policy if exists "Staff delete: avatars" on storage.objects;
drop policy if exists "Public viewing: blog-images" on storage.objects;
drop policy if exists "Staff insert: blog-images" on storage.objects;
drop policy if exists "Staff update: blog-images" on storage.objects;
drop policy if exists "Staff delete: blog-images" on storage.objects;
drop policy if exists "Staff viewing: payout-slips" on storage.objects;
drop policy if exists "Staff insert: payout-slips" on storage.objects;
drop policy if exists "Staff update: payout-slips" on storage.objects;
drop policy if exists "Staff delete: payout-slips" on storage.objects;
drop policy if exists "Staff viewing: documents" on storage.objects;
drop policy if exists "Staff insert: documents" on storage.objects;
drop policy if exists "Staff update: documents" on storage.objects;
drop policy if exists "Staff delete: documents" on storage.objects;
drop policy if exists "Staff viewing: co-broker-documents" on storage.objects;
drop policy if exists "Staff insert: co-broker-documents" on storage.objects;
drop policy if exists "Staff update: co-broker-documents" on storage.objects;
drop policy if exists "Staff delete: co-broker-documents" on storage.objects;
drop policy if exists "Staff viewing: finance" on storage.objects;
drop policy if exists "Staff insert: finance" on storage.objects;
drop policy if exists "Staff update: finance" on storage.objects;
drop policy if exists "Staff delete: finance" on storage.objects;

-- --------------------------------------------------------------------
-- 🟢 นโยบายสำหรับ Public Buckets (property-images, user-assets, service-images, avatars, blog-images)
-- --------------------------------------------------------------------

-- [property-images]
create policy "Public viewing: property-images" on storage.objects for select using (bucket_id = 'property-images');

create policy "Staff insert: property-images" on storage.objects for insert to authenticated with check (
  bucket_id = 'property-images' 
  AND (
    public.is_member_of_tenant(split_part(name, '/', 1))
    OR (
      split_part(name, '/', 1) = 'site-assets'
      AND exists (
        select 1 from public.profiles 
        where id = auth.uid() 
        and role in ('ADMIN', 'MANAGER')
      )
    )
  )
);

create policy "Staff update: property-images" on storage.objects for update to authenticated using (
  bucket_id = 'property-images' 
  AND (
    owner = auth.uid()
    OR (
      split_part(name, '/', 1) = 'site-assets'
      AND exists (
        select 1 from public.profiles 
        where id = auth.uid() 
        and role in ('ADMIN', 'MANAGER')
      )
    )
  )
);

create policy "Staff delete: property-images" on storage.objects for delete to authenticated using (
  bucket_id = 'property-images' 
  AND (
    owner = auth.uid()
    OR (
      split_part(name, '/', 1) = 'site-assets'
      AND exists (
        select 1 from public.profiles 
        where id = auth.uid() 
        and role in ('ADMIN', 'MANAGER')
      )
    )
  )
);

-- [user-assets]
create policy "User-assets read access" on storage.objects for select using (
  bucket_id = 'user-assets' AND (
    (storage.foldername(name))[1] = 'user-profiles'
    OR 
    ((storage.foldername(name))[1] = 'user-signatures' AND (storage.foldername(name))[2] = (auth.uid())::text)
  )
);

create policy "User-assets insert access" on storage.objects for insert to authenticated with check (
  bucket_id = 'user-assets' 
  AND array_length(storage.foldername(name), 1) = 2 
  AND (storage.foldername(name))[1] IN ('user-profiles', 'user-signatures') 
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

create policy "User-assets update access" on storage.objects for update to authenticated using (
  bucket_id = 'user-assets' AND (storage.foldername(name))[2] = (auth.uid())::text
);

create policy "User-assets delete access" on storage.objects for delete to authenticated using (
  bucket_id = 'user-assets' AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- [service-images]
create policy "Public viewing: service-images" on storage.objects for select using (bucket_id = 'service-images');
create policy "Staff insert: service-images" on storage.objects for insert to authenticated with check (bucket_id = 'service-images');
create policy "Staff update: service-images" on storage.objects for update to authenticated using (bucket_id = 'service-images' AND owner = auth.uid());
create policy "Staff delete: service-images" on storage.objects for delete to authenticated using (bucket_id = 'service-images' AND owner = auth.uid());

-- [avatars]
create policy "Public viewing: avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "Staff insert: avatars" on storage.objects for insert to authenticated with check (bucket_id = 'avatars');
create policy "Staff update: avatars" on storage.objects for update to authenticated using (bucket_id = 'avatars' AND owner = auth.uid());
create policy "Staff delete: avatars" on storage.objects for delete to authenticated using (bucket_id = 'avatars' AND owner = auth.uid());

-- [blog-images]
create policy "Public viewing: blog-images" on storage.objects for select using (bucket_id = 'blog-images');
create policy "Staff insert: blog-images" on storage.objects for insert to authenticated with check (bucket_id = 'blog-images' AND public.is_member_of_tenant(split_part(name, '/', 1)));
create policy "Staff update: blog-images" on storage.objects for update to authenticated using (bucket_id = 'blog-images' AND owner = auth.uid());
create policy "Staff delete: blog-images" on storage.objects for delete to authenticated using (bucket_id = 'blog-images' AND owner = auth.uid());

-- --------------------------------------------------------------------
-- 🔴 นโยบายสำหรับ Private Buckets (payout-slips, documents, co-broker-documents, finance)
-- --------------------------------------------------------------------

-- [payout-slips]
create policy "Staff viewing: payout-slips" on storage.objects for select to authenticated using (
  bucket_id = 'payout-slips' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff insert: payout-slips" on storage.objects for insert to authenticated with check (
  bucket_id = 'payout-slips' AND (public.is_member_of_tenant(split_part(name, '/', 1)) OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff update: payout-slips" on storage.objects for update to authenticated using (
  bucket_id = 'payout-slips' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff delete: payout-slips" on storage.objects for delete to authenticated using (
  bucket_id = 'payout-slips' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);

-- [documents]
create policy "Staff viewing: documents" on storage.objects for select to authenticated using (
  bucket_id = 'documents' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff insert: documents" on storage.objects for insert to authenticated with check (
  bucket_id = 'documents' AND (public.is_member_of_tenant(split_part(name, '/', 1)) OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff update: documents" on storage.objects for update to authenticated using (
  bucket_id = 'documents' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff delete: documents" on storage.objects for delete to authenticated using (
  bucket_id = 'documents' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);

-- [co-broker-documents]
create policy "Staff viewing: co-broker-documents" on storage.objects for select to authenticated using (
  bucket_id = 'co-broker-documents' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff insert: co-broker-documents" on storage.objects for insert to authenticated with check (
  bucket_id = 'co-broker-documents' AND (public.is_member_of_tenant(split_part(name, '/', 1)) OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff update: co-broker-documents" on storage.objects for update to authenticated using (
  bucket_id = 'co-broker-documents' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff delete: co-broker-documents" on storage.objects for delete to authenticated using (
  bucket_id = 'co-broker-documents' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);

-- [finance]
create policy "Staff viewing: finance" on storage.objects for select to authenticated using (
  bucket_id = 'finance' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff insert: finance" on storage.objects for insert to authenticated with check (
  bucket_id = 'finance' AND (public.is_member_of_tenant(split_part(name, '/', 1)) OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff update: finance" on storage.objects for update to authenticated using (
  bucket_id = 'finance' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
create policy "Staff delete: finance" on storage.objects for delete to authenticated using (
  bucket_id = 'finance' AND (owner = auth.uid() OR public.is_tenant_admin_or_manager(split_part(name, '/', 1)))
);
