-- ====================================================================
-- 📦 1. สร้างและอัปเดต Storage Buckets (Idempotent Setup)
-- ====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images', 
  'property-images', 
  true, 
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'user-assets', 
  'user-assets', 
  true, 
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'service-images', 
  'service-images', 
  true, 
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
) on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payout-slips', 
  'payout-slips', 
  false, -- Private Bucket
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
) on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 
  'documents', 
  false, -- Private Bucket
  20971520, -- 20MB
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
) on conflict (id) do update set public = false;


-- ====================================================================
-- 🛡️ 2. สร้าง Helper Functions สำหรับ Multi-Tenant Isolation
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
$$ language plpgsql security definer;

-- 2.2 ตรวจสอบสิทธิ์พนักงานในสาขา (ใช้ตอน INSERT เพื่อป้องกัน Path Spoofing)
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
$$ language plpgsql security definer;


-- ====================================================================
-- 🔒 3. นโยบายความปลอดภัย RLS (Storage Security Policies - Ultimate Hardened)
-- ====================================================================
-- หมายเหตุ: Supabase เปิดใช้งาน RLS บน storage.objects เป็นค่าเริ่มต้นอยู่แล้ว 
-- ไม่จำเป็นต้องใช้คำสั่ง alter table storage.objects enable row level security; (ป้องกัน Error 42501)

-- ลบนโยบายเก่าออกก่อน (ป้องกัน Error กรณีรันซ้ำ)
drop policy if exists "Public buckets viewing access" on storage.objects;
drop policy if exists "Staff insert access for public buckets" on storage.objects;
drop policy if exists "Staff update access for public buckets" on storage.objects;
drop policy if exists "Staff delete access for public buckets" on storage.objects;

drop policy if exists "Staff viewing access for private buckets" on storage.objects;
drop policy if exists "Staff insert access for private buckets" on storage.objects;
drop policy if exists "Staff update access for private buckets" on storage.objects;
drop policy if exists "Staff delete access for private buckets" on storage.objects;

-- --------------------------------------------------------------------
-- 🟢 นโยบายสำหรับ Public Buckets
-- --------------------------------------------------------------------

-- 1. ทุกคน (รวมถึงคนไม่ล็อกอิน) สามารถ "ดู" รูปสาธารณะได้
create policy "Public buckets viewing access" on storage.objects
  for select using (bucket_id in ('property-images', 'user-assets', 'service-images'));

-- 2. พนักงานที่ล็อกอินสามารถ "อัปโหลด" ได้
create policy "Staff insert access for public buckets" on storage.objects
  for insert to authenticated with check (bucket_id in ('property-images', 'user-assets', 'service-images'));

-- 3. พนักงานสามารถ "แก้ไข" ได้ **เฉพาะไฟล์ที่ตัวเองเป็นคนอัปโหลดเท่านั้น**
create policy "Staff update access for public buckets" on storage.objects
  for update to authenticated using (
    bucket_id in ('property-images', 'user-assets', 'service-images') 
    AND owner = auth.uid()
  );

-- 4. พนักงานสามารถ "ลบ" ได้ **เฉพาะไฟล์ที่ตัวเองเป็นคนอัปโหลดเท่านั้น**
create policy "Staff delete access for public buckets" on storage.objects
  for delete to authenticated using (
    bucket_id in ('property-images', 'user-assets', 'service-images') 
    AND owner = auth.uid()
  );

-- --------------------------------------------------------------------
-- 🔴 นโยบายสำหรับ Private Buckets (payout-slips, documents)
-- --------------------------------------------------------------------

-- 1. พนักงานสามารถ "ดู" ได้เฉพาะไฟล์ของตัวเอง หรือเป็นผู้ดูแล/เจ้าของสาขานั้นๆ
create policy "Staff viewing access for private buckets" on storage.objects
  for select to authenticated using (
    bucket_id in ('payout-slips', 'documents') 
    AND (
      owner = auth.uid() OR 
      public.is_tenant_admin_or_manager(split_part(name, '/', 1))
    )
  );

-- 2. พนักงานสามารถ "อัปโหลด" ได้เฉพาะลงใน Folder ชั้นแรกที่เป็น Tenant ID ของตัวเองเท่านั้น (ป้องกัน Path Spoofing)
create policy "Staff insert access for private buckets" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('payout-slips', 'documents')
    AND (
      public.is_member_of_tenant(split_part(name, '/', 1))
      OR public.is_tenant_admin_or_manager(split_part(name, '/', 1))
    )
  );

-- 3. พนักงานสามารถ "แก้ไข" เฉพาะไฟล์ของตัวเอง
create policy "Staff update access for private buckets" on storage.objects
  for update to authenticated using (
    bucket_id in ('payout-slips', 'documents') 
    AND owner = auth.uid()
  );

-- 4. พนักงานสามารถ "ลบ" เฉพาะไฟล์ของตัวเอง
create policy "Staff delete access for private buckets" on storage.objects
  for delete to authenticated using (
    bucket_id in ('payout-slips', 'documents') 
    AND owner = auth.uid()
  );

-- ====================================================================
-- ⚡ 4. ตรวจสอบและสร้าง Index เพิ่มประสิทธิภาพ (Performance Gate)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_tenant_members_v3_security_gate 
ON public.tenant_members_v3 (identity_id, tenant_id, role);
