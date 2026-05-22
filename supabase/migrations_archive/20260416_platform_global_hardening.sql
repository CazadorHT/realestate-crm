-- 20260416_platform_global_hardening.sql
-- Goal: Enforce Central Control for Global Features (FAQ & Partners)
-- Requirements: 
-- 1. Full CRUD for System Admins (SuperAdmins)
-- 2. Read-Only for all other authenticated users (Tenants)

-- 1. FAQ Hardening
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Drop all existing FAQ management policies to avoid conflicts
DROP POLICY IF EXISTS "System Admin Manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "Staff Manage Global FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Public: FAQ Read" ON public.faqs;
DROP POLICY IF EXISTS "Tenant Isolation: FAQ Manage" ON public.faqs;

-- Policy: Platform SuperAdmin can do EVERYTHING
CREATE POLICY "SuperAdmin: Full Access on faqs" 
ON public.faqs
FOR ALL 
TO authenticated
USING (is_system_admin())
WITH CHECK (is_system_admin());

-- Policy: Everyone can READ active FAQs
CREATE POLICY "Public/Tenants: Read Access on faqs" 
ON public.faqs
FOR SELECT 
TO authenticated
USING (is_active = true AND deleted_at IS NULL);


-- 2. Partners Hardening
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Drop all existing Partners policies
DROP POLICY IF EXISTS "System Admin Manage partners" ON public.partners;
DROP POLICY IF EXISTS "Staff Manage Global Partners" ON public.partners;
DROP POLICY IF EXISTS "Public: Partners Read" ON public.partners;

-- Policy: Platform SuperAdmin can do EVERYTHING
CREATE POLICY "SuperAdmin: Full Access on partners" 
ON public.partners
FOR ALL 
TO authenticated
USING (is_system_admin())
WITH CHECK (is_system_admin());

-- Policy: Everyone can READ active partners
CREATE POLICY "Public/Tenants: Read Access on partners" 
ON public.partners
FOR SELECT 
TO authenticated
USING (is_active = true);


-- 3. Cleanup: Ensure faqs and partners do NOT have tenant_id (They are Global)
-- We keep the columns if they exist for compatibility but we will ignore them in queries
-- (Audit shows they typically don't have them, but let's be safe)

COMMENT ON TABLE public.faqs IS 'Global FAQ table managed by System Admins. Read-only for tenants.';
COMMENT ON TABLE public.partners IS 'Global Partners table managed by System Admins. Read-only for tenants.';
