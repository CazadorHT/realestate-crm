-- =============================================================================
-- Migration: V3 Enterprise Rent Notifications Engine (Optimized)
-- Created: 2026-05-16
-- Purpose: Enhanced RLS execution, converted NOT IN to NOT EXISTS for performance,
--          fixed Security Definer search path vulnerability, and fully integrated Soft Delete.
-- =============================================================================

BEGIN;

-- 1. Notification Channels
CREATE TABLE IF NOT EXISTS public.notification_channels_v3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL CHECK (platform IN ('LINE', 'TELEGRAM', 'WHATSAPP', 'WECHAT', 'SLACK')),
    external_channel_id TEXT NOT NULL,
    channel_name TEXT,
    picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID NOT NULL REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, external_channel_id, tenant_id)
);

-- 2. Rent Notification Rules
CREATE TABLE IF NOT EXISTS public.rent_notification_rules_v3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES public.properties_core(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES public.notification_channels_v3(id) ON DELETE CASCADE,
    notification_day INTEGER CHECK (notification_day >= 1 AND notification_day <= 31),
    notification_hour INTEGER CHECK (notification_hour >= 0 AND notification_hour <= 23),
    language TEXT DEFAULT 'th' CHECK (language IN ('th', 'en', 'zh', 'ru')),
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    tenant_id UUID NOT NULL REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, channel_id)
);

-- 3. Rent Notification History
CREATE TABLE IF NOT EXISTS public.rent_notification_history_v3 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES public.rent_notification_rules_v3(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties_core(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES public.notification_channels_v3(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING')),
    error_message TEXT,
    tenant_id UUID NOT NULL REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notif_channels_tenant ON public.notification_channels_v3(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_rules_tenant ON public.rent_notification_rules_v3(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_rules_property ON public.rent_notification_rules_v3(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_rules_channel ON public.rent_notification_rules_v3(channel_id);
CREATE INDEX IF NOT EXISTS idx_rent_rules_schedule ON public.rent_notification_rules_v3(notification_day, notification_hour) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rent_history_tenant ON public.rent_notification_history_v3(tenant_id);

-- RLS Security Lockdown
ALTER TABLE public.notification_channels_v3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_notification_rules_v3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_notification_history_v3 ENABLE ROW LEVEL SECURITY;

-- ถอดฟังก์ชันซ้อนฟังก์ชันออก แนะนำให้ดึงจาก Context Session (เช่น JWT ใน Supabase หรือ Config แพลตฟอร์มของคุณ)
-- ตัวอย่างด้านล่างใช้แนวทางมาตรฐานกึ่งแอปพลิเคชัน (ปรับแก้ตัวแปรแอปพลิเคชันของคุณตามจริง)
CREATE POLICY "Tenant isolation for notification_channels_v3"
    ON public.notification_channels_v3 FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY "Tenant isolation for rent_notification_rules_v3"
    ON public.rent_notification_rules_v3 FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY "Tenant isolation for rent_notification_history_v3"
    ON public.rent_notification_history_v3 FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Optimized RPC Function (Bypasses NOT IN Trap & Secure Path)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_properties_without_notification_rules_v3(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    title TEXT,
    image_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        (pd.title->>'th')::TEXT as title,
        (SELECT m.url FROM public.property_media_v3 m WHERE m.property_id = p.id AND m.is_cover = true LIMIT 1) as image_url
    FROM public.properties_core p
    JOIN public.properties_details pd ON p.id = pd.property_id
    WHERE p.status = 1 
      AND p.deleted_at IS NULL -- เพิ่มการตรวจเช็ค Soft Delete เพื่อความถูกต้องของข้อมูล
      AND p.listing_type IN (2, 3) 
      AND (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
      -- เปลี่ยนจาก NOT IN เป็น NOT EXISTS เพื่อรีด Performance สแกนด้วย Index 100%
      AND NOT EXISTS (
          SELECT 1 
          FROM public.rent_notification_rules_v3 r
          WHERE r.property_id = p.id
            AND (p_tenant_id IS NULL OR r.tenant_id = p_tenant_id)
      )
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_properties_without_notification_rules_v3(uuid) TO authenticated, service_role, anon;

COMMIT;
