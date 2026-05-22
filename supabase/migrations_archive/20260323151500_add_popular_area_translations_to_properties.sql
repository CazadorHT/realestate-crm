-- 20260323_add_popular_area_translations_to_properties.sql
-- Goal: Fix property submission error by adding missing translation columns to properties table.

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS popular_area_en TEXT,
ADD COLUMN IF NOT EXISTS popular_area_cn TEXT;

-- Verify RLS: 'Properties Enterprise Access' uses FOR ALL and covers these new columns automatically.
-- No additional RLS changes needed as the existing policy uses tenant_id and created_by checks.
