-- ====================================================================
-- 📦 V3 Ultimate Enterprise Architecture: Cross-Branch Transfer Ops
-- Target: transfer_property_to_tenant_v3, transfer_lead_to_tenant_v3
-- Added: 2026-05-20
-- Description: Allows OWNER and MANAGER (or system admins) to transfer
--              properties and leads to another branch securely, logging
--              the transition in the activity timeline.
-- ====================================================================

BEGIN;

-- --------------------------------------------------------------------
-- 1. FUNCTION: transfer_property_to_tenant_v3
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_property_to_tenant_v3(
    p_property_id UUID,
    p_target_tenant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_source_tenant_id UUID;
    v_is_authorized BOOLEAN;
BEGIN
    -- 1. Get current tenant of the property
    SELECT tenant_id INTO v_source_tenant_id
    FROM public.properties_core
    WHERE id = p_property_id;

    IF v_source_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Property not found or invalid ID.';
    END IF;

    -- 2. Check authorization: User must be OWNER/MANAGER of source tenant, or System Admin
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_members_v3
        WHERE identity_id = auth.uid()
          AND tenant_id = v_source_tenant_id
          AND LOWER(role) IN ('owner', 'admin', 'manager')
    ) OR public.is_system_admin() INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Access Denied: Only Branch Owner, Manager, or System Admin can transfer properties.';
    END IF;

    -- 3. Verify target tenant exists
    IF NOT EXISTS (SELECT 1 FROM public.tenants_v3 WHERE id = p_target_tenant_id) THEN
        RAISE EXCEPTION 'Target tenant/branch does not exist.';
    END IF;

    -- 4. Perform the update
    UPDATE public.properties_core
    SET tenant_id = p_target_tenant_id,
        updated_at = NOW()
    WHERE id = p_property_id;

    -- 5. Log transfer in the activity timeline for audit trail
    INSERT INTO public.activity_timeline_v3 (
        tenant_id,
        actor_id,
        target_entity,
        target_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        p_target_tenant_id,
        auth.uid(),
        'property',
        p_property_id,
        'transferred',
        'Property transferred from tenant ' || v_source_tenant_id || ' to ' || p_target_tenant_id,
        jsonb_build_object(
            'source_tenant_id', v_source_tenant_id,
            'target_tenant_id', p_target_tenant_id,
            'transferred_by', auth.uid()
        )
    );
END;
$$;

-- --------------------------------------------------------------------
-- 2. FUNCTION: transfer_lead_to_tenant_v3
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_lead_to_tenant_v3(
    p_lead_id UUID,
    p_target_tenant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_source_tenant_id UUID;
    v_is_authorized BOOLEAN;
BEGIN
    -- 1. Get current tenant of the lead
    SELECT tenant_id INTO v_source_tenant_id
    FROM public.crm_leads_v3
    WHERE id = p_lead_id;

    IF v_source_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Lead not found or invalid ID.';
    END IF;

    -- 2. Check authorization: User must be OWNER/MANAGER of source tenant, or System Admin
    SELECT EXISTS (
        SELECT 1 FROM public.tenant_members_v3
        WHERE identity_id = auth.uid()
          AND tenant_id = v_source_tenant_id
          AND LOWER(role) IN ('owner', 'admin', 'manager')
    ) OR public.is_system_admin() INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'Access Denied: Only Branch Owner, Manager, or System Admin can transfer leads.';
    END IF;

    -- 3. Verify target tenant exists
    IF NOT EXISTS (SELECT 1 FROM public.tenants_v3 WHERE id = p_target_tenant_id) THEN
        RAISE EXCEPTION 'Target tenant/branch does not exist.';
    END IF;

    -- 4. Perform the update
    UPDATE public.crm_leads_v3
    SET tenant_id = p_target_tenant_id,
        updated_at = NOW()
    WHERE id = p_lead_id;

    -- 5. Log transfer in the activity timeline for audit trail
    INSERT INTO public.activity_timeline_v3 (
        tenant_id,
        actor_id,
        target_entity,
        target_id,
        activity_type,
        description,
        metadata
    ) VALUES (
        p_target_tenant_id,
        auth.uid(),
        'lead',
        p_lead_id,
        'transferred',
        'Lead transferred from tenant ' || v_source_tenant_id || ' to ' || p_target_tenant_id,
        jsonb_build_object(
            'source_tenant_id', v_source_tenant_id,
            'target_tenant_id', p_target_tenant_id,
            'transferred_by', auth.uid()
        )
    );
END;
$$;

-- --------------------------------------------------------------------
-- 3. GRANTS & SECURITY LOCKDOWN
-- --------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.transfer_property_to_tenant_v3(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.transfer_lead_to_tenant_v3(UUID, UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.transfer_property_to_tenant_v3(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_lead_to_tenant_v3(UUID, UUID) TO authenticated, service_role;

-- Reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
