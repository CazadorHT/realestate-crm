-- Add AI Review Audit Columns to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS ai_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_reviewed_by UUID REFERENCES profiles(id);

-- Add Index for performance
CREATE INDEX IF NOT EXISTS idx_properties_requires_ai_review ON properties(requires_ai_review) WHERE requires_ai_review = true;

-- Update Audit Logs for consistency
COMMENT ON COLUMN properties.ai_reviewed_at IS 'Timestamp when AI content was manually approved by an admin';
COMMENT ON COLUMN properties.ai_reviewed_by IS 'The ID of the admin who approved the AI content';
