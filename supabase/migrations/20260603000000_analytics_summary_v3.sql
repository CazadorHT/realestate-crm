-- 🚀 Add get_analytics_summary_v3 RPC & optimized index for analytics

-- 1. Create optimized composite index on traffic_views_v3 partitioned table
CREATE INDEX IF NOT EXISTS idx_traffic_views_v3_tenant_created 
ON public.traffic_views_v3 (tenant_id, created_at DESC);

-- 2. Create the consolidated analytics summary RPC
CREATE OR REPLACE FUNCTION public.get_analytics_summary_v3(
    p_tenant_id UUID,
    p_days INTEGER DEFAULT 30,
    p_listing_type TEXT DEFAULT NULL,
    p_property_type TEXT DEFAULT NULL,
    p_area TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_result JSONB;
BEGIN
    v_start_date := now() - (COALESCE(p_days, 30) || ' days')::INTERVAL;

    WITH filtered_views AS (
        -- Scan partitioned logs and join with properties view to get facets
        SELECT l.created_at, l.tenant_id, p.listing_type, p.property_type, p.popular_area
        FROM public.traffic_views_v3 l
        JOIN public.properties p ON l.target_id = p.id
        WHERE l.target_type = 'property'
          AND p.deleted_at IS NULL
          AND (p_tenant_id IS NULL OR l.tenant_id = p_tenant_id)
          AND l.created_at >= v_start_date
          AND (p_listing_type IS NULL OR p_listing_type = 'all' OR p_listing_type = 'ALL' OR p.listing_type = p_listing_type)
          AND (p_property_type IS NULL OR p_property_type = 'ALL' OR p_property_type = 'all' OR p.property_type = p_property_type)
          AND (p_area IS NULL OR p_area = 'all' OR p_area = 'ALL' OR p.popular_area = p_area)
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
            SELECT COALESCE(jsonb_agg(d), '[]'::jsonb) FROM (
                SELECT date_trunc('day', created_at)::date::text as date, COUNT(*)::int as views
                FROM filtered_views GROUP BY 1 ORDER BY 1
            ) d
        ),
        
        'area_distribution', (
            SELECT COALESCE(jsonb_agg(a), '[]'::jsonb) FROM (
                SELECT popular_area as label, COUNT(*)::int as value
                FROM filtered_views WHERE popular_area IS NOT NULL
                GROUP BY 1 ORDER BY 2 DESC LIMIT 10
            ) a
        ),

        'listing_type_distribution', (
            SELECT COALESCE(jsonb_agg(lt), '[]'::jsonb) FROM (
                SELECT listing_type as label, COUNT(*)::int as value
                FROM filtered_views WHERE listing_type IS NOT NULL
                GROUP BY 1 ORDER BY 2 DESC
            ) lt
        ),

        'property_type_distribution', (
            SELECT COALESCE(jsonb_agg(pt), '[]'::jsonb) FROM (
                SELECT property_type as label, COUNT(*)::int as value
                FROM filtered_views WHERE property_type IS NOT NULL
                GROUP BY 1 ORDER BY 2 DESC
            ) pt
        ),

        'agent_performance', (
            SELECT COALESCE(jsonb_agg(ap), '[]'::jsonb) FROM (
                SELECT 
                    COALESCE(prof.full_name, prof.display_name, 'Unknown') as name,
                    COUNT(DISTINCT l.id)::int as leads_count,
                    COUNT(DISTINCT d.id)::int as deals_count
                FROM public.profiles prof
                LEFT JOIN filtered_leads l ON l.assigned_to = prof.id
                LEFT JOIN filtered_deals d ON d.created_by = prof.id
                JOIN public.tenant_members tm ON tm.profile_id = prof.id
                WHERE (p_tenant_id IS NULL OR tm.tenant_id = p_tenant_id)
                GROUP BY prof.id, prof.full_name, prof.display_name
                HAVING COUNT(DISTINCT l.id) > 0 OR COUNT(DISTINCT d.id) > 0
                ORDER BY 3 DESC, 2 DESC LIMIT 5
            ) ap
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;
