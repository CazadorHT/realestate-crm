-- ====================================================================
-- 🧹 V3 Ultimate Enterprise Architecture (Phase 0: The Great Purge)
-- ====================================================================
-- คำเตือน: สคริปต์นี้จะลบ (DROP) ทุกตาราง, Views, Functions, และ Enums 
-- ใน public schema ทิ้งทั้งหมด เพื่อให้เป็น Greenfield ที่สะอาดบริสุทธิ์จริงๆ 
-- โดยไม่กระทบกับระบบหลังบ้านของ Supabase (เช่น auth, storage) และ Extensions (เช่น postgis)

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- 1. DROP ALL VIEWS
    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public' AND table_name NOT IN ('geography_columns', 'geometry_columns')) 
    LOOP
        BEGIN
            EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            -- Ignore views that belong to extensions
        END;
    END LOOP;

    -- 2. DROP ALL TABLES (ยกเว้น spatial_ref_sys ที่เป็นของ PostGIS)
    FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name != 'spatial_ref_sys') 
    LOOP
        BEGIN
            EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            -- Ignore tables that belong to extensions
        END;
    END LOOP;

    -- 3. DROP ALL FUNCTIONS (รวมถึง Triggers และ RPCs เดิม)
    FOR r IN (
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    ) 
    LOOP
        -- ข้ามฟังก์ชันของ PostGIS และ Extensions อื่นๆ
        IF r.proname NOT LIKE 'st_%' AND r.proname NOT LIKE 'geometry%' AND r.proname NOT LIKE 'geography%' AND r.proname NOT LIKE 'h3_%' THEN
            BEGIN
                EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
            EXCEPTION WHEN OTHERS THEN
                -- ดักจับ Error กรณีที่เป็น Function ของ System
            END;
        END IF;
    END LOOP;

    -- 4. DROP ALL CUSTOM ENUMS (Types)
    FOR r IN (
        SELECT t.typname
        FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE n.nspname = 'public' AND t.typtype = 'e'
    ) 
    LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;

END $$;
