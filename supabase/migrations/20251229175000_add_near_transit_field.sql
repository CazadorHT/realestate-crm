-- Add transit columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS near_transit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transit_station_name TEXT,
ADD COLUMN IF NOT EXISTS transit_type TEXT,
ADD COLUMN IF NOT EXISTS transit_distance_meters INTEGER;

-- Add transit columns to property_search_sessions table
ALTER TABLE public.property_search_sessions
ADD COLUMN IF NOT EXISTS near_transit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS transit_station_name TEXT,
ADD COLUMN IF NOT EXISTS transit_type TEXT,
ADD COLUMN IF NOT EXISTS transit_distance_meters INTEGER,
ADD COLUMN IF NOT EXISTS preferred_property_type TEXT;

-- Update existing condos to be true by default as a heuristic (just as a starting point)
UPDATE public.properties 
SET near_transit = true 
WHERE property_type = 'CONDO';
