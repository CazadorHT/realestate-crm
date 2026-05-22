-- Migration: Add notification_hour to rent_notification_rules
-- Purpose: Enable hourly scheduling for rent notifications

ALTER TABLE rent_notification_rules 
ADD COLUMN IF NOT EXISTS notification_hour INTEGER DEFAULT 9 CHECK (notification_hour >= 0 AND notification_hour <= 23);

COMMENT ON COLUMN rent_notification_rules.notification_hour IS 'The hour of the day (0-23) to send the notification.';
