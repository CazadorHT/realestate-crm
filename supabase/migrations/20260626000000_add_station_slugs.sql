-- ============================================================================
-- Migration: Add slugs and line metadata to transit stations
-- Date: 2026-06-26
-- Description:
--   1. Generates a URL-friendly slug for each TRANSIT_STATION from its code
--   2. Adds line_name and line_color to metadata based on transit_type
--   3. Creates a unique index on metadata->>'slug' for fast lookups
--   4. Adds description (jsonb) column to popular_areas_v3 for SEO content
-- ============================================================================

-- ============================================================================
-- Step 1: Add slug to transit station metadata
-- Generates slug from code: lowercase, replace '_' with '-'
-- Example: bts_asok → bts-asok, mrt_sukhumvit → mrt-sukhumvit
-- This is idempotent — re-running will simply overwrite the slug with the same value
-- ============================================================================
UPDATE public.ref_master_data
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'slug', REPLACE(LOWER(code), '_', '-')
)
WHERE type = 'TRANSIT_STATION';

-- ============================================================================
-- Step 2: Add line_name and line_color based on transit_type
-- Each transit type maps to a specific line name and color for display
-- Uses conditional CASE on the existing transit_type in metadata
-- This is idempotent — re-running will overwrite with the same values
-- ============================================================================
UPDATE public.ref_master_data
SET metadata = metadata || jsonb_build_object(
  'line_name',
  CASE metadata->>'transit_type'
    WHEN 'BTS'        THEN 'Sukhumvit/Silom Line'
    WHEN 'MRT'        THEN 'Blue Line'
    WHEN 'MRT_PURPLE' THEN 'Purple Line'
    WHEN 'MRT_YELLOW' THEN 'Yellow Line'
    WHEN 'MRT_PINK'   THEN 'Pink Line'
    WHEN 'ARL'        THEN 'Airport Rail Link'
    WHEN 'SRT_RED'    THEN 'Red Line'
    WHEN 'GOLD'       THEN 'Gold Line'
    WHEN 'BRT'        THEN 'BRT'
    ELSE 'Unknown'
  END,
  'line_color',
  CASE metadata->>'transit_type'
    WHEN 'BTS'        THEN '#7BC542'
    WHEN 'MRT'        THEN '#1E3A8A'
    WHEN 'MRT_PURPLE' THEN '#7C3AED'
    WHEN 'MRT_YELLOW' THEN '#F59E0B'
    WHEN 'MRT_PINK'   THEN '#EC4899'
    WHEN 'ARL'        THEN '#DC2626'
    WHEN 'SRT_RED'    THEN '#EF4444'
    WHEN 'GOLD'       THEN '#D97706'
    WHEN 'BRT'        THEN '#059669'
    ELSE '#6B7280'
  END
)
WHERE type = 'TRANSIT_STATION';

-- ============================================================================
-- Step 3: Create unique index on station slug for fast lookups
-- This ensures no two TRANSIT_STATION rows share the same slug
-- Uses a partial index filtered to type = 'TRANSIT_STATION' only
-- IF NOT EXISTS makes this idempotent
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_ref_master_station_slug
ON ref_master_data ((metadata->>'slug'))
WHERE type = 'TRANSIT_STATION';

-- ============================================================================
-- Step 4: Add SEO description column to popular_areas_v3
-- Stores multilingual descriptions as JSONB: {"th":"...", "en":"...", "cn":"...", "ru":"..."}
-- Used for SEO meta descriptions and on-page content on area landing pages
-- IF NOT EXISTS makes this idempotent
-- ============================================================================
ALTER TABLE public.popular_areas_v3
  ADD COLUMN IF NOT EXISTS description jsonb DEFAULT '{}';

COMMENT ON COLUMN public.popular_areas_v3.description
  IS 'Multilingual SEO description: {"th":"...", "en":"...", "cn":"...", "ru":"..."}';
