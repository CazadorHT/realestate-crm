-- 🛡️ Data Ghost Records Cleanup (Enterprise Hardening)
-- Objective: Eliminate orphaned records when a property is soft-deleted or permanently purged.

-- 1. Ensure Cascading Deletes for hard-deletion (Purge from Trash)
DO $$ 
BEGIN
    -- property_views_log
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_views_log_property_id_fkey') THEN
        ALTER TABLE property_views_log DROP CONSTRAINT property_views_log_property_id_fkey;
    END IF;
    ALTER TABLE property_views_log ADD CONSTRAINT property_views_log_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

    -- rent_notification_rules
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'rent_notification_rules_property_id_fkey') THEN
        ALTER TABLE rent_notification_rules DROP CONSTRAINT rent_notification_rules_property_id_fkey;
    END IF;
    ALTER TABLE rent_notification_rules ADD CONSTRAINT rent_notification_rules_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

    -- property_matches
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_matches_property_id_fkey') THEN
        ALTER TABLE property_matches DROP CONSTRAINT property_matches_property_id_fkey;
    END IF;
    ALTER TABLE property_matches ADD CONSTRAINT property_matches_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

    -- property_syndication
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_syndication_property_id_fkey') THEN
        ALTER TABLE property_syndication DROP CONSTRAINT property_syndication_property_id_fkey;
    END IF;
    ALTER TABLE property_syndication ADD CONSTRAINT property_syndication_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

    -- property_features
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_features_property_id_fkey') THEN
        ALTER TABLE property_features DROP CONSTRAINT property_features_property_id_fkey;
    END IF;
    ALTER TABLE property_features ADD CONSTRAINT property_features_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

    -- property_agents
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_agents_property_id_fkey') THEN
        ALTER TABLE property_agents DROP CONSTRAINT property_agents_property_id_fkey;
    END IF;
    ALTER TABLE property_agents ADD CONSTRAINT property_agents_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

    -- rent_notification_history
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'rent_notification_history_property_id_fkey') THEN
        ALTER TABLE rent_notification_history DROP CONSTRAINT rent_notification_history_property_id_fkey;
    END IF;
    ALTER TABLE rent_notification_history ADD CONSTRAINT rent_notification_history_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

    -- property_images
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_images_property_id_fkey') THEN
        ALTER TABLE property_images DROP CONSTRAINT property_images_property_id_fkey;
    END IF;
    ALTER TABLE property_images ADD CONSTRAINT property_images_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

    -- property_image_uploads
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_image_uploads_property_id_fkey') THEN
        ALTER TABLE property_image_uploads DROP CONSTRAINT property_image_uploads_property_id_fkey;
    END IF;
    ALTER TABLE property_image_uploads ADD CONSTRAINT property_image_uploads_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
END $$;

-- 2. Create Trigger Function for Soft-Delete Cleanup
CREATE OR REPLACE FUNCTION fn_cleanup_property_ghost_records()
RETURNS TRIGGER AS $$
BEGIN
    -- Detect Transition to Soft-Delete (deleted_at NULL -> NOT NULL)
    IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
        
        -- A. Delete ephemeral rules and logs that should not persist for trashed items
        DELETE FROM rent_notification_rules WHERE property_id = NEW.id;
        DELETE FROM property_matches WHERE property_id = NEW.id;
        
        -- B. Optionally cleanup views to save space (Forensic choice)
        DELETE FROM property_views_log WHERE property_id = NEW.id;
        
        -- C. Cancel any pending syndication with Timestamp for easier debugging
        UPDATE property_syndication 
        SET status = 'CANCELLED', 
            sync_error = 'Property moved to trash at ' || NOW()::text
        WHERE property_id = NEW.id AND status = 'PENDING';

        RAISE NOTICE 'Cleaned up ghost records for Property: %', NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach Trigger to properties table
DROP TRIGGER IF EXISTS trg_cleanup_property_ghosts ON properties;
CREATE TRIGGER trg_cleanup_property_ghosts
    AFTER UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION fn_cleanup_property_ghost_records();

-- 4. Initial Cleanup (Optional: Clean existing orphans if any)
-- This runs once during migration to ensure immediate consistency
DELETE FROM rent_notification_rules 
WHERE property_id IN (SELECT id FROM properties WHERE deleted_at IS NOT NULL);

DELETE FROM property_views_log 
WHERE property_id IN (SELECT id FROM properties WHERE deleted_at IS NOT NULL);
