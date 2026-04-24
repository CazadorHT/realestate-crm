-- Add translation columns for price_range in services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS price_range_en TEXT,
ADD COLUMN IF NOT EXISTS price_range_cn TEXT;

-- Update existing records if needed (optional, usually they'd be empty)
COMMENT ON COLUMN public.services.price_range_en IS 'Price range description in English';
COMMENT ON COLUMN public.services.price_range_cn IS 'Price range description in Chinese';
