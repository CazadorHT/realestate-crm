-- Migration: Auto partition management and optimized composite indexing
-- Created to automate partition creation and speed up CRM queries.

-- 1. Create partition management function
CREATE OR REPLACE FUNCTION public.auto_create_partitions_v3()
RETURNS void AS $$
DECLARE
    -- Monthly partitions ranges
    v_curr_month date := date_trunc('month', now())::date;
    v_next_month date := (date_trunc('month', now()) + interval '1 month')::date;
    v_month_after date := (date_trunc('month', now()) + interval '2 months')::date;
    
    -- Format names
    v_curr_month_str text := to_char(v_curr_month, 'YYYY_MM');
    v_next_month_str text := to_char(v_next_month, 'YYYY_MM');
    v_month_after_str text := to_char(v_month_after, 'YYYY_MM');
    
    -- Format ranges
    v_curr_month_start text := to_char(v_curr_month, 'YYYY-MM-DD');
    v_curr_month_end text := to_char(v_next_month, 'YYYY-MM-DD');
    v_next_month_start text := to_char(v_next_month, 'YYYY-MM-DD');
    v_next_month_end text := to_char(v_month_after, 'YYYY-MM-DD');
    v_month_after_start text := to_char(v_month_after, 'YYYY-MM-DD');
    v_month_after_end text := to_char(v_month_after + interval '1 month', 'YYYY-MM-DD');

    -- Quarterly partitions ranges
    v_curr_q_start date := date_trunc('quarter', now())::date;
    v_next_q_start date := (date_trunc('quarter', now()) + interval '3 months')::date;
    v_q_after_start date := (date_trunc('quarter', now()) + interval '6 months')::date;

    -- Format names
    v_curr_q_name text := to_char(v_curr_q_start, 'YYYY"q"Q');
    v_next_q_name text := to_char(v_next_q_start, 'YYYY"q"Q');
    v_q_after_name text := to_char(v_q_after_start, 'YYYY"q"Q');
    
    -- Format ranges
    v_curr_q_start_str text := to_char(v_curr_q_start, 'YYYY-MM-DD');
    v_curr_q_end_str text := to_char(v_next_q_start, 'YYYY-MM-DD');
    v_next_q_start_str text := to_char(v_next_q_start, 'YYYY-MM-DD');
    v_next_q_end_str text := to_char(v_q_after_start, 'YYYY-MM-DD');
    v_q_after_start_str text := to_char(v_q_after_start, 'YYYY-MM-DD');
    v_q_after_end_str text := to_char(v_q_after_start + interval '3 months', 'YYYY-MM-DD');
BEGIN
    -- Create system_audit_logs_v3 partitions
    -- Current Month
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'audit_logs_v3_' || v_curr_month_str) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.audit_logs_v3_%s PARTITION OF public.system_audit_logs_v3 FOR VALUES FROM (%L) TO (%L);', 
            v_curr_month_str, v_curr_month_start, v_curr_month_end);
    END IF;
    -- Next Month
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'audit_logs_v3_' || v_next_month_str) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.audit_logs_v3_%s PARTITION OF public.system_audit_logs_v3 FOR VALUES FROM (%L) TO (%L);', 
            v_next_month_str, v_next_month_start, v_next_month_end);
    END IF;
    -- 2 Months After (buffer)
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'audit_logs_v3_' || v_month_after_str) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.audit_logs_v3_%s PARTITION OF public.system_audit_logs_v3 FOR VALUES FROM (%L) TO (%L);', 
            v_month_after_str, v_month_after_start, v_month_after_end);
    END IF;

    -- Create traffic_views_v3 partitions
    -- Current Month
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'traffic_views_v3_' || v_curr_month_str) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.traffic_views_v3_%s PARTITION OF public.traffic_views_v3 FOR VALUES FROM (%L) TO (%L);', 
            v_curr_month_str, v_curr_month_start, v_curr_month_end);
    END IF;
    -- Next Month
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'traffic_views_v3_' || v_next_month_str) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.traffic_views_v3_%s PARTITION OF public.traffic_views_v3 FOR VALUES FROM (%L) TO (%L);', 
            v_next_month_str, v_next_month_start, v_next_month_end);
    END IF;
    -- 2 Months After (buffer)
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'traffic_views_v3_' || v_month_after_str) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.traffic_views_v3_%s PARTITION OF public.traffic_views_v3 FOR VALUES FROM (%L) TO (%L);', 
            v_month_after_str, v_month_after_start, v_month_after_end);
    END IF;

    -- Create ai_token_ledgers partitions
    -- Current Quarter
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ai_token_ledgers_' || lower(v_curr_q_name)) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.ai_token_ledgers_%s PARTITION OF public.ai_token_ledgers FOR VALUES FROM (%L) TO (%L);', 
            lower(v_curr_q_name), v_curr_q_start_str, v_curr_q_end_str);
    END IF;
    -- Next Quarter
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ai_token_ledgers_' || lower(v_next_q_name)) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.ai_token_ledgers_%s PARTITION OF public.ai_token_ledgers FOR VALUES FROM (%L) TO (%L);', 
            lower(v_next_q_name), v_next_q_start_str, v_next_q_end_str);
    END IF;
    -- Quarter After (buffer)
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ai_token_ledgers_' || lower(v_q_after_name)) THEN
        EXECUTE format('CREATE TABLE IF NOT EXISTS public.ai_token_ledgers_%s PARTITION OF public.ai_token_ledgers FOR VALUES FROM (%L) TO (%L);', 
            lower(v_q_after_name), v_q_after_start_str, v_q_after_end_str);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Execute immediately to ensure current & next partitions exist right now
SELECT public.auto_create_partitions_v3();

-- 3. Create optimized composite index for CRM screens filtering properties by tenant, status and non-deleted
CREATE INDEX IF NOT EXISTS idx_properties_core_tenant_status_crm 
ON public.properties_core USING btree (tenant_id, status) 
WHERE (deleted_at IS NULL);
