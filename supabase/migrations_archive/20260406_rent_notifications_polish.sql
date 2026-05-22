-- Migration: Final Polish for Rent Notifications History
-- Purpose: Standardize timestamp naming and add missing Foreign Key relationship

-- 1. Rename sent_at to created_at
ALTER TABLE public.rent_notification_history 
RENAME COLUMN sent_at TO created_at;

-- 2. Add Foreign Key for line_group_id to line_groups (group_id)
-- This allows relationship joins in Supabase queries
ALTER TABLE public.rent_notification_history
ADD CONSTRAINT rent_notification_history_line_group_id_fkey 
FOREIGN KEY (line_group_id) 
REFERENCES public.line_groups(group_id) 
ON DELETE SET NULL;

COMMENT ON TABLE rent_notification_history IS 'Historical log of all sent rent notifications with status auditing.';
