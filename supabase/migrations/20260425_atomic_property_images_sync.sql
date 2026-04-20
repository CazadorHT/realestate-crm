-- 🛡️ Phase 2.7: Atomic Property Image Sync
-- Ensures properties.images (JSONB) is always consistent with property_images (relational)
-- Removal of the need for eventual consistency from Background Jobs (Inngest)

CREATE OR REPLACE FUNCTION fn_sync_property_images()
RETURNS TRIGGER AS $$
DECLARE
    target_property_id UUID;
BEGIN
    -- Determine which property needs syncing
    IF (TG_OP = 'DELETE') THEN
        target_property_id := OLD.property_id;
    ELSE
        target_property_id := NEW.property_id;
    END IF;

    -- Atomic Aggregation
    UPDATE properties
    SET images = (
        SELECT jsonb_agg(
            jsonb_build_object(
                'url', image_url,
                'storage_path', storage_path,
                'is_cover', is_cover,
                'sort_order', sort_order
            ) ORDER BY sort_order ASC
        )
        FROM property_images
        WHERE property_id = target_property_id
    )
    WHERE id = target_property_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger if any
DROP TRIGGER IF EXISTS trig_sync_property_images ON property_images;

-- Attach trigger
CREATE TRIGGER trig_sync_property_images
AFTER INSERT OR UPDATE OR DELETE ON property_images
FOR EACH ROW EXECUTE FUNCTION fn_sync_property_images();

-- ⚡ Batch Sync for existing data (one-time fix)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM properties WHERE deleted_at IS NULL LOOP
        UPDATE properties
        SET images = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'url', image_url,
                    'storage_path', storage_path,
                    'is_cover', is_cover,
                    'sort_order', sort_order
                ) ORDER BY sort_order ASC
            )
            FROM property_images
            WHERE property_id = r.id
        )
        WHERE id = r.id;
    END LOOP;
END $$;
