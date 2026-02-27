-- 1. Fix Tenants RLS (Missing SELECT policy)
CREATE POLICY "Users can view tenants they are members of"
ON public.tenants FOR SELECT
USING (
    id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = auth.uid())
);

-- 2. Ensure Site Settings is readable (for global config)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'site_settings' AND policyname = 'Public Read Site Settings'
    ) THEN
        CREATE POLICY "Public Read Site Settings" ON public.site_settings 
        FOR SELECT USING (true);
    END IF;
END $$;

-- 3. Ensure Profiles have a base select policy (if not already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles 
        FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;
