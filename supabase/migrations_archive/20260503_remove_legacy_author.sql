-- Migration: Remove Legacy Author Column
-- Description: Drops the old JSONB 'author' column from blog_posts as we've migrated to relational author_id.
-- Created: 2026-05-03

BEGIN;

-- 1. Remove the default value first (just to be clean)
ALTER TABLE public.blog_posts ALTER COLUMN author DROP DEFAULT;

-- 2. Drop the legacy column
ALTER TABLE public.blog_posts DROP COLUMN IF EXISTS author;

-- 3. Cleanup any other legacy mentions in comments if needed
COMMENT ON TABLE public.blog_posts IS 'Blog posts table with relational authorship and multilingual support.';

COMMIT;
