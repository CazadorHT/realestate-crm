-- Migration: Add extra special features to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS is_cbd BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_smart_home BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_private_elevator BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_handicapped_friendly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_high_floor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_never_lived_in BOOLEAN DEFAULT false;

-- Comment for data context
COMMENT ON COLUMN properties.is_cbd IS 'Central Business District zone';
COMMENT ON COLUMN properties.is_smart_home IS 'Smart home system included';
COMMENT ON COLUMN properties.has_private_elevator IS 'Private elevator for luxury units';
COMMENT ON COLUMN properties.is_handicapped_friendly IS 'Accessibility for elderly or handicapped';
COMMENT ON COLUMN properties.is_high_floor IS 'High floor unit preference';
COMMENT ON COLUMN properties.is_never_lived_in IS 'Brand new / First hand unit';
