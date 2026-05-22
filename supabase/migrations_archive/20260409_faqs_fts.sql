-- Add Full-Text Search (FTS) support for FAQs

-- 1. Create a function to generate the search vector
-- We combine question and answer across all languages
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS fts_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('simple', coalesce(question, '')) ||
  to_tsvector('simple', coalesce(question_en, '')) ||
  to_tsvector('simple', coalesce(question_cn, '')) ||
  to_tsvector('simple', coalesce(answer, '')) ||
  to_tsvector('simple', coalesce(answer_en, '')) ||
  to_tsvector('simple', coalesce(answer_cn, ''))
) STORED;

-- 2. Create the GIN index for fast searching
CREATE INDEX IF NOT EXISTS faqs_fts_idx ON public.faqs USING GIN (fts_vector);

-- 3. (Optional) If you want to support prefix matching (e.g., "search" matches "searching"), 
-- you can also add a trigram index, but GIN on tsvector is standard for FTS.
