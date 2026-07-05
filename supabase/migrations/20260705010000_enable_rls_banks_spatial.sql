-- Enable RLS for banks table
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone
CREATE POLICY "Allow public read access to banks" ON public.banks
    FOR SELECT USING (true);

-- Allow system admins to modify banks
CREATE POLICY "Allow system admins to modify banks" ON public.banks
    FOR ALL
    TO authenticated
    USING ("public"."is_system_admin"())
    WITH CHECK ("public"."is_system_admin"());
