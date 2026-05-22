-- ====================================================================
-- 🧠 Real Estate CRM Database V2 (Phase 5: Smart Logic & Optimization)
-- ====================================================================

-- 🛡️ Ensure extensions are in the right place before continuing
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        ALTER EXTENSION vector SET SCHEMA extensions;
    END IF;
END $$;

-- 1. AI Infrastructure for Identities (Lead Preferences)
ALTER TABLE identities 
ADD COLUMN IF NOT EXISTS search_embedding extensions.vector(1536);

-- 2. Performance Optimization (Generated Columns)
ALTER TABLE properties_v2 
ADD COLUMN IF NOT EXISTS price_per_sqm NUMERIC 
GENERATED ALWAYS AS (
    CASE WHEN floor_area > 0 THEN sale_price / floor_area ELSE NULL END
) STORED;

-- 3. Expression Indexes (Boosting View Performance)
CREATE INDEX IF NOT EXISTS idx_prop_district ON properties_v2 ((address_info->>'district'));
CREATE INDEX IF NOT EXISTS idx_prop_province ON properties_v2 ((address_info->>'province'));
CREATE INDEX IF NOT EXISTS idx_prop_is_hot_deal ON properties_v2 (((amenities->>'is_hot_deal')::boolean));
CREATE INDEX IF NOT EXISTS idx_prop_is_pet_friendly ON properties_v2 (((amenities->>'is_pet_friendly')::boolean));
CREATE INDEX IF NOT EXISTS idx_prop_floor ON properties_v2 (((metadata->>'floor')::integer));

-- 4. Smart Match Engine (AI RPC)
-- ฟังก์ชันนี้จะทำการจับคู่ทรัพย์สินที่ "ใช่" ที่สุดสำหรับลูกค้าแต่ละคน
CREATE OR REPLACE FUNCTION match_properties_for_lead(
    p_lead_id UUID,
    p_threshold FLOAT DEFAULT 0.7,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    similarity FLOAT,
    match_score NUMERIC,
    sale_price NUMERIC,
    location GEOGRAPHY(POINT)
) AS $$
DECLARE
    v_embedding extensions.vector(1536);
    v_budget_max NUMERIC;
    v_tenant_id UUID;
BEGIN
    -- 1. ดึง Embedding, Budget และ Tenant ID ของ Lead
    SELECT search_embedding, (metadata->>'budget_max')::numeric, tenant_id
    INTO v_embedding, v_budget_max, v_tenant_id
    FROM public.identities WHERE id = p_lead_id;

    -- ถ้าไม่เจอ Embedding ให้คืนค่าว่าง
    IF v_embedding IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.title->>'th',
        (1 - (p.description_embedding <=> v_embedding))::FLOAT AS similarity,
        -- ผสม Logic: ความหมายตรงกัน 70% + อยู่ในงบ 30%
        ( ( (1 - (p.description_embedding <=> v_embedding)) * 0.7 ) + 
          ( CASE WHEN p.sale_price <= v_budget_max THEN 0.3 ELSE 0 END ) ) * 100 AS match_score,
        p.sale_price,
        p.location
    FROM public.properties_v2 p
    WHERE p.tenant_id = v_tenant_id 
      AND p.deleted_at IS NULL 
      AND p.status = 'active'
      AND (1 - (p.description_embedding <=> v_embedding)) > p_threshold
    ORDER BY match_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';

-- Lockdown for security
REVOKE EXECUTE ON FUNCTION match_properties_for_lead(UUID, FLOAT, INTEGER) FROM PUBLIC;
