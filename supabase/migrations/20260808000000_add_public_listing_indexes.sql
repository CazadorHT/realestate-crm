-- Migration: Add optimized indexes for public property listing queries
-- Fixes: Statement timeout (error 57014) on GET /rest/v1/properties
-- Date: 2026-08-08

-- 1. Composite index for public listing: WHERE status=1 AND deleted_at IS NULL ORDER BY created_at DESC
-- This covers the most common public query pattern used by getPublicProperties()
CREATE INDEX IF NOT EXISTS idx_properties_core_public_listing
ON public.properties_core (created_at DESC)
WHERE (status = 1 AND deleted_at IS NULL);

-- 2. Index for property_media_v3 lookups (subquery in view for images/main_image)
CREATE INDEX IF NOT EXISTS idx_property_media_v3_cover
ON public.property_media_v3 (property_id, is_cover, sort_order);

-- 3. Index for property_features join (subquery in view for features)
CREATE INDEX IF NOT EXISTS idx_property_features_property_id
ON public.property_features (property_id);
