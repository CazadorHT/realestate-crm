-- 1. Add 'USER' to user_role enum
-- Note: PostgreSQL doesn't support dropping enum values easily, so we just add it.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'USER' BEFORE 'AGENT';

-- 2. Update profiles table default role
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'USER'::user_role;

-- 3. Update RLS policies to restrict access to CRM data
-- We need to ensure that only ADMIN and AGENT can access CRM tables.

-- Function to check if a user is staff (ADMIN or AGENT)
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'AGENT')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS for Properties
DROP POLICY IF EXISTS "Authenticated can manage properties" ON properties;
CREATE POLICY "Staff can manage properties" ON properties
  FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- Update RLS for Leads
DROP POLICY IF EXISTS "Authenticated can read leads" ON leads;
DROP POLICY IF EXISTS "Authenticated can insert leads" ON leads;
DROP POLICY IF EXISTS "authenticated_update_leads_all" ON leads;
DROP POLICY IF EXISTS "authenticated_delete_leads_all" ON leads;

CREATE POLICY "Staff can view leads" ON leads FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "Staff can insert leads" ON leads FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "Staff can update leads" ON leads FOR UPDATE TO authenticated USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY "Staff can delete leads" ON leads FOR DELETE TO authenticated USING (is_staff());

-- Update RLS for Owners
DROP POLICY IF EXISTS "Authenticated users can view all owners" ON owners;
DROP POLICY IF EXISTS "Authenticated users can insert owners" ON owners;
DROP POLICY IF EXISTS "Authenticated users can update all owners" ON owners;
DROP POLICY IF EXISTS "Authenticated users can delete all owners" ON owners;

CREATE POLICY "Staff can manage owners" ON owners
  FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- Update RLS for Property Images
DROP POLICY IF EXISTS "Authenticated can read images" ON property_images;
DROP POLICY IF EXISTS "Authenticated can insert images" ON property_images;
DROP POLICY IF EXISTS "authenticated_manage_all_images" ON property_images;

CREATE POLICY "Staff can manage property images" ON property_images
  FOR ALL TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- Update RLS for Storage Objects (property-images bucket)
DROP POLICY IF EXISTS "authenticated_manage_images_storage" ON storage.objects;
CREATE POLICY "Staff can manage property images storage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'property-images' AND is_staff())
  WITH CHECK (bucket_id = 'property-images' AND is_staff());
