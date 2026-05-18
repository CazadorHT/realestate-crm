-- 1. Create Pure CRM Deals V3 table (Zero Ledger, Zero View)
CREATE TABLE IF NOT EXISTS public.crm_deals_v3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    branch_id UUID,
    
    -- Relationships
    lead_id UUID REFERENCES public.crm_leads_v3(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties_core(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.identities_v3(id) ON DELETE SET NULL,
    
    -- Deal Info
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'NEGOTIATING', -- NEGOTIATING, SIGNED, CANCELLED, CLOSED_WIN, CLOSED_LOSS
    deal_type TEXT NOT NULL, -- SALE, RENT
    
    -- Financial Summary (Directly in table for speed)
    currency TEXT DEFAULT 'THB',
    total_amount NUMERIC(15, 2) DEFAULT 0,
    commission_total NUMERIC(15, 2) DEFAULT 0,
    vat_amount NUMERIC(15, 2) DEFAULT 0,
    wht_amount NUMERIC(15, 2) DEFAULT 0,
    net_received NUMERIC(15, 2) DEFAULT 0,
    
    -- Dates
    transaction_date DATE,
    transaction_end_date DATE,
    closed_at TIMESTAMP WITH TIME ZONE,
    undetermined_date BOOLEAN DEFAULT false,
    
    -- Additional Info
    co_agent_name TEXT,
    co_agent_contact TEXT,
    co_agent_online TEXT,
    partner_co_broker_id UUID REFERENCES public.identities_v3(id),
    
    source TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES public.identities_v3(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create Pure Deal Commissions V3 table (Replaces Ledger for Splits)
CREATE TABLE IF NOT EXISTS public.crm_deal_commissions_v3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES public.crm_deals_v3(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    recipient_id UUID REFERENCES public.identities_v3(id),
    recipient_role TEXT NOT NULL, -- LISTING, CLOSING, CO_BROKER, AGENCY, TEAM_POOL
    
    percentage NUMERIC(5, 2) DEFAULT 0,
    amount NUMERIC(15, 2) DEFAULT 0,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    net_amount NUMERIC(15, 2) DEFAULT 0,
    
    status TEXT DEFAULT 'UNPAID', -- UNPAID, PAID
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. High Performance Indexes
CREATE INDEX IF NOT EXISTS idx_v3_deals_tenant_status ON public.crm_deals_v3 (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_v3_deals_agent ON public.crm_deals_v3 (agent_id);
CREATE INDEX IF NOT EXISTS idx_v3_commissions_deal ON public.crm_deal_commissions_v3 (deal_id);
CREATE INDEX IF NOT EXISTS idx_v3_commissions_recipient ON public.crm_deal_commissions_v3 (recipient_id);

-- 4. Enable Row Level Security (RLS) and Tenant Isolation Policies
ALTER TABLE public.crm_deals_v3 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deal_commissions_v3 ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access deals within their tenant
CREATE POLICY "deals_v3_tenant_isolation" ON public.crm_deals_v3
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members_v3 
      WHERE tenant_members_v3.tenant_id = crm_deals_v3.tenant_id 
        AND tenant_members_v3.identity_id = auth.uid()
    )
  );

-- Policy: Users can access commissions within their tenant
CREATE POLICY "commissions_v3_tenant_isolation" ON public.crm_deal_commissions_v3
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members_v3 
      WHERE tenant_members_v3.tenant_id = crm_deal_commissions_v3.tenant_id 
        AND tenant_members_v3.identity_id = auth.uid()
    )
  );
