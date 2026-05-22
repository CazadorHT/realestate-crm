-- Optimized function to get properties without notification rules
-- This prevents N+1 or large application-side filtering
CREATE OR REPLACE FUNCTION get_properties_without_notification_rules(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    title TEXT,
    image_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        (SELECT img.image_url FROM property_images img WHERE img.property_id = p.id ORDER BY img.is_cover DESC, img.sort_order ASC LIMIT 1) as image_url
    FROM properties p
    JOIN deals d ON d.property_id = p.id
    JOIN rental_contracts rc ON rc.deal_id = d.id
    WHERE 
        (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
        AND p.deleted_at IS NULL
        AND p.status != 'ARCHIVED'
        AND d.status = 'CLOSED_WIN'
        AND rc.status = 'ACTIVE'
        AND NOT EXISTS (
            SELECT 1 
            FROM rent_notification_rules rnr 
            WHERE rnr.property_id = p.id
        )
    ORDER BY p.created_at DESC;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_properties_without_notification_rules(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_properties_without_notification_rules(UUID) TO service_role;
