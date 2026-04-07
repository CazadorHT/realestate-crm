-- 1. Add Soft Delete and Analytics columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;

-- 2. Create service_views_log table for granular analytics
CREATE TABLE IF NOT EXISTS public.service_views_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    tenant_id UUID,
    user_id UUID REFERENCES auth.users(id),
    client_ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add indexes for faster aggregation and filtering
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON public.services(deleted_at);
CREATE INDEX IF NOT EXISTS idx_service_views_log_created_at ON public.service_views_log(created_at);
CREATE INDEX IF NOT EXISTS idx_service_views_log_service_id ON public.service_views_log(service_id);

-- 4. Enable RLS on analytics log
ALTER TABLE public.service_views_log ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy for Analytics Log
DROP POLICY IF EXISTS "Public can insert service views log via RPC" ON public.service_views_log;
CREATE POLICY "Public can insert service views log via RPC" 
ON public.service_views_log FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view service analytics" ON public.service_views_log;
CREATE POLICY "Admins can view service analytics" 
ON public.service_views_log FOR SELECT TO authenticated 
USING (
  is_system_admin() 
  OR (EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER') ))
);

-- 6. Storage Bucket: service-images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public Read
DROP POLICY IF EXISTS "Public Read Access: Service Images" ON storage.objects;
CREATE POLICY "Public Read Access: Service Images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'service-images');

-- Storage RLS: Staff Management
DROP POLICY IF EXISTS "Staff Manage: Service Images" ON storage.objects;
CREATE POLICY "Staff Manage: Service Images"
ON storage.objects FOR ALL TO authenticated
USING (
    (bucket_id = 'service-images') AND 
    (is_system_admin() OR (EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER', 'AGENT') )))
)
WITH CHECK (
    (bucket_id = 'service-images') AND 
    (is_system_admin() OR (EXISTS ( SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER', 'AGENT') )))
);

-- 7. Advanced RPC: increment_service_view with Anti-Spam
CREATE OR REPLACE FUNCTION public.increment_service_view(
    p_service_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_ip_hash TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_tenant_id UUID;
    v_last_view TIMESTAMPTZ;
BEGIN
    -- 1. Get tenant_id
    SELECT tenant_id INTO v_tenant_id FROM public.services WHERE id = p_service_id;

    -- 2. Anti-Spam Check: Check if same IP/User viewed in the last 15 minutes
    SELECT MAX(created_at) INTO v_last_view 
    FROM public.service_views_log 
    WHERE service_id = p_service_id 
    AND (client_ip_hash = p_ip_hash OR user_id = p_user_id)
    AND created_at > now() - interval '15 minutes';

    IF v_last_view IS NULL THEN
        -- 3. Increment total view_count
        UPDATE public.services 
        SET view_count = COALESCE(view_count, 0) + 1,
            updated_at = now()
        WHERE id = p_service_id;

        -- 4. Log individual event
        INSERT INTO public.service_views_log (
            service_id, 
            tenant_id, 
            user_id, 
            client_ip_hash, 
            user_agent, 
            created_at
        )
        VALUES (
            p_service_id, 
            v_tenant_id, 
            p_user_id, 
            p_ip_hash, 
            p_user_agent, 
            now()
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
