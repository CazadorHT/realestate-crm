-- 🛡️ V3 Hardened Atomic Operations
-- Designed for properties_core and crm_deals_v3
-- Migrated from legacy 'properties' and 'deals' views

-- 1. Atomic Property Status Sync
CREATE OR REPLACE FUNCTION public.sync_property_inventory_atomic(
    p_property_id UUID,
    p_adjustment INTEGER, -- +1 for WON, -1 for REVERT
    p_deal_type TEXT,     -- 'SALE' or 'RENT'
    p_tenant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_status INTEGER;
BEGIN
    -- V3 Logic: 1 Property = 1 Unit (Aggregator Standard)
    -- Mapping from labels.ts: ACTIVE (1), SOLD (4), RENTED (5)
    IF p_adjustment > 0 THEN
        -- Deal WON -> Set to SOLD (4) or RENTED (5)
        IF p_deal_type = 'RENT' THEN
            v_new_status := 5;
        ELSE
            v_new_status := 4;
        END IF;
    ELSE
        -- Deal Cancelled/Reverted -> Set back to ACTIVE (1)
        v_new_status := 1;
    END IF;

    UPDATE public.properties_core
    SET status = v_new_status,
        updated_at = NOW()
    WHERE id = p_property_id AND tenant_id = p_tenant_id;
END;
$$;

-- 2. Atomic Property Swap
CREATE OR REPLACE FUNCTION public.swap_property_stock_atomic(
    p_old_property_id UUID,
    p_new_property_id UUID,
    p_old_deal_type TEXT,
    p_new_deal_type TEXT,
    p_tenant_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Revert Old Property
    IF p_old_property_id IS NOT NULL THEN
        PERFORM public.sync_property_inventory_atomic(p_old_property_id, -1, p_old_deal_type, p_tenant_id);
    END IF;

    -- Book New Property
    IF p_new_property_id IS NOT NULL THEN
        PERFORM public.sync_property_inventory_atomic(p_new_property_id, 1, p_new_deal_type, p_tenant_id);
    END IF;
END;
$$;

-- 3. Atomic Bulk Deal Deletion
CREATE OR REPLACE FUNCTION public.bulk_delete_deals_atomic(
    p_deal_ids UUID[],
    p_tenant_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Revert statuses for properties linked to WON deals being deleted
    UPDATE public.properties_core p
    SET status = 1, -- Back to ACTIVE
        updated_at = NOW()
    FROM public.crm_deals_v3 d
    WHERE d.id = ANY(p_deal_ids)
      AND d.tenant_id = p_tenant_id
      AND d.status = 'CLOSED_WIN'
      AND d.property_id = p.id;

    -- Delete the deals
    DELETE FROM public.crm_deals_v3
    WHERE id = ANY(p_deal_ids)
      AND tenant_id = p_tenant_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION public.sync_property_inventory_atomic(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.swap_property_stock_atomic(UUID, UUID, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_delete_deals_atomic(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_property_inventory_atomic(UUID, INTEGER, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.swap_property_stock_atomic(UUID, UUID, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.bulk_delete_deals_atomic(UUID[], UUID) TO service_role;
