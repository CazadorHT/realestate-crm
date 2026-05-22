-- ====================================================================
-- 🛡️ V3 Security Architecture: View Bridge Column-Level Security Hardening
-- ====================================================================
-- This migration protects internal/sensitive broker data from public scraping
-- by dynamic null-masking of owner details and commissions for 'anon' users.

BEGIN;

DROP VIEW IF EXISTS public.properties CASCADE;

CREATE OR REPLACE VIEW public.properties WITH (security_invoker = true) AS
SELECT 
    -- Core Hot Fields
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
    c.listing_type as listing_type_int,
    CASE 
        WHEN c.listing_type = 0 THEN 'SALE'
        WHEN c.listing_type = 1 THEN 'RENT'
        WHEN c.listing_type = 2 THEN 'SALE_AND_RENT'
        ELSE 'SALE'
    END as listing_type,
    c.property_type as property_type_int,
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
    c.assigned_to,
    
    -- 🛡️ Dynamically mask sensitive columns for non-staff / anonymous callers
    CASE 
        WHEN (auth.role() = 'authenticated' OR is_system_admin()) THEN c.owner_id 
        ELSE NULL 
    END as owner_id,
    CASE 
        WHEN (auth.role() = 'authenticated' OR is_system_admin()) THEN c.created_by 
        ELSE NULL 
    END as created_by,
    CASE 
        WHEN (auth.role() = 'authenticated' OR is_system_admin()) THEN COALESCE(d.meta_data, '{}'::jsonb)->>'co_agent_name' 
        ELSE NULL 
    END as co_agent_name,
    CASE 
        WHEN (auth.role() = 'authenticated' OR is_system_admin()) THEN COALESCE(d.meta_data, '{}'::jsonb)->>'co_agent_phone' 
        ELSE NULL 
    END as co_agent_phone,
    CASE 
        WHEN (auth.role() = 'authenticated' OR is_system_admin()) THEN (COALESCE(d.meta_data, '{}'::jsonb)->>'co_agent_sale_commission_percent')::numeric 
        ELSE NULL 
    END as co_agent_sale_commission_percent,
    CASE 
        WHEN (auth.role() = 'authenticated' OR is_system_admin()) THEN (COALESCE(d.meta_data, '{}'::jsonb)->>'commission_sale_percentage')::numeric 
        ELSE NULL 
    END as commission_sale_percentage,
    CASE 
        WHEN (auth.role() = 'authenticated' OR is_system_admin()) THEN (COALESCE(d.meta_data, '{}'::jsonb)->>'commission_rent_months')::numeric 
        ELSE NULL 
    END as commission_rent_months,
    
    -- Social sharing timestamps
    c.posted_to_facebook_at,
    c.posted_to_instagram_at,
    c.posted_to_line_at,
    c.posted_to_tiktok_at,
    
    -- New Core Columns (Strict Boolean)
    COALESCE(c.is_hot_deal, false) as is_hot_deal,
    COALESCE(c.is_exclusive, false) as is_exclusive,
    COALESCE(c.verified, false) as verified,
    c.co_broker_id,
    c.slug,

    -- Titles (Multi-language unroll with COALESCE protection)
    COALESCE(d.title, '{}'::jsonb)->>'th' as title,
    COALESCE(d.title, '{}'::jsonb)->>'en' as title_en,
    COALESCE(d.title, '{}'::jsonb)->>'cn' as title_cn,
    COALESCE(d.title, '{}'::jsonb)->>'ru' as title_ru,

    -- Descriptions (Multi-language unroll with COALESCE protection)
    COALESCE(d.description, '{}'::jsonb)->>'th' as description,
    COALESCE(d.description, '{}'::jsonb)->>'en' as description_en,
    COALESCE(d.description, '{}'::jsonb)->>'cn' as description_cn,
    COALESCE(d.description, '{}'::jsonb)->>'ru' as description_ru,
    
    -- Address Info Unroll with COALESCE protection
    COALESCE(d.address_info, '{}'::jsonb)->>'subdistrict' as subdistrict,
    COALESCE(d.address_info, '{}'::jsonb)->>'district' as district,
    COALESCE(d.address_info, '{}'::jsonb)->>'province' as province,
    COALESCE(d.address_info, '{}'::jsonb)->>'popular_area' as popular_area,
    COALESCE(d.address_info, '{}'::jsonb)->>'popular_area_en' as popular_area_en,
    COALESCE(d.address_info, '{}'::jsonb)->>'popular_area_cn' as popular_area_cn,
    COALESCE(d.address_info, '{}'::jsonb)->>'popular_area_ru' as popular_area_ru,
    COALESCE(d.address_info, '{}'::jsonb)->>'address_line1' as address_line1,
    COALESCE(d.address_info, '{}'::jsonb)->>'address_line1_en' as address_line1_en,
    COALESCE(d.address_info, '{}'::jsonb)->>'address_line1_cn' as address_line1_cn,
    COALESCE(d.address_info, '{}'::jsonb)->>'address_line1_ru' as address_line1_ru,
    COALESCE(d.address_info, '{}'::jsonb)->>'postal_code' as postal_code,
    
    -- Pricing Details Unroll with COALESCE protection
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'original_price')::numeric as original_price,
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'original_rental_price')::numeric as original_rental_price,
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'min_contract_months')::integer as min_contract_months,
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'price_per_sqm')::numeric as price_per_sqm,
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'rent_price_per_sqm')::numeric as rent_price_per_sqm,

    -- Meta Data Unroll with COALESCE protection (God Tier Comprehensive)
    COALESCE(d.meta_data, '{}'::jsonb)->'meta_keywords' as meta_keywords,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'parking_slots')::integer as parking_slots,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'floor')::integer as floor,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'total_units')::integer as total_units,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'sold_units')::integer as sold_units,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'ceiling_height')::numeric as ceiling_height,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'office_capacity')::integer as office_capacity,
    COALESCE(d.meta_data, '{}'::jsonb)->>'orientation' as orientation,
    COALESCE(d.meta_data, '{}'::jsonb)->>'parking_type' as parking_type,
    COALESCE(d.meta_data, '{}'::jsonb)->>'property_source' as property_source,
    
    -- Boolean Flags & Amenities (Strict Boolean for Zod Validation)
    COALESCE((d.meta_data->>'is_fully_furnished')::boolean, false) as is_fully_furnished,
    COALESCE((d.meta_data->>'is_bare_shell')::boolean, false) as is_bare_shell,
    COALESCE((d.meta_data->>'is_pet_friendly')::boolean, false) as is_pet_friendly,
    COALESCE((d.meta_data->>'is_corner_unit')::boolean, false) as is_corner_unit,
    COALESCE((d.meta_data->>'is_renovated')::boolean, false) as is_renovated,
    COALESCE((d.meta_data->>'is_selling_with_tenant')::boolean, false) as is_selling_with_tenant,
    COALESCE((d.meta_data->>'is_foreigner_quota')::boolean, false) as is_foreigner_quota,
    COALESCE((d.meta_data->>'is_tax_registered')::boolean, false) as is_tax_registered,
    COALESCE((d.meta_data->>'requires_ai_review')::boolean, false) as requires_ai_review,
    COALESCE((d.meta_data->>'is_featured')::boolean, false) as is_featured,
    COALESCE((d.meta_data->>'has_city_view')::boolean, false) as has_city_view,
    COALESCE((d.meta_data->>'has_pool_view')::boolean, false) as has_pool_view,
    COALESCE((d.meta_data->>'has_garden_view')::boolean, false) as has_garden_view,
    COALESCE((d.meta_data->>'has_private_pool')::boolean, false) as has_private_pool,
    COALESCE((d.meta_data->>'has_river_view')::boolean, false) as has_river_view,
    COALESCE((d.meta_data->>'has_unblocked_view')::boolean, false) as has_unblocked_view,
    COALESCE((d.meta_data->>'allow_smoking')::boolean, false) as allow_smoking,
    COALESCE((d.meta_data->>'is_high_ceiling')::boolean, false) as is_high_ceiling,
    COALESCE((d.meta_data->>'is_column_free')::boolean, false) as is_column_free,
    COALESCE((d.meta_data->>'is_grade_a')::boolean, false) as is_grade_a,
    COALESCE((d.meta_data->>'is_grade_b')::boolean, false) as is_grade_b,
    COALESCE((d.meta_data->>'is_grade_c')::boolean, false) as is_grade_c,
    COALESCE((d.meta_data->>'has_raised_floor')::boolean, false) as has_raised_floor,
    COALESCE((d.meta_data->>'is_central_air')::boolean, false) as is_central_air,
    COALESCE((d.meta_data->>'is_split_air')::boolean, false) as is_split_air,
    COALESCE((d.meta_data->>'has_247_access')::boolean, false) as has_247_access,
    COALESCE((d.meta_data->>'has_fiber_optic')::boolean, false) as has_fiber_optic,
    COALESCE((d.meta_data->>'has_multi_parking')::boolean, false) as has_multi_parking,
    COALESCE((d.meta_data->>'facing_east')::boolean, false) as facing_east,
    COALESCE((d.meta_data->>'facing_north')::boolean, false) as facing_north,
    COALESCE((d.meta_data->>'facing_south')::boolean, false) as facing_south,
    COALESCE((d.meta_data->>'facing_west')::boolean, false) as facing_west,
    
    -- AI & Metadata Strings
    COALESCE(d.meta_data, '{}'::jsonb)->>'ai_summary_content' as ai_summary_content,
    COALESCE(d.meta_data, '{}'::jsonb)->>'ai_reviewed_at' as ai_reviewed_at,
    COALESCE(d.meta_data, '{}'::jsonb)->>'ai_reviewed_by' as ai_reviewed_by,
    COALESCE(d.meta_data, '{}'::jsonb)->>'google_maps_link' as google_maps_link,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'version')::integer as version,
    
    -- V3 Tenant & Branch Context Bridges
    (SELECT name FROM public.tenants_v3 WHERE id = c.tenant_id) as tenant_name,
    (SELECT name FROM public.branches_v3 WHERE id = c.branch_id) as branch_name,

    -- Transit Info Unroll with COALESCE protection
    COALESCE((d.transit_info->>'near_transit')::boolean, false) as near_transit,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_type' as transit_type,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_station_name' as transit_station_name,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_station_name_en' as transit_station_name_en,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_station_name_cn' as transit_station_name_cn,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_station_name_ru' as transit_station_name_ru,
    (COALESCE(d.transit_info, '{}'::jsonb)->>'transit_distance_meters')::numeric as transit_distance_meters,

    -- Raw JSONB Blocks (For form mapping)
    d.amenities,
    d.pricing_details,
    d.meta_data,
    d.address_info,
    d.transit_info,

    -- Legacy & Relationship compatibility bridges (Fully Populated God Tier)
    (
        SELECT jsonb_agg(url ORDER BY sort_order ASC)::text 
        FROM public.property_media_v3 
        WHERE property_id = c.id
    ) as images,
    COALESCE(d.meta_data, '{}'::jsonb)->>'structured_data' as structured_data,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'view_count')::integer as view_count,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'trust_score')::numeric as trust_score,
    COALESCE((d.meta_data->>'has_nearby_places')::boolean, false) as has_nearby_places,
    
    -- JSON Arrays bridges (Fully Populated God Tier)
    COALESCE(d.address_info->'nearby_places', '[]'::jsonb) as nearby_places,
    COALESCE(d.transit_info->'nearby_transits', '[]'::jsonb) as nearby_transits,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', f.id,
                'name', f.name,
                'name_en', f.name_en,
                'name_cn', f.name_cn,
                'name_ru', f.name_ru,
                'icon_key', f.icon_key,
                'category', f.category
            )
        )
        FROM public.property_features pf
        JOIN public.features f ON pf.feature_id = f.id
        WHERE pf.property_id = c.id
    ) as features,
    
    -- 🚀 GOD TIER OPTIMIZATION: Subquery main_image to eliminate N+1 joins
    (
        SELECT url 
        FROM public.property_media_v3 
        WHERE property_id = c.id AND is_cover = true 
        ORDER BY sort_order ASC 
        LIMIT 1
    ) as main_image

FROM public.properties_core c
LEFT JOIN public.properties_details d ON c.id = d.property_id;

-- Recreate property_images view bridge
DROP VIEW IF EXISTS public.property_images CASCADE;
CREATE OR REPLACE VIEW public.property_images WITH (security_invoker = true) AS
SELECT 
    id,
    property_id,
    url,
    url as image_url,
    storage_path,
    is_cover,
    sort_order,
    media_type,
    ai_scan_status,
    ai_scan_result,
    created_at
FROM public.property_media_v3;

COMMENT ON VIEW public.property_images IS '@foreignKey (property_id) references public.properties (id)';

-- Recreate computed relationship
CREATE OR REPLACE FUNCTION public.profiles(property public.properties)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM public.profiles WHERE id = property.assigned_to;
$$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
