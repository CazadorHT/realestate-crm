-- ====================================================================
-- 💬 V3 Ultimate Enterprise Architecture (Phase 4: CRM & Omni-Channel)
-- ====================================================================

-- ==========================================
-- 1. OMNI-CHANNEL HUB (Unified Messaging)
-- ==========================================
-- แทนที่ตาราง communications_hub_v3, line_groups, line_templates เดิม
CREATE TABLE public.communications_hub_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches_v3(id),
    
    identity_id UUID REFERENCES public.identities_v3(id), -- ใครคือคนคุย
    
    platform TEXT NOT NULL, -- 'LINE', 'FACEBOOK', 'WHATSAPP', 'EMAIL', 'SYSTEM'
    external_thread_id TEXT, -- e.g., Line Group ID หรือ Chat ID
    external_message_id TEXT, 
    
    direction SMALLINT NOT NULL, -- 0=Inbound(ลูกค้าทักมา), 1=Outbound(เราทักไป)
    message_type TEXT DEFAULT 'text', -- 'text', 'image', 'template', 'location'
    content TEXT,
    payload JSONB, -- เก็บ JSON ต้นฉบับจาก webhook
    
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comms_hub_tenant ON public.communications_hub_v3(tenant_id);
CREATE INDEX idx_comms_hub_identity ON public.communications_hub_v3(identity_id);
CREATE INDEX idx_comms_hub_thread ON public.communications_hub_v3(external_thread_id);

-- ==========================================
-- 2. SMART LEADS & PIPELINE
-- ==========================================
-- ยกระดับจากตาราง leads เดิม
CREATE TABLE public.crm_leads_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    identity_id UUID REFERENCES public.identities_v3(id) NOT NULL,
    
    assigned_to UUID REFERENCES public.identities_v3(id), -- Agent ที่ดูแล
    
    status TEXT DEFAULT 'new',
    stage TEXT DEFAULT 'awareness',
    
    -- Filterable Requirements (ย้ายจาก JSONB มาเป็น Column เพื่อความเร็ว)
    budget_min NUMERIC,
    budget_max NUMERIC,
    min_bedrooms SMALLINT,
    preferred_locations TEXT[], -- เก็บเป็น Array ของ h3_index หรือ slug
    
    -- AI & Matching
    requirements_embedding vector(1536),
    ai_score NUMERIC(5,2),
    ai_summary TEXT,
    
    -- UTM & Source Tracking
    source TEXT,
    utm_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. ACTIVITY TIMELINE & TRIGGERS
-- ==========================================
-- รวบรวม lead_activities, maintenance_logs, proactive_agent_triggers
CREATE TABLE public.activity_timeline_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    
    actor_id UUID REFERENCES public.identities_v3(id), -- ใครทำ (Agent / System)
    
    target_entity TEXT NOT NULL, -- 'property', 'lead', 'deal', 'identity'
    target_id UUID NOT NULL,
    
    activity_type TEXT NOT NULL, -- 'viewed', 'called', 'maintenance', 'ai_trigger'
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- เก็บข้อมูลจิปาถะ เช่น visitor_id, ai_reasons
    
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_target ON public.activity_timeline_v3(target_entity, target_id);
