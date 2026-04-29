-- ==========================================================
-- 1. Create background_tasks table
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.background_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'ERROR')),
    message TEXT,
    type TEXT,
    -- ⚠️ CAUTION: Do not store large binary data (Base64) in payload. 
    -- Store only metadata/IDs to keep Realtime performance high.
    payload JSONB DEFAULT '{}'::jsonb,
    result_link TEXT,
    priority INTEGER DEFAULT 0,
    is_cancelled BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    error_details TEXT
);

-- ==========================================================
-- 2. Enable Realtime (Crucial for Enterprise UX)
-- ==========================================================
-- Ensure the table is in the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.background_tasks;

-- ==========================================================
-- 3. Enable RLS (Hardened Security)
-- ==========================================================
ALTER TABLE public.background_tasks ENABLE ROW LEVEL SECURITY;

-- Admins: Full visibility
CREATE POLICY "Admins can see all background tasks"
ON public.background_tasks FOR SELECT TO authenticated
USING (
    (auth.jwt() ->> 'role' = 'ADMIN') OR 
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
    )
);

-- Staff: Tenant-isolated visibility
-- Optimized with JWT claim if available, fallback to profile subquery
CREATE POLICY "Users can see their own tenant tasks"
ON public.background_tasks FOR SELECT TO authenticated
USING (
    tenant_id = COALESCE(
        (auth.jwt() ->> 'tenant_id')::uuid,
        (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can insert their own tasks"
ON public.background_tasks FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tasks"
ON public.background_tasks FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ==========================================================
-- 4. Automated Operations (Cleanup & Stats)
-- ==========================================================

-- Cleanup Function: Retention 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_background_tasks()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.background_tasks
    WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule Cleanup: Every day at midnight (Requires pg_cron)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 0 * * *', $$SELECT public.cleanup_old_background_tasks()$$);

-- Trigger for completed_at: Set on any terminal state
CREATE OR REPLACE FUNCTION public.handle_background_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completed_at if entering success or error state
    IF (NEW.status IN ('SUCCESS', 'ERROR')) AND (OLD.status NOT IN ('SUCCESS', 'ERROR')) THEN
        NEW.completed_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_background_task_completion
BEFORE UPDATE ON public.background_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_background_task_completion();

-- ==========================================================
-- 5. Performance Indexing
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_background_tasks_user_id ON public.background_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_background_tasks_tenant_id ON public.background_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_background_tasks_status ON public.background_tasks(status);
CREATE INDEX IF NOT EXISTS idx_background_tasks_created_at ON public.background_tasks(created_at DESC);

-- 🚀 Partial Index for High-Performance Queue Management
-- Specifically for workers looking for pending high-priority jobs
CREATE INDEX IF NOT EXISTS idx_background_tasks_worker_queue 
ON public.background_tasks(priority DESC, created_at ASC) 
WHERE (status = 'PENDING');
