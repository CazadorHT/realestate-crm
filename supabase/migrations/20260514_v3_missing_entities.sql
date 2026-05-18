-- =============================================================================
-- Migration: V3 Missing Entities (popular_areas_v3 + Tenant RPC Functions)
-- Created: 2026-05-14
-- Purpose: Add back critical tables and functions that were missing from V3,
--          redesigned to be smarter, leaner, and future-proof.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. popular_areas_v3 — JSONB i18n, single source of truth for area names
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.popular_areas_v3 (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        jsonb NOT NULL DEFAULT '{}',  -- {"th":"สุขุมวิท","en":"Sukhumvit","cn":"素坤逸","ru":"Сукхумвит"}
  province    text DEFAULT 'กรุงเทพมหานคร',
  slug        text UNIQUE,
  image_url   text,
  is_active   boolean DEFAULT true,
  featured    boolean DEFAULT false,
  sort_order  int DEFAULT 0,
  tenant_id   uuid REFERENCES public.tenants_v3(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

COMMENT ON TABLE public.popular_areas_v3 IS 'V3 popular areas with JSONB i18n names. Replaces legacy popular_areas table.';
COMMENT ON COLUMN public.popular_areas_v3.name IS 'Multilingual name: {"th":"...","en":"...","cn":"...","ru":"..."}';

-- Index for slug lookups (public pages)
CREATE INDEX IF NOT EXISTS idx_popular_areas_v3_slug ON public.popular_areas_v3(slug) WHERE slug IS NOT NULL;
-- Index for active featured areas (homepage)
CREATE INDEX IF NOT EXISTS idx_popular_areas_v3_featured ON public.popular_areas_v3(featured, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.popular_areas_v3 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "popular_areas_v3_read_all" ON public.popular_areas_v3
  FOR SELECT USING (true);

CREATE POLICY "popular_areas_v3_admin_write" ON public.popular_areas_v3
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.identities_v3
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. transfer_tenant_member — Atomic member transfer between tenants (V3)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.transfer_tenant_member(
  p_profile_id uuid,
  p_from_tenant_id uuid,
  p_to_tenant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identity_id uuid;
  v_member_role text;
BEGIN
  -- Resolve identity_id from auth user id (p_profile_id maps to identities_v3.id)
  v_identity_id := p_profile_id;

  -- Get current role from source tenant
  SELECT role INTO v_member_role
  FROM tenant_members_v3
  WHERE identity_id = v_identity_id AND tenant_id = p_from_tenant_id;

  IF v_member_role IS NULL THEN
    RAISE EXCEPTION 'Member not found in source tenant';
  END IF;

  -- Remove from source tenant
  DELETE FROM tenant_members_v3
  WHERE identity_id = v_identity_id AND tenant_id = p_from_tenant_id;

  -- Add to target tenant (keep same role)
  INSERT INTO tenant_members_v3 (identity_id, tenant_id, role, joined_at)
  VALUES (v_identity_id, p_to_tenant_id, v_member_role, now())
  ON CONFLICT (identity_id, tenant_id) DO UPDATE SET role = EXCLUDED.role;

  -- Audit log
  INSERT INTO system_audit_logs_v3 (action, entity_table, entity_id, actor_id, old_data, new_data)
  VALUES (
    'TRANSFER_MEMBER',
    'tenant_members_v3',
    v_identity_id::text,
    auth.uid()::text,
    jsonb_build_object('from_tenant', p_from_tenant_id),
    jsonb_build_object('to_tenant', p_to_tenant_id)
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. accept_tenant_invitation — Accept a pending invitation (V3)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_tenant_invitation(
  p_tenant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
  v_identity_id uuid;
  v_email text;
BEGIN
  v_identity_id := auth.uid();

  -- Get the caller's email from identities_v3
  SELECT email INTO v_email FROM identities_v3 WHERE id = v_identity_id;

  -- Find the pending invitation
  SELECT * INTO v_invitation
  FROM tenant_invitations_v3
  WHERE tenant_id = p_tenant_id
    AND email = v_email
    AND status = 'PENDING'
    AND expires_at > now()
  LIMIT 1;

  IF v_invitation IS NULL THEN
    RAISE EXCEPTION 'No valid pending invitation found';
  END IF;

  -- Create membership
  INSERT INTO tenant_members_v3 (identity_id, tenant_id, role, joined_at)
  VALUES (v_identity_id, p_tenant_id, v_invitation.role, now())
  ON CONFLICT (identity_id, tenant_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE tenant_invitations_v3
  SET status = 'ACCEPTED'
  WHERE id = v_invitation.id;

  -- Audit
  INSERT INTO system_audit_logs_v3 (action, entity_table, entity_id, actor_id, new_data)
  VALUES (
    'ACCEPT_INVITATION',
    'tenant_invitations_v3',
    v_invitation.id::text,
    v_identity_id::text,
    jsonb_build_object('tenant_id', p_tenant_id, 'role', v_invitation.role)
  );
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. decline_tenant_invitation — Decline a pending invitation (V3)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decline_tenant_invitation(
  p_tenant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id uuid;
  v_identity_id uuid;
  v_email text;
BEGIN
  v_identity_id := auth.uid();

  SELECT email INTO v_email FROM identities_v3 WHERE id = v_identity_id;

  -- Find and decline
  UPDATE tenant_invitations_v3
  SET status = 'DECLINED'
  WHERE tenant_id = p_tenant_id
    AND email = v_email
    AND status = 'PENDING'
  RETURNING id INTO v_invitation_id;

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'No valid pending invitation found';
  END IF;

  -- Audit
  INSERT INTO system_audit_logs_v3 (action, entity_table, entity_id, actor_id, new_data)
  VALUES (
    'DECLINE_INVITATION',
    'tenant_invitations_v3',
    v_invitation_id::text,
    v_identity_id::text,
    jsonb_build_object('tenant_id', p_tenant_id)
  );
END;
$$;
