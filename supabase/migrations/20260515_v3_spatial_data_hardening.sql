-- 🛡️ V3 Spatial Data Hardening
-- Description: Consolidate Transit & Nearby Places into a structured JSONB object
--              and standardize distances to numeric meters (distance_meters).
-- Created At: 2026-05-15

BEGIN;

-- 1. Migrate and Normalize Data
UPDATE public.properties_details
SET transit_info = jsonb_build_object(
    'places', (
        SELECT jsonb_agg(
            CASE 
                -- Convert legacy 'distance' (string) -> 'distance_meters' (numeric)
                WHEN elem ? 'distance' THEN 
                    (elem - 'distance') || jsonb_build_object(
                        'distance_meters', 
                        CASE 
                            WHEN (elem->>'distance') ~ '[0-9.]+' THEN 
                                substring(elem->>'distance' from '[0-9.]+')::numeric
                            ELSE 0 
                        END
                    )
                ELSE elem
            END
        )
        FROM jsonb_array_elements(
            CASE 
                WHEN jsonb_typeof(transit_info) = 'object' AND transit_info ? 'places' THEN transit_info->'places'
                WHEN meta_data ? 'nearby_places' THEN meta_data->'nearby_places'
                ELSE '[]'::jsonb
            END
        ) AS elem
    ),
    'transits', (
        SELECT jsonb_agg(
            CASE 
                -- Ensure distance_meters is strictly numeric
                WHEN elem ? 'distance_meters' AND jsonb_typeof(elem->'distance_meters') = 'string' THEN
                    elem || jsonb_build_object('distance_meters', (elem->>'distance_meters')::numeric)
                ELSE elem
            END
        )
        FROM jsonb_array_elements(
            CASE 
                WHEN jsonb_typeof(transit_info) = 'object' AND transit_info ? 'transits' THEN transit_info->'transits'
                WHEN jsonb_typeof(transit_info) = 'array' THEN transit_info
                ELSE '[]'::jsonb
            END
        ) AS elem
    )
)
WHERE transit_info IS NOT NULL OR meta_data ? 'nearby_places';

-- 2. Performance Optimization
CREATE INDEX IF NOT EXISTS idx_prop_details_transit_info_gin ON public.properties_details USING GIN (transit_info);

-- 3. Cleanup (Optional: If you want to remove the old boolean flag from meta_data in the future, 
-- but we keep it for now for compatibility with existing views)
COMMENT ON COLUMN public.properties_details.transit_info IS 'V3 Consolidated Spatial Data: {places: Array, transits: Array}';

COMMIT;
