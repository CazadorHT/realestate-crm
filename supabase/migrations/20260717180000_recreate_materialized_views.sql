-- Migration: Recreate Materialized Views dropped due to CASCADE
-- Date: 2026-07-17

-- 1. Recreate mv_station_property_stats materialized view
DROP MATERIALIZED VIEW IF EXISTS public.mv_station_property_stats CASCADE;

CREATE MATERIALIZED VIEW public.mv_station_property_stats AS
WITH station_names AS (
    -- Primary stations (TH)
    SELECT 
        id,
        price,
        rental_price,
        TRIM(transit_station_name) AS station_name
    FROM public.properties
    WHERE status = 'ACTIVE' AND deleted_at IS NULL AND transit_station_name IS NOT NULL AND TRIM(transit_station_name) <> ''
    
    UNION
    
    -- Primary stations (EN)
    SELECT 
        id,
        price,
        rental_price,
        TRIM(transit_station_name_en) AS station_name
    FROM public.properties
    WHERE status = 'ACTIVE' AND deleted_at IS NULL AND transit_station_name_en IS NOT NULL AND TRIM(transit_station_name_en) <> ''
    
    UNION
    
    -- Secondary stations (from nearby_transits)
    SELECT 
        p.id,
        p.price,
        p.rental_price,
        TRIM(elem->>key) AS station_name
    FROM public.properties p
    CROSS JOIN jsonb_array_elements(COALESCE(p.nearby_transits, '[]'::jsonb)) AS elem
    CROSS JOIN LATERAL (VALUES ('station_name'), ('station_name_en')) AS keys(key)
    WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL AND elem->>key IS NOT NULL AND TRIM(elem->>key) <> ''
)
SELECT 
    station_name,
    COUNT(DISTINCT id) AS property_count,
    MIN(price) AS min_price,
    MIN(rental_price) AS min_rental_price
FROM station_names
GROUP BY station_name;

-- Create unique index for concurrent refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_station_property_stats_name ON public.mv_station_property_stats (station_name);

-- Grant select permissions
GRANT SELECT ON public.mv_station_property_stats TO anon, authenticated, service_role;


-- 2. Recreate mv_project_property_stats materialized view
DROP MATERIALIZED VIEW IF EXISTS public.mv_project_property_stats CASCADE;

CREATE MATERIALIZED VIEW public.mv_project_property_stats AS
SELECT 
    project_id,
    COUNT(id) AS property_count,
    MIN(price) AS price_min,
    MAX(price) AS price_max,
    MIN(rental_price) AS rental_min,
    MAX(rental_price) AS rental_max,
    MODE() WITHIN GROUP (ORDER BY popular_area) AS primary_popular_area
FROM public.properties
WHERE status = 'ACTIVE' AND deleted_at IS NULL AND project_id IS NOT NULL
GROUP BY project_id;

-- Create unique index for concurrent refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_project_property_stats_id ON public.mv_project_property_stats (project_id);

-- Grant select permissions
GRANT SELECT ON public.mv_project_property_stats TO anon, authenticated, service_role;
