-- 1. Create CRM Deals V3 table (Refined & Hardened)
CREATE TABLE IF NOT EXISTS public.crm_deals_v3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches_v3(id) ON DELETE SET NULL,
    
    -- Relationships (Unified Identity Architecture)
    lead_id UUID REFERENCES public.crm_leads_v3(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties_core(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.identities_v3(id) ON DELETE SET NULL,
    
    -- Deal Info
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEGOTIATING', -- NEGOTIATING, SIGNED, CANCELLED, CLOSED_WIN, CLOSED_LOSS
    deal_type TEXT NOT NULL, -- SALE, RENT
    
    -- Financial Highlights (High Precision)
    currency TEXT DEFAULT 'THB',
    total_amount NUMERIC(15, 2) DEFAULT 0,
    commission_amount NUMERIC(15, 2) DEFAULT 0,
    commission_percent NUMERIC(5, 2) DEFAULT 0,
    
    -- Dates & Pipeline Tracking
    transaction_date TIMESTAMP WITH TIME ZONE,
    transaction_end_date TIMESTAMP WITH TIME ZONE,
    undetermined_date BOOLEAN DEFAULT false, -- For flexible rent/sale dates
    expected_closed_at TIMESTAMP WITH TIME ZONE, -- For Forecasting
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Co-broker Info (Linked to V3 Identities)
    co_agent_name TEXT,
    co_agent_contact TEXT,
    co_agent_online TEXT,
    partner_co_broker_id UUID REFERENCES public.identities_v3(id),
    
    -- Metadata & AI Integration
    source TEXT,
    metadata JSONB DEFAULT '{}', -- Supports AI summaries, custom fields, and tags
    created_by UUID REFERENCES public.identities_v3(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add Indexes for High-Performance Lookups
CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_tenant_id ON public.crm_deals_v3 (tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_branch_id ON public.crm_deals_v3 (branch_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_agent_id ON public.crm_deals_v3 (agent_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_status ON public.crm_deals_v3 (status);
CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_lead_id ON public.crm_deals_v3 (lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_property_id ON public.crm_deals_v3 (property_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_created_at ON public.crm_deals_v3 (created_at DESC);

-- 3. Create a compatibility view for legacy application support
CREATE OR REPLACE VIEW public.deals AS
SELECT 
    id,
    tenant_id,
    lead_id,
    property_id,
    agent_id as assigned_to,
    title,
    status,
    deal_type,
    total_amount,
    commission_amount,
    commission_percent,
    transaction_date,
    transaction_end_date,
    undetermined_date,
    co_agent_name,
    co_agent_contact,
    co_agent_online,
    partner_co_broker_id,
    created_by,
    created_at,
    updated_at
FROM public.crm_deals_v3;
