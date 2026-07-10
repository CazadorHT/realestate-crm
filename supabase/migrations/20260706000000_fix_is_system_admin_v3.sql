-- Migration: 20260706000000_fix_is_system_admin_v3.sql
-- Rationale:
-- In V3, roles and identity systems have been migrated to the public.identities_v3 table as the Source of Truth.
-- The legacy public.profiles table is no longer the primary place where roles are updated for new or approved users (e.g. v3_approve_identity).
-- This causes the public.is_system_admin() function to return false for valid system admins if they only have their 'ADMIN' role in identities_v3 but not profiles.
-- By extending is_system_admin() to check public.identities_v3, we restore correct administrative bypasses across all RLS policies.

CREATE OR REPLACE FUNCTION "public"."is_system_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN COALESCE((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')), '') = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
    )
    OR EXISTS (
      SELECT 1 FROM public.identities_v3 WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$;
