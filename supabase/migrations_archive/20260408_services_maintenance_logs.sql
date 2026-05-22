-- 1. Create maintenance_logs table for tracking storage orphans and system issues
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    entity_type TEXT NOT NULL, -- 'service', 'property', etc.
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,      -- 'delete_storage_failed', etc.
    details JSONB,            -- { "path": "...", "error": "..." }
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indexes for faster maintenance auditing
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_status ON public.maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_entity ON public.maintenance_logs(entity_type, entity_id);

-- 3. Enable RLS
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Admins and Managers only
DROP POLICY IF EXISTS "Admins can view maintenance logs" ON public.maintenance_logs;
CREATE POLICY "Admins can view maintenance logs" 
ON public.maintenance_logs FOR SELECT TO authenticated 
USING (
  is_system_admin() 
  OR (EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER') ))
);

-- 5. Data Sync: Initialize view_count from existing logs if currently zero
-- This ensures that the denormalized column is accurate from day one
UPDATE public.services s
SET view_count = (
    SELECT COUNT(*) 
    FROM public.service_views_log l 
    WHERE l.service_id = s.id
)
WHERE COALESCE(view_count, 0) = 0;
