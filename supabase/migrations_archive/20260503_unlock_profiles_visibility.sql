-- Migration: Unlock Profiles Visibility for Blog & CRM (Unified & Optimized)
-- Description: Consolidates all SELECT policies into one to fix performance warnings.
-- Created: 2026-05-03

BEGIN;

-- 1. Clean up ALL existing SELECT policies to avoid "Multiple Permissive Policies" warning
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_read_basic" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Master: Profiles Select" ON public.profiles;

-- 2. Create the ONE and ONLY SELECT policy
-- Allowing public read access is necessary for blog authorship and agent profiles.
-- Sensitive fields (like emails if any) should be handled via API or Column Level Security if needed.
CREATE POLICY "profiles_select_optimized_unified" ON public.profiles
FOR SELECT USING (true); 

-- Note: UPDATE/DELETE still restricted via other role-specific policies.

COMMIT;
