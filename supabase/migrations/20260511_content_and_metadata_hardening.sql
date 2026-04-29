-- ==========================================
-- 🚀 SECURITY HARDENING: CONTENT & METADATA
-- Description: Blog categories, FAQs, Services, and Templates
-- ==========================================

BEGIN;

-- 1. BLOG CATEGORIES
DROP POLICY IF EXISTS "blog_categories_select_optimized" ON public.blog_categories;
DROP POLICY IF EXISTS "blog_categories_insert_optimized" ON public.blog_categories;
DROP POLICY IF EXISTS "blog_categories_update_optimized" ON public.blog_categories;
DROP POLICY IF EXISTS "blog_categories_delete_optimized" ON public.blog_categories;

CREATE POLICY "blog_categories_select_optimized" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "blog_categories_insert_optimized" ON public.blog_categories FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "blog_categories_update_optimized" ON public.blog_categories FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "blog_categories_delete_optimized" ON public.blog_categories FOR DELETE USING ((SELECT public.is_system_admin()));

-- 2. FAQS
DROP POLICY IF EXISTS "faqs_select_optimized" ON public.faqs;
DROP POLICY IF EXISTS "faqs_insert_optimized" ON public.faqs;
DROP POLICY IF EXISTS "faqs_update_optimized" ON public.faqs;
DROP POLICY IF EXISTS "faqs_delete_optimized" ON public.faqs;

CREATE POLICY "faqs_select_optimized" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "faqs_insert_optimized" ON public.faqs FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "faqs_update_optimized" ON public.faqs FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "faqs_delete_optimized" ON public.faqs FOR DELETE USING ((SELECT public.is_system_admin()));

-- 3. SERVICES
DROP POLICY IF EXISTS "services_select_optimized" ON public.services;
DROP POLICY IF EXISTS "services_insert_optimized" ON public.services;
DROP POLICY IF EXISTS "services_update_optimized" ON public.services;
DROP POLICY IF EXISTS "services_delete_optimized" ON public.services;

CREATE POLICY "services_select_optimized" ON public.services FOR SELECT USING (true);
CREATE POLICY "services_insert_optimized" ON public.services FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "services_update_optimized" ON public.services FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "services_delete_optimized" ON public.services FOR DELETE USING ((SELECT public.is_system_admin()));

-- 4. CONTRACT TEMPLATES
DROP POLICY IF EXISTS "contract_templates_select_optimized" ON public.contract_templates;
DROP POLICY IF EXISTS "contract_templates_insert_optimized" ON public.contract_templates;
DROP POLICY IF EXISTS "contract_templates_update_optimized" ON public.contract_templates;
DROP POLICY IF EXISTS "contract_templates_delete_optimized" ON public.contract_templates;

CREATE POLICY "contract_templates_select_optimized" ON public.contract_templates FOR SELECT USING (true);
CREATE POLICY "contract_templates_insert_optimized" ON public.contract_templates FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "contract_templates_update_optimized" ON public.contract_templates FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "contract_templates_delete_optimized" ON public.contract_templates FOR DELETE USING ((SELECT public.is_system_admin()));

-- 5. OTHER CONTENT (Partners, Popular Areas, Property Images)
DROP POLICY IF EXISTS "partners_select_optimized" ON public.partners;
DROP POLICY IF EXISTS "partners_insert_optimized" ON public.partners;
DROP POLICY IF EXISTS "partners_update_optimized" ON public.partners;
DROP POLICY IF EXISTS "partners_delete_optimized" ON public.partners;
CREATE POLICY "partners_select_optimized" ON public.partners FOR SELECT USING (true);
CREATE POLICY "partners_insert_optimized" ON public.partners FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "partners_update_optimized" ON public.partners FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "partners_delete_optimized" ON public.partners FOR DELETE USING ((SELECT public.is_system_admin()));

DROP POLICY IF EXISTS "popular_areas_select_optimized" ON public.popular_areas;
DROP POLICY IF EXISTS "popular_areas_insert_optimized" ON public.popular_areas;
DROP POLICY IF EXISTS "popular_areas_update_optimized" ON public.popular_areas;
DROP POLICY IF EXISTS "popular_areas_delete_optimized" ON public.popular_areas;
CREATE POLICY "popular_areas_select_optimized" ON public.popular_areas FOR SELECT USING (true);
CREATE POLICY "popular_areas_insert_optimized" ON public.popular_areas FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "popular_areas_update_optimized" ON public.popular_areas FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "popular_areas_delete_optimized" ON public.popular_areas FOR DELETE USING ((SELECT public.is_system_admin()));

DROP POLICY IF EXISTS "property_images_select_optimized" ON public.property_images;
DROP POLICY IF EXISTS "property_images_insert_optimized" ON public.property_images;
DROP POLICY IF EXISTS "property_images_update_optimized" ON public.property_images;
DROP POLICY IF EXISTS "property_images_delete_optimized" ON public.property_images;
CREATE POLICY "property_images_select_optimized" ON public.property_images FOR SELECT USING (true);
CREATE POLICY "property_images_insert_optimized" ON public.property_images FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "property_images_update_optimized" ON public.property_images FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "property_images_delete_optimized" ON public.property_images FOR DELETE USING ((SELECT public.is_system_admin()));

COMMIT;
