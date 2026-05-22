-- Upgrade Properties View for Full Legacy Compatibility (V3)
-- This maps the new Hot/Warm architecture back to the legacy schema
-- Created at: 2026-05-14

DROP VIEW IF EXISTS public.properties CASCADE;
DROP VIEW IF EXISTS public.tenant_members CASCADE;
DROP VIEW IF EXISTS public.tenant_invitations CASCADE;
DROP VIEW IF EXISTS public.tenants CASCADE;

CREATE OR REPLACE VIEW public.properties WITH (security_invoker = true) AS
SELECT 
    -- 1. Hot Core Fields
    c.id,
    c.tenant_id,
    c.branch_id,
    CASE 
        WHEN c.status = 0 THEN 'DRAFT'
        WHEN c.status = 1 THEN 'ACTIVE'
        WHEN c.status = 2 THEN 'UNDER_OFFER'
        WHEN c.status = 3 THEN 'RESERVED'
        WHEN c.status = 4 THEN 'SOLD'
        WHEN c.status = 5 THEN 'RENTED'
        WHEN c.status = 6 THEN 'ARCHIVED'
        ELSE 'DRAFT'
    END as status,
    CASE 
        WHEN c.listing_type = 0 THEN 'SALE'
        WHEN c.listing_type = 1 THEN 'RENT'
        WHEN c.listing_type = 2 THEN 'SALE_AND_RENT'
        ELSE 'SALE'
    END as listing_type,
    CASE 
        WHEN c.property_type = 1 THEN 'CONDO'
        WHEN c.property_type = 2 THEN 'HOUSE'
        WHEN c.property_type = 3 THEN 'TOWNHOME'
        WHEN c.property_type = 4 THEN 'LAND'
        WHEN c.property_type = 5 THEN 'COMMERCIAL_BUILDING'
        WHEN c.property_type = 6 THEN 'WAREHOUSE'
        WHEN c.property_type = 7 THEN 'OFFICE_BUILDING'
        WHEN c.property_type = 8 THEN 'VILLA'
        WHEN c.property_type = 9 THEN 'POOL_VILLA'
        ELSE 'OTHER'
    END as property_type,
    
    c.sale_price as price,
    c.rent_price as rental_price,
    c.currency,
    c.bedrooms,
    c.bathrooms,
    c.floor_area as size_sqm,
    c.land_area as land_size_sqwah,
    c.location,
    c.created_at,
    c.updated_at,
    c.deleted_at,

    -- 2. Warm Details (Unrolling JSONB)
    d.title->>'th' as title,
    d.title->>'en' as title_en,
    d.title->>'cn' as title_cn,
    d.title->>'ru' as title_ru,
    
    d.description->>'th' as description,
    d.description->>'en' as description_en,
    d.description->>'cn' as description_cn,
    d.description->>'ru' as description_ru,
    
    -- Address Info
    d.address_info->>'address_line1' as address_line1,
    d.address_info->>'address_line1_en' as address_line1_en,
    d.address_info->>'subdistrict' as subdistrict,
    d.address_info->>'district' as district,
    d.address_info->>'province' as province,
    d.address_info->>'postal_code' as postal_code,
    d.address_info->>'google_maps_link' as google_maps_link,
    
    -- Amenities & Features (Legacy Flat Columns)
    (d.amenities->>'floor')::integer as floor,
    (d.amenities->>'parking_slots')::integer as parking_slots,
    (d.amenities->>'is_pet_friendly')::boolean as is_pet_friendly,
    (d.amenities->>'is_fully_furnished')::boolean as is_fully_furnished,
    (d.amenities->>'is_high_ceiling')::boolean as is_high_ceiling,
    (d.amenities->>'is_green_building')::boolean as is_green_building,
    (d.amenities->>'has_flexible_lease')::boolean as has_flexible_lease,
    (d.amenities->>'ceiling_height')::numeric as ceiling_height,
    
    -- Additional Metadata
    d.meta_data->>'owner_id' as owner_id,
    d.meta_data->>'assigned_to' as assigned_to,
    (d.meta_data->>'view_count')::integer as view_count,
    (d.meta_data->>'trust_score')::numeric as trust_score,
    (d.meta_data->>'has_nearby_places')::boolean as has_nearby_places,
    d.meta_data->>'version' as version

FROM public.properties_core c
LEFT JOIN public.properties_details d ON c.id = d.property_id;

-- 3. Create missing linking tables
CREATE TABLE IF NOT EXISTS public.property_agents (
    property_id UUID REFERENCES public.properties_core(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.identities_v3(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, agent_id)
);

CREATE TABLE IF NOT EXISTS public.property_features (
    property_id UUID REFERENCES public.properties_core(id) ON DELETE CASCADE,
    feature_id TEXT,
    PRIMARY KEY (property_id, feature_id)
);

-- 4. Create missing tenant_members view
CREATE OR REPLACE VIEW public.tenant_members WITH (security_invoker = true) AS
SELECT 
    m.id,
    m.tenant_id,
    m.identity_id as profile_id,
    m.role,
    m.team_id,
    m.joined_at as created_at
FROM public.tenant_members_v3 m;

-- 5. Create missing tenant_invitations view
CREATE OR REPLACE VIEW public.tenant_invitations WITH (security_invoker = true) AS
SELECT 
    i.id,
    i.tenant_id,
    i.email,
    i.role,
    i.token,
    i.invited_by,
    i.status,
    i.expires_at,
    i.created_at
FROM public.tenant_invitations_v3 i;

-- 6. Create missing tenants bridge view
CREATE OR REPLACE VIEW public.tenants WITH (security_invoker = true) AS
SELECT 
    t.id,
    t.name,
    t.slug,
    t.logo_url,
    t.is_deleted,
    t.created_at
FROM public.tenants_v3 t;
