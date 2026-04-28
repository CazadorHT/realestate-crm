-- Migration: Add Russian (RU) translations to core tables
-- Description: Adds _ru columns to properties, blog_posts, categories, faqs, popular_areas, and services for internationalization support.

-- 1. Properties Table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS title_ru TEXT,
ADD COLUMN IF NOT EXISTS description_ru TEXT,
ADD COLUMN IF NOT EXISTS address_line1_ru TEXT,
ADD COLUMN IF NOT EXISTS popular_area_ru TEXT,
ADD COLUMN IF NOT EXISTS transit_station_name_ru TEXT;

-- 2. Blog Posts Table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS title_ru TEXT,
ADD COLUMN IF NOT EXISTS excerpt_ru TEXT,
ADD COLUMN IF NOT EXISTS content_ru TEXT;

-- 3. Blog Categories Table
ALTER TABLE public.blog_categories 
ADD COLUMN IF NOT EXISTS name_ru TEXT;

-- 4. FAQs Table
ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS question_ru TEXT,
ADD COLUMN IF NOT EXISTS answer_ru TEXT;

-- 5. Popular Areas Table
ALTER TABLE public.popular_areas 
ADD COLUMN IF NOT EXISTS name_ru TEXT;

-- 6. Services Table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS title_ru TEXT,
ADD COLUMN IF NOT EXISTS description_ru TEXT,
ADD COLUMN IF NOT EXISTS content_ru TEXT,
ADD COLUMN IF NOT EXISTS price_range_ru TEXT;

-- 7. Reference Banks Table (Already included in previous step)
ALTER TABLE public.ref_banks
ADD COLUMN IF NOT EXISTS name_ru TEXT;

-- 8. Features Table (property amenities/features)
ALTER TABLE public.features
ADD COLUMN IF NOT EXISTS name_ru TEXT;

-- Indexing for search performance
CREATE INDEX IF NOT EXISTS idx_properties_title_ru_trgm ON public.properties USING gin (title_ru gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_ru_trgm ON public.blog_posts USING gin (title_ru gin_trgm_ops);
