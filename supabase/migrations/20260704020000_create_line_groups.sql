-- Create LINE groups table
CREATE TABLE IF NOT EXISTS public.line_groups (
    group_id TEXT PRIMARY KEY,
    group_name TEXT NOT NULL,
    picture_url TEXT,
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.line_groups ENABLE ROW LEVEL SECURITY;

-- Drop isolation policy if it exists
DROP POLICY IF EXISTS "Tenant Isolation: LINE Groups" ON public.line_groups;

-- Create policy allowing tenant members or unclaimed groups
CREATE POLICY "Tenant Isolation: LINE Groups" ON public.line_groups
FOR ALL USING (
    tenant_id = ANY (public.get_user_tenants())
    OR tenant_id IS NULL
);

-- Allow authenticated and service_role access
GRANT ALL ON TABLE public.line_groups TO authenticated;
GRANT ALL ON TABLE public.line_groups TO service_role;
GRANT ALL ON TABLE public.line_groups TO anon;
