-- 🛡️ Phase 5.1: AI Context Readiness
-- Goal: Prepare "Brain Food" for upcoming AI Smart Match features by 
-- aggregating property markers into a single searchable text blob.

-- 1. Add AI Summary Column
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS ai_summary_content TEXT;

-- 2. Create index for GIN search (Full Text Search ready)
CREATE INDEX IF NOT EXISTS idx_properties_ai_summary ON public.properties USING gin(to_tsvector('english', COALESCE(ai_summary_content, '')));

-- 3. Update Sync Function to handle AI Content
CREATE OR REPLACE FUNCTION public.fn_sync_property_ai_context()
RETURNS TRIGGER AS $$
DECLARE
    v_features TEXT;
BEGIN
    -- Aggregate features into a single string
    SELECT string_agg(f.name, ', ')
    INTO v_features
    FROM property_features pf
    JOIN features f ON pf.feature_id = f.id
    WHERE pf.property_id = NEW.id;

    -- Build the AI Content Blob
    -- Format: [Title] | [Listing Type] [Property Type] in [Area], [Province] | [Bed]BR [Bath]BA [Size]sqm | Features: [Features] | Highlights: [Keywords]
    NEW.ai_summary_content := format(
        '%s | %s %s in %s, %s | %sBR %sBA %ssqm | Features: %s | Highlights: %s | Description: %s',
        COALESCE(NEW.title, ''),
        COALESCE(NEW.listing_type::text, ''),
        COALESCE(NEW.property_type::text, ''),
        COALESCE(NEW.popular_area, NEW.district, ''),
        COALESCE(NEW.province, ''),
        COALESCE(NEW.bedrooms::text, '0'),
        COALESCE(NEW.bathrooms::text, '0'),
        COALESCE(NEW.size_sqm::text, '0'),
        COALESCE(v_features, 'None'),
        COALESCE(array_to_string(NEW.meta_keywords, ', '), 'None'),
        substring(COALESCE(NEW.description, '') from 1 for 500)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS trig_sync_property_ai_context ON public.properties;
CREATE TRIGGER trig_sync_property_ai_context
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_property_ai_context();

-- 5. Backfill existing records
UPDATE public.properties
SET ai_summary_content = 'PENDING_SYNC' -- This triggers the above trigger
WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.properties.ai_summary_content IS 'Aggregated property context for AI Vectorization and Semantic Search. managed by trigger.';

