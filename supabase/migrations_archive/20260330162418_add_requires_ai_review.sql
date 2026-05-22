-- Migration to add requires_ai_review flag to properties table
ALTER TABLE "public"."properties" 
ADD COLUMN IF NOT EXISTS "requires_ai_review" boolean DEFAULT false NOT NULL;
