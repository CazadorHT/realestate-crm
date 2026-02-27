-- 1. Ensure a default tenant exists
INSERT INTO public.tenants (name, slug)
VALUES ('Main Office', 'main-office')
ON CONFLICT (slug) DO NOTHING;

-- 2. Initialize system configuration in site_settings
-- We default it to 'false' (Single-tenant) as per user's request for flexibility
INSERT INTO public.site_settings (key, value)
VALUES (
  'system_config', 
  jsonb_build_object(
    'multi_tenant_enabled', false,
    'default_tenant_id', (SELECT id FROM public.tenants WHERE slug = 'main-office' LIMIT 1)
  )
)
ON CONFLICT (key) DO NOTHING;
