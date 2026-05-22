-- 20260323_fix_property_images_rls.sql
-- Goal: Restore visibility of property images by adding missing RLS policies.

-- 1. Public Read: Allow viewing images of active properties
-- This is needed for the public website to display images.
DROP POLICY IF EXISTS "Public View property_images" ON public.property_images;
CREATE POLICY "Public View property_images" ON public.property_images
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.properties 
        WHERE id = property_id 
        AND status = 'ACTIVE' 
        AND deleted_at IS NULL
    )
);

-- 2. Staff View: Allow staff (Agents, Managers, Admins) to see all property images
-- This is needed for the CRM table and detail pages.
DROP POLICY IF EXISTS "Staff View property_images" ON public.property_images;
CREATE POLICY "Staff View property_images" ON public.property_images
FOR SELECT USING (is_staff());

-- 3. Staff Manage: Allow staff to manage property images
-- This allows uploading, sorting, and deleting images.
DROP POLICY IF EXISTS "Staff Manage property_images" ON public.property_images;
CREATE POLICY "Staff Manage property_images" ON public.property_images
FOR ALL USING (is_staff());

-- 4. Property Image Uploads: Also ensure this helper table is accessible to staff
DROP POLICY IF EXISTS "Staff Manage property_image_uploads" ON public.property_image_uploads;
CREATE POLICY "Staff Manage property_image_uploads" ON public.property_image_uploads
FOR ALL USING (is_staff());
