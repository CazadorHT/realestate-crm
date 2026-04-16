-- Atomic Property Swap RPC
-- Handles the transition of a winning deal from an old property to a new one.

CREATE OR REPLACE FUNCTION public.swap_property_stock_atomic(
    p_old_property_id UUID,
    p_new_property_id UUID,
    p_tenant_id UUID,
    p_old_deal_type TEXT,
    p_new_deal_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Revert Old Property Stock (Adjustment = -1)
    -- We use our existing hardened sync function to ensure logic consistency
    IF p_old_property_id IS NOT NULL THEN
        PERFORM public.sync_property_inventory_atomic(
            p_old_property_id,
            p_tenant_id,
            -1,
            p_old_deal_type
        );
    END IF;

    -- 2. Book New Property Stock (Adjustment = +1)
    IF p_new_property_id IS NOT NULL THEN
        PERFORM public.sync_property_inventory_atomic(
            p_new_property_id,
            p_tenant_id,
            1,
            p_new_deal_type
        );
    END IF;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.swap_property_stock_atomic(UUID, UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.swap_property_stock_atomic(UUID, UUID, UUID, TEXT, TEXT) TO service_role;
