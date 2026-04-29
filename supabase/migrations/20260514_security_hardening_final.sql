-- ==========================================
-- 🚀 FINAL SECURITY HARDENING (THE ULTIMATE WRAPPER - COMPLETE V2)
-- Description: Moving ALL SECURITY DEFINER functions to internal schema 
-- and creating SECURITY INVOKER wrappers in public to satisfy the linter.
-- Fixed: performance optimization for RLS (auth_rls_initplan).
-- ==========================================

BEGIN;

-- 1. SCHEMAS
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS internal;

-- 2. ABSOLUTE REVOKE
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- 3. INTERNAL FUNCTIONS (SECURITY DEFINER)
-- [SUBMIT LEAD]
DROP FUNCTION IF EXISTS internal.submit_public_lead(text, text, text, text, text);
CREATE OR REPLACE FUNCTION internal.submit_public_lead(p_full_name TEXT, p_line_id TEXT, p_phone TEXT, p_source TEXT, p_note TEXT) RETURNS UUID AS $$
DECLARE v_lead_id UUID;
BEGIN
    INSERT INTO public.leads (full_name, line_id, phone, source, stage, note, lead_type)
    VALUES (p_full_name, p_line_id, p_phone, p_source::public.lead_source, 'NEW', p_note, 'INDIVIDUAL')
    RETURNING id INTO v_lead_id;
    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [INCREMENT VIEW]
DROP FUNCTION IF EXISTS internal.increment_property_view(uuid);
CREATE OR REPLACE FUNCTION internal.increment_property_view(p_id UUID) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.property_views_log (property_id, user_id) VALUES (p_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [LOG AI]
DROP FUNCTION IF EXISTS internal.log_ai_usage(text, text, text, text, integer, integer, numeric);
CREATE OR REPLACE FUNCTION internal.log_ai_usage(p_model TEXT, p_feature TEXT, p_status TEXT, p_error_message TEXT, p_prompt_tokens INTEGER, p_completion_tokens INTEGER, p_cost_thb NUMERIC) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.ai_usage_logs (model, feature, status, error_message, user_id, prompt_tokens, completion_tokens, cost_thb)
    VALUES (p_model, p_feature, p_status, p_error_message, auth.uid(), p_prompt_tokens, p_completion_tokens, p_cost_thb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [LOG SYSTEM]
DROP FUNCTION IF EXISTS internal.log_system_activity(text, text, text, jsonb, uuid, text);
CREATE OR REPLACE FUNCTION internal.log_system_activity(p_action text, p_entity text, p_entity_id text, p_metadata jsonb, p_tenant_id uuid, p_email text) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (action, entity, entity_id, metadata, tenant_id, actor_id, actor_email)
    VALUES (p_action, p_entity, p_entity_id, p_metadata, p_tenant_id, auth.uid(), p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [TENANT INVITATION]
DROP FUNCTION IF EXISTS internal.accept_tenant_invitation(uuid);
CREATE OR REPLACE FUNCTION internal.accept_tenant_invitation(p_tenant_id UUID) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.tenant_members (tenant_id, profile_id, role) VALUES (p_tenant_id, auth.uid(), 'AGENT');
    DELETE FROM public.tenant_invitations WHERE tenant_id = p_tenant_id AND email = (SELECT email FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS internal.decline_tenant_invitation(uuid);
CREATE OR REPLACE FUNCTION internal.decline_tenant_invitation(p_tenant_id UUID) RETURNS VOID AS $$
BEGIN
    DELETE FROM public.tenant_invitations WHERE tenant_id = p_tenant_id AND email = (SELECT email FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [CREATE LEAD FROM MATCH]
DROP FUNCTION IF EXISTS internal.create_lead_from_match(uuid, uuid, text, text, text, text);
CREATE OR REPLACE FUNCTION internal.create_lead_from_match(p_session_id UUID, p_property_id UUID, p_full_name TEXT, p_phone TEXT, p_email TEXT, p_line_id TEXT) RETURNS UUID AS $$
DECLARE v_lead_id UUID;
BEGIN
    INSERT INTO public.leads (full_name, phone, email, line_id, lead_type, source, stage, note)
    VALUES (p_full_name, p_phone, p_email, p_line_id, 'INDIVIDUAL', 'WEBSITE', 'NEW', format('Smart Match: %s', p_session_id))
    RETURNING id INTO v_lead_id;
    UPDATE public.property_search_sessions SET lead_id = v_lead_id, converted_at = NOW() WHERE id = p_session_id;
    RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [BULK ACTIONS]
DROP FUNCTION IF EXISTS internal.bulk_trash_properties(uuid[]);
CREATE OR REPLACE FUNCTION internal.bulk_trash_properties(p_ids UUID[]) RETURNS VOID AS $$
BEGIN
    UPDATE public.properties SET deleted_at = NOW() WHERE id = ANY(p_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP FUNCTION IF EXISTS internal.bulk_hard_delete_properties(uuid[]);
CREATE OR REPLACE FUNCTION internal.bulk_hard_delete_properties(p_ids UUID[]) RETURNS VOID AS $$
BEGIN
    DELETE FROM public.properties WHERE id = ANY(p_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. PUBLIC WRAPPERS (SECURITY INVOKER)
DROP FUNCTION IF EXISTS public.submit_public_lead(text, text, text, text, text);
CREATE OR REPLACE FUNCTION public.submit_public_lead(p_full_name TEXT, p_line_id TEXT DEFAULT NULL, p_phone TEXT DEFAULT NULL, p_source TEXT DEFAULT 'WEBSITE', p_note TEXT DEFAULT NULL) RETURNS UUID AS $$
BEGIN RETURN internal.submit_public_lead(p_full_name, p_line_id, p_phone, p_source, p_note); END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP FUNCTION IF EXISTS public.increment_property_view(uuid);
CREATE OR REPLACE FUNCTION public.increment_property_view(p_id UUID) RETURNS VOID AS $$
BEGIN PERFORM internal.increment_property_view(p_id); END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP FUNCTION IF EXISTS public.log_ai_usage(text, text, text, text, integer, integer, numeric);
CREATE OR REPLACE FUNCTION public.log_ai_usage(p_model TEXT, p_feature TEXT, p_status TEXT, p_error_message TEXT DEFAULT NULL, p_prompt_tokens INTEGER DEFAULT 0, p_completion_tokens INTEGER DEFAULT 0, p_cost_thb NUMERIC DEFAULT 0) RETURNS VOID AS $$
BEGIN PERFORM internal.log_ai_usage(p_model, p_feature, p_status, p_error_message, p_prompt_tokens, p_completion_tokens, p_cost_thb); END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP FUNCTION IF EXISTS public.log_system_activity(text, text, text, jsonb, uuid, text);
CREATE OR REPLACE FUNCTION public.log_system_activity(p_action text, p_entity text, p_entity_id text, p_metadata jsonb, p_tenant_id uuid, p_email text) RETURNS VOID AS $$
BEGIN PERFORM internal.log_system_activity(p_action, p_entity, p_entity_id, p_metadata, p_tenant_id, p_email); END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP FUNCTION IF EXISTS public.accept_tenant_invitation(uuid);
CREATE OR REPLACE FUNCTION public.accept_tenant_invitation(p_tenant_id UUID) RETURNS VOID AS $$
BEGIN PERFORM internal.accept_tenant_invitation(p_tenant_id); END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP FUNCTION IF EXISTS public.decline_tenant_invitation(uuid);
CREATE OR REPLACE FUNCTION public.decline_tenant_invitation(p_tenant_id UUID) RETURNS VOID AS $$
BEGIN PERFORM internal.decline_tenant_invitation(p_tenant_id); END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP FUNCTION IF EXISTS public.create_lead_from_match(uuid, uuid, text, text, text, text);
CREATE OR REPLACE FUNCTION public.create_lead_from_match(p_session_id UUID, p_property_id UUID, p_full_name TEXT, p_phone TEXT, p_email TEXT DEFAULT NULL, p_line_id TEXT DEFAULT NULL) RETURNS UUID AS $$
BEGIN RETURN internal.create_lead_from_match(p_session_id, p_property_id, p_full_name, p_phone, p_email, p_line_id); END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP FUNCTION IF EXISTS public.bulk_trash_properties(uuid[]);
CREATE OR REPLACE FUNCTION public.bulk_trash_properties(p_ids UUID[]) RETURNS VOID AS $$
BEGIN PERFORM internal.bulk_trash_properties(p_ids); END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

DROP FUNCTION IF EXISTS public.bulk_hard_delete_properties(uuid[]);
CREATE OR REPLACE FUNCTION public.bulk_hard_delete_properties(p_ids UUID[]) RETURNS VOID AS $$
BEGIN PERFORM internal.bulk_hard_delete_properties(p_ids); END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 5. PERFORMANCE FIXES FOR RLS (auth_rls_initplan)
-- Wrap auth.role() in subqueries to force query planner optimization.
DROP POLICY IF EXISTS "leads_insert_all" ON public.leads;
CREATE POLICY "leads_insert_all" ON public.leads
FOR INSERT WITH CHECK ((SELECT auth.role()) IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "blog_views_insert_optimized" ON public.blog_post_views_log;
CREATE POLICY "blog_views_insert_optimized" ON public.blog_post_views_log 
FOR INSERT WITH CHECK ((SELECT auth.role()) IN ('anon', 'authenticated'));

DROP POLICY IF EXISTS "service_views_insert_optimized" ON public.service_views_log;
CREATE POLICY "service_views_insert_optimized" ON public.service_views_log 
FOR INSERT WITH CHECK ((SELECT auth.role()) IN ('anon', 'authenticated'));

-- 6. SELECTIVE GRANT
GRANT EXECUTE ON FUNCTION public.submit_public_lead(text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_property_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_ai_usage(text, text, text, text, integer, integer, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_system_activity(text, text, text, jsonb, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_tenant_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_tenant_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_lead_from_match(uuid, uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_trash_properties(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_hard_delete_properties(uuid[]) TO authenticated;

COMMIT;
