-- Migration: 20260608000000_bulk_approve_ai_review.sql

CREATE OR REPLACE FUNCTION public.bulk_approve_ai_review(
    p_ids uuid[],
    p_user_id uuid,
    p_reviewed_at text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_count integer := 0;
    v_id uuid;
BEGIN
    FOREACH v_id IN ARRAY p_ids LOOP
        -- Update properties_details metadata using JSONB merge operator to preserve other keys
        UPDATE public.properties_details
        SET meta_data = COALESCE(meta_data, '{}'::jsonb) 
            || jsonb_build_object(
                'requires_ai_review', false,
                'ai_reviewed_at', p_reviewed_at,
                'ai_reviewed_by', p_user_id::text
            )
        WHERE property_id = v_id;

        -- Update properties_core updated_at
        UPDATE public.properties_core
        SET updated_at = now()
        WHERE id = v_id;

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- Grant permissions for bulk_approve_ai_review
REVOKE ALL ON FUNCTION public.bulk_approve_ai_review(uuid[], uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_approve_ai_review(uuid[], uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_approve_ai_review(uuid[], uuid, text) TO service_role;
