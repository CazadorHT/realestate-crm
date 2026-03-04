-- 0. Helper function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create table for advanced commission splits
CREATE TYPE public.commission_role AS ENUM (
    'LISTING',
    'CLOSING',
    'AGENCY',
    'CO_AGENT',
    'TEAM_POOL'
);

CREATE TYPE public.commission_status AS ENUM (
    'PENDING',
    'PAID',
    'CANCELLED'
);

CREATE TABLE IF NOT EXISTS public.deal_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role public.commission_role NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    wht_amount NUMERIC(15, 2) NOT NULL DEFAULT 0, -- 3% WHT
    net_amount NUMERIC(15, 2) NOT NULL DEFAULT 0, -- amount after WHT
    status public.commission_status NOT NULL DEFAULT 'PENDING',
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure amounts match (percentage * total_commission / 100) is handled in app logic or trigger
    -- Indexing for leaderboard and reporting
    CONSTRAINT deal_commissions_percentage_check CHECK (percentage >= 0 AND percentage <= 100)
);

-- Add indices
CREATE INDEX idx_deal_commissions_deal_id ON public.deal_commissions(deal_id);
CREATE INDEX idx_deal_commissions_agent_id ON public.deal_commissions(agent_id);
CREATE INDEX idx_deal_commissions_tenant_id ON public.deal_commissions(tenant_id);
CREATE INDEX idx_deal_commissions_role ON public.deal_commissions(role);

-- Enable RLS
ALTER TABLE public.deal_commissions ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified, usually matching existing patterns)
CREATE POLICY "Users can view their own tenant's commissions" ON public.deal_commissions
    FOR SELECT USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE tenant_id = deal_commissions.tenant_id
    ));

CREATE POLICY "Admins can manage commissions" ON public.deal_commissions
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'ADMIN' AND tenant_id = deal_commissions.tenant_id
    ));

-- Trigger for updated_at
CREATE TRIGGER set_deal_commissions_updated_at
    BEFORE UPDATE ON public.deal_commissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
