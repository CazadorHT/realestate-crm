-- 🛠️ Drop Legacy and Redundant "Tenant Isolation Policy" on properties_core
-- 
-- Rationale:
-- 1. This policy is a RESTRICTIVE policy that restricts operations based on `status = 1`
--    or `tenant_id = ((SELECT auth.jwt())->>'tenant_id')::uuid`.
-- 2. However, the custom claim `tenant_id` at the root JWT level is not populated or used
--    by standard users (their roles and tenant memberships are resolved in `identities_v3` / `tenant_members_v3`).
-- 3. As a result, agents (who are not system admins) cannot create, update, or view properties with status != 1 (such as DRAFT listings),
--    which violates RLS and blocks property creation since new properties are created as DRAFT by default.
-- 4. Tenant isolation is already perfectly and dynamically enforced by:
--    - Permissive policy "properties_core_modify" (checks tenant_id against `get_user_tenants()`)
--    - Permissive policy "properties_core_select" (checks tenant_id against `get_user_tenants()`)
--    - Restrictive policy "Properties RLS Restrictive Isolation" (handles branch/staff-level dynamic isolation)

DROP POLICY IF EXISTS "Tenant Isolation Policy" ON public.properties_core;
