-- Add notification_preferences column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"new_lead": true, "assignment": true, "status_update": false, "activity": true}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN profiles.notification_preferences IS 'Stores user notification settings as JSONB. Default: all true except status_update.';
