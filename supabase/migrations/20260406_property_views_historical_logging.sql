-- 1. Create property_views_log table
CREATE TABLE IF NOT EXISTS public.property_views_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indexes for faster aggregation
CREATE INDEX IF NOT EXISTS idx_property_views_log_created_at ON public.property_views_log(created_at);
CREATE INDEX IF NOT EXISTS idx_property_views_log_property_id ON public.property_views_log(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_log_tenant_id ON public.property_views_log(tenant_id);

-- 3. Enable RLS
ALTER TABLE public.property_views_log ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Public can insert (via RPC)
CREATE POLICY "Public can insert property views log" 
ON public.property_views_log 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 5. RLS Policy: Admins can view their own branch logs
CREATE POLICY "Branch isolation for property views" 
ON public.property_views_log 
FOR SELECT 
TO authenticated 
USING (
  is_system_admin() 
  OR is_tenant_admin(tenant_id)
);

-- 6. Update increment_property_view function to include logging
CREATE OR REPLACE FUNCTION public.increment_property_view(property_id uuid)
RETURNS void AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Get the tenant_id first
  SELECT tenant_id INTO v_tenant_id 
  FROM public.properties 
  WHERE id = property_id;

  -- 1. Increment total view_count on property
  UPDATE public.properties 
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = now()
  WHERE id = property_id;

  -- 2. Log the individual view event
  INSERT INTO public.property_views_log (property_id, tenant_id, created_at)
  VALUES (property_id, v_tenant_id, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
