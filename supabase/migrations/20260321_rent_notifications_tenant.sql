-- Add tenant_id to rent_notification_rules
ALTER TABLE rent_notification_rules ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Add tenant_id to line_groups
ALTER TABLE line_groups ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Update existing data to a default tenant if possible, or leave as NULL (system-wide)
-- For now, we leave as NULL as requested: "ไม่มี branch ให้แสดงทั้งระบบ"

-- Add Index for performance
CREATE INDEX IF NOT EXISTS idx_rent_notification_rules_tenant_id ON rent_notification_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_line_groups_tenant_id ON line_groups(tenant_id);

-- Enable RLS (Assuming it's already enabled, but let's ensure policies exist)
-- POLICY: Users can only see rules/groups for their own tenant or where tenant_id is NULL (if permitted)

-- Note: Existing policies might need adjustment.
-- For simplicity in this step, we just add the columns.
