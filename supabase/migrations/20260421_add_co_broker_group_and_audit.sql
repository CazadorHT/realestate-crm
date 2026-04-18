-- Add group support for co-brokers and refine audit integration
-- Phase 7.4 & Phase 8

BEGIN;

-- 1. Add broker_group column to co_brokers
ALTER TABLE public.co_brokers 
ADD COLUMN IF NOT EXISTS broker_group TEXT DEFAULT 'GENERAL';

-- 2. Add index for faster filtering by group
CREATE INDEX IF NOT EXISTS idx_co_brokers_group ON public.co_brokers(broker_group);

-- 3. (Optional) If we want a stricter set of groups, we could use a CHECK constraint
-- ALTER TABLE public.co_brokers 
-- ADD CONSTRAINT check_valid_group CHECK (broker_group IN ('GENERAL', 'VIP', 'PARTNER', 'BLACKLIST'));

COMMIT;
