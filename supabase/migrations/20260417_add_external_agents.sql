-- Migration: Add External Agents (Co-Agents) Centralized Table
-- This table allows to store external partners data in a directory-like structure.

CREATE TABLE IF NOT EXISTS public.external_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    line_id TEXT,
    whatsapp TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.external_agents ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "External Agents: View members of their tenant" ON public.external_agents;
DROP POLICY IF EXISTS "External Agents: Manage members of their tenant" ON public.external_agents;
DROP POLICY IF EXISTS "External Agents: Admins manage all" ON public.external_agents;
DROP POLICY IF EXISTS "External Agents: Agents can view their tenant directory" ON public.external_agents;
DROP POLICY IF EXISTS "External Agents: Agents can insert into their tenant" ON public.external_agents;

-- Policies: Members of the tenant can manage/view their own branch partners
CREATE POLICY "External Agents: View members of their tenant"
    ON public.external_agents
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_members
            WHERE tenant_members.tenant_id = external_agents.tenant_id
            AND tenant_members.profile_id = auth.uid()
        )
    );

CREATE POLICY "External Agents: Manage members of their tenant"
    ON public.external_agents
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.tenant_members
            WHERE tenant_members.tenant_id = external_agents.tenant_id
            AND tenant_members.profile_id = auth.uid()
            AND tenant_members.role IN ('ADMIN', 'MANAGER')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tenant_members
            WHERE tenant_members.tenant_id = tenant_id
            AND tenant_members.profile_id = auth.uid()
            AND tenant_members.role IN ('ADMIN', 'MANAGER', 'AGENT')
        )
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_external_agents_updated_at ON public.external_agents;
CREATE TRIGGER update_external_agents_updated_at
    BEFORE UPDATE ON public.external_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add Indexes for faster search
CREATE INDEX IF NOT EXISTS idx_external_agents_tenant ON public.external_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_external_agents_name ON public.external_agents(name);
CREATE INDEX IF NOT EXISTS idx_external_agents_phone ON public.external_agents(phone);

-- Grant Access
GRANT ALL ON public.external_agents TO authenticated;
GRANT ALL ON public.external_agents TO service_role;
