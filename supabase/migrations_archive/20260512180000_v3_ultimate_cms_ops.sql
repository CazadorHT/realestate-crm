-- ====================================================================
-- 🌐 V3 Ultimate Enterprise Architecture (Phase 6: CMS, Config & Ops)
-- ====================================================================

-- ==========================================
-- 1. CMS & MARKETING ENGINE (Global JSONB)
-- ==========================================
-- ควบรวม Blogs, FAQs, Services, Popular Areas ไว้ในโครงสร้างที่คลีนขึ้น
CREATE TABLE public.cms_content_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    
    content_type TEXT NOT NULL, -- 'blog', 'faq', 'service', 'popular_area', 'landing_page'
    
    title JSONB NOT NULL, -- รองรับ 4 ภาษา (TH, EN, CN, RU)
    slug TEXT NOT NULL,
    
    content JSONB, -- เนื้อหาหลัก
    cover_image TEXT,
    
    -- SEO & Meta
    meta_data JSONB DEFAULT '{}'::jsonb, -- keywords, meta_desc
    seo_score SMALLINT,
    
    -- Publishing
    author_id UUID REFERENCES public.identities_v3(id),
    status TEXT DEFAULT 'draft', -- draft, published, archived
    published_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, content_type, slug)
);

CREATE INDEX idx_cms_v3_tenant ON public.cms_content_v3(tenant_id);
CREATE INDEX idx_cms_v3_type ON public.cms_content_v3(content_type);

-- ==========================================
-- 2. GLOBAL SYSTEM & TENANT SETTINGS
-- ==========================================
-- ควบรวม site_settings, smart_match_settings, features
CREATE TABLE public.system_settings_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    
    category TEXT NOT NULL, -- 'smart_match', 'branding', 'features_list', 'payment_gateways'
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.identities_v3(id),
    UNIQUE(tenant_id, category, key)
);

-- ตาราง Reference กลาง (เช่น รายชื่อธนาคาร)
CREATE TABLE public.ref_master_data (
    type TEXT NOT NULL, -- 'bank', 'property_type', 'currency'
    code TEXT NOT NULL,
    label JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order SMALLINT DEFAULT 0,
    PRIMARY KEY (type, code)
);

-- ==========================================
-- 3. NOTIFICATIONS & BACKGROUND OPS
-- ==========================================
-- แจ้งเตือนผู้ใช้และจัดการ Cron Jobs (แทนที่ background_tasks และ rent_notifications)
CREATE TABLE public.notifications_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    
    user_id UUID REFERENCES public.identities_v3(id) NOT NULL,
    
    type TEXT NOT NULL, -- 'system', 'rent_due', 'new_lead', 'ai_alert'
    title TEXT NOT NULL,
    message TEXT,
    link_url TEXT,
    
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Background Task Queue สำหรับประมวลผลหนักๆ (ส่ง Email, Sync Portals)
CREATE TABLE public.system_task_queue (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    task_name TEXT NOT NULL,
    payload JSONB,
    priority SMALLINT DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    error_log TEXT,
    run_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_task_queue_status ON public.system_task_queue(status, run_at);

-- ==========================================
-- 4. REALTIME PUBLICATION CONFIG
-- ==========================================
-- เปิดใช้งาน Realtime สำหรับ notifications_v3
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications_v3'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_v3;
    END IF;
END
$$;
