-- =============================================================================
-- Migration: V3 Ultimate Schema Alignment & Gap Closure
-- Created: 2026-05-16
-- Purpose: Aligns V3 migration scripts with live database generated types,
--          V2/V3 blueprints, and the Frontend Integration Plan.
--          Guarantees 100% exact match with lib/database.types.generated.ts.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Align properties_core with lib/database.types.generated.ts & Enforce FKs
-- ─────────────────────────────────────────────────────────────────────────────
-- A. Ensure all required columns exist
ALTER TABLE public.properties_core 
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS co_broker_id UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS owner_id UUID,
  ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_hot_deal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- B. Explicitly enforce Foreign Key constraints
-- (Bypasses Postgres limitation where ADD COLUMN IF NOT EXISTS skips FK creation if column exists)
ALTER TABLE public.properties_core DROP CONSTRAINT IF EXISTS properties_core_assigned_to_fkey;
ALTER TABLE public.properties_core ADD CONSTRAINT properties_core_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES public.identities_v3(id) ON DELETE SET NULL;

ALTER TABLE public.properties_core DROP CONSTRAINT IF EXISTS properties_core_co_broker_id_fkey;
ALTER TABLE public.properties_core ADD CONSTRAINT properties_core_co_broker_id_fkey 
  FOREIGN KEY (co_broker_id) REFERENCES public.identities_v3(id) ON DELETE SET NULL;

ALTER TABLE public.properties_core DROP CONSTRAINT IF EXISTS properties_core_created_by_fkey;
ALTER TABLE public.properties_core ADD CONSTRAINT properties_core_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.identities_v3(id) ON DELETE SET NULL;

ALTER TABLE public.properties_core DROP CONSTRAINT IF EXISTS properties_core_owner_id_fkey;
ALTER TABLE public.properties_core ADD CONSTRAINT properties_core_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES public.identities_v3(id) ON DELETE SET NULL;

-- C. Create indexes for foreign keys and search vector
CREATE INDEX IF NOT EXISTS idx_prop_core_assigned ON public.properties_core(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prop_core_cobroker ON public.properties_core(co_broker_id) WHERE co_broker_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prop_core_owner ON public.properties_core(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prop_core_search_vec ON public.properties_core USING GIN(search_vector);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create property_price_history_v3 (From V2 Blueprint)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.property_price_history_v3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties_core(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    currency VARCHAR(3) DEFAULT 'THB',
    changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prop_price_hist_v3 ON public.property_price_history_v3(property_id, changed_at DESC);

ALTER TABLE public.property_price_history_v3 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_history_read_all" ON public.property_price_history_v3
  FOR SELECT USING (true);

CREATE POLICY "price_history_write_tenant" ON public.property_price_history_v3
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members_v3
      WHERE identity_id = auth.uid() AND tenant_id = property_price_history_v3.tenant_id
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Fix match_properties_v3 RPC Function
-- ─────────────────────────────────────────────────────────────────────────────
-- Aligns return table structure with generated types (status smallint)
-- and corrects vector column reference to description_embedding.
DROP FUNCTION IF EXISTS public.match_properties_v3(vector, double precision, integer, uuid);

CREATE OR REPLACE FUNCTION public.match_properties_v3(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
    property_id uuid,
    tenant_id uuid,
    status smallint,
    price numeric,
    bedrooms int,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as property_id,
        c.tenant_id,
        c.status,
        c.sale_price as price,
        (c.bedrooms)::int as bedrooms,
        1 - (ai.description_embedding <=> query_embedding) AS similarity
    FROM public.properties_ai ai
    JOIN public.properties_core c ON c.id = ai.property_id
    WHERE 
        (p_tenant_id IS NULL OR c.tenant_id = p_tenant_id)
        AND c.status = 1 -- 1 = Active/Available
        AND c.deleted_at IS NULL
        AND 1 - (ai.description_embedding <=> query_embedding) > match_threshold
    ORDER BY ai.description_embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.match_properties_v3(vector, float, int, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_properties_v3(vector, float, int, uuid) TO service_role, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Update Properties View Bridge (Smart Mapping exactly matching Generated Types)
-- ─────────────────────────────────────────────────────────────────────────────
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

COMMIT;
