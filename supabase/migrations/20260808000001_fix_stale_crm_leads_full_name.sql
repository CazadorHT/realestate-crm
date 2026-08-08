-- Migration: Fix stale database functions referencing crm_leads_v3.full_name
-- Fixes: "column crm_leads_v3.full_name does not exist" (error 42703)
-- Date: 2026-08-08
--
-- The crm_leads_v3 table does NOT have a full_name column.
-- Name data lives in identities_v3.display_name (linked via identity_id FK).
-- This error comes from stale functions that were created before the v3 schema migration.

-- 1. Drop any stale functions from the pre-v3 era that reference crm_leads_v3.full_name
-- These are legacy functions that may have been left behind after schema migration.
DO $$
DECLARE
    r RECORD;
    func_count INT := 0;
BEGIN
    -- Find all functions that reference both 'crm_leads_v3' and 'full_name' in their body
    FOR r IN
        SELECT n.nspname AS schema_name, 
               p.proname AS function_name,
               pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE p.prokind = 'f'
          AND pg_catalog.pg_get_functiondef(p.oid) ILIKE '%crm_leads_v3%full_name%'
          AND n.nspname NOT IN ('pg_catalog', 'information_schema')
          -- Exclude the known-good functions that use p_full_name as parameter name
          -- (these insert into identities_v3, not crm_leads_v3.full_name column)
          AND pg_catalog.pg_get_functiondef(p.oid) NOT ILIKE '%p_full_name%'
    LOOP
        RAISE NOTICE 'Found stale function: %.% (%)', r.schema_name, r.function_name, r.args;
        -- Drop the stale function
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', r.schema_name, r.function_name, r.args);
        func_count := func_count + 1;
    END LOOP;

    IF func_count = 0 THEN
        RAISE NOTICE 'No stale functions found referencing crm_leads_v3.full_name';
    ELSE
        RAISE NOTICE 'Dropped % stale function(s)', func_count;
    END IF;
END;
$$;

-- 2. Also check for and drop any stale views that reference crm_leads_v3.full_name
DO $$
DECLARE
    r RECORD;
    view_count INT := 0;
BEGIN
    FOR r IN
        SELECT schemaname, viewname, definition
        FROM pg_catalog.pg_views
        WHERE definition ILIKE '%crm_leads_v3%'
          AND definition ILIKE '%full_name%'
          AND schemaname NOT IN ('pg_catalog', 'information_schema')
          -- Exclude the known-good "leads" view which uses i.display_name AS full_name (from identities_v3)
          AND viewname != 'leads'
    LOOP
        RAISE NOTICE 'Found stale view: %.%', r.schemaname, r.viewname;
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', r.schemaname, r.viewname);
        view_count := view_count + 1;
    END LOOP;

    IF view_count = 0 THEN
        RAISE NOTICE 'No stale views found referencing crm_leads_v3.full_name';
    ELSE
        RAISE NOTICE 'Dropped % stale view(s)', view_count;
    END IF;
END;
$$;

-- 3. Add a comment on the table documenting the correct schema
COMMENT ON TABLE public.crm_leads_v3 IS 
'CRM Leads table (v3). Does NOT have a full_name column. '
'Name data is stored in identities_v3.display_name via the identity_id FK. '
'Use the "leads" view for queries that need full_name.';
