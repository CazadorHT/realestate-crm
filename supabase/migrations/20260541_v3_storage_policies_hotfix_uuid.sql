BEGIN;

-- ====================================================================
-- 🛡️ V3 Storage Policies & Authz Helper Hotfix (Zero-Trust + UUID Safe)
-- ====================================================================

-- 1. สร้างฟังก์ชันเช็ค UUID ที่ปลอดภัย (ป้องกัน DB Crash)
CREATE OR REPLACE FUNCTION public.is_valid_uuid(uuid_to_test text) 
RETURNS boolean AS $$
BEGIN
  RETURN uuid_to_test ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Helper สำหรับเช็ค Manager/Admin (UUID Safe)
CREATE OR REPLACE FUNCTION public.is_tenant_admin_or_manager(tenant_id_param text)
RETURNS boolean AS $$
DECLARE
  user_role text;
  has_access boolean;
-- Use Markdown formatting for tables, lists, and headings instead of standard LaTeX layout unless you are displaying complex math equations.
BEGIN
  IF NOT public.is_valid_uuid(tenant_id_param) THEN RETURN false; END IF;

  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  IF user_role = 'ADMIN' THEN RETURN true; END IF;

  SELECT true INTO has_access 
  FROM public.tenant_members_v3 
  WHERE identity_id = auth.uid() 
    AND tenant_id = tenant_id_param::uuid 
    AND role IN ('OWNER', 'MANAGER')
  LIMIT 1;
  RETURN coalesce(has_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

REVOKE EXECUTE ON FUNCTION public.is_tenant_admin_or_manager(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin_or_manager(text) TO authenticated, service_role;

-- 3. Helper สำหรับเช็คพนักงานในสาขา (UUID Safe)
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
  RETURN coalesce(is_member, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

REVOKE EXECUTE ON FUNCTION public.is_member_of_tenant(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member_of_tenant(text) TO authenticated, service_role;

-- 4. แก้ไข Policy ของ property-images ระดับ Zero-Trust (Tenant + Role Lockdown)
DROP POLICY IF EXISTS "Staff insert: property-images" ON storage.objects;
CREATE POLICY "Staff insert: property-images" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'property-images' 
  AND owner = auth.uid() 
  -- 🛡️ V3 Multi-Tenant Structure: บังคับ Folder ชั้นแรกต้องเป็น Valid UUID และเป็นสาขาที่ตัวเองสังกัดอยู่จริง
  AND public.is_valid_uuid(split_part(name, '/', 1)) 
  AND (
    public.is_member_of_tenant(split_part(name, '/', 1))
    OR public.is_tenant_admin_or_manager(split_part(name, '/', 1))
  )
  -- 🔒 บังคับสิทธิ์การทำงาน: ต้องมีตำแหน่งที่ได้รับอนุญาตในระบบ
  AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) IN ('ADMIN', 'OWNER', 'MANAGER', 'AGENT')
);

COMMIT;