-- Migration: Add system_task_queue to Supabase Realtime publication
-- This enables realtime listeners to receive status updates for background processes.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        -- Check if table is already in the publication to avoid errors
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'system_task_queue'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.system_task_queue;
        END IF;
    END IF;
END $$;
