-- Migration: V3 Popular Areas Dynamic RPC with Counts
-- Description: Upgrades get_popular_areas_with_counts to query popular_areas_v3 directly,
-- unpack JSONB i18n names, join properties, and enforce tenant isolation.

CREATE OR REPLACE FUNCTION public.get_popular_areas_with_counts(target_tenant_id uuid DEFAULT NULL)
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
    COALESCE(pa.name->>'th', pa.name->>'default', '')::TEXT as name,
    (pa.name->>'en')::TEXT as name_en,
    (pa.name->>'cn')::TEXT as name_cn,
    (pa.name->>'ru')::TEXT as name_ru,
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
  FROM public.popular_areas_v3 pa
  LEFT JOIN public.properties p ON COALESCE(pa.name->>'th', pa.name->>'default', '') = p.popular_area
  WHERE (target_tenant_id IS NULL OR pa.tenant_id = target_tenant_id)
  GROUP BY pa.id
  ORDER BY pa.sort_order ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_popular_areas_with_counts(uuid) TO authenticated, service_role, anon;
