-- 1. Create a specialized RPC for Enterprise Analytics
-- This handles all aggregations inside the database for maximum performance.

CREATE OR REPLACE FUNCTION public.get_analytics_summary_v2(
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
    v_total_views BIGINT;
    v_total_leads BIGINT;
    v_total_deals BIGINT;
BEGIN
    v_start_date := CASE 
        WHEN p_days IS NULL THEN '1970-01-01'::TIMESTAMPTZ 
        ELSE now() - (p_days || ' days')::INTERVAL 
    END;

    -- 1. Total Counts (Funnel)
    -- Views
    SELECT COUNT(*) INTO v_total_views
    FROM public.property_views_log
    WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
      AND created_at >= v_start_date;

    -- Leads
    SELECT COUNT(*) INTO v_total_leads
    FROM public.leads
    WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
      AND created_at >= v_start_date
      AND (p_listing_type IS NULL OR p_listing_type = 'all' OR property_id IN (SELECT id FROM properties WHERE listing_type = p_listing_type))
      AND (p_property_type IS NULL OR p_property_type = 'ALL' OR property_id IN (SELECT id FROM properties WHERE property_type = p_property_type))
      AND (p_area IS NULL OR p_area = 'all' OR property_id IN (SELECT id FROM properties WHERE popular_area = p_area));

    -- Deals
    SELECT COUNT(*) INTO v_total_deals
    FROM public.deals
    WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
      AND created_at >= v_start_date;

    -- 2. Build the final JSON result
    v_result := jsonb_build_object(
        'total_views', v_total_views,
        'total_leads', v_total_leads,
        'total_deals', v_total_deals,
        
        -- Daily Trends (Views)
        'daily_trends', (
            SELECT jsonb_agg(d) FROM (
                SELECT 
                    date_trunc('day', created_at)::date::text as date,
                    COUNT(*) as views
                FROM public.property_views_log
                WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
                  AND created_at >= v_start_date
                GROUP BY 1
                ORDER BY 1
            ) d
        ),
        
        -- Area Distribution
        'area_distribution', (
            SELECT jsonb_agg(a) FROM (
                SELECT 
                    p.popular_area as label,
                    COUNT(*) as value
                FROM public.property_views_log l
                JOIN public.properties p ON l.property_id = p.id
                WHERE (p_tenant_id IS NULL OR l.tenant_id = p_tenant_id)
                  AND l.created_at >= v_start_date
                GROUP BY 1
                ORDER BY 2 DESC
                LIMIT 10
            ) a
        ),

        -- Listing Type Distribution
        'listing_type_distribution', (
            SELECT jsonb_agg(lt) FROM (
                SELECT 
                    p.listing_type as label,
                    COUNT(*) as value
                FROM public.property_views_log l
                JOIN public.properties p ON l.property_id = p.id
                WHERE (p_tenant_id IS NULL OR l.tenant_id = p_tenant_id)
                  AND l.created_at >= v_start_date
                GROUP BY 1
                ORDER BY 2 DESC
            ) lt
        ),

        -- Property Type Distribution
        'property_type_distribution', (
            SELECT jsonb_agg(pt) FROM (
                SELECT 
                    p.property_type as label,
                    COUNT(*) as value
                FROM public.property_views_log l
                JOIN public.properties p ON l.property_id = p.id
                WHERE (p_tenant_id IS NULL OR l.tenant_id = p_tenant_id)
                  AND l.created_at >= v_start_date
                GROUP BY 1
                ORDER BY 2 DESC
            ) pt
        ),

        -- Agent Performance
        'agent_performance', (
            SELECT jsonb_agg(ap) FROM (
                SELECT 
                    prof.full_name as name,
                    COUNT(DISTINCT l.id) as leads_count,
                    COUNT(DISTINCT d.id) as deals_count
                FROM public.profiles prof
                LEFT JOIN public.leads l ON l.assigned_to = prof.id AND l.created_at >= v_start_date
                LEFT JOIN public.deals d ON d.created_by = prof.id AND d.created_at >= v_start_date
                JOIN public.tenant_members tm ON tm.profile_id = prof.id
                WHERE (p_tenant_id IS NULL OR tm.tenant_id = p_tenant_id)
                GROUP BY prof.id, prof.full_name
                HAVING COUNT(DISTINCT l.id) > 0 OR COUNT(DISTINCT d.id) > 0
                ORDER BY 3 DESC, 2 DESC
                LIMIT 5
            ) ap
        )
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
