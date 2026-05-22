-- ==========================================
-- 🚀 SECURITY HARDENING: AUDIT & LOGS
-- Description: Audit logs and view tracking with Nuclear Clean
-- ==========================================

BEGIN;

-- 1. LOGS (Nuclear Clean for Views)
DO $$ 
DECLARE 
    pol record;
BEGIN 
    -- Clean blog_post_views_log
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'blog_post_views_log' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.blog_post_views_log', pol.policyname);
    END LOOP;
    -- Clean service_views_log
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'service_views_log' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.service_views_log', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "blog_views_insert_optimized" ON public.blog_post_views_log FOR INSERT WITH CHECK (true);
CREATE POLICY "blog_views_select_optimized" ON public.blog_post_views_log FOR SELECT USING ((SELECT public.is_system_admin()));
CREATE POLICY "blog_views_update_optimized" ON public.blog_post_views_log FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "blog_views_delete_optimized" ON public.blog_post_views_log FOR DELETE USING ((SELECT public.is_system_admin()));

CREATE POLICY "service_views_insert_optimized" ON public.service_views_log FOR INSERT WITH CHECK (true);
CREATE POLICY "service_views_select_optimized" ON public.service_views_log FOR SELECT USING ((SELECT public.is_system_admin()));
CREATE POLICY "service_views_update_optimized" ON public.service_views_log FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "service_views_delete_optimized" ON public.service_views_log FOR DELETE USING ((SELECT public.is_system_admin()));

-- 2. AUDIT LOGS
DROP POLICY IF EXISTS "audit_logs_select_hardened" ON public.audit_logs;
CREATE POLICY "audit_logs_select_hardened" ON public.audit_logs
FOR SELECT USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_system_admin()));

DROP POLICY IF EXISTS "Audit logs isolation" ON public.audit_logs_history;
CREATE POLICY "Audit logs isolation" ON public.audit_logs_history
FOR SELECT USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_system_admin()));

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs_2026_05') THEN
        DROP POLICY IF EXISTS "Audit logs isolation 05" ON public.audit_logs_2026_05;
        CREATE POLICY "Audit logs isolation 05" ON public.audit_logs_2026_05
        FOR SELECT USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_system_admin()));
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs_2026_06') THEN
        DROP POLICY IF EXISTS "Audit logs isolation 06" ON public.audit_logs_2026_06;
        CREATE POLICY "Audit logs isolation 06" ON public.audit_logs_2026_06
        FOR SELECT USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_system_admin()));
    END IF;
END $$;

COMMIT;
