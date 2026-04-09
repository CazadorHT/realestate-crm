-- supabase/migrations/20260409_audit_logs_user_id_nullable.sql
-- Make user_id nullable to allow anonymous logging (e.g., login failures)

ALTER TABLE public.audit_logs ALTER COLUMN user_id DROP NOT NULL;
COMMENT ON COLUMN public.audit_logs.user_id IS 'User ID who performed the action. Null for anonymous/system actions.';
