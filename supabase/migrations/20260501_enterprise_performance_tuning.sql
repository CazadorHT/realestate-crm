-- 🚀 SRE Phase 3.2: Enterprise Performance Tuning
-- Objective: Optimize slow queries identified via Sentry Performance profiling.
-- Focus: Global Search (Trigram), Analytics (Composite Indices), and RPC Refactoring (CTEs).

-- 1. Enable Trigram extension (already enabled but for safety)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Global Search Hardening: Trigram Indices for Leads & Owners
-- These speed up ILIKE '%term%' searches by 10x-50x
CREATE INDEX IF NOT EXISTS idx_leads_search_trgm 
ON public.leads USING gin (full_name gin_trgm_ops, phone gin_trgm_ops, email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_owners_search_trgm 
ON public.owners USING gin (full_name gin_trgm_ops, phone gin_trgm_ops, company_name gin_trgm_ops);

-- 3. Analytics & Reporting: Composite Indices for Time-Series Data
-- Prevents slow sequential scans on large log tables
CREATE INDEX IF NOT EXISTS idx_property_views_log_tenant_date 
ON public.property_views_log (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_date 
ON public.audit_logs (tenant_id, created_at DESC);

-- 4. RPC Refactoring: Optimized Analytics Summary (v2.1)
-- Uses CTEs to scan property_views_log only once per logical block
CREATE OR REPLACE FUNCTION public.get_analytics_summary_v3(
    p_tenant_id UUID,
    p_days INTEGER DEFAULT 30,
    p_listing_type TEXT DEFAULT NULL,
    p_property_type TEXT DEFAULT NULL,
    p_area TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_result JSONB;
BEGIN
    v_start_date := now() - (COALESCE(p_days, 30) || ' days')::INTERVAL;

    WITH filtered_views AS (
        -- Scan logs once and join with properties to get facets
        SELECT l.*, p.listing_type, p.property_type, p.popular_area
        FROM public.property_views_log l
        JOIN public.properties p ON l.property_id = p.id
        WHERE (p_tenant_id IS NULL OR l.tenant_id = p_tenant_id)
          AND l.created_at >= v_start_date
          AND (p_listing_type IS NULL OR p_listing_type = 'all' OR p.listing_type = p_listing_type)
          AND (p_property_type IS NULL OR p_property_type = 'ALL' OR p.property_type = p_property_type)
          AND (p_area IS NULL OR p_area = 'all' OR p.popular_area = p_area)
    ),
    filtered_leads AS (
        SELECT id, assigned_to
        FROM public.leads
        WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
          AND created_at >= v_start_date
    ),
    filtered_deals AS (
        SELECT id, created_by
        FROM public.deals
        WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
          AND created_at >= v_start_date
    )
    SELECT jsonb_build_object(
        'total_views', (SELECT COUNT(*) FROM filtered_views),
        'total_leads', (SELECT COUNT(*) FROM filtered_leads),
        'total_deals', (SELECT COUNT(*) FROM filtered_deals),
        
        'daily_trends', (
            SELECT jsonb_agg(d) FROM (
                SELECT date_trunc('day', created_at)::date::text as date, COUNT(*) as views
                FROM filtered_views GROUP BY 1 ORDER BY 1
            ) d
        ),
        
        'area_distribution', (
            SELECT jsonb_agg(a) FROM (
                SELECT popular_area as label, COUNT(*) as value
                FROM filtered_views WHERE popular_area IS NOT NULL
                GROUP BY 1 ORDER BY 2 DESC LIMIT 10
            ) a
        ),

        'listing_type_distribution', (
            SELECT jsonb_agg(lt) FROM (
                SELECT listing_type as label, COUNT(*) as value
                FROM filtered_views WHERE listing_type IS NOT NULL
                GROUP BY 1 ORDER BY 2 DESC
            ) lt
        ),

        'agent_performance', (
            SELECT jsonb_agg(ap) FROM (
                SELECT 
                    prof.full_name as name,
                    COUNT(DISTINCT l.id) as leads_count,
                    COUNT(DISTINCT d.id) as deals_count
                FROM public.profiles prof
                LEFT JOIN filtered_leads l ON l.assigned_to = prof.id
                LEFT JOIN filtered_deals d ON d.created_by = prof.id
                JOIN public.tenant_members tm ON tm.profile_id = prof.id
                WHERE (p_tenant_id IS NULL OR tm.tenant_id = p_tenant_id)
                GROUP BY prof.id, prof.full_name
                HAVING COUNT(DISTINCT l.id) > 0 OR COUNT(DISTINCT d.id) > 0
                ORDER BY 3 DESC, 2 DESC LIMIT 5
            ) ap
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC Refactoring: Optimized Search Facets (v2.9)
-- Uses a CTE to filter properties once based on search term
CREATE OR REPLACE FUNCTION public.get_public_property_facets_v2(
  p_q TEXT DEFAULT NULL,
  p_province TEXT DEFAULT NULL,
  p_property_type TEXT DEFAULT NULL,
  p_listing_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_q TEXT;
BEGIN
  v_q := CASE WHEN p_q IS NULL OR p_q = '' THEN NULL ELSE '%' || p_q || '%' END;

  WITH filtered_props AS (
    SELECT p.province, p.property_type, p.listing_type, p.popular_area, pa.name_en, pa.name_cn
    FROM public.properties p
    LEFT JOIN public.popular_areas pa ON pa.name = p.popular_area
    WHERE p.status = 'ACTIVE' AND p.deleted_at IS NULL
    AND (p_q IS NULL OR p_q = '' OR (
      p.title ILIKE v_q OR p.title_en ILIKE v_q OR p.title_cn ILIKE v_q OR
      p.description ILIKE v_q OR p.description_en ILIKE v_q OR p.description_cn ILIKE v_q OR
      p.popular_area ILIKE v_q OR p.province ILIKE v_q OR
      to_tsvector('simple', COALESCE(p.ai_summary_content, '')) @@ plainto_tsquery('simple', p_q)
    ))
  )
  SELECT jsonb_build_object(
    'availableProvinces', (
      SELECT jsonb_object_agg(province, count) FROM (
        SELECT province, count(*) as count FROM filtered_props GROUP BY 1
      ) p
    ),
    'availableTypes', (
      SELECT jsonb_object_agg(property_type, count) FROM (
        SELECT property_type, count(*) as count FROM filtered_props GROUP BY 1
      ) t
    ),
    'availableListingTypes', (
      SELECT jsonb_build_object(
        'SALE', (SELECT count(*) FROM filtered_props WHERE listing_type IN ('SALE', 'SALE_AND_RENT')),
        'RENT', (SELECT count(*) FROM filtered_props WHERE listing_type IN ('RENT', 'SALE_AND_RENT')),
        'ALL', (SELECT count(*) FROM filtered_props)
      )
    ),
    'availableAreas', (
      SELECT jsonb_object_agg(popular_area, details) FROM (
        SELECT 
          popular_area,
          jsonb_build_object(
            'count', count(*),
            'name_en', COALESCE(name_en, popular_area),
            'name_cn', COALESCE(name_cn, popular_area)
          ) as details
        FROM filtered_props
        WHERE popular_area IS NOT NULL
        GROUP BY 1, name_en, name_cn
      ) a
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;
