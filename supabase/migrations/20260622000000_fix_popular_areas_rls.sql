-- 🛠️ Fix Row-Level Security on popular_areas_v3
-- 
-- Rationale:
-- 1. The previous policy "popular_areas_v3_admin_write" only permitted ADMIN and SUPER_ADMIN roles to insert/update popular areas.
-- 2. However, the application server action `addPopularAreaAction` permits all backend staff members (including AGENT, MANAGER, OWNER)
--    to create popular areas because they are global.
-- 3. This mismatch leads to RLS violations when non-admin staff attempt to add popular areas.
-- 4. We drop the old restrictive admin-only write policy and replace it with a policy that allows all authenticated staff roles
--    (ADMIN, SUPER_ADMIN, MANAGER, AGENT, OWNER) to manage popular areas.

DROP POLICY IF EXISTS "popular_areas_v3_admin_write" ON public.popular_areas_v3;

CREATE POLICY "popular_areas_v3_staff_write" ON public.popular_areas_v3
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.identities_v3
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN', 'MANAGER', 'AGENT', 'OWNER')
    )
  );
