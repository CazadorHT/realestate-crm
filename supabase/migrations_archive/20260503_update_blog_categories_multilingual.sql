-- Update Blog Categories with Multilingual Support
-- This script moves current English names to name_en and adds TH, CN, RU translations

-- 1. Update "Investment"
UPDATE blog_categories 
SET 
    name = 'การลงทุน',
    name_en = 'Investment',
    name_cn = '投资',
    name_ru = 'Инвестиции'
WHERE slug = 'investment';

-- 2. Update "Market Update"
UPDATE blog_categories 
SET 
    name = 'อัปเดตตลาด',
    name_en = 'Market Update',
    name_cn = '市场动态',
    name_ru = 'Обзор рынка'
WHERE slug = 'market-update';

-- 3. Update "News"
UPDATE blog_categories 
SET 
    name = 'ข่าวสาร',
    name_en = 'News',
    name_cn = '新闻',
    name_ru = 'Новости'
WHERE slug = 'news';

-- 4. Update "Tips"
UPDATE blog_categories 
SET 
    name = 'เคล็ดลับและสาระน่ารู้',
    name_en = 'Tips & Tricks',
    name_cn = '技巧与窍门',
    name_ru = 'Советы и рекомендации'
WHERE slug = 'tips';

-- Ensure "General" exists and is translated (if any)
UPDATE blog_categories 
SET 
    name = 'ทั่วไป',
    name_en = 'General',
    name_cn = '常规',
    name_ru = 'Общие'
WHERE name = 'General' OR slug = 'general';
