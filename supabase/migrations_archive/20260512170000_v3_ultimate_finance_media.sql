-- ====================================================================
-- 💰 V3 Ultimate Enterprise Architecture (Phase 5: Finance & Ops)
-- ====================================================================

-- ==========================================
-- 1. IMMUTABLE FINANCIAL LEDGER
-- ==========================================
-- รวบรวม deals, deal_commissions, commission_adjustments, invoices
CREATE TABLE public.financial_ledger_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches_v3(id),
    
    transaction_type TEXT NOT NULL, -- 'deal_closed', 'commission_payout', 'adjustment', 'invoice_issued'
    reference_entity TEXT, -- 'deal', 'invoice'
    reference_id UUID,
    
    -- คู่สัญญา
    from_identity_id UUID REFERENCES public.identities_v3(id),
    to_identity_id UUID REFERENCES public.identities_v3(id),
    
    -- จำนวนเงิน
    amount_net NUMERIC NOT NULL,
    tax_amount NUMERIC DEFAULT 0,
    wht_amount NUMERIC DEFAULT 0,
    amount_total NUMERIC NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    
    status TEXT DEFAULT 'pending', -- pending, cleared, voided
    metadata JSONB DEFAULT '{}'::jsonb, -- เก็บ payout_slip_url, idempotency_key
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
    -- ไม่มี updated_at และ deleted_at เพราะเป็น Immutable Ledger (ห้ามแก้ ห้ามลบ ถ้าผิดให้ตี Void แล้วออกใหม่)
);

CREATE INDEX idx_ledger_v3_tenant ON public.financial_ledger_v3(tenant_id);
CREATE INDEX idx_ledger_v3_ref ON public.financial_ledger_v3(reference_entity, reference_id);

-- ==========================================
-- 2. DOCUMENTS & E-SIGNATURES
-- ==========================================
-- ยกระดับตาราง documents และ co_broker_documents
CREATE TABLE public.documents_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    
    owner_entity TEXT NOT NULL, -- 'property', 'deal', 'identity'
    owner_id UUID NOT NULL,
    
    document_type TEXT NOT NULL, -- 'contract', 'id_card', 'title_deed'
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    
    -- E-Signature Integration
    esign_envelope_id TEXT,
    esign_provider TEXT, -- 'docusign', 'signnow'
    esign_status TEXT,
    esign_signed_at TIMESTAMPTZ,
    
    -- AI Document Analysis
    ai_summary TEXT,
    ai_verified_status TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. SYNDICATION & PORTAL SYNC
-- ==========================================
-- สำหรับ Push ข้อมูลไปเว็บอื่น (DDProperty, DotProperty)
CREATE TABLE public.property_syndication_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    property_id UUID REFERENCES public.properties_core(id) ON DELETE CASCADE,
    portal_name TEXT NOT NULL,
    external_id TEXT,
    status TEXT DEFAULT 'pending',
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,
    UNIQUE(property_id, portal_name)
);

-- ==========================================
-- 4. AI OPS & METERING
-- ==========================================
-- คุมค่าใช้จ่าย AI ตามตาราง ai_usage_logs
CREATE TABLE public.ai_token_ledgers (
    id UUID DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id),
    user_id UUID REFERENCES public.identities_v3(id),
    
    feature TEXT NOT NULL, -- 'generate_desc', 'match_lead', 'ocr_document'
    model TEXT NOT NULL,
    
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    cost_thb NUMERIC(10,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Partition แรกสำหรับ Q3 2026
CREATE TABLE public.ai_token_ledgers_2026q3 PARTITION OF public.ai_token_ledgers FOR VALUES FROM ('2026-07-01') TO ('2026-10-01');
