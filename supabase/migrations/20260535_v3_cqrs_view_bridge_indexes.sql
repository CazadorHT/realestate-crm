-- ============================================================================
-- 🌟 V3 Enterprise CQRS View Bridge High-Performance Indexing
-- ============================================================================
-- Description: Creates surgical precision GIN, Expression, and B-tree indexes
-- to guarantee sub-millisecond query performance on the View Bridge (public.properties,
-- public.leads, public.deals) for 1,000,000+ records.
-- ============================================================================

-- 1. Enable pg_trgm extension if not already enabled for advanced ILIKE text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- 🏛️ 1. Properties View Bridge Performance Indexes
-- ============================================================================

-- GIN Trigram Indexes for lightning-fast multi-language title & description search
CREATE INDEX IF NOT EXISTS idx_properties_details_title_th_trgm 
ON public.properties_details USING GIN ((title->>'th') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_details_title_en_trgm 
ON public.properties_details USING GIN ((title->>'en') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_details_desc_th_trgm 
ON public.properties_details USING GIN ((description->>'th') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_details_desc_en_trgm 
ON public.properties_details USING GIN ((description->>'en') gin_trgm_ops);

-- B-tree Expression Index for popular area filtering
CREATE INDEX IF NOT EXISTS idx_properties_details_popular_area_expr 
ON public.properties_details (((address_info->>'popular_area')));

-- B-tree Partial Compound Index on Core for active listings filtering
CREATE INDEX IF NOT EXISTS idx_properties_core_active_cqrs 
ON public.properties_core (tenant_id, status, sale_price) 
WHERE deleted_at IS NULL AND status = 1;

-- Add missing slug column to properties_core and update properties view bridge
ALTER TABLE public.properties_core ADD COLUMN IF NOT EXISTS slug TEXT;

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
    
    -- New Core Columns
    c.is_hot_deal,
    c.is_exclusive,
    c.verified,
    c.co_broker_id,
    c.slug,

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

CREATE INDEX IF NOT EXISTS idx_properties_core_slug 
ON public.properties_core (slug) 
WHERE deleted_at IS NULL;

-- ============================================================================
-- 🏛️ 2. Leads View Bridge Performance Indexes
-- ============================================================================

-- GIN Index on utm_data JSONB for deep querying
CREATE INDEX IF NOT EXISTS idx_crm_leads_v3_utm_data_gin 
ON public.crm_leads_v3 USING GIN (utm_data);

-- B-tree Compound Index for active leads filtering
CREATE INDEX IF NOT EXISTS idx_crm_leads_v3_active_cqrs 
ON public.crm_leads_v3 (tenant_id, status, stage);

-- ============================================================================
-- 🏛️ 3. Deals View Bridge Performance Indexes
-- ============================================================================

-- Foreign Key & Stage B-tree Indexes for fast JOINs and aggregations
CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_property_id 
ON public.crm_deals_v3 (property_id);

CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_lead_id 
ON public.crm_deals_v3 (lead_id);

CREATE INDEX IF NOT EXISTS idx_crm_deals_v3_tenant_status 
ON public.crm_deals_v3 (tenant_id, status);

-- ============================================================================
-- 🏛️ 4. CMS Content Multi-Language Performance Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cms_content_v3_title_th_trgm 
ON public.cms_content_v3 USING GIN ((title->>'th') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cms_content_v3_title_en_trgm 
ON public.cms_content_v3 USING GIN ((title->>'en') gin_trgm_ops);
