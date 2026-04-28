-- Migration to add Russian (RU) language support to various tables

-- 1. Properties Table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS title_ru TEXT,
ADD COLUMN IF NOT EXISTS description_ru TEXT,
ADD COLUMN IF NOT EXISTS address_line1_ru TEXT,
ADD COLUMN IF NOT EXISTS popular_area_ru TEXT,
ADD COLUMN IF NOT EXISTS transit_station_name_ru TEXT;

-- 2. Blog Posts Table
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS title_ru TEXT,
ADD COLUMN IF NOT EXISTS excerpt_ru TEXT,
ADD COLUMN IF NOT EXISTS content_ru TEXT;

-- 3. Blog Categories Table
ALTER TABLE blog_categories 
ADD COLUMN IF NOT EXISTS name_ru TEXT;

-- 4. FAQs Table
ALTER TABLE faqs 
ADD COLUMN IF NOT EXISTS question_ru TEXT,
ADD COLUMN IF NOT EXISTS answer_ru TEXT;

-- 5. Popular Areas Table
ALTER TABLE popular_areas 
ADD COLUMN IF NOT EXISTS name_ru TEXT;

-- 6. Services Table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS title_ru TEXT,
ADD COLUMN IF NOT EXISTS description_ru TEXT,
ADD COLUMN IF NOT EXISTS content_ru TEXT,
ADD COLUMN IF NOT EXISTS price_range_ru TEXT;
