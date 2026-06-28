-- Migration: Add SEO and AI flags to popular areas and recreate the helper count RPC function.

-- 1. Add SEO title, SEO description, and is_ai_generated columns to popular_areas_v3
ALTER TABLE public.popular_areas_v3 
  ADD COLUMN IF NOT EXISTS seo_title jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_description jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false;

-- 2. Backfill slugs if there are any records missing them
UPDATE public.popular_areas_v3
SET slug = COALESCE(
  LOWER(REGEXP_REPLACE(name->>'en', '[^a-zA-Z0-9]+', '-', 'g')),
  'area-' || id::text
)
WHERE slug IS NULL OR slug = '';

-- 3. Create unique index on slug for URL mapping
CREATE UNIQUE INDEX IF NOT EXISTS idx_popular_areas_v3_slug 
ON public.popular_areas_v3 (slug);

-- 4. Drop the old get_popular_areas_with_counts RPC function (with exact argument types)
DROP FUNCTION IF EXISTS public.get_popular_areas_with_counts(uuid);

-- 5. Recreate RPC function with new SEO columns and is_ai_generated column returned
CREATE OR REPLACE FUNCTION public.get_popular_areas_with_counts(target_tenant_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid,
  name text,
  name_en text,
  name_cn text,
  name_ru text,
  province text,
  slug text,
  image_url text,
  is_active boolean,
  sort_order integer,
  featured boolean,
  created_at timestamp with time zone,
  description jsonb,
  seo_title jsonb,
  seo_description jsonb,
  is_ai_generated boolean,
  property_count bigint
)
LANGUAGE plpgsql STABLE
SET search_path TO 'public'
AS $$
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
    pa.description,
    pa.seo_title,
    pa.seo_description,
    pa.is_ai_generated,
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
END $$;
