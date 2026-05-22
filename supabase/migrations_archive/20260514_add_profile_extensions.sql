-- Migration to add nickname and signature_url to profiles
-- Created at: 2026-05-14

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- Update identities_v3 to also have nickname for system-wide display consistency
ALTER TABLE public.identities_v3
ADD COLUMN IF NOT EXISTS nickname TEXT;

COMMENT ON COLUMN public.profiles.nickname IS 'ชื่อเล่นของพนักงาน';
COMMENT ON COLUMN public.profiles.signature_url IS 'URL รูปภาพลายเซ็นดิจิทัล (Transparent PNG)';
