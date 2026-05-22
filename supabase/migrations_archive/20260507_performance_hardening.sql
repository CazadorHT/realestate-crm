-- ==========================================
-- 🚀 PERFORMANCE HARDENING: RLS Optimization
-- Version: 1.0 (Diamond Performance Edition)
-- Description: Fixing auth_rls_initplan and multiple_permissive_policies
-- ==========================================

BEGIN;

-- 1. PROFILES OPTIMIZATION
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read_basic" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Master: Profiles Select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_optimized_unified" ON public.profiles;

CREATE POLICY "profiles_select_optimized_v2" ON public.profiles
FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_agent_update_self" ON public.profiles;
CREATE POLICY "profiles_agent_update_self" ON public.profiles
FOR UPDATE USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
-- Consolidating with profiles_select_own if they do the same thing

-- 2. NOTIFICATIONS OPTIMIZATION
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- 3. AI_USAGE_LOGS CONSOLIDATION & OPTIMIZATION
-- Fixed multiple permissive policies by dropping duplicates
DROP POLICY IF EXISTS "AI Logs: Admin see all" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "AI Logs: Users see own" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Allow admins to view all logs" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Allow users to view their own logs" ON public.ai_usage_logs;

CREATE POLICY "ai_usage_logs_select_policy" ON public.ai_usage_logs
FOR SELECT USING (
    user_id = (SELECT auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('ADMIN', 'MANAGER'))
);

DROP POLICY IF EXISTS "Allow authenticated users to insert logs" ON public.ai_usage_logs;
CREATE POLICY "ai_usage_logs_insert_policy" ON public.ai_usage_logs
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

-- 4. AUDIT_LOGS OPTIMIZATION
DROP POLICY IF EXISTS "audit_logs_select_hardened" ON public.audit_logs;
CREATE POLICY "audit_logs_select_hardened" ON public.audit_logs
FOR SELECT USING (
    user_id = (SELECT auth.uid()) OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('ADMIN', 'MANAGER'))
);

-- 5. BACKGROUND_TASKS OPTIMIZATION
DROP POLICY IF EXISTS "Users can see their own tenant tasks" ON public.background_tasks;
CREATE POLICY "Users can see their own tenant tasks" ON public.background_tasks
FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

-- 6. LEADS CONSOLIDATION
DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;
DROP POLICY IF EXISTS "Tenant Isolation leads" ON public.leads;
CREATE POLICY "leads_select_optimized" ON public.leads
FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

-- 7. CONTRACT_TEMPLATES OPTIMIZATION
DROP POLICY IF EXISTS "Allow authenticated users to read templates" ON public.contract_templates;
CREATE POLICY "contract_templates_select_optimized" ON public.contract_templates
FOR SELECT TO authenticated USING (true);

-- 8. BLOG_POSTS CONSOLIDATION
-- Consolidation of 4+ redundant policies
DROP POLICY IF EXISTS "Public View Published Blogs" ON public.blog_posts;
DROP POLICY IF EXISTS "Public can view published posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Staff Manage blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "System Admin Manage blog_posts" ON public.blog_posts;

CREATE POLICY "blog_posts_select_optimized" ON public.blog_posts
FOR SELECT USING (
    (is_published = true AND deleted_at IS NULL) OR 
    author_id = (SELECT auth.uid()) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('ADMIN', 'MANAGER', 'AGENT'))
);

-- 9. CO_BROKERS & DOCUMENTS
DROP POLICY IF EXISTS "view_co_brokers" ON public.co_brokers;
CREATE POLICY "view_co_brokers_optimized" ON public.co_brokers
FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    AND (deleted_at IS NULL OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('ADMIN', 'MANAGER')))
);

DROP POLICY IF EXISTS "view_documents" ON public.co_broker_documents;
CREATE POLICY "view_documents_optimized" ON public.co_broker_documents
FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

-- 10. AUDIT_LOGS PARTITIONS (Fixing re-evaluation)
-- Loop through partitions or set specifically if they are detected
DO $$ 
BEGIN
    -- Partition 03
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs_2026_03') THEN
        DROP POLICY IF EXISTS "Audit logs isolation 03" ON public.audit_logs_2026_03;
        CREATE POLICY "Audit logs isolation 03" ON public.audit_logs_2026_03
        FOR SELECT USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('ADMIN', 'MANAGER')));
    END IF;
    -- Partition 04
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_logs_2026_04') THEN
        DROP POLICY IF EXISTS "Audit logs isolation 04" ON public.audit_logs_2026_04;
        CREATE POLICY "Audit logs isolation 04" ON public.audit_logs_2026_04
        FOR SELECT USING (user_id = (SELECT auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('ADMIN', 'MANAGER')));
    END IF;
END $$;

COMMIT;
