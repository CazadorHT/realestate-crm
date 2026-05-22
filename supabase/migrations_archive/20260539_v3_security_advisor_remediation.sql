BEGIN;

-- ====================================================================
-- 🛡️ 1. แก้ไข RLS Disabled in Public (LEVEL: ERROR)
-- ====================================================================


-- 1.2 เปิดใช้งาน RLS บน property_agents
ALTER TABLE public.property_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read property_agents" ON public.property_agents;
CREATE POLICY "Public read property_agents" ON public.property_agents FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff write property_agents" ON public.property_agents;
CREATE POLICY "Staff write property_agents" ON public.property_agents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 1.3 เปิดใช้งาน RLS บน property_features
ALTER TABLE public.property_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read property_features" ON public.property_features;
CREATE POLICY "Public read property_features" ON public.property_features FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff write property_features" ON public.property_features;
CREATE POLICY "Staff write property_features" ON public.property_features FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- แนะนำในอนาคต: ควร JOIN เช็คผ่าน properties_core ว่าพนักงานคนนั้นอยู่ tenant เดียวกันจริงหรือไม่


-- ====================================================================
-- 📦 2. แก้ไข Extension in Public (LEVEL: WARN)
-- ====================================================================
-- สร้างสคีมา extensions (เผื่อไว้สำหรับ Extension ใหม่ในอนาคต)
CREATE SCHEMA IF NOT EXISTS extensions;
-- หมายเหตุ: Extension เดิมในระบบ (pg_jsonschema, pg_trgm, postgis) มีการผูก Type เข้ากับตารางหลักไปแล้วและตั้งค่า relocatable = false 
-- จึงไม่สามารถย้ายสคีมาผ่าน ALTER EXTENSION ได้ (เป็นข้อจำกัดปกติของ Supabase Cloud ที่สามารถกด Ignore Linter Warning ได้อย่างปลอดภัยครับ)
-- ALTER EXTENSION pg_jsonschema SET SCHEMA extensions;
-- ALTER EXTENSION pg_trgm SET SCHEMA extensions;
-- ALTER EXTENSION postgis SET SCHEMA extensions;


-- ====================================================================
-- ⚡ 3. แก้ไข Function Search Path Mutable (LEVEL: WARN)
-- ====================================================================
-- กำหนด search_path พ่วง extensions เสมอ สำหรับฟังก์ชันที่มีการใช้พิกัด แผนที่ หรือการคำนวณข้อความ

ALTER FUNCTION public.log_system_activity(text, text, text, uuid, jsonb) SET search_path = public, extensions;
ALTER FUNCTION public.handle_new_user() SET search_path = public, extensions;
ALTER FUNCTION public.trig_owners_view_dml() SET search_path = public, extensions;
ALTER FUNCTION public.bulk_delete_deals_atomic(uuid[], uuid) SET search_path = public, extensions;
ALTER FUNCTION public.increment_service_view(uuid, uuid, text, text) SET search_path = public, extensions;
ALTER FUNCTION public.is_tenant_admin_or_manager(text) SET search_path = public, extensions;
ALTER FUNCTION public.is_member_of_tenant(text) SET search_path = public, extensions;
ALTER FUNCTION public.v3_approve_identity(uuid, text, uuid) SET search_path = public, extensions;


-- ====================================================================
-- 🔒 4. แก้ไข Public Bucket Allows Listing (LEVEL: WARN)
-- ====================================================================
DROP POLICY IF EXISTS "V3 Public Read: Property Images" ON storage.objects;


-- ====================================================================
-- 🚫 5. แก้ไข Anon Can Execute SECURITY DEFINER Functions (LEVEL: WARN)
-- ====================================================================
-- เพิกถอนสิทธิ์จาก PUBLIC และ anon เพื่อไม่ให้ผู้ใช้ทั่วไปสืบทอดสิทธิ์ผ่าน PUBLIC ได้ 
-- และให้สิทธิ์เฉพาะผู้ใช้ที่ล็อกอิน (authenticated) และ service_role เท่านั้น
-- (เว้น increment_service_view ไว้ให้คนไม่ล็อกอินนับยอดวิวได้)

REVOKE EXECUTE ON FUNCTION public.accept_tenant_invitation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_tenant_invitation(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.bulk_delete_deals_atomic(uuid[], uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bulk_delete_deals_atomic(uuid[], uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.decline_tenant_invitation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_tenant_invitation(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_properties_without_notification_rules_v3(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_properties_without_notification_rules_v3(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_tenants() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_tenants() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_member_of_tenant(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member_of_tenant(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_system_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_tenant_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_tenant_admin_or_manager(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin_or_manager(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_tenant_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_staff(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.log_system_activity(text, text, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_system_activity(text, text, text, uuid, jsonb) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.swap_property_stock_atomic(uuid, uuid, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.swap_property_stock_atomic(uuid, uuid, text, text, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.sync_property_inventory_atomic(uuid, integer, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_property_inventory_atomic(uuid, integer, text, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.transfer_tenant_member(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_tenant_member(uuid, uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.trig_owners_view_dml() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.trig_owners_view_dml() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.v3_approve_identity(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.v3_approve_identity(uuid, text, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.match_properties_v3(extensions.vector, double precision, integer, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_properties_v3(extensions.vector, double precision, integer, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM PUBLIC, anon;


-- ====================================================================
-- 🧹 6. แก้ไข Duplicate Index (LEVEL: WARN)
-- ====================================================================
-- ลบ Index ที่ซ้ำซ้อนออก เพื่อประหยัดพื้นที่จัดเก็บและเพิ่มความเร็วในการ INSERT/UPDATE

DROP INDEX IF EXISTS public.idx_cms_v3_type;
DROP INDEX IF EXISTS public.idx_cms_v3_tenant;
DROP INDEX IF EXISTS public.idx_v3_deals_tenant_status;
DROP INDEX IF EXISTS public.idx_properties_details_popular_area;


-- รีโหลดสคีมาแคช
NOTIFY pgrst, 'reload schema';

COMMIT;

