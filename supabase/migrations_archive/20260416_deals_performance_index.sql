-- Performance Hardening: Deal Property Index
-- Optimizes joins between deals and properties for bulk operations and filtering.

CREATE INDEX IF NOT EXISTS idx_deals_property_id ON public.deals(property_id);
