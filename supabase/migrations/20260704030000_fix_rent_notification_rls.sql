-- Fix Admin access for notification_channels_v3 RLS policy
DROP POLICY IF EXISTS "Tenant isolation for notification_channels_v3" ON "public"."notification_channels_v3";
CREATE POLICY "Tenant isolation for notification_channels_v3" ON "public"."notification_channels_v3"
USING (
  "public"."is_system_admin"() OR
  "tenant_id" = (NULLIF("current_setting"('app.current_tenant_id'::"text", true), ''::"text"))::"uuid"
);

-- Fix Admin access for rent_notification_rules_v3 RLS policy
DROP POLICY IF EXISTS "Tenant isolation for rent_notification_rules_v3" ON "public"."rent_notification_rules_v3";
CREATE POLICY "Tenant isolation for rent_notification_rules_v3" ON "public"."rent_notification_rules_v3"
USING (
  "public"."is_system_admin"() OR
  "tenant_id" = (NULLIF("current_setting"('app.current_tenant_id'::"text", true), ''::"text"))::"uuid"
);

-- Fix Admin access for rent_notification_history_v3 RLS policy
DROP POLICY IF EXISTS "Tenant isolation for rent_notification_history_v3" ON "public"."rent_notification_history_v3";
CREATE POLICY "Tenant isolation for rent_notification_history_v3" ON "public"."rent_notification_history_v3"
USING (
  "public"."is_system_admin"() OR
  "tenant_id" = (NULLIF("current_setting"('app.current_tenant_id'::"text", true), ''::"text"))::"uuid"
);
