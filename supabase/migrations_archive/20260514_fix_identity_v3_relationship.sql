-- Fix missing identity for profiles and establish foreign key relationship
-- Created at: 2026-05-14

-- 1. Backfill: Create missing identities for all profiles
INSERT INTO public.identities_v3 (id, email, display_name, category, role, is_active)
SELECT 
    p.id, 
    p.email, 
    COALESCE(p.full_name, p.email), 
    1, -- Category: Internal/Staff
    COALESCE(p.role, 'USER'), 
    true
FROM public.profiles p
WHERE p.id NOT IN (SELECT id FROM public.identities_v3)
ON CONFLICT (id) DO NOTHING;

-- 2. Establish Foreign Key from profiles to identities_v3
-- This allows PostgREST to understand the relationship for joins
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_identity_v3_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_identity_v3_fkey 
FOREIGN KEY (id) REFERENCES public.identities_v3(id) ON DELETE CASCADE;

-- 3. Add comment for documentation
COMMENT ON CONSTRAINT profiles_id_identity_v3_fkey ON public.profiles IS 'Links staff profile to the master identity hub (V3 Architecture)';
