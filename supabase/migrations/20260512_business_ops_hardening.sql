-- ==========================================
-- 🚀 SECURITY HARDENING: BUSINESS OPERATIONS
-- Description: Co-Brokers, Commission, and Background Tasks
-- ==========================================

BEGIN;

-- 1. CO_BROKERS
DROP POLICY IF EXISTS "co_brokers_select_optimized" ON public.co_brokers;
DROP POLICY IF EXISTS "co_brokers_insert_optimized" ON public.co_brokers;
DROP POLICY IF EXISTS "co_brokers_update_optimized" ON public.co_brokers;
DROP POLICY IF EXISTS "co_brokers_delete_optimized" ON public.co_brokers;

CREATE POLICY "co_brokers_select_optimized" ON public.co_brokers
FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
    AND (deleted_at IS NULL OR (SELECT public.is_system_admin()))
);

CREATE POLICY "co_brokers_insert_optimized" ON public.co_brokers
FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

CREATE POLICY "co_brokers_update_optimized" ON public.co_brokers
FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

CREATE POLICY "co_brokers_delete_optimized" ON public.co_brokers
FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

-- 2. COMMISSION ADJUSTMENTS
DROP POLICY IF EXISTS "commission_adjustments_select_optimized" ON public.commission_adjustments;
DROP POLICY IF EXISTS "commission_adjustments_insert_optimized" ON public.commission_adjustments;
DROP POLICY IF EXISTS "commission_adjustments_update_optimized" ON public.commission_adjustments;
DROP POLICY IF EXISTS "commission_adjustments_delete_optimized" ON public.commission_adjustments;

CREATE POLICY "commission_adjustments_select_optimized" ON public.commission_adjustments
FOR SELECT USING (
    (SELECT public.is_system_admin()) OR 
    EXISTS (
        SELECT 1 FROM public.deal_commissions dc
        WHERE dc.id = commission_id
        AND (dc.agent_id = (SELECT auth.uid()) OR dc.tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()) AND role IN ('OWNER', 'ADMIN', 'MANAGER')))
    )
);
CREATE POLICY "commission_adjustments_insert_optimized" ON public.commission_adjustments FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));
CREATE POLICY "commission_adjustments_update_optimized" ON public.commission_adjustments FOR UPDATE USING ((SELECT public.is_system_admin()));
CREATE POLICY "commission_adjustments_delete_optimized" ON public.commission_adjustments FOR DELETE USING ((SELECT public.is_system_admin()));

-- 3. BACKGROUND TASKS
DROP POLICY IF EXISTS "background_tasks_select_optimized" ON public.background_tasks;
DROP POLICY IF EXISTS "background_tasks_insert_optimized" ON public.background_tasks;
DROP POLICY IF EXISTS "background_tasks_update_optimized" ON public.background_tasks;

CREATE POLICY "background_tasks_select_optimized" ON public.background_tasks
FOR SELECT USING (
    (SELECT public.is_system_admin()) OR 
    tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()))
);

CREATE POLICY "background_tasks_insert_optimized" ON public.background_tasks
FOR INSERT WITH CHECK (
    user_id = (SELECT auth.uid()) OR (SELECT public.is_system_admin())
);

CREATE POLICY "background_tasks_update_optimized" ON public.background_tasks
FOR UPDATE USING (
    user_id = (SELECT auth.uid()) OR (SELECT public.is_system_admin())
);

-- 4. CO_BROKER DOCUMENTS
DROP POLICY IF EXISTS "co_broker_documents_select_optimized" ON public.co_broker_documents;
DROP POLICY IF EXISTS "co_broker_documents_insert_optimized" ON public.co_broker_documents;
DROP POLICY IF EXISTS "co_broker_documents_update_optimized" ON public.co_broker_documents;
DROP POLICY IF EXISTS "co_broker_documents_delete_optimized" ON public.co_broker_documents;

CREATE POLICY "co_broker_documents_select_optimized" ON public.co_broker_documents
FOR SELECT USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid())));
CREATE POLICY "co_broker_documents_insert_optimized" ON public.co_broker_documents
FOR INSERT WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()) AND role IN ('OWNER', 'ADMIN', 'MANAGER')));
CREATE POLICY "co_broker_documents_update_optimized" ON public.co_broker_documents
FOR UPDATE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()) AND role IN ('OWNER', 'ADMIN', 'MANAGER')));
CREATE POLICY "co_broker_documents_delete_optimized" ON public.co_broker_documents
FOR DELETE USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = (SELECT auth.uid()) AND role IN ('OWNER', 'ADMIN', 'MANAGER')));

COMMIT;
