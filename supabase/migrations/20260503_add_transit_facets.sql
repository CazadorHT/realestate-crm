-- 🛡️ CRM Hardening: Scalable Transit Stations Facets
-- Goal: Optimize for 100k+ properties by using a junction table instead of on-the-fly JSONB unnesting.

-- 1. Create the optimized junction table
CREATE TABLE IF NOT EXISTS public.property_transit_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    station_name TEXT NOT NULL,
    station_name_en TEXT,
    station_name_cn TEXT,
    station_name_ru TEXT,
    type TEXT, -- BTS, MRT, etc.
    distance_meters INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indexes for blazing fast aggregation
CREATE INDEX IF NOT EXISTS idx_prop_transit_station_name ON public.property_transit_stations(station_name);
CREATE INDEX IF NOT EXISTS idx_prop_transit_type ON public.property_transit_stations(type);
CREATE INDEX IF NOT EXISTS idx_prop_transit_property_id ON public.property_transit_stations(property_id);

-- 🛡️ Security Hardening: Enable RLS on the junction table
ALTER TABLE public.property_transit_stations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to transit stations for search facets
CREATE POLICY "Allow public read access" 
ON public.property_transit_stations 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 3. Create sync trigger function
CREATE OR REPLACE FUNCTION public.sync_property_transit_stations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Remove old entries
    DELETE FROM public.property_transit_stations WHERE property_id = NEW.id;

    -- Insert new entries from JSONB if exists
    IF NEW.nearby_transits IS NOT NULL AND jsonb_typeof(NEW.nearby_transits) = 'array' THEN
        INSERT INTO public.property_transit_stations (
            property_id, 
            station_name, 
            station_name_en, 
            station_name_cn, 
            station_name_ru, 
            type, 
            distance_meters
        )
        SELECT 
            NEW.id,
            elem->>'station_name',
            COALESCE(elem->>'station_name_en', elem->>'station_name'),
            COALESCE(elem->>'station_name_cn', elem->>'station_name'),
            COALESCE(elem->>'station_name_ru', elem->>'station_name'),
            elem->>'type',
            (elem->>'distance_meters')::INTEGER
        FROM jsonb_array_elements(NEW.nearby_transits) AS elem
        WHERE (elem->>'station_name') IS NOT NULL;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Apply trigger to properties table
DROP TRIGGER IF EXISTS trg_sync_property_transits ON public.properties;
CREATE TRIGGER trg_sync_property_transits
AFTER INSERT OR UPDATE OF nearby_transits ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.sync_property_transit_stations();

-- 5. Initial migration: Populate the table from existing data
INSERT INTO public.property_transit_stations (
    property_id, 
    station_name, 
    station_name_en, 
    station_name_cn, 
    station_name_ru, 
    type, 
    distance_meters
)
SELECT 
    id,
    elem->>'station_name',
    COALESCE(elem->>'station_name_en', elem->>'station_name'),
    COALESCE(elem->>'station_name_cn', elem->>'station_name'),
    COALESCE(elem->>'station_name_ru', elem->>'station_name'),
    elem->>'type',
    (elem->>'distance_meters')::INTEGER
FROM public.properties, 
jsonb_array_elements(nearby_transits) AS elem
WHERE nearby_transits IS NOT NULL 
AND jsonb_typeof(nearby_transits) = 'array'
AND (elem->>'station_name') IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Updated Optimized RPC
CREATE OR REPLACE FUNCTION public.get_public_property_facets_v2(
  p_q TEXT DEFAULT NULL,
  p_province TEXT DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL,
  p_listing_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp -- 🛡️ Prevent search path hijacking
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
      pa.name_en, 
      pa.name_cn, 
      pa.name_ru
    FROM public.properties p
    LEFT JOIN public.popular_areas pa ON pa.name = p.popular_area
    WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL
    AND (p_province IS NULL OR p_province = 'ALL' OR p.province = p_province)
    AND (p_property_type IS NULL OR p_property_type = 'ALL' OR p.property_type = p_property_type)
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
    'availableAreas', (
      SELECT COALESCE(jsonb_object_agg(popular_area, details), '{}'::jsonb) FROM (
        SELECT 
          popular_area,
          jsonb_build_object(
            'count', count(*),
            'name_en', COALESCE(name_en, popular_area),
            'name_cn', COALESCE(name_cn, popular_area),
            'name_ru', COALESCE(name_ru, popular_area)
          ) as details
        FROM filtered_props
        WHERE popular_area IS NOT NULL
        GROUP BY 1, name_en, name_cn, name_ru
      ) a
    ),
    'availableStations', (
      -- 🚀 Scalable Aggregation using the Junction Table
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

-- 🛡️ Security Hardening: Revoke execute on trigger function from PUBLIC
-- This prevents the function from being called directly via the API (/rpc/sync_property_transit_stations)
REVOKE EXECUTE ON FUNCTION public.sync_property_transit_stations() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_property_transit_stations() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_property_transit_stations() FROM authenticated;
