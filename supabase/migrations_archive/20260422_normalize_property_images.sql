-- 📦 Database Normalization: Large JSON Bloat Removal
-- Objective: Move property images from JSONB column to property_images table.

-- 1. Data Migration: Populate property_images table from properties.images JSONB
-- We only do this for rows that have data in the images column but no data in property_images yet.
INSERT INTO property_images (property_id, image_url, storage_path, is_cover, sort_order, created_at)
SELECT 
    p.id as property_id,
    (img->>'url')::text as image_url,
    (img->>'storage_path')::text as storage_path,
    (img->>'is_cover')::boolean as is_cover,
    COALESCE((img->>'sort_order')::integer, 0) as sort_order,
    p.created_at
FROM 
    properties p,
    jsonb_array_elements(p.images) AS img
WHERE 
    p.images IS NOT NULL 
    AND jsonb_array_length(p.images) > 0
    AND NOT EXISTS (
        SELECT 1 FROM property_images pi WHERE pi.property_id = p.id
    )
ON CONFLICT DO NOTHING;

-- 2. Performance Note:
-- After this migration, we can safely fetch images via JOIN.
-- We will NOT drop the 'images' column yet to ensure zero-downtime during code deployment.
-- Cleanup script (Dropping the column) should be run after the code is updated.

COMMENT ON COLUMN properties.images IS 'DEPRECATED: Use property_images table instead.';
