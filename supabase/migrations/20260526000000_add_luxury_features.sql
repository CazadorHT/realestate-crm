-- Migration: Add Luxury / Premium Feature Flags
-- Scope: properties (legacy flat table) + properties_core JSONB amenities (V3)
-- Features: Large Kitchen, Bar Counter, Bathtub, Walk-in Closet, Private Garden,
--            Garage, BBQ Area, Home Theatre, Private Gym, Wine Cellar

-- V1/V2 legacy flat table (properties)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS has_large_kitchen  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_bar_counter    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_bathtub        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_walk_in_closet BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_private_garden BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_garage         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_bbq_area       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_home_theatre   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_private_gym    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_wine_cellar    BOOLEAN DEFAULT false;

-- Comments for clarity
COMMENT ON COLUMN public.properties.has_large_kitchen  IS 'ห้องครัวใหญ่ (luxury property feature)';
COMMENT ON COLUMN public.properties.has_bar_counter    IS 'เคาท์เตอร์บาร์ (bar counter)';
COMMENT ON COLUMN public.properties.has_bathtub        IS 'อ่างแช่ตัว (bathtub)';
COMMENT ON COLUMN public.properties.has_walk_in_closet IS 'Walk-in Closet';
COMMENT ON COLUMN public.properties.has_private_garden IS 'สวนส่วนตัว (private garden)';
COMMENT ON COLUMN public.properties.has_garage         IS 'โรงจอดรถ (garage)';
COMMENT ON COLUMN public.properties.has_bbq_area       IS 'พื้นที่ BBQ (BBQ area)';
COMMENT ON COLUMN public.properties.has_home_theatre   IS 'Home Theatre';
COMMENT ON COLUMN public.properties.has_private_gym    IS 'Gym ส่วนตัว (private gym)';
COMMENT ON COLUMN public.properties.has_wine_cellar    IS 'Wine Cellar';

-- V3: New features are stored in properties_details.amenities (JSONB)
-- No schema change needed — JSONB is schema-less.
-- The application layer (create.ts / update.ts) will write these fields into
-- the amenities JSONB object automatically.
