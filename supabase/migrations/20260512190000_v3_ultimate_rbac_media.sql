-- ====================================================================
-- 🔐 V3 Ultimate Enterprise Architecture (Phase 7: RBAC, Media & Audit)
-- ====================================================================

-- ==========================================
-- 1. RBAC & ORGANIZATION STRUCTURE
-- ==========================================
-- ควบคุมสิทธิ์ (Roles), ทีม (Teams), และการเชิญพนักงาน (Invitations)
CREATE TABLE public.teams_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches_v3(id), -- ทีมนี้อยู่สาขาไหน (Option)
    
    name TEXT NOT NULL,
    manager_id UUID REFERENCES public.identities_v3(id),
    
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tenant_members_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    identity_id UUID REFERENCES public.identities_v3(id) NOT NULL,
    team_id UUID REFERENCES public.teams_v3(id),
    
    role TEXT NOT NULL DEFAULT 'agent', -- 'owner', 'admin', 'manager', 'agent'
    permissions JSONB DEFAULT '{}'::jsonb, -- สิทธิ์ย่อย (เช่น view_finance: true)
    
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, identity_id)
);

CREATE TABLE public.tenant_invitations_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    
    invited_by UUID REFERENCES public.identities_v3(id),
    status TEXT DEFAULT 'pending', -- pending, accepted, expired
    
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. ENTERPRISE MEDIA GALLERY (Images & Video)
-- ==========================================
-- ระบบจัดการรูปภาพทรัพย์สิน (แยกจาก JSONB เพื่อทำ Watermark / AI Scan)
CREATE TABLE public.property_media_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    property_id UUID REFERENCES public.properties_core(id) ON DELETE CASCADE,
    
    media_type TEXT DEFAULT 'image', -- 'image', 'video', 'floor_plan', '360_tour'
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    
    is_cover BOOLEAN DEFAULT false,
    sort_order SMALLINT DEFAULT 0,
    
    -- AI & Security
    ai_scan_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected_watermark'
    ai_scan_result JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_media_v3_prop ON public.property_media_v3(property_id, sort_order);

-- ==========================================
-- 3. TRAFFIC & AUDIT LOGGING (Partitioned)
-- ==========================================
-- ระบบแกะรอยและนับยอดวิว (Audit & Views) - ทำ Partition แยกรายเดือนเพื่อกันฐานข้อมูลบวม
CREATE TABLE public.system_audit_logs_v3 (
    id UUID DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID,
    actor_id UUID, -- ใครทำ
    
    action TEXT NOT NULL, -- 'UPDATE_PROPERTY', 'DELETE_LEAD'
    entity_table TEXT NOT NULL,
    entity_id UUID,
    
    old_data JSONB,
    new_data JSONB,
    
    client_ip TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- สร้าง Partition ล่วงหน้า (ตัวอย่าง 1 เดือน)
CREATE TABLE public.audit_logs_v3_2026_05 PARTITION OF public.system_audit_logs_v3 
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- ระบบนับ View ของเว็บ (Properties, Blogs, Services)
CREATE TABLE public.traffic_views_v3 (
    id UUID DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID,
    
    target_type TEXT NOT NULL, -- 'property', 'blog', 'service'
    target_id UUID NOT NULL,
    
    visitor_session_id TEXT, -- ระบุตัวคนดู (เผื่อยังไม่ล็อกอิน)
    identity_id UUID, -- ถ้าล็อกอินแล้ว
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE public.traffic_views_v3_2026_05 PARTITION OF public.traffic_views_v3 
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
