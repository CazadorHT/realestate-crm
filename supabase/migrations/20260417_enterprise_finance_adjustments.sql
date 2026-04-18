-- Phase 6.2: Enterprise Financial Hardening - Adjustments & Audit
-- 1. Create Commission Adjustments Table
-- This table allows for +/- adjustments (marketing fees, bonuses, etc.) per payout.
CREATE TABLE IF NOT EXISTS public.commission_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commission_id UUID NOT NULL REFERENCES public.deal_commissions(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL, -- Positive for bonuses, negative for deductions
    adjustment_type TEXT NOT NULL DEFAULT 'OTHER', -- 'MARKETING', 'FEE', 'BONUS', 'OTHER'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- 2. Add Precision & Idempotency to Deal Commissions
ALTER TABLE public.deal_commissions 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
ADD COLUMN IF NOT EXISTS payout_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Security Hardening: RLS for Adjustments
ALTER TABLE public.commission_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Adjustments: Admins manage all" 
ON public.commission_adjustments FOR ALL
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN' AND tenant_id = commission_adjustments.tenant_id)
);

CREATE POLICY "Adjustments: Agents view their own" 
ON public.commission_adjustments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.deal_commissions dc 
        WHERE dc.id = commission_adjustments.commission_id 
        AND dc.agent_id = auth.uid()
    )
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_commission_adj_comm_id ON public.commission_adjustments(commission_id);
CREATE INDEX IF NOT EXISTS idx_deal_comm_idempotency ON public.deal_commissions(idempotency_key);

-- 4. Create a View for "Net Payout" calculation
-- Helps the finance dashboard pull the "True Transfer" amount instantly.
CREATE OR REPLACE VIEW public.view_commission_payout_summaries AS
SELECT 
    dc.id AS commission_id,
    dc.deal_id,
    dc.agent_id,
    dc.amount AS gross_amount,
    dc.wht_amount, -- Adjusted to match column name in your schema
    COALESCE(SUM(ca.amount), 0) AS total_adjustments,
    (dc.amount - dc.wht_amount + COALESCE(SUM(ca.amount), 0)) AS net_payout_amount,
    dc.status,
    dc.tenant_id
FROM 
    public.deal_commissions dc
LEFT JOIN 
    public.commission_adjustments ca ON dc.id = ca.commission_id
GROUP BY 
    dc.id;
