-- Upgrade Properties View for "Smart Mapping" (V3)
-- This provides both unrolled common fields AND raw JSONB for deep lookup
-- Created at: 2026-05-14

DROP VIEW IF EXISTS public.properties CASCADE;

CREATE OR REPLACE VIEW public.properties WITH (security_invoker = true) AS
SELECT 
    -- 1. Hot Core Fields (For filtering/sorting)
    c.id,
    c.tenant_id,
    c.branch_id,
    c.status as status_int,
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
    c.owner_id,
    c.assigned_to,

    -- 2. Warm Details (Unrolling only most critical fields for legacy UI lists)
    d.title->>'th' as title,
    d.title->>'en' as title_en,
    d.description->>'th' as description,
    
    -- Address (Critical for lists)
    d.address_info->>'subdistrict' as subdistrict,
    d.address_info->>'district' as district,
    d.address_info->>'province' as province,
    
    -- 3. THE "SMART" BLOCKS (For Deep Mapping in Frontend)
    -- This allows mapRowToFormValues to find ANY field without updating the View
    d.amenities,
    d.pricing_details,
    d.meta_data,
    d.address_info,
    d.transit_info,

    -- Legacy Compatibility Fields (Placeholder for things moved to JSONB)
    NULL as images, -- Handled via property_media_v3 join in code
    NULL as structured_data,
    (d.meta_data->>'view_count')::integer as view_count,
    (d.meta_data->>'trust_score')::numeric as trust_score,
    (d.meta_data->>'has_nearby_places')::boolean as has_nearby_places

FROM public.properties_core c
LEFT JOIN public.properties_details d ON c.id = d.property_id;
