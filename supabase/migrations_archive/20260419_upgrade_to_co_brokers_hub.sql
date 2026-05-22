-- Migrate external_agents to co_brokers and enhance for CRM Phase 7
-- Date: 2026-04-19

-- 1. Rename existing table if it exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'external_agents' AND table_schema = 'public') THEN
    ALTER TABLE public.external_agents RENAME TO co_brokers;
    -- Update existing indexes if needed
    ALTER INDEX IF EXISTS idx_external_agents_tenant RENAME TO idx_co_brokers_tenant;
    ALTER INDEX IF EXISTS idx_external_agents_name RENAME TO idx_co_brokers_name;
    ALTER INDEX IF EXISTS idx_external_agents_phone RENAME TO idx_co_brokers_phone;
  ELSE
    -- Create fresh if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.co_brokers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      company_name TEXT,
      phone TEXT,
      line_id TEXT,
      whatsapp TEXT,
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id)
    );
  END IF;
END $$;

-- 2. Add new fields and enhancements
ALTER TABLE public.co_brokers 
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS specialized_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS property_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS tax_address TEXT,
ADD COLUMN IF NOT EXISTS standard_commission_rate NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Create Indexes for Search Optimization (Array indexing)
CREATE INDEX IF NOT EXISTS idx_co_brokers_areas ON public.co_brokers USING GIN (specialized_areas);
CREATE INDEX IF NOT EXISTS idx_co_brokers_property_types ON public.co_brokers USING GIN (property_types);
CREATE INDEX IF NOT EXISTS idx_co_brokers_deleted_at ON public.co_brokers(deleted_at) WHERE deleted_at IS NULL;

-- 4. Update Properties Linkage
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'external_agent_id') THEN
    ALTER TABLE public.properties RENAME COLUMN external_agent_id TO co_broker_id;
  ELSE
    ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS co_broker_id UUID REFERENCES public.co_brokers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Update Deals & Commissions Linkage
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS partner_co_broker_id UUID REFERENCES public.co_brokers(id) ON DELETE SET NULL;
ALTER TABLE public.deal_commissions ADD COLUMN IF NOT EXISTS co_broker_id UUID REFERENCES public.co_brokers(id) ON DELETE SET NULL;

-- 6. RLS Policies
ALTER TABLE public.co_brokers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Co-brokers: View shared tenant directory" ON public.co_brokers;
CREATE POLICY "Co-brokers: View shared tenant directory"
    ON public.co_brokers FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_members WHERE profile_id = auth.uid()
        )
        AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS "Co-brokers: Manage shared tenant directory" ON public.co_brokers;
CREATE POLICY "Co-brokers: Manage shared tenant directory"
    ON public.co_brokers FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.tenant_members WHERE profile_id = auth.uid()
        )
    );

-- 7. Audit Logging (Basic Trigger)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_co_brokers_updated_at ON public.co_brokers;
CREATE TRIGGER tr_co_brokers_updated_at
    BEFORE UPDATE ON public.co_brokers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.co_brokers IS 'CRM Hub for external co-brokers and partners (Phase 7)';
