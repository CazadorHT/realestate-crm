-- ==========================================================
-- INTERNAL SCHEMA MIGRATION (THE FINAL MOVE)
-- ==========================================================

-- 1. CREATE INTERNAL SCHEMA (Hidden from REST API)
CREATE SCHEMA IF NOT EXISTS internal;

-- 2. DYNAMICALLY MOVE SENSITIVE FUNCTIONS TO INTERNAL SCHEMA
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
          AND p.proname IN ('handle_new_user', 'log_ai_usage', 'log_system_activity')
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SET SCHEMA internal', 
                          func_record.schema_name, func_record.func_name, func_record.args);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Notice: Could not move %: %', func_record.func_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 3. UPDATE AUTH TRIGGER TO POINT TO NEW INTERNAL SCHEMA
-- We drop and re-create the trigger to use the new function path
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION internal.handle_new_user();

-- 4. FINAL REVOKE ON INTERNAL SCHEMA
-- Ensure only service_role and triggers can access internal schema
REVOKE ALL ON SCHEMA internal FROM public, anon, authenticated;
GRANT USAGE ON SCHEMA internal TO service_role;
GRANT USAGE ON SCHEMA internal TO postgres;

-- 5. RE-ENFORCE SEARCH PATH FOR MOVED FUNCTIONS
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
        WHERE n.nspname = 'internal'
    LOOP
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions, internal, pg_temp', 
                      func_record.schema_name, func_record.func_name, func_record.args);
    END LOOP;
END $$;
