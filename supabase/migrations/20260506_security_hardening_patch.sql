-- ==========================================================
-- EMERGENCY SECURITY PATCH: RLS HARDENING
-- ==========================================================

-- 1. Enable RLS for ALL missed tables (Critical Fix)
ALTER TABLE public.audit_logs_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_2026_03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_2026_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_2026_05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_2026_06 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ref_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_agent_triggers ENABLE ROW LEVEL SECURITY;

-- 2. Secure RLS Policies (Stop referencing user_metadata)
-- Drop old risky policies (Names based on Supabase Linter)
DROP POLICY IF EXISTS "Audit logs are visible to branch admins" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can see own logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Teams are visible to branch members" ON public.teams;
DROP POLICY IF EXISTS "Teams are manageable by branch admins" ON public.teams;
DROP POLICY IF EXISTS "Team members can see team" ON public.teams;

-- Drop new policies (To allow re-running the script)
DROP POLICY IF EXISTS "Secure: Users can see own logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Secure: Team visibility" ON public.teams;
DROP POLICY IF EXISTS "Secure: Team management" ON public.teams;

-- Create new secure policies using public.profiles (Server-controlled)
CREATE POLICY "Secure: Users can see own logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
);

CREATE POLICY "Secure: Team visibility"
ON public.teams
FOR SELECT
TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Secure: Team management"
ON public.teams
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
);

-- 3. Fix Security Definer Views (Switch to SECURITY INVOKER)
-- We must DROP first because CREATE OR REPLACE is strict about column changes

-- Fix for popular_areas_with_counts
DROP VIEW IF EXISTS public.popular_areas_with_counts CASCADE;
CREATE VIEW public.popular_areas_with_counts 
WITH (security_invoker = true)
AS 
SELECT popular_area, count(*) as property_count, tenant_id
FROM public.properties
GROUP BY popular_area, tenant_id;

-- Fix for view_commission_payout_summaries
ALTER VIEW IF EXISTS public.view_commission_payout_summaries SET (security_invoker = true);

-- 4. Basic Access for Reference Tables (Read-only for all authenticated)
DROP POLICY IF EXISTS "Authenticated users can read banks" ON public.ref_banks;
CREATE POLICY "Authenticated users can read banks"
ON public.ref_banks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage triggers" ON public.proactive_agent_triggers;
CREATE POLICY "Admins can manage triggers"
ON public.proactive_agent_triggers FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'));

-- 5. Partitioned Tables RLS (Inherit logic)
-- Since they are partitions, we apply the same logic as the parent table
DROP POLICY IF EXISTS "Audit logs isolation" ON public.audit_logs_history;
CREATE POLICY "Audit logs isolation" ON public.audit_logs_history FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Audit logs isolation 03" ON public.audit_logs_2026_03;
CREATE POLICY "Audit logs isolation 03" ON public.audit_logs_2026_03 FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Audit logs isolation 04" ON public.audit_logs_2026_04;
CREATE POLICY "Audit logs isolation 04" ON public.audit_logs_2026_04 FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Audit logs isolation 05" ON public.audit_logs_2026_05;
CREATE POLICY "Audit logs isolation 05" ON public.audit_logs_2026_05 FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Audit logs isolation 06" ON public.audit_logs_2026_06;
CREATE POLICY "Audit logs isolation 06" ON public.audit_logs_2026_06 FOR SELECT TO authenticated USING (user_id = auth.uid());
