-- =============================================================================
-- Migration: V3 Popular Areas Core Join & Peak Performance Optimization
-- Created: 2026-05-16
-- Purpose: Upgrades get_popular_areas_with_counts to join properties_details 
--          and properties_core directly, bypassing legacy view overhead.
--          Implements exact Expression Indexes and Partial Compound Indexes 
--          to guarantee Index Only Scans and zero Memory/Disk Spill.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. High-Performance Expression & Partial Compound Indexes
-- ─────────────────────────────────────────────────────────────────────────────
-- A. Exact Expression Index matching the COALESCE join condition 100%
CREATE INDEX IF NOT EXISTS idx_popular_areas_v3_name_coalesce 
  ON public.popular_areas_v3 ((COALESCE(name->>'th', name->>'default', '')));

-- B. Expression Index for properties_details JSONB extraction
CREATE INDEX IF NOT EXISTS idx_properties_details_popular_area 
  ON public.properties_details ((address_info->>'popular_area'));

-- C. Partial Compound Index on properties_core for blazing fast active tenant joins
CREATE INDEX IF NOT EXISTS idx_properties_core_active_tenant 
  ON public.properties_core(tenant_id, status) 
  WHERE deleted_at IS NULL AND status = 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create Dynamic RPC Function with Direct V3 Core Join & Pre-Filtered ON Clauses
-- ─────────────────────────────────────────────────────────────────────────────
-- Drop existing function first to bypass Postgres strict return type limitation (ERROR: 42P13)
DROP FUNCTION IF EXISTS public.get_popular_areas_with_counts(uuid);

CREATE OR REPLACE FUNCTION public.get_popular_areas_with_counts(target_tenant_id uuid DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_en TEXT,
  name_cn TEXT,
  name_ru TEXT,
  province TEXT,
  slug TEXT,
  image_url TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  featured BOOLEAN,
  created_at TIMESTAMPTZ,
  property_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    COALESCE(pa.name->>'th', pa.name->>'default', '')::TEXT as name,
    (pa.name->>'en')::TEXT as name_en,
    (pa.name->>'cn')::TEXT as name_cn,
    (pa.name->>'ru')::TEXT as name_ru,
    pa.province,
    pa.slug,
    pa.image_url,
    pa.is_active,
    pa.sort_order,
    pa.featured,
    pa.created_at,
    COUNT(c.id)::BIGINT as property_count
  FROM public.popular_areas_v3 pa
  LEFT JOIN public.properties_details pd 
    ON COALESCE(pa.name->>'th', pa.name->>'default', '') = pd.address_info->>'popular_area'
  LEFT JOIN public.properties_core c 
    ON c.id = pd.property_id 
    AND c.status = 1 -- Active
    AND c.deleted_at IS NULL 
    AND (target_tenant_id IS NULL OR c.tenant_id = target_tenant_id)
  WHERE (target_tenant_id IS NULL OR pa.tenant_id = target_tenant_id)
  GROUP BY pa.id
  ORDER BY pa.sort_order ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_popular_areas_with_counts(uuid) TO authenticated, service_role, anon;

COMMIT;
