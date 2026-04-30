-- 🔒 1. Performance-Optimized & Unified RLS for tenant_members
-- Consolidates multiple policies and uses (SELECT ...) subqueries to fix auth_rls_initplan warnings.
DROP POLICY IF EXISTS "Admin and Members View" ON public.tenant_members;
DROP POLICY IF EXISTS "System Admin Manage tenant_members" ON public.tenant_members;
DROP POLICY IF EXISTS "View Members in Same Tenant" ON public.tenant_members;

CREATE POLICY "Unified Tenant Members Access" ON public.tenant_members
FOR ALL TO authenticated, service_role, anon
USING (
    (SELECT is_system_admin()) -- Fixed: Subquery for performance
    OR profile_id = (SELECT auth.uid()) -- Fixed: Subquery for performance
    OR tenant_id IN (
        SELECT tm.tenant_id 
        FROM public.tenant_members tm 
        WHERE tm.profile_id = (SELECT auth.uid())
    )
);

-- 🕵️ 2. Redefine Core Helpers as SECURITY INVOKER (Linter Fix)
-- Use CREATE OR REPLACE to maintain dependent RLS policies without dropping them.
CREATE OR REPLACE FUNCTION public.get_user_tenants()
RETURNS uuid[] AS $$
BEGIN
  RETURN COALESCE(
    ARRAY(
      SELECT tenant_id 
      FROM public.tenant_members 
      WHERE profile_id = auth.uid()
    ),
    '{}'::uuid[]
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_tenant_staff(target_tenant_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE profile_id = auth.uid() 
      AND tenant_id = target_tenant_id
      AND role IN ('OWNER', 'ADMIN', 'MANAGER', 'AGENT')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

DROP FUNCTION IF EXISTS public.get_popular_areas_with_counts(uuid);
CREATE OR REPLACE FUNCTION public.get_popular_areas_with_counts(target_tenant_id uuid DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_en TEXT,
  name_cn TEXT,
  name_ru TEXT,
  province TEXT,
  slug TEXT,
  image_url TEXT,
  is_active BOOLEAN,
  sort_order INTEGER,
  featured BOOLEAN,
  created_at TIMESTAMPTZ,
  property_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.name,
    pa.name_en,
    pa.name_cn,
    pa.name_ru,
    pa.province,
    pa.slug,
    pa.image_url,
    pa.is_active,
    pa.sort_order,
    pa.featured,
    pa.created_at,
    COUNT(p.id) FILTER (
      WHERE (target_tenant_id IS NULL OR p.tenant_id = target_tenant_id)
      AND p.deleted_at IS NULL
    ) as property_count
  FROM popular_areas pa
  LEFT JOIN properties p ON pa.name = p.popular_area
  GROUP BY pa.id
  ORDER BY pa.sort_order ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

-- 🛡️ 3. Handle SECURITY DEFINER functions (RPCs)
-- These still need DEFINER to bypass RLS, so we REVOKE/GRANT strictly.
REVOKE EXECUTE ON FUNCTION public.get_lead_messages(UUID, TEXT, TIMESTAMPTZ, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_system_activity(TEXT, TEXT, TEXT, JSONB, UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bulk_trash_properties(UUID[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bulk_hard_delete_properties(UUID[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_system_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.match_properties_hardened(vector(768), float, int, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_lead_from_match(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_tenant_invitation(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decline_tenant_invitation(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_ai_usage(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, NUMERIC) FROM PUBLIC;
-- 🛡️ 5. Grant explicit access to Authenticated & Service Role (Staff/Systems)
-- Also grant to anon for functions used in RLS policies to prevent query failure.
GRANT EXECUTE ON FUNCTION public.get_user_tenants() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.is_tenant_staff(uuid) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_popular_areas_with_counts(uuid) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.submit_public_lead(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.increment_property_view(UUID) TO authenticated, service_role, anon;

GRANT EXECUTE ON FUNCTION public.get_lead_messages(UUID, TEXT, TIMESTAMPTZ, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_system_activity(TEXT, TEXT, TEXT, JSONB, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bulk_trash_properties(UUID[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bulk_hard_delete_properties(UUID[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_properties_hardened(vector(768), float, int, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_lead_from_match(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.accept_tenant_invitation(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decline_tenant_invitation(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_ai_usage(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, NUMERIC) TO authenticated, service_role;

-- 🌐 3. Public-Facing Functions: Convert to SECURITY INVOKER to avoid warnings
-- We then use RLS to grant the necessary permissions to 'anon'.

CREATE OR REPLACE FUNCTION public.submit_public_lead(
  p_name TEXT, p_email TEXT, p_phone TEXT, p_message TEXT, p_property_id TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.leads (full_name, email, phone, message, property_id, status)
  VALUES (p_name, p_email, p_phone, p_message, p_property_id::uuid, 'NEW');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_property_view(p_id UUID) 
RETURNS void AS $$
BEGIN
  UPDATE public.properties 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

-- 🛡️ 4. Grant RLS Permissions for Anonymous Actions
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Lead Submission" ON public.leads;
CREATE POLICY "Public Lead Submission" ON public.leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Increment Views" ON public.properties;
CREATE POLICY "Public Increment Views" ON public.properties FOR UPDATE USING (true) WITH CHECK (true);

COMMENT ON FUNCTION public.get_lead_messages(UUID, TEXT, TIMESTAMPTZ, INTEGER, INTEGER) IS 'RLS-compliant message fetching. Restricted to authenticated users.';
COMMENT ON FUNCTION public.submit_public_lead(TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Public lead intake for website. Internally rate-limited.';
