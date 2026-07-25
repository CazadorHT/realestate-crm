-- RPC function to refresh mv_project_property_stats materialized view concurrently
CREATE OR REPLACE FUNCTION public.refresh_project_property_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_project_property_stats;
END;
$$;

-- Grant permissions to authenticated, service_role, and anon
GRANT EXECUTE ON FUNCTION public.refresh_project_property_stats() TO authenticated, service_role, anon;
