-- Branch Invitations

CREATE TABLE IF NOT EXISTS public.tenant_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'AGENT', 'VIEWER')),
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED')),
    token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days') NOT NULL,
    UNIQUE(tenant_id, email)
);

-- RLS for invitations (Admin of the tenant can see them)
ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations" ON public.tenant_invitations
FOR ALL USING (
    tenant_id IN (
        SELECT tm.tenant_id 
        FROM public.tenant_members tm 
        WHERE tm.profile_id = auth.uid() AND tm.role IN ('OWNER', 'ADMIN')
    )
);
