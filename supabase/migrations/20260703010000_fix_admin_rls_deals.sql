-- Fix Admin access for crm_deals_v3 RLS policy
DROP POLICY IF EXISTS "deals_v3_tenant_isolation" ON "public"."crm_deals_v3";
CREATE POLICY "deals_v3_tenant_isolation" ON "public"."crm_deals_v3"
USING (
  "public"."is_system_admin"() OR
  EXISTS (
    SELECT 1 FROM "public"."tenant_members_v3"
    WHERE "tenant_members_v3"."tenant_id" = "crm_deals_v3"."tenant_id"
      AND "tenant_members_v3"."identity_id" = "auth"."uid"()
  )
);

-- Fix Admin access for crm_deal_commissions_v3 RLS policy
DROP POLICY IF EXISTS "commissions_v3_tenant_isolation" ON "public"."crm_deal_commissions_v3";
CREATE POLICY "commissions_v3_tenant_isolation" ON "public"."crm_deal_commissions_v3"
USING (
  "public"."is_system_admin"() OR
  EXISTS (
    SELECT 1 FROM "public"."tenant_members_v3"
    WHERE "tenant_members_v3"."tenant_id" = "crm_deal_commissions_v3"."tenant_id"
      AND "tenant_members_v3"."identity_id" = "auth"."uid"()
  )
);
