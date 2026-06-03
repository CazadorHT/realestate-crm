-- 1. Clean up duplicate settings, keeping only the latest updated row for each tenant, category, and key
DELETE FROM public.system_settings_v3
WHERE id NOT IN (
    SELECT DISTINCT ON (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), category, key) id
    FROM public.system_settings_v3
    ORDER BY COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), category, key, updated_at DESC
);

-- 2. Drop the old unique constraint that allowed multiple NULL tenants
ALTER TABLE public.system_settings_v3 
DROP CONSTRAINT IF EXISTS system_settings_v3_tenant_id_category_key_key;

-- 3. Add the new constraint using NULLS NOT DISTINCT (PostgreSQL 15+)
ALTER TABLE public.system_settings_v3 
ADD CONSTRAINT system_settings_v3_tenant_id_category_key_key 
UNIQUE NULLS NOT DISTINCT (tenant_id, category, key);

-- 4. Seed default template settings for the global settings (tenant_id = null) if they do not exist
INSERT INTO public.system_settings_v3 (tenant_id, category, key, value, updated_at, updated_by)
VALUES
    (null, 'general', 'facebook_post_template', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}"', now(), null),
    (null, 'general', 'facebook_post_template_en', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nMore details: {{link}}"', now(), null),
    (null, 'general', 'facebook_post_template_cn', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\n更多详情: {{link}}"', now(), null),
    (null, 'general', 'facebook_post_template_ru', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nПодробнее: {{link}}"', now(), null),
    (null, 'general', 'instagram_post_template', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}"', now(), null),
    (null, 'general', 'instagram_post_template_en', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nMore details: {{link}}"', now(), null),
    (null, 'general', 'instagram_post_template_cn', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\n更多详情: {{link}}"', now(), null),
    (null, 'general', 'instagram_post_template_ru', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nПодробнее: {{link}}"', now(), null),
    (null, 'general', 'line_post_template', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}"', now(), null),
    (null, 'general', 'line_post_template_en', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nMore details: {{link}}"', now(), null),
    (null, 'general', 'line_post_template_cn', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\n更多详情: {{link}}"', now(), null),
    (null, 'general', 'line_post_template_ru', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n{{google_maps}}\n\nПодробнее: {{link}}"', now(), null),
    (null, 'general', 'tiktok_post_template', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n\n#RealEstate #Property {{link}}"', now(), null),
    (null, 'general', 'tiktok_post_template_en', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n\n#RealEstate #Property {{link}}"', now(), null),
    (null, 'general', 'tiktok_post_template_cn', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n\n#RealEstate #Property {{link}}"', now(), null),
    (null, 'general', 'tiktok_post_template_ru', '"🏠 {{title}}\n{{price_tag}}\n{{details}}\n{{description}}\n\n#RealEstate #Property {{link}}"', now(), null)
ON CONFLICT (tenant_id, category, key) DO NOTHING;
