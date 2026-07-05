-- Try to change owner and enable RLS on spatial_ref_sys to silence Supabase warning
DO $$
BEGIN
    -- Change owner of the table to postgres (the role used by the CLI/migrator)
    EXECUTE 'ALTER TABLE public.spatial_ref_sys OWNER TO postgres';
    
    -- Enable RLS
    EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
    
    -- Create read policy if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'spatial_ref_sys' AND policyname = 'Allow public read access to spatial_ref_sys'
    ) THEN
        EXECUTE 'CREATE POLICY "Allow public read access to spatial_ref_sys" ON public.spatial_ref_sys FOR SELECT USING (true)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not modify spatial_ref_sys: %', SQLERRM;
END $$;
