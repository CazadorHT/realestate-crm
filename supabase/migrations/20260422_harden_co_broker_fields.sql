-- Hardening Co-Broker Fields to match Enterprise Schema
-- Date: 2026-04-22

DO $$ 
BEGIN 
  -- 1. Rename 'company' to 'company_name' if it exists (legacy from external_agents)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'co_brokers' AND column_name = 'company' AND table_schema = 'public') THEN
    ALTER TABLE public.co_brokers RENAME COLUMN company TO company_name;
  END IF;

  -- 2. Ensure all audit logs for co_brokers use the correct entity name
  UPDATE public.audit_logs 
  SET entity = 'CO_BROKER' 
  WHERE entity = 'external_agents' OR entity = 'co_brokers';

END $$;

-- 3. Add index for company_name search performance
CREATE INDEX IF NOT EXISTS idx_co_brokers_company_name ON public.co_brokers(company_name);

COMMENT ON COLUMN public.co_brokers.company_name IS 'Official company or agency name of the partner';
