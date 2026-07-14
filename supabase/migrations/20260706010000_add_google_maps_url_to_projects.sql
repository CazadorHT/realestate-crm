-- Migration: Add google_maps_url to projects table
-- Date: 2026-07-14

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS google_maps_url text;
