-- Enable aggregation counting in the database for popular areas module
-- This avoids downloading all property rows just to count them in JavaScript

CREATE OR REPLACE FUNCTION get_property_counts_by_area(area_names text[])
RETURNS TABLE (area_name text, property_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER -- Respects RLS of the caller
SET search_path = public
AS $$
  SELECT a.name as area_name, COUNT(p.id) as property_count
  FROM (SELECT unnest(area_names) as name) a
  LEFT JOIN properties p ON p.popular_area = a.name AND p.deleted_at IS NULL
  GROUP BY a.name;
$$;

COMMENT ON FUNCTION get_property_counts_by_area(text[]) IS 'ใช้สำหรับนับจำนวนทรัพย์ในละแวกพื้นที่ยอดนิยมแบบประสิทธิภาพสูง';

-- Grant access to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_property_counts_by_area(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_property_counts_by_area(text[]) TO service_role;
GRANT EXECUTE ON FUNCTION get_property_counts_by_area(text[]) TO anon;
