-- Create a revolutionary dynamic RPC for popular areas with tenant-aware counts
-- This replaces the static view logic and supports both branch-level and global aggregation

CREATE OR REPLACE FUNCTION get_popular_areas_with_counts(target_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_en TEXT,
  name_cn TEXT,
  province TEXT,
  slug TEXT,
  image_url TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  featured BOOLEAN,
  created_at TIMESTAMPTZ,
  property_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.name,
    pa.name_en,
    pa.name_cn,
    pa.province,
    pa.slug,
    pa.image_url,
    pa.is_active,
    pa.sort_order,
    pa.featured,
    pa.created_at,
    COUNT(p.id) FILTER (
      WHERE (target_tenant_id IS NULL OR p.tenant_id = target_tenant_id)
      AND p.deleted_at IS NULL
    ) as property_count
  FROM popular_areas pa
  LEFT JOIN properties p ON pa.name = p.popular_area
  GROUP BY pa.id
  ORDER BY pa.sort_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_popular_areas_with_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_areas_with_counts(UUID) TO service_role;

COMMENT ON FUNCTION get_popular_areas_with_counts(UUID) IS 'ดึงข้อมูลทำเลยอดนิยมพร้อมนับยอดทรัพย์แบบ Dynamic ตาม Tenant ID (รองรับ Global Mode โดยส่ง NULL)';
