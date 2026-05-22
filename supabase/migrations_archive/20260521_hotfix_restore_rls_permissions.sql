-- 💎 Diamond Grade Hotfix: Absolute System Recovery
-- Target: Fix 'permission denied' for get_user_tenants and restore data visibility

-- 1. ล้างสิทธิ์และมอบสิทธิ์ใหม่ให้กับฟังก์ชันแกนหลัก (Core RLS Helpers)
-- เราจะทำทั้งใน public และ internal (ถ้ามี)
DO $$ 
DECLARE
    s TEXT;
BEGIN
    FOR s IN SELECT nspname FROM pg_namespace WHERE nspname IN ('public', 'internal') LOOP
        -- มอบสิทธิ์การใช้งาน Schema ให้ชัดเจน
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon, authenticated, service_role', s);
        
        -- มอบสิทธิ์ Execute ให้ฟังก์ชันสำคัญๆ
        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = s AND p.proname = 'get_user_tenants') THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.get_user_tenants() TO anon, authenticated, service_role', s);
            EXECUTE format('ALTER FUNCTION %I.get_user_tenants() SECURITY DEFINER', s);
            EXECUTE format('ALTER FUNCTION %I.get_user_tenants() SET search_path = public', s);
        END IF;

        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = s AND p.proname = 'is_tenant_member') THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.is_tenant_member(uuid) TO anon, authenticated, service_role', s);
            EXECUTE format('ALTER FUNCTION %I.is_tenant_member(uuid) SECURITY DEFINER', s);
        END IF;

        IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = s AND p.proname = 'get_popular_areas_with_counts') THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.get_popular_areas_with_counts(uuid) TO anon, authenticated, service_role', s);
            EXECUTE format('ALTER FUNCTION %I.get_popular_areas_with_counts(uuid) SECURITY DEFINER', s);
        END IF;
    END LOOP;
END $$;

-- 2. ตั้งค่า Search Path ให้กับ Role ต่างๆ โดยตรง (ป้องกันการหาฟังก์ชันไม่เจอ)
ALTER ROLE anon SET search_path = public, extensions;
ALTER ROLE authenticated SET search_path = public, extensions;

-- 3. การันตีสิทธิ์การอ่านตารางพื้นฐานสำหรับ Public Search
GRANT SELECT ON public.tenants TO anon, authenticated;
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT SELECT ON public.popular_areas TO anon, authenticated;
GRANT SELECT ON public.property_images TO anon, authenticated;
