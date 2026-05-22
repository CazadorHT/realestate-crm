-- Performance Optimization for Sentinel Elite
-- Adding index for the reviewer column to speed up audit lookups and joins
CREATE INDEX IF NOT EXISTS idx_properties_ai_reviewed_by ON properties(ai_reviewed_by);

-- Optional: Adding a comment to the index for documentation
COMMENT ON INDEX idx_properties_ai_reviewed_by IS 'Index to optimize performance when joining with profiles for AI review audit trails';
