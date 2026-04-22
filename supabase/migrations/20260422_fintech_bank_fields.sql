-- 20260422_fintech_bank_fields.sql
-- Goal: Add bank account fields to profiles and co_brokers with Hardened Data Integrity.

-- 1. Create Reference Table for Banks (Standardization)
CREATE TABLE IF NOT EXISTS public.ref_banks (
    code text PRIMARY KEY, -- e.g., 'KBANK', 'SCB'
    name_th text NOT NULL,
    name_en text NOT NULL,
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Seed common Thai banks
INSERT INTO public.ref_banks (code, name_th, name_en) VALUES
('BBL', 'ธนาคารกรุงเทพ', 'Bangkok Bank'),
('KBANK', 'ธนาคารกสิกรไทย', 'Kasikorn Bank'),
('KTB', 'ธนาคารกรุงไทย', 'Krung Thai Bank'),
('SCB', 'ธนาคารไทยพาณิชย์', 'Siam Commercial Bank'),
('BAY', 'ธนาคารกรุงศรีอยุธยา', 'Bank of Ayudhya'),
('TTB', 'ธนาคารทหารไทยธนชาต', 'TMBThanachart Bank'),
('GSB', 'ธนาคารออมสิน', 'Government Savings Bank'),
('UOB', 'ธนาคารยูโอบี', 'United Overseas Bank')
ON CONFLICT (code) DO NOTHING;

-- 2. Add fields to PROFILES (Agents/Staff)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_code text REFERENCES public.ref_banks(code),
ADD COLUMN IF NOT EXISTS bank_account_no text,
ADD COLUMN IF NOT EXISTS bank_account_name text;

-- Add numeric constraint to prevent space/dash
ALTER TABLE public.profiles 
ADD CONSTRAINT check_profiles_bank_acc_numeric 
CHECK (bank_account_no ~ '^[0-9]+$');

COMMENT ON COLUMN public.profiles.bank_code IS 'Reference to ref_banks code';
COMMENT ON COLUMN public.profiles.bank_account_no IS 'Numeric only bank account number';

-- 3. Add fields to CO_BROKERS (External Partners)
ALTER TABLE public.co_brokers 
ADD COLUMN IF NOT EXISTS bank_code text REFERENCES public.ref_banks(code),
ADD COLUMN IF NOT EXISTS bank_account_no text,
ADD COLUMN IF NOT EXISTS bank_account_name text;

ALTER TABLE public.co_brokers 
ADD CONSTRAINT check_cobrokers_bank_acc_numeric 
CHECK (bank_account_no ~ '^[0-9]+$');

-- 4. Add Payout Tracking to DEAL_COMMISSIONS
ALTER TABLE public.deal_commissions
ADD COLUMN IF NOT EXISTS payout_ref text,
ADD COLUMN IF NOT EXISTS payout_slip_url text;

-- 5. Audit Hardening: Ensure changes to bank details are tracked
-- This assumes we have an audit_logs or archive system.
-- We will add comments to mark these as SENSITIVE for future audit triggers.
COMMENT ON COLUMN public.profiles.bank_account_no IS 'SENSITIVE: Numeric only bank account number';
COMMENT ON COLUMN public.co_brokers.bank_account_no IS 'SENSITIVE: Numeric only bank account number';
