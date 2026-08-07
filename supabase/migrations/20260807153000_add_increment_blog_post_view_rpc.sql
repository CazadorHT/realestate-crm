-- Migration: Create increment_blog_post_view RPC function for atomic view count updates
CREATE OR REPLACE FUNCTION public.increment_blog_post_view(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.cms_content_v3
  SET meta_data = jsonb_set(
    COALESCE(meta_data, '{}'::jsonb),
    '{views}',
    to_jsonb(COALESCE((meta_data->>'views')::int, 0) + 1)
  )
  WHERE id = post_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_post_view(uuid) TO anon, authenticated, service_role;
