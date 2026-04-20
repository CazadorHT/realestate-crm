-- 🛡️ CRM Hardening: Server-Side Faceting RPC (Version 2.8 - Full Enterprise Polish)
-- Goal: Provide 100% reactive facades (Provinces, Types, ListingTypes, Areas)
-- Optimized: Joins with popular_areas for on-the-fly multilingual area translations

CREATE OR REPLACE FUNCTION public.get_public_property_facets(
  p_q TEXT DEFAULT NULL,
  p_province TEXT DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL,
  p_listing_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_q TEXT;
BEGIN
  -- เตรียมตัวแปรสำหรับ ILIKE
  v_q := CASE WHEN p_q IS NULL OR p_q = '' THEN NULL ELSE '%' || p_q || '%' END;

  SELECT jsonb_build_object(
    'availableProvinces', (
      SELECT jsonb_object_agg(province, count)
      FROM (
        SELECT province, count(*) as count
        FROM properties
        WHERE status = 'ACTIVE' AND deleted_at IS NULL
        AND (p_q IS NULL OR p_q = '' OR (
          title ILIKE v_q OR title_en ILIKE v_q OR title_cn ILIKE v_q OR
          description ILIKE v_q OR description_en ILIKE v_q OR description_cn ILIKE v_q OR
          popular_area ILIKE v_q OR province ILIKE v_q OR
          to_tsvector('simple', COALESCE(ai_summary_content, '')) @@ plainto_tsquery('simple', p_q)
        ))
        GROUP BY province
      ) p
    ),
    'availableTypes', (
      SELECT jsonb_object_agg(property_type, count)
      FROM (
        SELECT property_type, count(*) as count
        FROM properties
        WHERE status = 'ACTIVE' AND deleted_at IS NULL
        AND (p_q IS NULL OR p_q = '' OR (
          title ILIKE v_q OR title_en ILIKE v_q OR title_cn ILIKE v_q OR
          description ILIKE v_q OR description_en ILIKE v_q OR description_cn ILIKE v_q OR
          popular_area ILIKE v_q OR province ILIKE v_q OR
          to_tsvector('simple', COALESCE(ai_summary_content, '')) @@ plainto_tsquery('simple', p_q)
        ))
        GROUP BY property_type
      ) t
    ),
    'availableListingTypes', (
      SELECT jsonb_build_object(
        'SALE', (SELECT count(*) FROM properties WHERE status = 'ACTIVE' AND deleted_at IS NULL AND listing_type IN ('SALE', 'SALE_AND_RENT') AND (p_q IS NULL OR p_q = '' OR (title ILIKE v_q OR title_en ILIKE v_q OR title_cn ILIKE v_q OR description ILIKE v_q OR description_en ILIKE v_q OR description_cn ILIKE v_q OR popular_area ILIKE v_q OR province ILIKE v_q OR to_tsvector('simple', COALESCE(ai_summary_content, '')) @@ plainto_tsquery('simple', p_q)))),
        'RENT', (SELECT count(*) FROM properties WHERE status = 'ACTIVE' AND deleted_at IS NULL AND listing_type IN ('RENT', 'SALE_AND_RENT') AND (p_q IS NULL OR p_q = '' OR (title ILIKE v_q OR title_en ILIKE v_q OR title_cn ILIKE v_q OR description ILIKE v_q OR description_en ILIKE v_q OR description_cn ILIKE v_q OR popular_area ILIKE v_q OR province ILIKE v_q OR to_tsvector('simple', COALESCE(ai_summary_content, '')) @@ plainto_tsquery('simple', p_q)))),
        'ALL', (SELECT count(*) FROM properties WHERE status = 'ACTIVE' AND deleted_at IS NULL AND (p_q IS NULL OR p_q = '' OR (title ILIKE v_q OR title_en ILIKE v_q OR title_cn ILIKE v_q OR description ILIKE v_q OR description_en ILIKE v_q OR description_cn ILIKE v_q OR popular_area ILIKE v_q OR province ILIKE v_q OR to_tsvector('simple', COALESCE(ai_summary_content, '')) @@ plainto_tsquery('simple', p_q))))
      )
    ),
    'availableAreas', (
      SELECT jsonb_object_agg(p_area, details)
      FROM (
        SELECT 
          p.popular_area as p_area,
          jsonb_build_object(
            'count', count(*),
            'name_en', COALESCE(pa.name_en, p.popular_area),
            'name_cn', COALESCE(pa.name_cn, p.popular_area)
          ) as details
        FROM properties p
        LEFT JOIN popular_areas pa ON pa.name = p.popular_area
        WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL
        AND p.popular_area IS NOT NULL
        AND (p_q IS NULL OR p_q = '' OR (
          p.title ILIKE v_q OR p.title_en ILIKE v_q OR p.title_cn ILIKE v_q OR
          p.description ILIKE v_q OR p.description_en ILIKE v_q OR p.description_cn ILIKE v_q OR
          p.popular_area ILIKE v_q OR p.province ILIKE v_q OR
          to_tsvector('simple', COALESCE(p.ai_summary_content, '')) @@ plainto_tsquery('simple', p_q)
        ))
        GROUP BY p.popular_area, pa.name_en, pa.name_cn
      ) a
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_public_property_facets IS 'Returns 100% reactive counts for all facets (Provinces, Types, ListingTypes, Areas) with Multilingual FTS.';
