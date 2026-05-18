-- ====================================================================
-- 🔒 V3 Ultimate Enterprise Architecture (Phase 10: RLS Lockdown)
-- ====================================================================
-- สคริปต์นี้จะทำหน้าที่ไล่เปิด Row Level Security (RLS) ให้กับทุกตารางใน V3
-- เพื่อกำจัด Warning 'rls_disabled_in_public' ของ Supabase Linter แบบถอนรากถอนโคน

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- ไล่เปิด RLS ให้ทุกตารางใน public schema ยกเว้นของ PostGIS
    FOR r IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE' 
          AND table_name != 'spatial_ref_sys'
    ) 
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' ENABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- (Optional) ตัวอย่างการสร้าง Policy พื้นฐานระดับ Tenant-Isolation เพื่อใช้ในอนาคต (และผ่าน Linter)
DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.properties_core;
CREATE POLICY "Tenant Isolation Policy" ON public.properties_core
    AS RESTRICTIVE
    USING (tenant_id = ((SELECT auth.jwt())->>'tenant_id')::uuid);
