-- Fix match_properties_hardened to respect property status
-- Ensures that only ACTIVE properties are returned in hybrid vector search
CREATE OR REPLACE FUNCTION public.match_properties_hardened(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    slug text,
    property_type public.property_type,
    listing_type public.listing_type,
    price numeric,
    rental_price numeric,
    similarity float
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_is_admin boolean := public.is_system_admin();
    v_user_tenants uuid[] := public.get_user_tenants();
BEGIN
    -- [SECURITY] Enforce tenant isolation
    IF NOT v_is_admin AND p_tenant_id IS NOT NULL AND NOT (p_tenant_id = ANY(v_user_tenants)) THEN
        RAISE EXCEPTION 'Unauthorized tenant access for matching';
    END IF;

    RETURN QUERY
    WITH similarity_base AS (
        SELECT
            p.id,
            p.title,
            p.slug,
            p.property_type,
            p.listing_type,
            p.price,
            p.rental_price,
            1 - (p.embedding <=> query_embedding) AS calc_similarity
        FROM public.properties p
        WHERE 
            p.deleted_at IS NULL
            AND p.status = 'ACTIVE' -- ✨ Added status check
            AND (
                v_is_admin 
                OR (p_tenant_id IS NOT NULL AND p.tenant_id = p_tenant_id)
                OR (p_tenant_id IS NULL AND p.tenant_id = ANY(v_user_tenants))
            )
            AND p.embedding <=> query_embedding < (1 - match_threshold)
    )
    SELECT *
    FROM similarity_base
    WHERE calc_similarity > match_threshold
    ORDER BY calc_similarity DESC
    LIMIT match_count;
END;
$$;

-- 🛡️ SECURITY HARDENING: match_properties_hardened
-- Converted to SECURITY INVOKER to satisfy Supabase Linter warnings.
-- It now relies entirely on the calling user's permissions and RLS.

REVOKE EXECUTE ON FUNCTION public.match_properties_hardened(vector(768), float, int, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_properties_hardened(vector(768), float, int, uuid) TO authenticated, service_role, anon;

COMMENT ON FUNCTION public.match_properties_hardened IS 'Hardened hybrid vector search with strict tenant isolation and status filtering. Uses SECURITY INVOKER.';
