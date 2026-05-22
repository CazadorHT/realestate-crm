-- ==========================================
-- 🚀 PERFORMANCE: INDEX CLEANUP
-- Description: Drop duplicate and redundant indexes reported by linter
-- ==========================================

BEGIN;

-- 1. AUDIT LOGS (Parent & Partitions)
-- The parent table has redundant indexes that force child partitions to keep them.
-- We drop the redundant one on the parent first.
DROP INDEX IF EXISTS public.idx_audit_logs_tenant_created;

-- Now we can drop the redundant partition indexes that are NOT tied to the remaining parent index (idx_audit_logs_tenant_date)
-- Note: idx_audit_logs_tenant_date typically uses the 'idx1' version on partitions.
DROP INDEX IF EXISTS public.audit_logs_2026_03_tenant_id_created_at_idx;
DROP INDEX IF EXISTS public.audit_logs_2026_04_tenant_id_created_at_idx;
DROP INDEX IF EXISTS public.audit_logs_2026_05_tenant_id_created_at_idx;
DROP INDEX IF EXISTS public.audit_logs_2026_06_tenant_id_created_at_idx;
DROP INDEX IF EXISTS public.audit_logs_history_tenant_id_created_at_idx;

-- 2. CO_BROKERS
-- idx_co_brokers_tenant and idx_co_brokers_tenant_id are identical
DROP INDEX IF EXISTS public.idx_co_brokers_tenant_id;

-- 3. PROPERTIES
-- idx_properties_created_at and idx_properties_created_at_desc are redundant (B-tree can scan both ways)
DROP INDEX IF EXISTS public.idx_properties_created_at_desc;

-- idx_properties_ai_summary and idx_properties_ai_summary_fts are identical
DROP INDEX IF EXISTS public.idx_properties_ai_summary_fts;

COMMIT;
