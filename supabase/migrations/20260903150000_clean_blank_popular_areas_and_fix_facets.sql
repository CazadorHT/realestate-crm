-- 1. Clean existing properties with empty or blank popular_area in properties_details table
UPDATE public.properties_details
SET address_info = jsonb_set(
  COALESCE(address_info, '{}'::jsonb),
  '{popular_area}',
  'null'::jsonb
)
WHERE COALESCE(address_info, '{}'::jsonb)->>'popular_area' IS NOT NULL 
  AND trim(COALESCE(address_info, '{}'::jsonb)->>'popular_area') = '';

-- 2. Update get_public_property_facets_v2 RPC to ignore empty/blank popular_area
CREATE OR REPLACE FUNCTION public.get_public_property_facets_v2(
  p_q TEXT DEFAULT NULL,
  p_province TEXT DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL,
  p_listing_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result JSONB;
  v_q TEXT;
BEGIN
  v_q := CASE WHEN p_q IS NULL OR p_q = '' THEN NULL ELSE '%' || p_q || '%' END;

  WITH filtered_props AS (
    SELECT
      p.id,
      p.province,
      p.property_type,
      p.listing_type,
      p.popular_area,
      p.price,
      p.rental_price,
      p.size_sqm,
      p.near_transit,
      p.is_pet_friendly,
      p.is_fully_furnished,
      p.is_foreigner_quota,
      p.is_tax_registered,
      p.is_hot_deal,
      p.amenities,
      pa.name_en,
      pa.name_cn,
      pa.name_ru
    FROM public.properties p
    LEFT JOIN public.popular_areas pa ON pa.name = p.popular_area
    WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL
    AND (p_province IS NULL OR p_province = 'ALL' OR p.province = p_province)
    AND (p_property_type IS NULL OR p_property_type = 'ALL' OR p.property_type = ANY(string_to_array(p_property_type, ',')))
    AND (p_listing_type IS NULL OR p_listing_type = 'ALL' OR
         (p_listing_type = 'SALE' AND p.listing_type IN ('SALE', 'SALE_AND_RENT')) OR
         (p_listing_type = 'RENT' AND p.listing_type IN ('RENT', 'SALE_AND_RENT')) OR
         (p_listing_type = 'SALE_AND_RENT' AND p.listing_type = 'SALE_AND_RENT')
    )
    AND (p_q IS NULL OR p_q = '' OR (
      p.title ILIKE v_q OR p.title_en ILIKE v_q OR p.title_cn ILIKE v_q OR p.title_ru ILIKE v_q OR
      p.description ILIKE v_q OR p.description_en ILIKE v_q OR p.description_cn ILIKE v_q OR p.description_ru ILIKE v_q OR
      p.popular_area ILIKE v_q OR p.province ILIKE v_q OR
      to_tsvector('simple', COALESCE(p.ai_summary_content, '')) @@ plainto_tsquery('simple', p_q)
    ))
  )
  SELECT jsonb_build_object(
    'availableProvinces', (
      SELECT COALESCE(jsonb_object_agg(province, count), '{}'::jsonb) FROM (
        SELECT province, count(*) as count FROM filtered_props GROUP BY 1
      ) p
    ),
    'availableTypes', (
      SELECT COALESCE(jsonb_object_agg(property_type, count), '{}'::jsonb) FROM (
        SELECT property_type, count(*) as count FROM filtered_props GROUP BY 1
      ) t
    ),
    'availableListingTypes', (
      SELECT jsonb_build_object(
        'SALE', (SELECT count(*) FROM filtered_props WHERE listing_type IN ('SALE', 'SALE_AND_RENT')),
        'RENT', (SELECT count(*) FROM filtered_props WHERE listing_type IN ('RENT', 'SALE_AND_RENT')),
        'SALE_AND_RENT', (SELECT count(*) FROM filtered_props WHERE listing_type = 'SALE_AND_RENT'),
        'ALL', (SELECT count(*) FROM filtered_props)
      )
    ),
    'availablePrices', (
      SELECT jsonb_build_object(
        '0-2000000-SALE', (SELECT count(*) FROM filtered_props WHERE price > 0 AND price <= 2000000),
        '2000000-5000000-SALE', (SELECT count(*) FROM filtered_props WHERE price > 2000000 AND price <= 5000000),
        '5000000-10000000-SALE', (SELECT count(*) FROM filtered_props WHERE price > 5000000 AND price <= 10000000),
        '10000000-20000000-SALE', (SELECT count(*) FROM filtered_props WHERE price > 10000000 AND price <= 20000000),
        '20000000--SALE', (SELECT count(*) FROM filtered_props WHERE price > 20000000),

        '0-15000-RENT', (SELECT count(*) FROM filtered_props WHERE rental_price > 0 AND rental_price <= 15000),
        '15000-50000-RENT', (SELECT count(*) FROM filtered_props WHERE rental_price > 15000 AND rental_price <= 50000),
        '50000-100000-RENT', (SELECT count(*) FROM filtered_props WHERE rental_price > 50000 AND rental_price <= 100000),
        '100000-150000-RENT', (SELECT count(*) FROM filtered_props WHERE rental_price > 100000 AND rental_price <= 150000),
        '150000-250000-RENT', (SELECT count(*) FROM filtered_props WHERE rental_price > 150000 AND rental_price <= 250000),
        '250000--RENT', (SELECT count(*) FROM filtered_props WHERE rental_price > 250000)
      )
    ),
    'availableSizes', (
      SELECT jsonb_build_object(
        '0-30', (SELECT count(*) FROM filtered_props WHERE size_sqm > 0 AND size_sqm <= 30),
        '30-50', (SELECT count(*) FROM filtered_props WHERE size_sqm > 30 AND size_sqm <= 50),
        '50-100', (SELECT count(*) FROM filtered_props WHERE size_sqm > 50 AND size_sqm <= 100),
        '100-200', (SELECT count(*) FROM filtered_props WHERE size_sqm > 100 AND size_sqm <= 200),
        '200-', (SELECT count(*) FROM filtered_props WHERE size_sqm > 200)
      )
    ),
    'availableQuickFilters', (
      SELECT jsonb_build_object(
        'nearTrain', (SELECT count(*) FROM filtered_props WHERE near_transit = true),
        'petFriendly', (SELECT count(*) FROM filtered_props WHERE is_pet_friendly = true),
        'fullyFurnished', (SELECT count(*) FROM filtered_props WHERE is_fully_furnished = true),
        'isForeigner', (SELECT count(*) FROM filtered_props WHERE is_foreigner_quota = true),
        'companyRegistered', (SELECT count(*) FROM filtered_props WHERE is_tax_registered = true),
        'isHotDeal', (SELECT count(*) FROM filtered_props WHERE is_hot_deal = true),
        'allowAirbnb', (SELECT count(*) FROM filtered_props WHERE (amenities->>'allow_airbnb')::boolean = true),
        'cbd', (SELECT count(*) FROM filtered_props WHERE (amenities->>'is_cbd')::boolean = true OR popular_area IN ('สุขุมวิท','สาทร','สีลม','ทองหล่อ','พร้อมพงษ์','พระราม 9','เพลินจิต','ชิดลม - เพลินจิต','ชิดลม','อโศก','เอกมัย','วิทยุ','หลังสวน - ลุมพินี','หลังสวน','ลุมพินี','ราชดำริ','นานา','ช่องนนทรี','ศาลาแดง','สุรศักดิ์','รัชดา','รัชดาภิเษก'))
      )
    ),
    'availableAreas', (
      SELECT COALESCE(jsonb_object_agg(popular_area, details), '{}'::jsonb) FROM (
        SELECT
          popular_area,
          jsonb_build_object(
            'count', count(*),
            'name_en', COALESCE(NULLIF(name_en, ''), popular_area),
            'name_cn', COALESCE(NULLIF(name_cn, ''), popular_area),
            'name_ru', COALESCE(NULLIF(name_ru, ''), popular_area)
          ) as details
        FROM filtered_props
        WHERE popular_area IS NOT NULL AND trim(popular_area) <> ''
        GROUP BY 1, name_en, name_cn, name_ru
      ) a
    ),
    'availableStations', (
      SELECT COALESCE(jsonb_object_agg(station_name, details), '{}'::jsonb) FROM (
        SELECT
          pts.station_name,
          jsonb_build_object(
            'count', count(DISTINCT pts.property_id),
            'name_en', MIN(pts.station_name_en),
            'name_cn', MIN(pts.station_name_cn),
            'name_ru', MIN(pts.station_name_ru),
            'type', MIN(pts.type)
          ) as details
        FROM public.property_transit_stations pts
        JOIN filtered_props fp ON fp.id = pts.property_id
        GROUP BY 1
      ) s
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
