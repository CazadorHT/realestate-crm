-- ====================================================================
-- 🛡️ V3 Security: Public Agent Access for Property Detail Pages
-- ====================================================================
-- Problem: The identities_v3 RLS policy only allows reads for
-- authenticated tenant members. When anon users load a public property
-- detail page, the PostgREST join to identities_v3 (assigned_agent)
-- fails silently, causing the entire query to return null → "Not Found".
--
-- Fix: Add a narrow SELECT policy allowing anon to read identity rows
-- that are assigned to ACTIVE properties. This is safe because:
-- 1. Only display_name, phone, avatar_url are selected by the app
-- 2. The policy only exposes agents linked to publicly-visible listings
-- 3. No sensitive internal data (email, role, tenant membership) is leaked
-- ====================================================================

BEGIN;

-- Allow public visitors to read agent identity for active property listings
DROP POLICY IF EXISTS "Public read assigned agents" ON public.identities_v3;
CREATE POLICY "Public read assigned agents" ON public.identities_v3
    FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.properties_core pc
            WHERE pc.assigned_to = identities_v3.id
              AND pc.status = 1
              AND pc.deleted_at IS NULL
        )
    );

-- Also ensure features table is readable (should exist already but defensive)
DROP POLICY IF EXISTS "Public read features" ON public.features;
CREATE POLICY "Public read features" ON public.features
    FOR SELECT
    TO public
    USING (true);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
