-- 1. Create a function to search for leads globally (Cross-Tenant)
-- This is a SECURITY DEFINER function to bypass RLS for duplicate checking only.
-- It returns masked data to preserve privacy between branches.

CREATE OR REPLACE FUNCTION public.search_leads_globally(search_phone TEXT, search_email TEXT)
RETURNS TABLE (
    found BOOLEAN,
    branch_name TEXT,
    assigned_agent_name TEXT,
    masked_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Essential: allows searching across all tenants regardless of RLS
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE,
        t.name as branch_name,
        p.full_name as assigned_agent_name,
        -- Mask the name for privacy (e.g., "Somchai" -> "S***i")
        regexp_replace(l.full_name, '^(.).*(.)$', '\1***\2') as masked_name
    FROM public.leads l
    JOIN public.tenants t ON l.tenant_id = t.id
    LEFT JOIN public.profiles p ON l.assigned_to = p.id
    WHERE 
        (l.phone = search_phone AND search_phone IS NOT NULL AND search_phone <> '')
        OR (l.email = search_email AND search_email IS NOT NULL AND search_email <> '')
    LIMIT 1;
END;
$$;

-- 2. Create lead_transfers table for Option 3
CREATE TABLE IF NOT EXISTS public.lead_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    from_tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    to_tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    requested_by UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, CANCELLED
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable RLS and basic policies for lead_transfers
ALTER TABLE public.lead_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see transfers involving their tenants" ON public.lead_transfers
FOR SELECT USING (
    from_tenant_id IN (SELECT get_user_tenants()) OR 
    to_tenant_id IN (SELECT get_user_tenants())
);

CREATE POLICY "Users can create transfers from their tenants" ON public.lead_transfers
FOR INSERT WITH CHECK (
    from_tenant_id IN (SELECT get_user_tenants())
);
