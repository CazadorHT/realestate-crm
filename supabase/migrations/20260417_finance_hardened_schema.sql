-- Phase 6: Finance & Accounting Hardening Migration
-- 1. Upgrade Commission Status Enum
-- Note: Standalone ALTER TYPE statements used for reliable execution in Supabase/Postgres
ALTER TYPE public.commission_status ADD VALUE IF NOT EXISTS 'UNPAID';
ALTER TYPE public.commission_status ADD VALUE IF NOT EXISTS 'READY_TO_PAY';
ALTER TYPE public.commission_status ADD VALUE IF NOT EXISTS 'VOID';
ALTER TYPE public.commission_status ADD VALUE IF NOT EXISTS 'FAILED';

-- 2. Add Audit and Payment Columns to deal_commissions
ALTER TABLE public.deal_commissions 
ADD COLUMN IF NOT EXISTS slip_url TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Data Migration: Align existing records with the new status terminology
-- We preserve database integrity by mapping legacy statuses to the new hardening lifecycle
UPDATE public.deal_commissions SET status = 'UNPAID' WHERE status = 'PENDING';
UPDATE public.deal_commissions SET status = 'VOID' WHERE status = 'CANCELLED';

-- 4. Finance Storage Infrastructure
-- Create a private bucket for sensitive financial documents (slips, certificates)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'finance', 
    'finance', 
    false, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Finance RLS Policies (Security Hardening)
-- Policy: Admins have unrestricted access to finance documents
CREATE POLICY "Finance: Admin full access"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'finance' AND 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN' AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())))
);

-- Policy: Agents can view their own payment slips and certificates
-- We verify ownership by mapping the internal file path to the deal_commissions relationship
CREATE POLICY "Finance: Agents view their own records"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'finance' AND 
    EXISTS (
        SELECT 1 FROM public.deal_commissions dc
        WHERE (dc.agent_id = auth.uid())
          AND (dc.slip_url LIKE '%' || name)
    )
);

-- Grant access to buckets
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.buckets TO authenticated;
