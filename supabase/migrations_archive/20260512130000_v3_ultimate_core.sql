-- ====================================================================
-- 🚀 V3 Ultimate Enterprise Architecture (Phase 1: Core & Ingestion)
-- ====================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ลบความพยายามย้าย PostGIS ออก ปล่อยให้อยู่ใน public ตาม Default ของ Supabase
-- ป้องกัน Linter Warning จากสิทธิ์ Execute ของฟังก์ชัน PostGIS
DO $$
BEGIN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM PUBLIC, anon, authenticated';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM PUBLIC, anon, authenticated';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM PUBLIC, anon, authenticated';
EXCEPTION WHEN OTHERS THEN
    -- ข้ามไปถ้าไม่มีฟังก์ชัน
END $$;

-- ==========================================
-- 1. TENANT & MULTI-BRANCH FOUNDATION
-- ==========================================
CREATE TABLE public.tenants_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    global_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.branches_v3 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id) ON DELETE CASCADE,
    name JSONB NOT NULL,
    location GEOGRAPHY(POINT),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 2. DATA PROVENANCE (The Aggregator Engine)
-- ==========================================
CREATE TABLE public.data_sources (
    id TEXT PRIMARY KEY, -- 'livinginsider', 'ddproperty', 'manual'
    name TEXT NOT NULL,
    api_endpoint TEXT,
    trust_score NUMERIC DEFAULT 1.0
);

CREATE TABLE public.raw_ingestions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    source_id TEXT REFERENCES public.data_sources(id),
    external_reference_id TEXT,
    raw_payload JSONB NOT NULL,
    ingested_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' -- pending, merged, rejected
);

-- ==========================================
-- 3. THE "HOT" PROPERTY CORE (Extreme Speed)
-- ==========================================
CREATE TABLE public.properties_core (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants_v3(id),
    branch_id UUID REFERENCES public.branches_v3(id),
    
    status SMALLINT DEFAULT 0, -- 0=Draft, 1=Active, 2=UnderOffer, 3=Sold/Rented, 4=Archived
    listing_type SMALLINT NOT NULL, -- 0=Sale, 1=Rent
    property_type SMALLINT NOT NULL, -- 1=Condo, 2=House, 3=Townhouse, 4=Land, 5=Commercial
    
    -- 💰 Pricing Engine (Hot Filterable Fields)
    sale_price NUMERIC,
    rent_price NUMERIC,
    currency VARCHAR(3) DEFAULT 'THB',
    price_per_sqm NUMERIC,
    
    bedrooms SMALLINT,
    bathrooms SMALLINT,
    floor_area NUMERIC,
    land_area NUMERIC,
    
    h3_index_res8 TEXT, -- Uber H3 Index for mapping
    location GEOGRAPHY(POINT),
    
    fingerprint TEXT UNIQUE, -- Hash(lat,lng,floor,price) to detect duplicates
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for blazing fast filtering
CREATE INDEX idx_prop_core_tenant ON public.properties_core(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prop_core_h3 ON public.properties_core(h3_index_res8);
CREATE INDEX idx_prop_core_sale_price ON public.properties_core(sale_price);
CREATE INDEX idx_prop_core_rent_price ON public.properties_core(rent_price);
CREATE INDEX idx_prop_core_geo ON public.properties_core USING GIST (location);

-- ==========================================
-- 4. THE "WARM" CONTENT LAYER
-- ==========================================
CREATE TABLE public.properties_details (
    property_id UUID PRIMARY KEY REFERENCES public.properties_core(id) ON DELETE CASCADE,
    title JSONB NOT NULL,
    description JSONB,
    amenities JSONB DEFAULT '{}'::jsonb,
    pricing_details JSONB DEFAULT '{}'::jsonb, -- เก็บราคาแบบซับซ้อน (ค่าส่วนกลาง, มัดจำ, รายวัน)
    address_info JSONB DEFAULT '{}'::jsonb,
    transit_info JSONB DEFAULT '[]'::jsonb,
    meta_data JSONB DEFAULT '{}'::jsonb
);

-- ==========================================
-- 5. THE "COLD" AI & VECTOR LAYER
-- ==========================================
CREATE TABLE public.properties_ai (
    property_id UUID PRIMARY KEY REFERENCES public.properties_core(id) ON DELETE CASCADE,
    description_embedding vector(1536),
    image_embedding vector(1536),
    ai_metadata JSONB DEFAULT '{}'::jsonb,
    last_embedded_at TIMESTAMPTZ
);

CREATE INDEX idx_prop_ai_vector ON public.properties_ai USING hnsw (description_embedding vector_cosine_ops);
