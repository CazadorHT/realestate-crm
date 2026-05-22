-- 1. Add tenant_id to documents table
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 2. Create Index for performance
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);

-- 3. Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Tenant Isolation: Documents" ON public.documents;
CREATE POLICY "Tenant Isolation: Documents" ON public.documents
FOR ALL USING (
    tenant_id IN (SELECT get_user_tenants())
    OR tenant_id IS NULL -- Legacy/Global data support
);
-- 4. Backfill Legacy Data
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM public.tenants ORDER BY created_at ASC LIMIT 1;
    
    IF default_tenant_id IS NOT NULL THEN
        UPDATE public.documents SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;
END $$;

-- 5. Backfill Legacy Data (Optional/Recommended)
-- In this case, we'll keep it as NULL for now but provide a snippet for the user if they want to assign it.
-- UPDATE public.documents SET tenant_id = (SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1) WHERE tenant_id IS NULL;
