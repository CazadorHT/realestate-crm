-- ====================================================================
-- 🌉 Real Estate CRM Database V2 (Phase 4: Smart & Economical Bridge)
-- ====================================================================

-- 1. Enhance properties_v2 with Core Business Columns (For Speed)
-- เราจะเก็บเฉพาะฟิลด์ที่ต้องใช้ Sort/Filter บ่อยๆ เป็นคอลัมน์ เพื่อความเร็วสูงสุด
ALTER TABLE properties_v2 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC,
ADD COLUMN IF NOT EXISTS rent_price NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'THB',
ADD COLUMN IF NOT EXISTS address_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES identities(id),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES identities(id),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES identities(id),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- GIN Index สำหรับการค้นหาภายใน JSONB (ประหยัดแต่เร็ว)
CREATE INDEX IF NOT EXISTS idx_properties_amenities_gin ON properties_v2 USING GIN (amenities);
CREATE INDEX IF NOT EXISTS idx_properties_metadata_gin ON properties_v2 USING GIN (metadata);

-- 1.1 Enhance Identities with Metadata (Missing from Phase 2)
ALTER TABLE identities ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS idx_identities_metadata_gin ON identities USING GIN (metadata);

-- 2. The Comprehensive Legacy Bridge View (public.properties)
CREATE OR REPLACE VIEW public.properties 
WITH (security_invoker = true)
AS
SELECT 
    p.id, p.tenant_id, p.branch_id,
    
    -- i18n Flattening
    p.title->>'th' as title,
    p.title->>'en' as title_en,
    p.title->>'cn' as title_cn,
    p.title->>'ru' as title_ru,
    p.description->>'th' as description,
    p.description->>'en' as description_en,
    
    -- Core Specs (Converted to UPPERCASE for Legacy Compatibility)
    UPPER(p.property_type) as property_type,
    UPPER(p.listing_type) as listing_type,
    UPPER(p.status) as status,
    p.bedrooms, p.bathrooms, p.floor_area as size_sqm,
    p.sale_price as original_price, p.rent_price as original_rental_price,
    
    -- Images Aggregation (Sorted by Primary then Sort Order)
    COALESCE(
        (SELECT json_agg(m.url ORDER BY m.is_primary DESC, m.sort_order ASC) 
         FROM media_assets m WHERE m.owner_id = p.id AND m.owner_type = 'property'),
        '[]'::json
    ) as images,
    
    -- Address
    p.address_info->>'address_line1' as address_line1,
    p.address_info->>'district' as district,
    p.address_info->>'province' as province,
    p.address_info->>'zipcode' as zipcode,
    
    -- Amenities (Flattened)
    COALESCE((p.amenities->>'is_pet_friendly')::boolean, false) as is_pet_friendly,
    COALESCE((p.amenities->>'is_cbd')::boolean, false) as is_cbd,
    COALESCE((p.amenities->>'is_exclusive')::boolean, false) as is_exclusive,
    COALESCE((p.amenities->>'is_hot_deal')::boolean, false) as is_hot_deal,
    
    -- Relational
    p.owner_id, p.assigned_to, p.created_by,
    
    -- Technical Specs Fallback
    (p.metadata->>'floor')::integer as floor,
    (p.metadata->>'land_size_sqwah')::numeric as land_size_sqwah,
    
    -- Lifecycle
    p.created_at, p.updated_at, p.deleted_at
FROM properties_v2 p;

-- 3. The Leads Bridge
CREATE OR REPLACE VIEW public.leads
WITH (security_invoker = true)
AS
SELECT 
    i.id, i.tenant_id,
    i.full_name, i.email, i.phone,
    i.metadata->>'stage' as stage,
    (i.metadata->>'budget_min')::numeric as budget_min,
    (i.metadata->>'budget_max')::numeric as budget_max,
    i.metadata->'preferred_property_types' as preferred_property_types,
    i.created_at, i.updated_at, i.deleted_at
FROM identities i
WHERE i.category = 'external';

-- 4. Audit & Price History Sync
CREATE OR REPLACE FUNCTION log_property_price_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.sale_price IS DISTINCT FROM NEW.sale_price) THEN
        IF NEW.sale_price IS NOT NULL THEN
            INSERT INTO property_price_history (property_id, price, is_rental, changed_by)
            VALUES (NEW.id, NEW.sale_price, false, NULL);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_log_price_change ON properties_v2;
CREATE TRIGGER trigger_log_price_change
    AFTER INSERT OR UPDATE ON properties_v2
    FOR EACH ROW EXECUTE FUNCTION log_property_price_change();
