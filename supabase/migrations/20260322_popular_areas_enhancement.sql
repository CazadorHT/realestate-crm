-- Add province column and other enhancements to popular_areas
ALTER TABLE IF EXISTS popular_areas 
ADD COLUMN IF NOT EXISTS province TEXT DEFAULT 'กรุงเทพมหานคร',
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Create an index for province filtering
CREATE INDEX IF NOT EXISTS idx_popular_areas_province ON popular_areas(province);

-- Update slugs for existing data (simplified)
UPDATE popular_areas SET slug = id::text WHERE slug IS NULL;
