-- 🛡️ Phase 5.2: AI & LINE Intelligence Layer
-- Goal: Enable Semantic Vector Search using pgvector for Smart Matching

-- 1. Enable pgvector extension (Supabase comes with this pre-installed, just needs enabling)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding columns to Properties and Leads
-- Note: Google Gemini text-embedding-004 uses 768 dimensions
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS embedding vector(768);

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Create indices for fast similarity search (IVFFlat or HNSW)
-- HNSW is generally better for dynamic data but requires more memory
CREATE INDEX IF NOT EXISTS idx_properties_embedding 
ON public.properties USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_leads_embedding 
ON public.leads USING hnsw (embedding vector_cosine_ops);

-- 4. Create the Smart Match Function
-- This function performs cosine similarity search within a tenant (if applicable)
-- and allows filtering by similarity threshold.
CREATE OR REPLACE FUNCTION public.match_properties(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title text,
    slug text,
    property_type property_type,
    listing_type listing_type,
    price numeric,
    rental_price numeric,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.slug,
        p.property_type,
        p.listing_type,
        p.price,
        p.rental_price,
        1 - (p.embedding <=> query_embedding) AS similarity
    FROM public.properties p
    WHERE 
        p.deleted_at IS NULL
        AND (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
        AND 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_properties IS 'Finds properties semantically similar to the provided embedding vector.';