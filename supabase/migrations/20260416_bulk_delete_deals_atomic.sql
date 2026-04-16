-- Atomic Bulk Deal Deletion and Stock/Status Rollback (V2 - Hardened)
-- Ensures that deleting 'CLOSED_WIN' deals reverts property stock and status correctly in one transaction.

CREATE OR REPLACE FUNCTION public.bulk_delete_deals_atomic(
  p_deal_ids UUID[],
  p_tenant_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- 1. Rollback stock and status for WON deals before deletion
  -- We decrement sold_units for properties linked to WON deals in the list.
  -- Status is only reverted to 'ACTIVE' (ใช้งาน) if the new sold_units is less than total_units.
  UPDATE public.properties p
  SET 
    sold_units = GREATEST(p.sold_units - sub.won_count, 0),
    status = CASE 
      -- 💎 HARDENING: Only set to ACTIVE if there is stock available after this rollback
      WHEN GREATEST(p.sold_units - sub.won_count, 0) < COALESCE(p.total_units, 1) THEN 'ACTIVE'::property_status
      ELSE p.status 
    END,
    version = p.version + 1,
    updated_at = NOW()
  FROM (
    -- Count how many WON deals are being deleted for each property in this batch
    SELECT property_id, COUNT(*) as won_count
    FROM public.deals
    WHERE id = ANY(p_deal_ids)
      AND tenant_id = p_tenant_id
      AND status = 'CLOSED_WIN'
      AND property_id IS NOT NULL
    GROUP BY property_id
  ) sub
  WHERE p.id = sub.property_id
    AND p.tenant_id = p_tenant_id;

  -- 2. Delete the deals
  DELETE FROM public.deals
  WHERE id = ANY(p_deal_ids)
    AND tenant_id = p_tenant_id;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.bulk_delete_deals_atomic(UUID[], UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_delete_deals_atomic(UUID[], UUID) TO service_role;
