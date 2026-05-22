
-- Migration: 20240227_notifications_retention.sql

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own notifications
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can see their own notifications') THEN
        CREATE POLICY "Users can see their own notifications" ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can update their own notifications (to mark as read)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own notifications') THEN
        CREATE POLICY "Users can update their own notifications" ON public.notifications
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable Realtime for notifications
-- Check if the table is already in the publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;

-- 2. Audit Log Retention (pg_cron)
-- Only run if pg_cron is available
-- Note: In some Supabase setup, you need to enable it via Dashboard or 'CREATE EXTENSION IF NOT EXISTS pg_cron'
-- We'll try to enable it and schedule the job.

DO $$ 
BEGIN
    -- Check if pg_cron is installed
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule cleanup every Sunday at midnight
        -- Retain logs for 1 year (365 days)
        -- Using cron.schedule(job_name, schedule, command)
        PERFORM cron.schedule (
            'audit-log-cleanup',
            '0 0 * * 0',
            $job$ DELETE FROM public.audit_logs WHERE created_at < now() - INTERVAL '365 days' $job$
        );
    END IF;
END $$;
