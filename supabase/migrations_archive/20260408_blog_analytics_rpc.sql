-- 1. Create blog_post_views_log table
CREATE TABLE IF NOT EXISTS public.blog_post_views_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indexes for faster aggregation
CREATE INDEX IF NOT EXISTS idx_blog_post_views_log_created_at ON public.blog_post_views_log(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_log_post_id ON public.blog_post_views_log(post_id);

-- 3. Enable RLS
ALTER TABLE public.blog_post_views_log ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Public can insert (via RPC)
CREATE POLICY "Public can insert blog views log" 
ON public.blog_post_views_log 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 5. RLS Policy: Admins can view analytics
CREATE POLICY "Admins can view blog analytics" 
ON public.blog_post_views_log 
FOR SELECT 
TO authenticated 
USING (
  is_system_admin() 
  OR (EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER') ))
);

-- 6. Update increment_blog_post_view function to include logging
CREATE OR REPLACE FUNCTION public.increment_blog_post_view(post_id uuid)
RETURNS void AS $$
BEGIN
  -- 1. Increment total view_count on blog_post
  -- Using SECURITY DEFINER to bypass RLS for this specific update
  UPDATE public.blog_posts 
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = now()
  WHERE id = post_id;

  -- 2. Log the individual view event
  INSERT INTO public.blog_post_views_log (post_id, created_at)
  VALUES (post_id, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
