-- 🚀 V3 Atomic Identity Approval Function
-- Description: Consolidates identity update, tenant lookup, and audit logging into a single atomic RPC call.
-- Created At: 2026-05-15

BEGIN;

CREATE OR REPLACE FUNCTION public.v3_approve_identity(
    target_user_id UUID,
    new_role TEXT,
    actor_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- 1. Get the primary tenant_id for the user
    SELECT tenant_id INTO v_tenant_id 
    FROM public.tenant_members_v3 
    WHERE identity_id = target_user_id 
    LIMIT 1;

    -- 2. Update the role in identities_v3 (Direct Core update)
    UPDATE public.identities_v3
    SET role = new_role,
        updated_at = NOW()
    WHERE id = target_user_id;

    -- 3. Log the system audit entry atomically
    INSERT INTO public.system_audit_logs_v3 (
        action,
        entity_table,
        entity_id,
        new_data,
        tenant_id,
        actor_id
    ) VALUES (
        'ADMIN_APPROVE_USER',
        'identities_v3',
        target_user_id,
        jsonb_build_object(
            'new_role', new_role, 
            'method', 'ONE_CLICK_RPC_V3',
            'channel', 'SYSTEM_ADMIN'
        ),
        v_tenant_id,
        actor_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', v_tenant_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to the service_role (Admin API)
GRANT EXECUTE ON FUNCTION public.v3_approve_identity(UUID, TEXT, UUID) TO service_role;

COMMENT ON FUNCTION public.v3_approve_identity IS 'V3: Atomic user approval workflow including audit logging and tenant lookup.';

COMMIT;
