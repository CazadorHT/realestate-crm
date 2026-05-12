-- ====================================================================
-- 🔐 Real Estate CRM Database V2 (Phase 8: Final Security Hardening)
-- ====================================================================

-- 1. Move Extensions to 'extensions' schema (Linter 0014)
-- เพื่อความเป็นระเบียบและความปลอดภัยตามมาตรฐาน Supabase
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$ 
BEGIN
    -- NOTE: PostGIS and pg_jsonschema often don't support SET SCHEMA (Non-relocatable)
    -- We will leave them in 'public' but focus on hardening their function access instead.
    
    -- Move Vector (Usually relocatable and needed for our AI functions)
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        ALTER EXTENSION vector SET SCHEMA extensions;
    END IF;
END $$;

-- 2. Hardening PostGIS Functions (Linter 0028/0029)
-- ฟังก์ชันเหล่านี้มักจะถูกตั้งค่าให้ PUBLIC รันได้ซึ่งเป็นช่องโหว่
-- เราจะทำการ REVOKE สิทธิ์จาก anon และ authenticated
DO $$ 
DECLARE 
    func_id TEXT;
BEGIN
    FOR func_id IN 
        SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid))
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' 
        AND p.proname = 'st_estimatedextent'
    LOOP
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || func_id || ' FROM PUBLIC';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || func_id || ' FROM anon';
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || func_id || ' FROM authenticated';
    END LOOP;
END $$;

-- 3. Final Search Path Verification
-- ตรวจสอบให้มั่นใจว่า Search Path ของฐานข้อมูลครอบคลุม extensions
ALTER DATABASE postgres SET search_path TO public, extensions;
