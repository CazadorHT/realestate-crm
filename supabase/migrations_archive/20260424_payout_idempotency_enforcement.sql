-- Phase 6.5: Financial Infrastructure Hardening
-- Date: 2026-04-24

-- 1. Enforce Idempotency Security (DB Level)
-- Drop existing non-unique index if it exists
DROP INDEX IF EXISTS public.idx_deal_comm_idempotency;

-- Create a UNIQUE index to prevent double payouts across the entire tenant
CREATE UNIQUE INDEX idx_deal_comm_idempotency_unique 
ON public.deal_commissions(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- 2. Add Tax Rate Flexibility (Enterprise Grade)
-- Default to 0.03 (3% Thailand Standard)
ALTER TABLE public.deal_commissions 
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 4) DEFAULT 0.03;

COMMENT ON COLUMN public.deal_commissions.tax_rate IS 'Dynamic tax percentage (e.g. 0.03 for 3% WHT)';
COMMENT ON INDEX idx_deal_comm_idempotency_unique IS 'The final gatekeeper: prevents any merchant/deal/payout combo from being paid twice.';
