-- 20260322_rls_public_and_staff_access.sql
-- Goal: Restore safe public access and enable staff management without Admin Client bypass.

-- 1. Ensure Global Staff Helper Function
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'AGENT', 'MANAGER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Popular Areas: Public Read, Staff Manage
ALTER TABLE public.popular_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read popular_areas" ON public.popular_areas;
CREATE POLICY "Public Read popular_areas" ON public.popular_areas
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff Manage popular_areas" ON public.popular_areas;
CREATE POLICY "Staff Manage popular_areas" ON public.popular_areas
FOR ALL USING (is_staff());

-- 3. Properties: Public Read for ACTIVE listings
-- Note: 'Properties Enterprise Access' already handles staff/tenant isolation.
-- We add a specific policy for public SELECT.
DROP POLICY IF EXISTS "Public View Active Properties" ON public.properties;
CREATE POLICY "Public View Active Properties" ON public.properties
FOR SELECT USING (status = 'ACTIVE' AND deleted_at IS NULL);

-- 4. Blog Posts: Public Read for Published, Staff Manage
DROP POLICY IF EXISTS "Public View Published Blogs" ON public.blog_posts;
CREATE POLICY "Public View Published Blogs" ON public.blog_posts
FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Staff Manage blog_posts" ON public.blog_posts;
CREATE POLICY "Staff Manage blog_posts" ON public.blog_posts
FOR ALL USING (is_staff());

-- 5. Services: Public Read for Active, Staff Manage
DROP POLICY IF EXISTS "Public View Active Services" ON public.services;
CREATE POLICY "Public View Active Services" ON public.services
FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Staff Manage services" ON public.services;
CREATE POLICY "Staff Manage services" ON public.services
FOR ALL USING (is_staff());

-- 6. Features: Public Read (needed for property details)
DROP POLICY IF EXISTS "Public Read features" ON public.features;
CREATE POLICY "Public Read features" ON public.features
FOR SELECT USING (true);

-- 7. Omni-channel: Public Insert (for contact forms)
-- 7. Omni-channel: Public Insert (for contact forms)
DROP POLICY IF EXISTS "Public Insert messages" ON public.communications_hub_v3;
CREATE POLICY "Public Insert messages" ON public.communications_hub_v3
FOR INSERT WITH CHECK (true);

-- 8. Leads: Public Insert (for contact forms)
DROP POLICY IF EXISTS "Public Insert leads" ON public.leads;
CREATE POLICY "Public Insert leads" ON public.leads
FOR INSERT WITH CHECK (true);

-- 9. Lead Activities: Public Insert (for tracking new leads)
DROP POLICY IF EXISTS "Public Insert lead_activities" ON public.lead_activities;
CREATE POLICY "Public Insert lead_activities" ON public.lead_activities
FOR INSERT WITH CHECK (true);

-- 10. Profiles: Public Read for Staff profiles (to show agents)
DROP POLICY IF EXISTS "Public View Agent Profiles" ON public.profiles;
CREATE POLICY "Public View Agent Profiles" ON public.profiles
FOR SELECT USING (role IN ('ADMIN', 'AGENT', 'MANAGER'));
