-- 1. Create Notification History Table
CREATE TABLE IF NOT EXISTS public.rent_notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES public.rent_notification_rules(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    line_group_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'ERROR')),
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_rent_notification_history_tenant_id ON rent_notification_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_notification_history_rule_id ON rent_notification_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_rent_notification_history_sent_at ON rent_notification_history(sent_at);

-- 3. Enable RLS on all tables
ALTER TABLE public.rent_notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_notification_history ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies using get_user_tenants() helper
-- Rules
DROP POLICY IF EXISTS "Tenant Isolation: Rent Notification Rules" ON public.rent_notification_rules;
CREATE POLICY "Tenant Isolation: Rent Notification Rules" ON public.rent_notification_rules
FOR ALL USING (
    tenant_id IN (SELECT get_user_tenants())
    OR tenant_id IS NULL -- Allow seeing system-wide data if needed (consistent with current query logic)
);

-- Groups
DROP POLICY IF EXISTS "Tenant Isolation: LINE Groups" ON public.line_groups;
CREATE POLICY "Tenant Isolation: LINE Groups" ON public.line_groups
FOR ALL USING (
    tenant_id IN (SELECT get_user_tenants())
    OR tenant_id IS NULL
);

-- History
DROP POLICY IF EXISTS "Tenant Isolation: Rent Notification History" ON public.rent_notification_history;
CREATE POLICY "Tenant Isolation: Rent Notification History" ON public.rent_notification_history
FOR ALL USING (
    tenant_id IN (SELECT get_user_tenants())
);

-- 5. Backfill Legacy Data
-- We assign NULL records to the first available tenant to ensure they are properly owned.
-- In a real scenario, the user might want a specific HQ tenant ID.
DO $$
DECLARE
    default_tenant_id UUID;
BEGIN
    SELECT id INTO default_tenant_id FROM public.tenants ORDER BY created_at ASC LIMIT 1;
    
    IF default_tenant_id IS NOT NULL THEN
        UPDATE public.rent_notification_rules SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
        UPDATE public.line_groups SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    END IF;
END $$;
