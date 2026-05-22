-- 📦 Item 12: Enterprise Cold Storage & Archival Strategy (V2 - Hardened)
-- Objective: Universal archival for Properties, Leads, and Deals with Deleter Tracking & Auto-Cleanup.

-- 1. Hardened Archive Table
CREATE TABLE IF NOT EXISTS deleted_records_archive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id UUID NOT NULL,
    entity_type TEXT NOT NULL, -- 'property', 'lead', 'deal'
    data JSONB NOT NULL, -- Full snapshot
    deleted_at TIMESTAMPTZ DEFAULT now(),
    deleted_by UUID, -- Captured from auth.uid()
    tenant_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_archive_search ON deleted_records_archive (entity_type, tenant_id, deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_archive_original_id ON deleted_records_archive (original_id);

-- 2. Universal Archiving Function
CREATE OR REPLACE FUNCTION fn_archive_record_before_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_entity_type TEXT;
    v_meta JSONB;
BEGIN
    v_entity_type := TG_TABLE_NAME; -- property, lead, deal
    
    -- Build entity-specific metadata for easy searching in the archive list
    IF v_entity_type = 'properties' THEN
        v_meta := jsonb_build_object('title', OLD.title, 'slug', OLD.slug);
        v_entity_type := 'property';
    ELSIF v_entity_type = 'leads' THEN
        v_meta := jsonb_build_object('full_name', OLD.full_name, 'email', OLD.email);
        v_entity_type := 'lead';
    ELSIF v_entity_type = 'deals' THEN
        v_meta := jsonb_build_object('deal_type', OLD.deal_type, 'lead_id', OLD.lead_id);
        v_entity_type := 'deal';
    ELSE
        v_meta := '{}'::jsonb;
    END IF;

    INSERT INTO deleted_records_archive (
        original_id,
        entity_type,
        data,
        tenant_id,
        deleted_by,
        metadata
    ) VALUES (
        OLD.id,
        v_entity_type,
        to_jsonb(OLD),
        OLD.tenant_id,
        auth.uid(), -- Capture the user who performed the delete
        v_meta || jsonb_build_object(
            'delete_reason', current_setting('app.delete_reason', true),
            'archived_at', now()
        )
    );
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Triggers to Core Tables
-- Properties
DROP TRIGGER IF EXISTS trg_archive_property_delete ON properties;
CREATE TRIGGER trg_archive_property_delete
BEFORE DELETE ON properties FOR EACH ROW EXECUTE FUNCTION fn_archive_record_before_delete();

-- Leads
DROP TRIGGER IF EXISTS trg_archive_lead_delete ON leads;
CREATE TRIGGER trg_archive_lead_delete
BEFORE DELETE ON leads FOR EACH ROW EXECUTE FUNCTION fn_archive_record_before_delete();

-- Deals
DROP TRIGGER IF EXISTS trg_archive_deal_delete ON deals;
CREATE TRIGGER trg_archive_deal_delete
BEFORE DELETE ON deals FOR EACH ROW EXECUTE FUNCTION fn_archive_record_before_delete();

-- 4. Retention Policy: Cleanup older than 90 days
CREATE OR REPLACE FUNCTION fn_cleanup_old_archives(p_days_retention INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM deleted_records_archive
    WHERE deleted_at < (now() - (p_days_retention || ' days')::interval);
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Restore Engine (Example for Properties)
-- Usage: SELECT fn_restore_property_from_archive('uuid-of-archive-record');
CREATE OR REPLACE FUNCTION fn_restore_property_from_archive(p_archive_id UUID)
RETURNS UUID AS $$
DECLARE
    v_data JSONB;
    v_original_id UUID;
BEGIN
    -- 1. Get the data from archive
    SELECT data, original_id INTO v_data, v_original_id
    FROM deleted_records_archive
    WHERE id = p_archive_id AND entity_type = 'property';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Archive record not found for properties';
    END IF;

    -- 2. Check if the record still exists in the main table (prevent duplicates)
    IF EXISTS (SELECT 1 FROM properties WHERE id = v_original_id) THEN
        RAISE EXCEPTION 'Property with this ID already exists in the main table';
    END IF;

    -- 3. Re-insert the data
    -- Note: This is a simplified insert. In production, you might need to handle specific columns
    -- to avoid conflicts with triggers or updated_at timestamps.
    INSERT INTO properties (
        id, title, description, property_type, listing_type, status, price, rental_price,
        tenant_id, created_by, created_at, images, address_line1, province, district, subdistrict
    )
    SELECT 
        (v_data->>'id')::UUID,
        v_data->>'title',
        v_data->>'description',
        (v_data->>'property_type')::property_type,
        (v_data->>'listing_type')::listing_type,
        'DRAFT'::property_status, -- Restore as DRAFT for safety
        (v_data->>'price')::NUMERIC,
        (v_data->>'rental_price')::NUMERIC,
        (v_data->>'tenant_id')::UUID,
        (v_data->>'created_by')::UUID,
        (v_data->>'created_at')::TIMESTAMPTZ,
        v_data->'images',
        v_data->>'address_line1',
        v_data->>'province',
        v_data->>'district',
        v_data->>'subdistrict';

    -- 4. Delete from archive after successful restore
    DELETE FROM deleted_records_archive WHERE id = p_archive_id;

    RETURN v_original_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies
ALTER TABLE deleted_records_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/Owners can manage archive" 
ON deleted_records_archive FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (profiles.role IN ('ADMIN', 'MANAGER'))
    )
);

COMMENT ON TABLE deleted_records_archive IS 'Enterprise Cold Storage for deleted properties, leads, and deals with 90-day retention.';
