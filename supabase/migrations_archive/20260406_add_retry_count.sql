-- Add retry_count to rent_notification_history to support auto-retry logic
ALTER TABLE rent_notification_history ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Optional: Add a comment for better documentation
COMMENT ON COLUMN rent_notification_history.retry_count IS 'Number of retry attempts for this notification (max 3)';
