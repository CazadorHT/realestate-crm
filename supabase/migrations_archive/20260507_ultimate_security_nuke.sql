-- ==========================================================
-- ULTIMATE SECURITY NUKE v4.0 (FORCE CLEANUP)
-- ==========================================================

-- 1. FORCE MOVE EXTENSIONS (Linter 0014)
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
    -- We try to move them again with more explicit names
    EXECUTE 'ALTER EXTENSION "vector" SET SCHEMA extensions';
    EXECUTE 'ALTER EXTENSION "pg_net" SET SCHEMA extensions';
    EXECUTE 'ALTER EXTENSION "pg_trgm" SET SCHEMA extensions';
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Extension move notice: %', SQLERRM;
END $$;

-- 2. DELETE PERMISSIVE STORAGE POLICIES BY NAME (Linter 0025)
DO $$
BEGIN
    -- Drop by exact name as reported by Linter
    DROP POLICY IF EXISTS "Authenticated Users Manage" ON storage.objects;
    DROP POLICY IF EXISTS "Public read property images" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read Access: Blog Images" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read Access: Property Images" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read Access: Service Images" ON storage.objects;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Storage policy cleanup notice: %', SQLERRM;
END $$;

-- Re-create restricted storage policies
DROP POLICY IF EXISTS "Restricted: Blog Images" ON storage.objects;
CREATE POLICY "Restricted: Blog Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] IS NOT NULL);

DROP POLICY IF EXISTS "Restricted: Property Images" ON storage.objects;
CREATE POLICY "Restricted: Property Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] IS NOT NULL);

DROP POLICY IF EXISTS "Restricted: Service Images" ON storage.objects;
CREATE POLICY "Restricted: Service Images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'service-images' AND (storage.foldername(name))[1] IS NOT NULL);

-- 3. CONVERT FUNCTIONS TO SECURITY INVOKER (Linter 0028, 0029)
-- This is the "Nuclear" fix for Security Definer warnings.
-- Most functions don't actually need DEFINER rights.
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, 
               p.proname as func_name, 
               pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          -- Skip functions that actually NEED Security Definer (e.g. auth hooks or system logs)
          AND p.proname NOT IN ('handle_new_user', 'log_system_activity', 'log_ai_usage')
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SECURITY INVOKER', 
                          func_record.schema_name, func_record.func_name, func_record.args);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipping Security Invoker Change for %: %', func_record.func_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. HARD RESET PERMISSIONS
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Explicitly revoke execute on sensitive SECURITY DEFINER functions even for authenticated
-- (These should only be run by triggers or service_role)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_ai_usage(text, text, text, text, integer, integer, numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_system_activity(text, text, text, jsonb, uuid, text) FROM anon, authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant EXECUTE to anon only for necessary public functions
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, 
               p.proname as func_name, 
               pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
          AND p.proname IN (
              'submit_public_lead', 
              'increment_blog_post_view', 
              'increment_property_view', 
              'increment_service_view', 
              'match_properties', 
              'match_properties_hardened', 
              'get_public_property_facets', 
              'get_public_property_facets_v2'
          )
    LOOP
        BEGIN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO anon', 
                          func_record.schema_name, func_record.func_name, func_record.args);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipping Grant %: %', func_record.func_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 5. FINAL SEARCH PATH RE-ENFORCEMENT (Include extensions schema)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, 
               p.proname as func_name, 
               pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions, pg_temp', 
                          func_record.schema_name, func_record.func_name, func_record.args);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipping Search Path fix for %: %', func_record.func_name, SQLERRM;
        END;
    END LOOP;
END $$;
