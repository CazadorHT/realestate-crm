-- Add backward-compatible generated columns for popular_areas_v3
-- Prevents 42703 (undefined_column) errors when queries request name_th, name_en, name_cn, name_ru

ALTER TABLE public.popular_areas_v3
  ADD COLUMN IF NOT EXISTS name_th TEXT GENERATED ALWAYS AS (COALESCE(name->>'th', name->>'default', '')) STORED,
  ADD COLUMN IF NOT EXISTS name_en TEXT GENERATED ALWAYS AS (COALESCE(name->>'en', '')) STORED,
  ADD COLUMN IF NOT EXISTS name_cn TEXT GENERATED ALWAYS AS (COALESCE(name->>'cn', '')) STORED,
  ADD COLUMN IF NOT EXISTS name_ru TEXT GENERATED ALWAYS AS (COALESCE(name->>'ru', '')) STORED;
