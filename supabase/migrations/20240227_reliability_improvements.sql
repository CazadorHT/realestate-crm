-- Reliability Improvements Migration

-- 1. Add Soft Delete to Tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    performed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Update Tenant Member Role Constraint to include MANAGER
ALTER TABLE public.tenant_members DROP CONSTRAINT IF EXISTS tenant_members_role_check;
ALTER TABLE public.tenant_members ADD CONSTRAINT tenant_members_role_check CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'AGENT', 'VIEWER'));

-- 4. Atomic Member Transfer RPC
CREATE OR REPLACE FUNCTION public.transfer_tenant_member(
    p_profile_id UUID,
    p_from_tenant_id UUID,
    p_to_tenant_id UUID,
    p_role TEXT,
    p_admin_id UUID
) RETURNS VOID AS $$
BEGIN
    -- 1. Check if user is already in target tenant
    IF EXISTS (SELECT 1 FROM public.tenant_members WHERE tenant_id = p_to_tenant_id AND profile_id = p_profile_id) THEN
        RAISE EXCEPTION 'User is already a member of the target branch';
    END IF;

    -- 2. Insert into new tenant
    INSERT INTO public.tenant_members (tenant_id, profile_id, role)
    VALUES (p_to_tenant_id, p_profile_id, p_role);

    -- 3. Delete from old tenant
    DELETE FROM public.tenant_members
    WHERE tenant_id = p_from_tenant_id AND profile_id = p_profile_id;

    -- 4. Log the transfer
    INSERT INTO public.audit_logs (action, table_name, record_id, metadata, performed_by)
    VALUES (
        'MEMBER_TRANSFER',
        'tenant_members',
        p_profile_id,
        jsonb_build_object(
            'from_tenant_id', p_from_tenant_id,
            'to_tenant_id', p_to_tenant_id,
            'role', p_role
        ),
        p_admin_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
