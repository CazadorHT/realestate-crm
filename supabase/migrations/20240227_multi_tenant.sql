-- 1. Create Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    subscription_status TEXT DEFAULT 'TRIAL' CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'ENTERPRISE')),
    stripe_customer_id TEXT,
    omise_customer_id TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create Tenant Members (Linking Users to Tenants)
CREATE TABLE IF NOT EXISTS public.tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'AGENT', 'VIEWER')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(tenant_id, profile_id)
);

-- 3. Add tenant_id to Core Tables
-- Note: In a real migration, you would assign a default tenant_id to existing data.
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 4. Enable RLS on Tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function for RLS (Get Current User's Active Tenants)
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS TABLE (tenant_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT tm.tenant_id
    FROM public.tenant_members tm
    WHERE tm.profile_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies for Tenant-Level Isolation
-- Example for Properties
CREATE POLICY "Tenant Isolation: Properties" ON public.properties
FOR ALL USING (
    tenant_id IN (SELECT get_user_tenants())
);

-- Example for Leads
CREATE POLICY "Tenant Isolation: Leads" ON public.leads
FOR ALL USING (
    tenant_id IN (SELECT get_user_tenants())
);

-- Example for Tenant Members (Allow viewing colleagues)
CREATE POLICY "View Members in Same Tenant" ON public.tenant_members
FOR SELECT USING (
    tenant_id IN (SELECT get_user_tenants())
);
