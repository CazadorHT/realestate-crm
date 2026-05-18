-- ====================================================================
-- 👤 V3 Ultimate Enterprise Architecture (Phase 2: Universal User 360 & Linking)
-- ====================================================================

-- ==========================================
-- 1. THE UNIVERSAL IDENTITY HUB
-- ==========================================
CREATE TABLE public.identities_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    
    -- Category: 1=Internal(Staff), 2=External(Client/Owner/Agent), 3=System(API/Bot)
    category SMALLINT DEFAULT 2, 
    role TEXT DEFAULT 'USER',
    
    display_name TEXT,
    avatar_url TEXT,
    
    -- Fast Lookups (Indexed)
    email TEXT,
    phone TEXT,
    line_id TEXT,
    
    -- Extensible JSONB for other platforms (WeChat, FB, WhatsApp)
    social_links JSONB DEFAULT '{}'::jsonb,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_identities_v3_tenant ON public.identities_v3(tenant_id);
CREATE INDEX idx_identities_v3_phone ON public.identities_v3(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_identities_v3_email ON public.identities_v3(email) WHERE email IS NOT NULL;

-- ==========================================
-- 2. ENCRYPTED SECRETS (Vault/PDPA)
-- ==========================================
CREATE TABLE public.identity_secrets_v3 (
    identity_id UUID PRIMARY KEY REFERENCES public.identities_v3(id) ON DELETE CASCADE,
    full_name_encrypted TEXT,
    id_card_encrypted TEXT,
    bank_account_encrypted TEXT,
    tax_info JSONB, -- Address, Tax ID
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. THE "SECRET SAUCE": IDENTITY LINKING ENGINE
-- ==========================================
-- เมื่อดึงข้อมูลจากหลายเว็บ เจ้าของคนเดียวกันอาจจะสร้างโปรไฟล์หลายอัน
-- ตารางนี้จะช่วย Map ข้อมูลจากแหล่งต่างๆ กลับมาที่ Master Identity เดียว

CREATE TABLE public.identity_sources_map (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    master_identity_id UUID REFERENCES public.identities_v3(id) ON DELETE CASCADE,
    source_id TEXT REFERENCES public.data_sources(id), -- 'ddproperty', 'livinginsider'
    external_user_id TEXT NOT NULL,
    external_user_name TEXT,
    external_phone TEXT,
    confidence_score NUMERIC DEFAULT 1.0, -- 1.0 = Manual verify, 0.8 = AI Matched
    linked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (source_id, external_user_id)
);

CREATE INDEX idx_id_sources_map_master ON public.identity_sources_map(master_identity_id);

-- ==========================================
-- 4. IDENTITY MATCHING LOGIC (Rules Engine)
-- ==========================================
-- เก็บกฎเกณฑ์หรือประวัติที่ AI ใช้ในการรวมบัญชี (Merge)
CREATE TABLE public.identity_match_logs (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    source_identity_a UUID, -- อาจจะเป็น ID ดิบจาก Ingestion
    source_identity_b UUID,
    matched_master_id UUID REFERENCES public.identities_v3(id),
    match_reason TEXT, -- 'Exact phone match', 'Line ID + Name match'
    ai_confidence FLOAT,
    status SMALLINT DEFAULT 0, -- 0=Pending Review, 1=Auto-Merged, 2=Rejected
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 5. TRIGGER FOR UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_v3_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_identities_v3_updated_at BEFORE UPDATE ON public.identities_v3 FOR EACH ROW EXECUTE FUNCTION public.update_v3_updated_at();
