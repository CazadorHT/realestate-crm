-- ====================================================================
-- 👤 Real Estate CRM Database V2 (Phase 2: Identity Engine & User 360)
-- ====================================================================

-- 1. Identity Categories (Internal vs External)
CREATE TABLE IF NOT EXISTS ref_identity_categories (
    id TEXT PRIMARY KEY,
    label JSONB NOT NULL
);

INSERT INTO ref_identity_categories (id, label) VALUES
('internal', '{"th": "บุคลากรภายใน", "en": "Internal Staff", "cn": "内部员工", "ru": "Внутренний персонал"}'),
('external', '{"th": "บุคคลภายนอก/ลูกค้า", "en": "External Client/Owner", "cn": "外部客户/业主", "ru": "Внешний клиент/владелец"}')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label;

-- Add i18n constraint using Native JSONB check (More robust than extension)
ALTER TABLE ref_identity_categories ADD CONSTRAINT check_category_label_i18n 
CHECK (label ? 'th' AND label ? 'en' AND label ? 'cn' AND label ? 'ru');

-- 2. User Roles (Modern Reference Table instead of Enum)
CREATE TABLE IF NOT EXISTS ref_user_roles (
    id TEXT PRIMARY KEY,
    label JSONB NOT NULL
);

INSERT INTO ref_user_roles (id, label) VALUES
('ADMIN', '{"th": "ผู้ดูแลระบบ", "en": "Administrator"}'),
('MANAGER', '{"th": "ผู้จัดการ", "en": "Manager"}'),
('AGENT', '{"th": "ตัวแทน", "en": "Agent"}'),
('USER', '{"th": "ผู้ใช้งานทั่วไป", "en": "User"}')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label;

-- 3. Unified Identities Table (Fully Aligned with Legacy Profiles)
CREATE TABLE IF NOT EXISTS identities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category TEXT REFERENCES ref_identity_categories(id) DEFAULT 'external',
    
    -- Legacy Alignment: Role is now a string referencing the table
    role TEXT REFERENCES ref_user_roles(id) DEFAULT 'USER',
    
    -- Basic Profile (Matched with Legacy profiles table)
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    
    -- Contact Points
    email TEXT,
    phone TEXT,
    line_id TEXT,
    line_user_id TEXT,
    facebook_psid TEXT,
    facebook_url TEXT,
    telegram_id TEXT,
    wechat_id TEXT,
    whatsapp_id TEXT,
    other_contact TEXT,
    
    -- Preferences & Org
    team_id UUID,
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    default_tax_rate NUMERIC(5,2),
    
    -- PDPA Summary (Current State)
    consent_marketing BOOLEAN DEFAULT false,
    consent_privacy BOOLEAN DEFAULT false,
    consent_updated_at TIMESTAMPTZ,
    
    -- Lifecycle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- 3. Identity Sensitive Data (Separated for PDPA/Encryption)
CREATE TABLE IF NOT EXISTS identity_secrets (
    identity_id UUID PRIMARY KEY REFERENCES identities(id) ON DELETE CASCADE,
    
    -- Financial/Legal Data (Targets for Encryption/Vault)
    tax_id TEXT,
    tax_address TEXT,
    bank_code TEXT,
    bank_account_name TEXT,
    bank_account_no TEXT,
    other_bank_name TEXT,
    
    -- Passport/ID Card (Sensitive)
    id_card_no_encrypted TEXT, 
    passport_no_encrypted TEXT,
    
    internal_notes TEXT,
    kyc_status TEXT DEFAULT 'pending',
    kyc_metadata JSONB DEFAULT '{}'::jsonb,
    
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. PDPA Consent History (Audit Log for Compliance)
CREATE TABLE IF NOT EXISTS identity_consent_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- marketing, privacy, term_of_service
    is_granted BOOLEAN NOT NULL,
    policy_version TEXT, -- e.g., 'v1.2.0'
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Identity Relations (Auth & Multi-login)
CREATE TABLE IF NOT EXISTS identity_auth_map (
    identity_id UUID REFERENCES identities(id) ON DELETE CASCADE,
    auth_user_id UUID NOT NULL,
    provider TEXT DEFAULT 'email',
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (identity_id, auth_user_id)
);

-- 6. Security & Isolation (RLS)
ALTER TABLE identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_auth_map ENABLE ROW LEVEL SECURITY;

-- Indexing
CREATE INDEX IF NOT EXISTS idx_identities_tenant_id ON identities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_identities_email ON identities(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_identities_deleted_at ON identities(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_consent_history_identity ON identity_consent_history(identity_id);

-- 7. The Migration Bridge (public.profiles View)
-- This view acts as a drop-in replacement for the old profiles table
CREATE OR REPLACE VIEW public.profiles 
WITH (security_invoker = true)
AS
SELECT 
    i.id,
    i.full_name,
    i.avatar_url,
    i.email,
    i.phone,
    i.role,
    i.team_id,
    i.line_id,
    i.line_user_id,
    i.facebook_psid,
    i.facebook_url,
    i.telegram_id,
    i.wechat_id,
    i.whatsapp_id,
    i.other_contact,
    i.notification_preferences,
    i.default_tax_rate,
    s.tax_id,
    s.tax_address,
    s.bank_code,
    s.bank_account_name,
    s.bank_account_no,
    s.other_bank_name,
    i.created_at,
    i.updated_at
FROM identities i
LEFT JOIN identity_secrets s ON i.id = s.identity_id
WHERE i.deleted_at IS NULL;

-- 8. Triggers
CREATE OR REPLACE FUNCTION sync_identity_display_name()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.display_name IS NULL AND NEW.full_name IS NOT NULL THEN
        NEW.display_name := split_part(NEW.full_name, ' ', 1);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_identities_display_name
    BEFORE INSERT OR UPDATE ON identities
    FOR EACH ROW EXECUTE FUNCTION sync_identity_display_name();

CREATE TRIGGER update_identities_updated_at 
    BEFORE UPDATE ON identities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER audit_identities 
    AFTER INSERT OR UPDATE ON identities 
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_v2();

-- Hardening: Revoke public execute
REVOKE EXECUTE ON FUNCTION sync_identity_display_name() FROM PUBLIC;
