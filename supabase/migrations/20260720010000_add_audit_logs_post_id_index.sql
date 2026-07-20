-- Create index on new_data->>'post_id' in system_audit_logs_v3 to optimize Meta webhook lookup speed
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_v3_post_id 
ON system_audit_logs_v3 ((new_data->>'post_id'));
