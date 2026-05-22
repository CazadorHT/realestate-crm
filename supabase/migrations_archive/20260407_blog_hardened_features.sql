-- Migration: Blog Engine Hardened Features 🚂🛡️💎
-- Description: Implement Soft Delete and Basic Analytics

-- 1. Add deleted_at column for Trash system
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add view_count column for simple Analytics
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;

-- 3. Create index for performance on read queries (filtering deleted ones)
CREATE INDEX IF NOT EXISTS idx_blog_posts_deleted_at ON blog_posts (deleted_at) WHERE deleted_at IS NULL;

-- 4. Enable RLS or update if necessary (standard RLS usually covers new columns, but keeping watch)
COMMENT ON COLUMN blog_posts.deleted_at IS 'Timestamp for soft delete (Trash system)';
COMMENT ON COLUMN blog_posts.view_count IS 'Simple analytics: total page views';
