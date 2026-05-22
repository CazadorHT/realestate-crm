-- Migration to add requires_ai_review flag to blog_posts table
ALTER TABLE "public"."blog_posts" 
ADD COLUMN IF NOT EXISTS "requires_ai_review" boolean DEFAULT false NOT NULL;

-- Ensure RLS allows selecting this column (usually covered by *)
-- No changes needed for existing policies if they use select *
