-- Fix authenticated access for financial_ledger_v3 RLS policy
DROP POLICY IF EXISTS "financial_ledger_v3_tenant_isolation" ON "public"."financial_ledger_v3";
CREATE POLICY "financial_ledger_v3_tenant_isolation" ON "public"."financial_ledger_v3"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  "public"."is_system_admin"() OR
  EXISTS (
    SELECT 1 FROM "public"."tenant_members_v3"
    WHERE "tenant_members_v3"."tenant_id" = "financial_ledger_v3"."tenant_id"
      AND "tenant_members_v3"."identity_id" = "auth"."uid"()
  )
);
