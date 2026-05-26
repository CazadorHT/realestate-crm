-- Seed default site settings matching site-config.ts
-- This ensures baseline settings exist in the system_settings_v3 database table.

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the first tenant_id if it exists
    SELECT id INTO v_tenant_id FROM public.tenants_v3 LIMIT 1;

    -- Insert default configs for the tenant
    INSERT INTO public.system_settings_v3 (tenant_id, category, key, value, updated_at, updated_by)
    VALUES
        (v_tenant_id, 'general', 'site_name', '"VC Connect Asset"', now(), null),
        (v_tenant_id, 'general', 'company_name', '"VC Connect Asset Co., Ltd."', now(), null),
        (v_tenant_id, 'general', 'site_description', '"ระบบจัดการอสังหาริมทรัพย์และพอร์ทัลประกาศขาย-เช่า"', now(), null),
        (v_tenant_id, 'general', 'contact_phone', '"02-096-2588"', now(), null),
        (v_tenant_id, 'general', 'contact_email', '"vcconnect.asset@gmail.com"', now(), null),
        (v_tenant_id, 'general', 'contact_address', '"20th Floor, G Tower, Ratchadaphisek Road, Huai Khwang Subdistrict, Huai Khwang District, Bangkok 10310"', now(), null),
        (v_tenant_id, 'general', 'google_maps_url', '"https://maps.app.goo.gl/xxxx"', now(), null),
        (v_tenant_id, 'general', 'facebook_url', '"https://facebook.com/vcconnectasset"', now(), null),
        (v_tenant_id, 'general', 'instagram_url', '"https://instagram.com/vcconnectasset"', now(), null),
        (v_tenant_id, 'general', 'line_url', '"https://line.me/ti/p/@811slazm"', now(), null),
        (v_tenant_id, 'general', 'tiktok_url', '"https://tiktok.com/@vcconnectasset"', now(), null),
        (v_tenant_id, 'general', 'line_id', '"@vcconnectasset"', now(), null),
        (v_tenant_id, 'general', 'logo_light', '"/images/branding/vcc-asset/logo-dark.svg"', now(), null),
        (v_tenant_id, 'general', 'logo_dark', '"/images/branding/vcc-asset/logo-light.svg"', now(), null),
        (v_tenant_id, 'general', 'brand_card', '"/images/branding/vcc-asset/favicon-animated-light.svg"', now(), null),
        (v_tenant_id, 'general', 'favicon', '"/favicon.png"', now(), null)
    ON CONFLICT (tenant_id, category, key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = now();
END $$;
