-- ====================================================================
-- 🏢 Real Estate CRM Database V2 (Phase 1: Foundation - Stable Hardened)
-- ====================================================================

-- 1. Setup Extensions Schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Enable Extensions in the dedicated schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_jsonschema" WITH SCHEMA extensions;

-- Set search_path
SET search_path TO public, extensions;

-- 2. Create Global Translation Utility
-- Standardizing JSONB Translation Structure: {"th": "...", "en": "...", "cn": "...", "ru": "..."}

-- 3. Core Organization Structure
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Policies will be added in Phase 2)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name JSONB NOT NULL,
    location extensions.GEOGRAPHY(POINT),
    address JSONB,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Indexes for branches
CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON branches (tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_name_gin ON branches USING GIN (name);
CREATE INDEX IF NOT EXISTS idx_branches_address_gin ON branches USING GIN (address);

-- 4. Audit & History Engines
CREATE TABLE IF NOT EXISTS audit_logs_v2 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    branch_id UUID REFERENCES branches(id),
    user_id UUID,
    entity_name TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    changeset JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs_v2 ENABLE ROW LEVEL SECURITY;

-- Indexes for audit_logs_v2
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs_v2 (tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_branch_id ON audit_logs_v2 (branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs_v2 (entity_name, entity_id);

-- 5. Status & Financial Foundation
CREATE TABLE IF NOT EXISTS ref_listing_statuses (
    id TEXT PRIMARY KEY,
    label JSONB NOT NULL,
    color_code TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

ALTER TABLE ref_listing_statuses ENABLE ROW LEVEL SECURITY;

INSERT INTO ref_listing_statuses (id, label, color_code, sort_order) VALUES
('draft', '{"th": "ฉบับร่าง", "en": "Draft", "cn": "草稿", "ru": "Черновик"}', '#94a3b8', 1),
('active', '{"th": "ประกาศอยู่", "en": "Active", "cn": "有效", "ru": "Активный"}', '#22c55e', 2),
('under_offer', '{"th": "ติดจอง", "en": "Under Offer", "cn": "认购中", "ru": "Под предложением"}', '#f59e0b', 3),
('sold', '{"th": "ขายแล้ว", "en": "Sold", "cn": "已售", "ru": "Продано"}', '#ef4444', 4),
('rented', '{"th": "เช่าแล้ว", "en": "Rented", "cn": "已租", "ru": "Сдано"}', '#3b82f6', 5),
('archived', '{"th": "ปิดประกาศ", "en": "Archived", "cn": "已归档", "ru": "Архив"}', '#64748b', 6)
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label, color_code = EXCLUDED.color_code;

-- 6. Property Engine V2
CREATE TABLE IF NOT EXISTS properties_v2 (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    branch_id UUID REFERENCES branches(id),
    title JSONB NOT NULL,
    description JSONB,
    location extensions.GEOGRAPHY(POINT),
    description_embedding extensions.vector(1536),
    embedding_updated_at TIMESTAMPTZ,
    slug TEXT,
    status TEXT REFERENCES ref_listing_statuses(id) DEFAULT 'draft',
    property_type TEXT,
    listing_type TEXT,
    bedrooms INTEGER,
    bathrooms INTEGER,
    floor_area NUMERIC,
    amenities JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT unique_property_slug_per_tenant UNIQUE (tenant_id, slug)
);

ALTER TABLE properties_v2 ENABLE ROW LEVEL SECURITY;

-- Indexes for properties_v2
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON properties_v2 (tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_branch_id ON properties_v2 (branch_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties_v2 (status);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties_v2 USING GIST (location);

-- Index using search_path to find hnsw access method
CREATE INDEX IF NOT EXISTS idx_properties_embedding_hnsw ON properties_v2 
USING hnsw (description_embedding extensions.vector_cosine_ops);

-- View for Active Properties (Hardened with security_invoker)
CREATE OR REPLACE VIEW active_properties 
WITH (security_invoker = true)
AS SELECT * FROM properties_v2 WHERE deleted_at IS NULL;

-- Price History
CREATE TABLE IF NOT EXISTS property_price_history (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    property_id UUID REFERENCES properties_v2(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'THB',
    is_rental BOOLEAN DEFAULT false,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE property_price_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_price_history_property_id ON property_price_history(property_id);

-- 7. Unified Media Assets
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    owner_id UUID NOT NULL,
    owner_type TEXT NOT NULL,
    media_type TEXT DEFAULT 'image',
    url TEXT NOT NULL,
    alt_text JSONB,
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    ai_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_media_assets_tenant_id ON media_assets (tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets(owner_id, owner_type);

-- 8. Helper Functions (Hardened with Search Path)
CREATE OR REPLACE FUNCTION get_translation(data JSONB, lang TEXT DEFAULT 'th')
RETURNS TEXT 
LANGUAGE plpgsql IMMUTABLE
SET search_path = ''
AS $$
BEGIN
    IF data IS NULL THEN RETURN NULL; END IF;
    RETURN COALESCE(
        data->>lang, 
        data->>'en', 
        data->>'th',
        (SELECT value FROM jsonb_each_text(data) LIMIT 1)
    );
END;
$$;

-- Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_v2()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changes JSONB;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        SELECT jsonb_object_agg(key, value) INTO changes
        FROM jsonb_each(new_data)
        WHERE new_data->key IS DISTINCT FROM old_data->key;

        IF changes IS NOT NULL THEN
            INSERT INTO public.audit_logs_v2 (
                tenant_id, branch_id, entity_name, entity_id, action, changeset
            ) VALUES (
                (new_data->>'tenant_id')::UUID,
                (new_data->>'branch_id')::UUID,
                TG_TABLE_NAME,
                (new_data->>'id')::UUID,
                TG_OP,
                jsonb_build_object('old', old_data, 'new', new_data, 'diff', changes)
            );
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs_v2 (
            tenant_id, branch_id, entity_name, entity_id, action, changeset
        ) VALUES (
            (to_jsonb(NEW)->>'tenant_id')::UUID,
            (to_jsonb(NEW)->>'branch_id')::UUID,
            TG_TABLE_NAME,
            (to_jsonb(NEW)->>'id')::UUID,
            TG_OP,
            jsonb_build_object('new', to_jsonb(NEW))
        );
    END IF;
    RETURN NEW;
END;
$$;

-- 9. Trigger for Updated_at & Audit
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    IF TG_TABLE_NAME = 'properties_v2' THEN
        IF OLD.description IS DISTINCT FROM NEW.description THEN
            NEW.embedding_updated_at = NULL;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Set Up Triggers
CREATE OR REPLACE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_properties_v2_updated_at BEFORE UPDATE ON properties_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto Audit Triggers
CREATE OR REPLACE TRIGGER audit_properties_v2 AFTER INSERT OR UPDATE ON properties_v2 FOR EACH ROW EXECUTE FUNCTION audit_trigger_v2();
CREATE OR REPLACE TRIGGER audit_branches AFTER INSERT OR UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION audit_trigger_v2();

-- 10. Security Hardening (Post-Migration Cleanup)
-- Drop duplicate index if exists from previous runs
DROP INDEX IF EXISTS idx_audit_logs_tenant;

-- Revoke execute from public/anon/authenticated for sensitive functions
REVOKE EXECUTE ON FUNCTION audit_trigger_v2() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION get_translation(JSONB, TEXT) FROM PUBLIC;

-- Revoke execute on potential security definer functions mentioned by linter
DO $$ 
BEGIN
    -- Revoke from rls_auto_enable if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM PUBLIC';
    END IF;

    -- Revoke from PostGIS internal functions mentioned by linter
    EXECUTE 'REVOKE EXECUTE ON FUNCTION extensions.st_estimatedextent(text, text) FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION extensions.st_estimatedextent(text, text, text) FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION extensions.st_estimatedextent(text, text, text, boolean) FROM PUBLIC';
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if functions don't exist or permissions lack
END $$;

-- Final Compliance Fix for PostGIS internal tables (Skipped: requires owner privileges)
-- ALTER TABLE IF EXISTS spatial_ref_sys ENABLE ROW LEVEL SECURITY;
