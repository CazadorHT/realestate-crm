-- 📊 Financial Analytics Server-side Aggregation (v1)
-- This RPC calculates all financial KPIs in the database to support Big Data scaling.

CREATE OR REPLACE FUNCTION public.get_financial_analytics_v1(
    p_year INTEGER,
    p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_result JSONB;
BEGIN
    v_start_date := (p_year || '-01-01')::DATE;
    v_end_date := (p_year || '-12-31')::DATE;

    WITH monthly_revenue AS (
        SELECT 
            date_trunc('month', closed_at)::date as month,
            SUM(COALESCE(commission_amount, 0)) as revenue
        FROM public.deals
        WHERE status = 'CLOSED_WIN'
          AND closed_at >= v_start_date AND closed_at <= v_end_date
          AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        GROUP BY 1
    ),
    monthly_payouts AS (
        SELECT 
            date_trunc('month', created_at)::date as month,
            SUM(COALESCE(amount, 0)) as payouts,
            SUM(CASE WHEN status = 'PAID' THEN COALESCE(amount, 0) ELSE 0 END) as paid_payouts
        FROM public.deal_commissions
        WHERE created_at >= v_start_date AND created_at <= v_end_date
          AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        GROUP BY 1
    ),
    monthly_adjustments AS (
        SELECT 
            date_trunc('month', created_at)::date as month,
            SUM(COALESCE(amount, 0)) as adjustments
        FROM public.commission_adjustments
        WHERE created_at >= v_start_date AND created_at <= v_end_date
          AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
        GROUP BY 1
    ),
    all_months AS (
        SELECT generate_series(v_start_date, v_end_date, '1 month'::interval)::date as month
    ),
    trends AS (
        SELECT 
            am.month::text as month,
            COALESCE(r.revenue, 0) as revenue,
            COALESCE(p.payouts, 0) as payouts,
            -- Realized: Revenue - Paid Payouts + Adjustments
            COALESCE(r.revenue, 0) - COALESCE(p.paid_payouts, 0) + COALESCE(adj.adjustments, 0) as realized_profit,
            -- Accrued: - Unpaid Payouts
            -(COALESCE(p.payouts, 0) - COALESCE(p.paid_payouts, 0)) as accrued_profit
        FROM all_months am
        LEFT JOIN monthly_revenue r ON am.month = r.month
        LEFT JOIN monthly_payouts p ON am.month = p.month
        LEFT JOIN monthly_adjustments adj ON am.month = adj.month
        ORDER BY am.month
    )
    SELECT jsonb_build_object(
        'summary', jsonb_build_object(
            'totalRevenue', COALESCE(SUM(revenue), 0),
            'totalPayouts', COALESCE(SUM(payouts), 0),
            'totalAdjustments', (SELECT COALESCE(SUM(amount), 0) FROM public.commission_adjustments WHERE created_at >= v_start_date AND created_at <= v_end_date AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)),
            'realizedProfit', COALESCE(SUM(realized_profit), 0),
            'accruedProfit', COALESCE(SUM(accrued_profit), 0),
            'netProfit', COALESCE(SUM(realized_profit), 0) + COALESCE(SUM(accrued_profit), 0)
        ),
        'monthlyTrends', jsonb_agg(trends)
    ) INTO v_result
    FROM trends;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📅 Get Distinct Years with Financial Data
CREATE OR REPLACE FUNCTION public.get_distinct_finance_years()
RETURNS JSONB AS $$
DECLARE
    v_years JSONB;
BEGIN
    SELECT jsonb_agg(year) INTO v_years FROM (
        SELECT DISTINCT date_part('year', closed_at)::INTEGER as year
        FROM public.deals
        WHERE closed_at IS NOT NULL
        UNION
        SELECT DISTINCT date_part('year', created_at)::INTEGER
        FROM public.deal_commissions
        WHERE created_at IS NOT NULL
        ORDER BY 1 DESC
    ) y;
    
    RETURN COALESCE(v_years, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
