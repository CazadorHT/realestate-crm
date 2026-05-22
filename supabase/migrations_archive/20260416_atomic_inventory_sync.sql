-- Atomic Inventory Sync RPC (V2 - Hardened)
-- Handles atomic increment/decrement of sold_units and auto-updates property status.
-- Designed to prevent race conditions during deal closures.

CREATE OR REPLACE FUNCTION public.sync_property_inventory_atomic(
    p_property_id UUID,
    p_tenant_id UUID,
    p_adjustment INTEGER, -- +1 for new deal, -1 for cancellation
    p_deal_type TEXT      -- 'SALE' or 'RENT'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total INTEGER;
    v_sold INTEGER;
    v_new_sold INTEGER;
    v_new_status property_status;
BEGIN
    -- 1. Fetch with Row-Level Lock
    SELECT total_units, sold_units, status
    INTO v_total, v_sold, v_new_status
    FROM public.properties
    WHERE id = p_property_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Property not found or access denied (%)', p_property_id;
    END IF;

    -- 2. Calculate New Sold Units (Boundary safe)
    v_new_sold := GREATEST(0, COALESCE(v_sold, 0) + p_adjustment);

    -- 3. Determine New Status
    -- We only set status to SOLD/RENTED if the property is fully booked (sold_units >= total_units)
    IF v_new_sold >= COALESCE(v_total, 1) THEN
        IF p_deal_type = 'RENT' THEN
            v_new_status := 'RENTED';
        ELSE
            v_new_status := 'SOLD';
        END IF;
    ELSE
        -- 💎 HARDENING: Revert to 'ACTIVE' (ใช้งาน) only if there is available stock remaining
        v_new_status := 'ACTIVE';
    END IF;

    -- 4. Atomic Update
    UPDATE public.properties
    SET sold_units = v_new_sold,
        status = v_new_status,
        version = version + 1,
        updated_at = NOW()
    WHERE id = p_property_id AND tenant_id = p_tenant_id;

END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.sync_property_inventory_atomic(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_property_inventory_atomic(UUID, UUID, INTEGER, TEXT) TO service_role;
