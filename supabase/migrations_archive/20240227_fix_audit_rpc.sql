-- Fix Audit Log Consistency

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

    -- 4. Log the transfer using existing audit_logs schema
    INSERT INTO public.audit_logs (action, entity, entity_id, metadata, user_id)
    VALUES (
        'member.transfer',
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
