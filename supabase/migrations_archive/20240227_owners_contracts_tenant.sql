-- Add tenant_id to Owners and Rental Contracts table
-- This is necessary for full multi-tenant isolation

-- 1. Add tenant_id columns
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.rental_contracts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 2. Add RLS Policies
-- Owners Isolation
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation: Owners" ON public.owners
FOR ALL USING (
    tenant_id IN (SELECT get_user_tenants())
);

-- Rental Contracts Isolation
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant Isolation: Rental Contracts" ON public.rental_contracts
FOR ALL USING (
    tenant_id IN (SELECT get_user_tenants())
);

-- Note: Existing data will have NULL tenant_id. 
-- In production, you should assign them to a default tenant or actual owner/contract branch.
