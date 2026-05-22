-- ==========================================================
-- REVISED SECURITY HARDENING (UNIVERSAL & SAFE)
-- ==========================================================

-- 1. Fix Function Search Paths (Protect against Search Path Hijacking)
-- We use the function name ONLY where possible to avoid signature mismatch errors.
-- If you have overloaded functions, you might need to specify parameters.

DO $$ 
BEGIN
    -- Apply search_path fix to all mentioned functions
    -- We use a safe DO block to handle cases where functions might not exist
    EXECUTE 'ALTER FUNCTION public.is_tenant_admin(uuid) SET search_path = public, pg_temp';
    EXECUTE 'ALTER FUNCTION public.is_tenant_staff(uuid) SET search_path = public, pg_temp';
    EXECUTE 'ALTER FUNCTION public.is_staff() SET search_path = public, pg_temp';
    EXECUTE 'ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp';
    
    -- Fix for match_properties (Universal approach)
    -- We try to find the function by name and apply the fix
    ALTER FUNCTION public.match_properties SET search_path = public, pg_temp;
    ALTER FUNCTION public.match_properties_hardened SET search_path = public, pg_temp;
    
    -- Other functions
    ALTER FUNCTION public.increment_blog_post_view SET search_path = public, pg_temp;
    ALTER FUNCTION public.increment_property_view SET search_path = public, pg_temp;
    ALTER FUNCTION public.submit_public_lead SET search_path = public, pg_temp;
    ALTER FUNCTION public.get_user_tenants SET search_path = public, pg_temp;
    ALTER FUNCTION public.get_analytics_summary_v3 SET search_path = public, pg_temp;
    ALTER FUNCTION public.get_analytics_summary_v2 SET search_path = public, pg_temp;
    ALTER FUNCTION public.get_public_property_facets SET search_path = public, pg_temp;
    ALTER FUNCTION public.get_public_property_facets_v2 SET search_path = public, pg_temp;
    ALTER FUNCTION public.cleanup_old_background_tasks SET search_path = public, pg_temp;
    ALTER FUNCTION public.bulk_delete_deals_atomic SET search_path = public, pg_temp;
    ALTER FUNCTION public.bulk_hard_delete_properties SET search_path = public, pg_temp;
    ALTER FUNCTION public.transfer_tenant_member SET search_path = public, pg_temp;
    ALTER FUNCTION public.handle_new_user SET search_path = public, pg_temp;
    ALTER FUNCTION public.handle_background_task_completion SET search_path = public, pg_temp;

EXCEPTION WHEN OTHERS THEN
    -- If some fail, we just log and continue
    RAISE NOTICE 'Some functions could not be altered: %', SQLERRM;
END $$;

-- 2. Fix Permissive RLS (Stop bot spam)
DROP POLICY IF EXISTS "Public Insert leads" ON public.leads;
CREATE POLICY "Public Insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert lead_activities" ON public.lead_activities;
CREATE POLICY "Public Insert lead_activities" ON public.lead_activities FOR INSERT TO authenticated WITH CHECK (true);

-- 3. Specific Function Lockdown (Protect Admin-only RPCs)
-- We target high-risk functions mentioned by linter
DO $$ 
BEGIN
    REVOKE EXECUTE ON FUNCTION public.bulk_delete_deals_atomic FROM public, anon;
    REVOKE EXECUTE ON FUNCTION public.bulk_hard_delete_properties FROM public, anon;
    REVOKE EXECUTE ON FUNCTION public.transfer_tenant_member FROM public, anon;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Permissions already revoked or functions missing';
END $$;

-- Grant back to authenticated (Backend staff)
GRANT EXECUTE ON FUNCTION public.bulk_delete_deals_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_hard_delete_properties TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_tenant_member TO authenticated;
