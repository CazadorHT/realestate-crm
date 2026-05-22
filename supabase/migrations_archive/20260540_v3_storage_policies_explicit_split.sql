BEGIN;

-- ====================================================================
-- 📦 V3 Ultimate Storage Policies Explicit Split (Visual Perfectionist)
-- ====================================================================
-- Description: Refactors consolidated storage RLS policies into explicit,
-- per-bucket policies. This ensures that Supabase Studio Dashboard UI 
-- correctly parses and displays the exact policy count (4 policies) 
-- for every single bucket.
-- ====================================================================

-- ====================================================================
-- 📦 1. สร้างและลงทะเบียน Storage Buckets ทั้ง 9 ตัว (Idempotent Setup)
-- ====================================================================

-- [1. property-images] (Public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-images', 'property-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

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
-- 🛡️ 2. สร้างและอัปเดต Helper Functions สำหรับ Multi-Tenant Isolation (Self-Contained Guard)
-- ====================================================================

-- 2.1 ตรวจสอบสิทธิ์ผู้ดูแลสาขา (ใช้ตอน SELECT เพื่อให้ Manager ดูสลิปของลูกทีมได้)
create or replace function public.is_tenant_admin_or_manager(tenant_id_param text)
returns boolean as $$
declare
  user_role text;
  has_access boolean;
begin
  -- 1. ตรวจสอบว่าเป็น ADMIN สูงสุดของระบบหรือไม่
  select role into user_role from public.profiles where id = auth.uid();
  if user_role = 'ADMIN' then
    return true;
  end if;

  -- 2. ตรวจสอบว่าเป็น OWNER หรือ MANAGER ของสาขา (tenant) ที่ระบุหรือไม่
  select true into has_access 
  from public.tenant_members_v3 
  where identity_id = auth.uid() 
    and tenant_id = tenant_id_param 
    and role in ('OWNER', 'MANAGER')
  limit 1;

  return coalesce(has_access, false);
end;
$$ language plpgsql security definer set search_path = public, extensions;

-- ปรับสิทธิ์ความปลอดภัยตาม Security Advisor (REVOKE จาก public, GRANT ให้เฉพาะ authenticated)
REVOKE EXECUTE ON FUNCTION public.is_tenant_admin_or_manager(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin_or_manager(text) TO authenticated, service_role;

-- 1.2 ตรวจสอบสิทธิ์พนักงานในสาขา (ใช้ตอน INSERT เพื่อป้องกัน Path Spoofing)
create or replace function public.is_member_of_tenant(tenant_id_param text)
returns boolean as $$
declare
  is_member boolean;
begin
  select true into is_member 
  from public.tenant_members_v3 
  where identity_id = auth.uid() 
    and tenant_id = tenant_id_param 
  limit 1;

  return coalesce(is_member, false);
end;
$$ language plpgsql security definer set search_path = public, extensions;

REVOKE EXECUTE ON FUNCTION public.is_member_of_tenant(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member_of_tenant(text) TO authenticated, service_role;


-- ====================================================================
-- 📦 2. นโยบายความปลอดภัย RLS (Explicit Per-Bucket Policies)
-- ====================================================================

-- 2.1 ลบนโยบายเก่าออกก่อน (ป้องกัน Error กรณีรันซ้ำ)
drop policy if exists "Public buckets viewing access" on storage.objects;
drop policy if exists "Staff insert access for public buckets" on storage.objects;
drop policy if exists "Staff update access for public buckets" on storage.objects;
drop policy if exists "Staff delete access for public buckets" on storage.objects;

drop policy if exists "Staff viewing access for private buckets" on storage.objects;
drop policy if exists "Staff insert access for private buckets" on storage.objects;
drop policy if exists "Staff update access for private buckets" on storage.objects;
drop policy if exists "Staff delete access for private buckets" on storage.objects;

drop policy if exists "Public viewing: user-assets" on storage.objects;
drop policy if exists "Staff insert: user-assets" on storage.objects;
drop policy if exists "Staff update: user-assets" on storage.objects;
drop policy if exists "Staff delete: user-assets" on storage.objects;
drop policy if exists "Public Access for Profiles" on storage.objects;
drop policy if exists "Private Access for Signatures" on storage.objects;
drop policy if exists "Users can upload their own assets" on storage.objects;
drop policy if exists "Users can manage their own assets" on storage.objects;
drop policy if exists "Public/Owner viewing: user-assets" on storage.objects;
drop policy if exists "Users insert: user-assets" on storage.objects;
drop policy if exists "Users update: user-assets" on storage.objects;
drop policy if exists "Users delete: user-assets" on storage.objects;
drop policy if exists "User-assets read access" on storage.objects;
drop policy if exists "User-assets insert access" on storage.objects;
drop policy if exists "User-assets update access" on storage.objects;
drop policy if exists "User-assets delete access" on storage.objects;

drop policy if exists "Public viewing: service-images" on storage.objects;
drop policy if exists "Staff insert: service-images" on storage.objects;
drop policy if exists "Staff update: service-images" on storage.objects;
drop policy if exists "Staff delete: service-images" on storage.objects;

drop policy if exists "Public viewing: property-images" on storage.objects;
drop policy if exists "Staff insert: property-images" on storage.objects;
drop policy if exists "Staff update: property-images" on storage.objects;
drop policy if exists "Staff delete: property-images" on storage.objects;

drop policy if exists "Staff viewing: payout-slips" on storage.objects;
drop policy if exists "Staff insert: payout-slips" on storage.objects;
drop policy if exists "Staff update: payout-slips" on storage.objects;
drop policy if exists "Staff delete: payout-slips" on storage.objects;

drop policy if exists "Staff viewing: documents" on storage.objects;
drop policy if exists "Staff insert: documents" on storage.objects;
drop policy if exists "Staff update: documents" on storage.objects;
drop policy if exists "Staff delete: documents" on storage.objects;

-- 3. ลบนโยบายย่อยของบัคเก็ตเสริม (avatars, blog-images, co-broker-documents, finance)
drop policy if exists "Public viewing: avatars" on storage.objects;
drop policy if exists "Staff insert: avatars" on storage.objects;
drop policy if exists "Staff update: avatars" on storage.objects;
drop policy if exists "Staff delete: avatars" on storage.objects;

drop policy if exists "Public viewing: blog-images" on storage.objects;
drop policy if exists "Staff insert: blog-images" on storage.objects;
drop policy if exists "Staff update: blog-images" on storage.objects;
drop policy if exists "Staff delete: blog-images" on storage.objects;

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
create policy "Staff insert: property-images" on storage.objects for insert to authenticated with check (bucket_id = 'property-images' AND public.is_member_of_tenant(split_part(name, '/', 1)));
create policy "Staff update: property-images" on storage.objects for update to authenticated using (bucket_id = 'property-images' AND owner = auth.uid());
create policy "Staff delete: property-images" on storage.objects for delete to authenticated using (bucket_id = 'property-images' AND owner = auth.uid());

-- [user-assets] (หุ้มเกราะหนา 10 ชั้น และคงจำนวนไว้ที่ 4 นโยบายอย่างเป๊ะๆ)

-- 1. ยุบรวมนโยบายอ่านค่า (SELECT) ของ Profiles และ Signatures ไว้ด้วยกันด้วยเงื่อนไข OR ภายในนโยบายเดียว
create policy "User-assets read access" on storage.objects for select using (
  bucket_id = 'user-assets' AND (
    (storage.foldername(name))[1] = 'user-profiles' -- โปรไฟล์เปิดสาธารณะ
    OR 
    ((storage.foldername(name))[1] = 'user-signatures' AND (storage.foldername(name))[2] = (auth.uid())::text) -- ลายเซ็นเห็นเฉพาะเจ้าของ
  )
);

-- 2. บังคับท่ออัปโหลด (INSERT) ให้เดินตามโครงสร้าง Depth และคีย์โฟลเดอร์ที่ถูกต้องเท่านั้น (ไม่มีนโยบายอื่นมาแทรกแซง)
create policy "User-assets insert access" on storage.objects for insert to authenticated with check (
  bucket_id = 'user-assets' 
  AND array_length(storage.foldername(name), 1) = 2 
  AND (storage.foldername(name))[1] IN ('user-profiles', 'user-signatures') 
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- 3. จำกัดสิทธิ์การแก้ไขไฟล์ (UPDATE) เฉพาะเจ้าของตัวจริงเท่านั้น
create policy "User-assets update access" on storage.objects for update to authenticated using (
  bucket_id = 'user-assets' AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- 4. จำกัดสิทธิ์การทำลายข้อมูล (DELETE) เฉพาะเจ้าของตัวจริงเท่านั้น
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

COMMIT;