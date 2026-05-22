-- Hardening FAQs Table
-- Added: 2026-04-09
-- Description: Implement soft delete and view tracking

-- 1. Add deleted_at for Trash System
ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add view_count for Admin Analytics
ALTER TABLE public.faqs 
ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;

-- 3. Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_faqs_deleted_at ON public.faqs (deleted_at);

-- 4. RPC for efficient view increment (Atomic Update)
CREATE OR REPLACE FUNCTION public.increment_faq_view(faq_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.faqs
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = faq_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Hardened RLS Policies
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Clean up old simple policies
DROP POLICY IF EXISTS "System Admin Manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "Tenant Isolation: FAQ Manage" ON public.faqs;
DROP POLICY IF EXISTS "Public: FAQ Read" ON public.faqs;
DROP POLICY IF EXISTS "Staff Manage Global FAQs" ON public.faqs;

-- Policy: Authenticated Staff/Admins can manage all FAQs (Global)
CREATE POLICY "Staff Manage Global FAQs" ON public.faqs
FOR ALL TO authenticated
USING (
    is_system_admin()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MANAGER')
)
WITH CHECK (
    is_system_admin()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MANAGER')
);

-- Policy: Public/Authenticated users can view active FAQs (excluding trashed ones)
CREATE POLICY "Public: FAQ Read" ON public.faqs
FOR SELECT
USING (
    is_active = true 
    AND deleted_at IS NULL
);

-- 6. Documentation Comments
COMMENT ON COLUMN public.faqs.deleted_at IS 'Timestamp when the FAQ was moved to trash. NULL means active.';
COMMENT ON COLUMN public.faqs.view_count IS 'Incremental counter for how many times the FAQ was viewed.';
COMMENT ON FUNCTION public.increment_faq_view IS 'Increments the view count for a specific FAQ entity.';
