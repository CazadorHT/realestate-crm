-- Add line_id column to leads table for storing LINE contact information
ALTER TABLE leads ADD COLUMN IF NOT EXISTS line_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN leads.line_id IS 'LINE ID for contacting the lead';
