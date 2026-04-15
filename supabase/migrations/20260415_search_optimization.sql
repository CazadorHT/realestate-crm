-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indices for properties search columns
-- This significantly speeds up ILIKE keywords search

-- Title search (High Priority)
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm ON public.properties USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_title_en_trgm ON public.properties USING gin (title_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_title_cn_trgm ON public.properties USING gin (title_cn gin_trgm_ops);

-- Location search (Medium Priority)
CREATE INDEX IF NOT EXISTS idx_properties_province_trgm ON public.properties USING gin (province gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_district_trgm ON public.properties USING gin (district gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_subdistrict_trgm ON public.properties USING gin (subdistrict gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_popular_area_trgm ON public.properties USING gin (popular_area gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_address_line1_trgm ON public.properties USING gin (address_line1 gin_trgm_ops);

-- Description search (Optional - description can be very long, trgm is still better than seq scan)
-- Note: Large text might slightly increase index size, but it's worth it for CRM search
CREATE INDEX IF NOT EXISTS idx_properties_description_trgm ON public.properties USING gin (description gin_trgm_ops);
