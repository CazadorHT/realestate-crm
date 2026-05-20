BEGIN;

-- 1. สร้างฟังก์ชันเช็ค UUID ที่ปลอดภัย (ถ้ายังไม่มี)
CREATE OR REPLACE FUNCTION public.is_valid_uuid(uuid_to_test text) 
RETURNS boolean AS $$
BEGIN
  RETURN uuid_to_test ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. ปรับปรุง Helper สำหรับเช็ค Manager/Admin (ย้ายไปตรวจสอบบน identities_v3 ป้องกัน View Bridge Lockout)
CREATE OR REPLACE FUNCTION public.is_tenant_admin_or_manager(tenant_id_param text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  has_access boolean;
BEGIN
  IF NOT public.is_valid_uuid(tenant_id_param) THEN RETURN false; END IF;

  -- ดึงบทบาทจากตารางหลัก identities_v3 ที่มี id เป็น Unique (ป้องกัน Cardinality Crash)
  SELECT role INTO user_role FROM public.identities_v3 WHERE id = auth.uid();
  
  -- แอดมินสูงสุดผ่านตลอด (ตรวจสอบทั้ง JWT claims และตาราง identities_v3 เพื่อความมั่นใจ)
  IF user_role = 'ADMIN' OR COALESCE((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')), '') = 'ADMIN' THEN 
    RETURN true; 
  END IF;

  -- ตรวจสอบสิทธิ์ระดับสาขาใน tenant_members_v3
  SELECT true INTO has_access 
  FROM public.tenant_members_v3 
  WHERE identity_id = auth.uid() 
    AND tenant_id = tenant_id_param::uuid 
    AND role IN ('OWNER', 'MANAGER')
  LIMIT 1;
  
  RETURN COALESCE(has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

REVOKE EXECUTE ON FUNCTION public.is_tenant_admin_or_manager(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin_or_manager(text) TO authenticated, service_role;

-- 3. ปรับปรุง Helper สำหรับเช็คพนักงานในสาขา (ย้ายไปตรวจสอบบน identities_v3)
CREATE OR REPLACE FUNCTION public.is_member_of_tenant(tenant_id_param text)
RETURNS boolean AS $$
DECLARE
  is_member boolean;
BEGIN
  IF NOT public.is_valid_uuid(tenant_id_param) THEN RETURN false; END IF;

  SELECT true INTO is_member 
  FROM public.tenant_members_v3 
  WHERE identity_id = auth.uid() 
    AND tenant_id = tenant_id_param::uuid 
  LIMIT 1;
  
  RETURN COALESCE(is_member, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

REVOKE EXECUTE ON FUNCTION public.is_member_of_tenant(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member_of_tenant(text) TO authenticated, service_role;

-- 4. ปรับปรุง Policy ของ property-images: Zero-Trust + ป้องกันการ Crash + รองรับ Local Role
DROP POLICY IF EXISTS "Staff insert: property-images" ON storage.objects;
CREATE POLICY "Staff insert: property-images" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'property-images' 
  AND owner = auth.uid() 
  -- 🛡️ V3 Multi-Tenant Structure: บังคับ Folder ชั้นแรกต้องเป็น Valid UUID และตรวจสอบสิทธิ์สาขา
  AND public.is_valid_uuid(split_part(name, '/', 1)) 
  AND (
    -- 👑 1. เป็น Global Admin (ผ่าน JWT หรือ identities_v3)
    COALESCE((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')), '') = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.identities_v3 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
    -- 🏢 2. หรือเป็น Staff ที่มีบทบาทได้รับอนุญาตในสาขานั้นโดยตรง (OWNER, MANAGER, AGENT)
    -- วิธีนี้ทำให้ผู้ใช้มีบทบาทใดก็ได้ (รวมถึง USER ทั่วไป) สามารถทำงานได้หากได้รับอนุญาตเป็นระดับ Staff ในสาขานั้นๆ
    OR EXISTS (
      SELECT 1 FROM public.tenant_members_v3 
      WHERE identity_id = auth.uid() 
        AND tenant_id = (split_part(name, '/', 1))::uuid 
        AND role IN ('OWNER', 'MANAGER', 'AGENT')
    )
  )
);

COMMIT;
