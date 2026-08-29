-- Migration: Add indexes for sorting properties by bumped_at and updated_at
-- Fixes: Statement timeout on GET / (properties query)

-- 1. Index on properties_core (updated_at) for efficient fallback sorting
CREATE INDEX IF NOT EXISTS idx_properties_core_public_updated_at
ON public.properties_core (updated_at DESC)
WHERE (status = 1 AND deleted_at IS NULL);

-- 2. Index on properties_details (meta_data->>'bumped_at') for bump sorting
-- Using a B-tree index on the extracted JSON text
CREATE INDEX IF NOT EXISTS idx_properties_details_bumped_at
ON public.properties_details ((meta_data->>'bumped_at') DESC);
