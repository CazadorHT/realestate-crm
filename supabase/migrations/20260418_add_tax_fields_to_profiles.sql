-- Migration: Add Tax-related fields to Profiles
-- Purpose: Support high-precision financial reporting and WHT certificate generation.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS tax_address TEXT;

-- ✅ Commentary: 
-- We use TEXT for tax_id to support both 13-digit Thai National IDs 
-- and Corporate Tax IDs which may have varying formats.
-- tax_address is for official document generation.

COMMENT ON COLUMN public.profiles.tax_id IS 'National ID or Corporate Tax ID for financial/tax documents';
COMMENT ON COLUMN public.profiles.tax_address IS 'Official address to be used on tax certificates and financial documents';
