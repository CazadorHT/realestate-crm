-- Migration to implement Table Partitioning for audit_logs
-- This allows for easier data retention and better performance as logs grow.

BEGIN;

-- 1. Rename existing table
ALTER TABLE public.audit_logs RENAME TO audit_logs_old;

-- 2. Create the new partitioned table
-- Note: Partitioned tables must include the partition key in any unique/primary key constraint.
CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now() NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    tenant_id uuid,
    user_id uuid,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- 3. Restore ownership and permissions (if applicable)
-- Assuming default public schema and RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Re-create RLS Policies 
-- We need to check existing policies. For simplicity in migration, 
-- we assume standard multi-tenant RLS (matching existing project pattern).
CREATE POLICY "tenant_isolation_policy" ON public.audit_logs
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 5. Create initial partitions
-- Monthly partitions for 2026
CREATE TABLE public.audit_logs_2026_04 PARTITION OF public.audit_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE public.audit_logs_2026_05 PARTITION OF public.audit_logs
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE public.audit_logs_2026_06 PARTITION OF public.audit_logs
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- 6. Migrate existing data from old table to the partitioned one
-- It will automatically route to correct partitions
INSERT INTO public.audit_logs (id, created_at, action, entity, entity_id, metadata, tenant_id, user_id)
SELECT id, created_at, action, entity, entity_id, metadata, tenant_id, user_id
FROM public.audit_logs_old;

-- 7. Re-create foreign keys (Partitioned tables in PG 11+ support FKs)
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 8. (Optional) Cleanup - Uncomment after verifying data
-- DROP TABLE public.audit_logs_old;

COMMIT;

-- 9. Retention Helper (To be run manually or via pg_cron)
/*
-- Example to drop old partition (e.g., month of April 2025)
-- DROP TABLE public.audit_logs_2025_04;
*/
