-- Migration: Hardened Property Status RPC (Method 1)
-- Provides a strict, type-safe API boundary for status updates using the exact enum type.

CREATE OR REPLACE FUNCTION public.update_property_status_elite(
    p_id UUID,
    p_tenant_id UUID,
    p_user_id UUID,
    p_is_admin BOOLEAN,
    p_status public.property_status,
    p_version INTEGER
)
RETURNS public.properties
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated_row public.properties;
    v_existing_version INTEGER;
    v_created_by UUID;
    v_requires_ai_review BOOLEAN;
BEGIN
    -- 0. Set local lock timeout for safety
    SET LOCAL lock_timeout = '2s';

    IF p_status IS NULL THEN
        RAISE EXCEPTION 'Status cannot be NULL';
    END IF;

    -- 1. Fetch current state safely with row-level lock
    SELECT version, created_by, requires_ai_review 
    INTO v_existing_version, v_created_by, v_requires_ai_review
    FROM public.properties
    WHERE id = p_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'VC404: Property not found' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Ownership Guard (Bypass if Admin/Manager)
    -- Protects against unauthenticated or unauthorized lateral property modifications
    IF NOT p_is_admin AND v_created_by != p_user_id THEN
        RAISE EXCEPTION 'VC403: Forbidden - Not owner' USING ERRCODE = 'P4030';
    END IF;

    -- 3. AI Data Quality Guard
    -- Future-proof against attempting to turn a DRAFT property ACTIVE before AI review is met
    IF v_requires_ai_review AND p_status != 'DRAFT' THEN
        RAISE EXCEPTION 'AI Review Required: Cannot change status from DRAFT until properties are reviewed' USING ERRCODE = 'P0002';
    END IF;

    -- 4. Optimistic Locking Check
    IF p_version IS NOT NULL AND p_version > 0 AND v_existing_version != p_version THEN
        RAISE EXCEPTION 'VC409: Version conflict (Expected %, Got %)', p_version, v_existing_version USING ERRCODE = 'P4090';
    END IF;

    -- 5. Execute Atomic Update
    -- Best practice: Derive version sequentially from table instead of parameter directly
    UPDATE public.properties
    SET 
        status = p_status,
        version = v_existing_version + 1,
        updated_at = NOW()
    WHERE id = p_id AND tenant_id = p_tenant_id
    RETURNING * INTO v_updated_row;

    RETURN v_updated_row;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.update_property_status_elite(UUID, UUID, UUID, BOOLEAN, public.property_status, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_property_status_elite(UUID, UUID, UUID, BOOLEAN, public.property_status, INTEGER) TO service_role;
