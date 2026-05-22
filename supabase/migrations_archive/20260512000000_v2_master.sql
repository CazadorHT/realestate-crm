-- ====================================================================
-- 🚀 CRM Enterprise Database V2 (Master Consolidated Migration)
-- ====================================================================

-- 1. SETUP EXTENSIONS & SCHEMA
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA public; -- PostGIS usually stays in public
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_jsonschema" WITH SCHEMA extensions;

SET search_path TO public, extensions;

-- 2. CORE ORGANIZATION
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name JSONB NOT NULL,
    location geography(POINT),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. IDENTITY ENGINE (User 360)
CREATE TABLE IF NOT EXISTS ref_identity_categories (
    id TEXT PRIMARY KEY,
    label JSONB NOT NULL
);

INSERT INTO ref_identity_categories (id, label) VALUES
('internal', '{"th": "บุคลากรภายใน", "en": "Internal Staff"}'),
('external', '{"th": "บุคคลภายนอก/ลูกค้า", "en": "External Client/Owner"}')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS ref_user_roles (
    id TEXT PRIMARY KEY,
    label JSONB NOT NULL
);

INSERT INTO ref_user_roles (id, label) VALUES
('ADMIN', '{"th": "ผู้ดูแลระบบ", "en": "Administrator"}'),
('MANAGER', '{"th": "ผู้จัดการ", "en": "Manager"}'),
('AGENT', '{"th": "ตัวแทน", "en": "Agent"}'),
('USER', '{"th": "ผู้ใช้งานทั่วไป", "en": "User"}')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS identities (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category TEXT REFERENCES ref_identity_categories(id) DEFAULT 'external',
    role TEXT REFERENCES ref_user_roles(id) DEFAULT 'USER',
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    email TEXT,
    phone TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    search_embedding vector(1536),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS identity_secrets (
    identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
    secrets_data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PROPERTY ENGINE V2
CREATE TABLE IF NOT EXISTS properties_v2 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    title JSONB NOT NULL,
    description JSONB,
    property_type TEXT NOT NULL,
    listing_type TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    sale_price NUMERIC,
    rent_price NUMERIC,
    currency TEXT DEFAULT 'THB',
    floor_area NUMERIC,
    bedrooms INTEGER,
    bathrooms INTEGER,
    address_info JSONB DEFAULT '{}'::jsonb,
    location geography(POINT),
    amenities JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    description_embedding vector(1536),
    owner_id UUID REFERENCES identities(id),
    assigned_to UUID REFERENCES identities(id),
    created_by UUID REFERENCES identities(id),
    price_per_sqm NUMERIC GENERATED ALWAYS AS (CASE WHEN floor_area > 0 THEN sale_price / floor_area ELSE NULL END) STORED,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    owner_id UUID NOT NULL,
    owner_type TEXT NOT NULL,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RLS HELPERS (HARDENED)
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
DECLARE _tid UUID;
BEGIN
    _tid := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
    IF _tid IS NULL THEN
        SELECT tenant_id INTO _tid FROM public.identities WHERE id = auth.uid() LIMIT 1;
    END IF;
    RETURN _tid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE _role TEXT;
BEGIN
    _role := (auth.jwt() -> 'app_metadata' ->> 'role');
    IF _role IS NULL THEN
        SELECT role INTO _role FROM public.identities WHERE id = auth.uid();
    END IF;
    RETURN _role = 'ADMIN';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- 6. LEGACY BRIDGE VIEWS
CREATE OR REPLACE VIEW public.properties WITH (security_invoker = true) AS
SELECT 
    p.id, p.tenant_id, p.branch_id,
    p.title->>'th' as title, p.title->>'en' as title_en,
    UPPER(p.property_type) as property_type, UPPER(p.listing_type) as listing_type, UPPER(p.status) as status,
    p.bedrooms, p.bathrooms, p.floor_area as size_sqm,
    p.sale_price as original_price, p.rent_price as original_rental_price,
    COALESCE((SELECT json_agg(m.url ORDER BY m.is_primary DESC, m.sort_order ASC) FROM media_assets m WHERE m.owner_id = p.id AND m.owner_type = 'property'), '[]'::json) as images,
    p.address_info->>'district' as district, p.address_info->>'province' as province,
    p.owner_id, p.assigned_to, p.created_at, p.deleted_at
FROM properties_v2 p;

CREATE OR REPLACE VIEW public.leads WITH (security_invoker = true) AS
SELECT i.id, i.tenant_id, i.full_name, i.email, i.phone, i.metadata->>'stage' as stage, i.created_at, i.deleted_at
FROM identities i WHERE i.category = 'external';

CREATE OR REPLACE VIEW public.profiles WITH (security_invoker = true) AS
SELECT id, tenant_id, full_name, email, role, avatar_url, created_at FROM identities WHERE category = 'internal';

-- 7. SMART LOGIC & INDEXES
CREATE INDEX IF NOT EXISTS idx_prop_v2_district ON properties_v2 ((address_info->>'district'));
CREATE INDEX IF NOT EXISTS idx_prop_v2_status ON properties_v2 (status);
CREATE INDEX IF NOT EXISTS idx_prop_v2_vector ON properties_v2 USING hnsw (description_embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION match_properties_for_lead(p_lead_id UUID, p_threshold FLOAT DEFAULT 0.7, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (id UUID, title TEXT, similarity FLOAT, match_score NUMERIC) AS $$
DECLARE v_embedding vector(1536); v_budget_max NUMERIC; v_tenant_id UUID;
BEGIN
    SELECT search_embedding, (metadata->>'budget_max')::numeric, tenant_id INTO v_embedding, v_budget_max, v_tenant_id FROM public.identities WHERE id = p_lead_id;
    IF v_embedding IS NULL THEN RETURN; END IF;
    RETURN QUERY SELECT p.id, p.title->>'th', (1 - (p.description_embedding <=> v_embedding))::FLOAT,
    (((1 - (p.description_embedding <=> v_embedding)) * 0.7) + (CASE WHEN p.sale_price <= v_budget_max THEN 0.3 ELSE 0 END)) * 100
    FROM public.properties_v2 p WHERE p.tenant_id = v_tenant_id AND p.deleted_at IS NULL AND p.status = 'active' AND (1 - (p.description_embedding <=> v_embedding)) > p_threshold
    ORDER BY 4 DESC LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';

-- 8. SECURITY HARDENING
-- Revoke sensitive PostGIS functions
DO $$ 
DECLARE func_id TEXT;
BEGIN
    FOR func_id IN SELECT format('%I.%I(%s)', n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'st_estimatedextent'
    LOOP
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || func_id || ' FROM PUBLIC';
    END LOOP;
END $$;
