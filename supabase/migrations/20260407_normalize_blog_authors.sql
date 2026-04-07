-- Migration: Normalize Blog Authors (JSONB -> Relational)
-- Created: 2026-04-07

-- 1. Add author_id column
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Try to migrate legacy data (Best effort: matching names from JSONB to profiles)
-- This assumes the 'author' JSONB had a 'name' field that matches profiles.full_name
UPDATE public.blog_posts 
SET author_id = p.id
FROM public.profiles p
WHERE 
  blog_posts.author_id IS NULL AND 
  blog_posts.author->>'name' = p.full_name;

-- 3. Safety: If any posts remain without author, assign to the creator if possible (audit trails)
-- For a fresh system, we might leave them as NULL or assign to a default Admin.

-- 4. Clean up legacy JSONB column (Optional: Keep it for a while if risky, but we'll remove it for normalization)
-- ALTER TABLE public.blog_posts DROP COLUMN IF EXISTS author;

-- 5. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);

-- 6. Update RLS (Ensure staff can still manage)
-- (Existing policies usually cover this if based on roles, but we'll re-verify)
COMMENT ON COLUMN public.blog_posts.author_id IS 'Relational link to the profiles table for post authorship.';
