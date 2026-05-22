-- ==========================================
-- 🚀 SECURITY HARDENING: SETTINGS & SMART MATCH
-- Description: Site settings and Smart Match with Nuclear Clean
-- ==========================================

BEGIN;

-- 1. SITE SETTINGS & LINE TEMPLATES
DROP POLICY IF EXISTS "site_settings_select_optimized" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_insert_optimized" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_update_optimized" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_delete_optimized" ON public.site_settings;
CREATE POLICY "site_settings_select_optimized" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_insert_optimized" ON public.site_settings FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "site_settings_update_optimized" ON public.site_settings FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "site_settings_delete_optimized" ON public.site_settings FOR DELETE USING ((SELECT public.is_system_admin()));

DROP POLICY IF EXISTS "line_templates_select_optimized" ON public.line_templates;
DROP POLICY IF EXISTS "line_templates_insert_optimized" ON public.line_templates;
DROP POLICY IF EXISTS "line_templates_update_optimized" ON public.line_templates;
DROP POLICY IF EXISTS "line_templates_delete_optimized" ON public.line_templates;
CREATE POLICY "line_templates_select_optimized" ON public.line_templates FOR SELECT USING (true);
CREATE POLICY "line_templates_insert_optimized" ON public.line_templates FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "line_templates_update_optimized" ON public.line_templates FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "line_templates_delete_optimized" ON public.line_templates FOR DELETE USING ((SELECT public.is_system_admin()));

-- 2. SMART MATCH NUCLEAR CLEAN
DO $$ 
DECLARE 
    pol record;
BEGIN 
    -- Clean smart_match_settings
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'smart_match_settings' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.smart_match_settings', pol.policyname);
    END LOOP;
    -- Clean ranges
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'smart_match_budget_ranges' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.smart_match_budget_ranges', pol.policyname);
    END LOOP;
    -- Clean sizes
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'smart_match_office_sizes' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.smart_match_office_sizes', pol.policyname);
    END LOOP;
    -- Clean types
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'smart_match_property_types' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.smart_match_property_types', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "smart_match_settings_select_optimized" ON public.smart_match_settings FOR SELECT USING (true);
CREATE POLICY "smart_match_settings_insert_optimized" ON public.smart_match_settings FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "smart_match_settings_update_optimized" ON public.smart_match_settings FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "smart_match_settings_delete_optimized" ON public.smart_match_settings FOR DELETE USING ((SELECT public.is_system_admin()));

CREATE POLICY "smart_match_budget_ranges_select_optimized" ON public.smart_match_budget_ranges FOR SELECT USING (true);
CREATE POLICY "smart_match_budget_ranges_insert_optimized" ON public.smart_match_budget_ranges FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "smart_match_budget_ranges_update_optimized" ON public.smart_match_budget_ranges FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "smart_match_budget_ranges_delete_optimized" ON public.smart_match_budget_ranges FOR DELETE USING ((SELECT public.is_system_admin()));

CREATE POLICY "smart_match_office_sizes_select_optimized" ON public.smart_match_office_sizes FOR SELECT USING (true);
CREATE POLICY "smart_match_office_sizes_insert_optimized" ON public.smart_match_office_sizes FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "smart_match_office_sizes_update_optimized" ON public.smart_match_office_sizes FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "smart_match_office_sizes_delete_optimized" ON public.smart_match_office_sizes FOR DELETE USING ((SELECT public.is_system_admin()));

CREATE POLICY "smart_match_property_types_select_optimized" ON public.smart_match_property_types FOR SELECT USING (true);
CREATE POLICY "smart_match_property_types_insert_optimized" ON public.smart_match_property_types FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "smart_match_property_types_update_optimized" ON public.smart_match_property_types FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "smart_match_property_types_delete_optimized" ON public.smart_match_property_types FOR DELETE USING ((SELECT public.is_system_admin()));

-- 3. IMAGES
DROP POLICY IF EXISTS "piu_insert_optimized" ON public.property_image_uploads;
CREATE POLICY "piu_insert_optimized" ON public.property_image_uploads FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_system_admin()));

COMMIT;
