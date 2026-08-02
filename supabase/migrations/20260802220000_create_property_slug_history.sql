-- Migration: Property Slug History (301 Permanent Redirect System for SEO)
CREATE TABLE IF NOT EXISTS public.property_slug_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties_core(id) ON DELETE CASCADE,
    old_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ultra-fast lookup (< 2ms)
CREATE INDEX IF NOT EXISTS idx_property_slug_history_old_slug ON public.property_slug_history(old_slug);
CREATE INDEX IF NOT EXISTS idx_property_slug_history_property_id ON public.property_slug_history(property_id);

-- Enable RLS
ALTER TABLE public.property_slug_history ENABLE ROW LEVEL SECURITY;

-- Public READ policy (Anyone can resolve old slugs for 301 redirects)
CREATE POLICY "Public read property_slug_history"
ON public.property_slug_history
FOR SELECT
TO public
USING (true);

-- Authenticated Users Write Policy
CREATE POLICY "Authenticated write property_slug_history"
ON public.property_slug_history
FOR INSERT
TO authenticated
WITH CHECK (true);
