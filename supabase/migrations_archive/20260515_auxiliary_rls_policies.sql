-- ==========================================
-- 🚀 AUXILIARY RLS POLICIES (THE CLEANUP)
-- Description: Implementing missing RLS policies for auxiliary tables
-- to resolve 'rls_enabled_no_policy' INFO warnings.
-- ==========================================

BEGIN;

-- 1. DEALS
DROP POLICY IF EXISTS "deals_all_optimized" ON public.deals;
CREATE POLICY "deals_all_optimized" ON public.deals
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    OR (SELECT public.is_system_admin())
);

-- 2. DOCUMENTS
DROP POLICY IF EXISTS "documents_all_optimized" ON public.documents;
CREATE POLICY "documents_all_optimized" ON public.documents
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    OR (SELECT public.is_system_admin())
);

-- 3. LEAD_TRANSFERS
DROP POLICY IF EXISTS "lead_transfers_all_optimized" ON public.lead_transfers;
CREATE POLICY "lead_transfers_all_optimized" ON public.lead_transfers
FOR ALL USING (
    from_tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    OR to_tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    OR (SELECT public.is_system_admin())
);

-- 4. OWNERS
DROP POLICY IF EXISTS "owners_all_optimized" ON public.owners;
CREATE POLICY "owners_all_optimized" ON public.owners
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    OR (SELECT public.is_system_admin())
);

-- 5. RENTAL_CONTRACTS
DROP POLICY IF EXISTS "rental_contracts_all_optimized" ON public.rental_contracts;
CREATE POLICY "rental_contracts_all_optimized" ON public.rental_contracts
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    OR (SELECT public.is_system_admin())
);

-- 6. RENT_NOTIFICATION_RULES
DROP POLICY IF EXISTS "rent_notification_rules_all_optimized" ON public.rent_notification_rules;
CREATE POLICY "rent_notification_rules_all_optimized" ON public.rent_notification_rules
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    OR (SELECT public.is_system_admin())
);

-- 7. RENT_NOTIFICATION_HISTORY
DROP POLICY IF EXISTS "rent_notification_history_all_optimized" ON public.rent_notification_history;
CREATE POLICY "rent_notification_history_all_optimized" ON public.rent_notification_history
FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    OR (SELECT public.is_system_admin())
);

COMMIT;
