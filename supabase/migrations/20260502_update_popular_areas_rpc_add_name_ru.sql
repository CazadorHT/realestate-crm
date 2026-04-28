-- Update RPC: Add name_ru to get_popular_areas_with_counts
-- Required because the RU migration added name_ru to popular_areas table
-- but the RPC function was never updated to return it.
-- Must DROP first because PostgreSQL cannot change RETURNS TABLE signature via CREATE OR REPLACE.

DROP FUNCTION IF EXISTS get_popular_areas_with_counts(UUID);

CREATE FUNCTION get_popular_areas_with_counts(target_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_en TEXT,
  name_cn TEXT,
  name_ru TEXT,
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
    pa.name_ru,
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

-- Re-grant access (required after CREATE OR REPLACE)
GRANT EXECUTE ON FUNCTION get_popular_areas_with_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_areas_with_counts(UUID) TO service_role;

COMMENT ON FUNCTION get_popular_areas_with_counts(UUID) IS 'ดึงข้อมูลทำเลยอดนิยมพร้อมนับยอดทรัพย์แบบ Dynamic ตาม Tenant ID (รองรับ Global Mode + name_ru)';
