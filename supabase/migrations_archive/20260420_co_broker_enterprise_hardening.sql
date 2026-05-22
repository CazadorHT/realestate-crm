-- 1. Create Storage Bucket for Co-Broker Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('co-broker-documents', 'co-broker-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
-- Allow authenticated users to see documents (restricted by profile lookup in app)
CREATE POLICY "authenticated_view_documents" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'co-broker-documents');

-- Allow all authenticated members of the tenant to manage documents (Upload/Delete)
CREATE POLICY "tenant_members_manage_documents" ON storage.objects
FOR ALL TO authenticated 
USING (
  bucket_id = 'co-broker-documents' AND 
  EXISTS (
    SELECT 1 FROM public.tenant_members 
    WHERE profile_id = auth.uid()
  )
);

-- 3. Refactor Co-Brokers RLS for Agent Autonomy
DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.co_brokers;
DROP POLICY IF EXISTS "Enable insert/update for managers" ON public.co_brokers;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.co_brokers;

-- Users can see all co-brokers in their tenant (except deleted ones, unless they are admin/looking at trash)
CREATE POLICY "view_co_brokers" ON public.co_brokers
FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = auth.uid()) 
  AND (deleted_at IS NULL OR EXISTS (
    SELECT 1 FROM public.tenant_members 
    WHERE profile_id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
  ))
);

-- Agents/Staff can insert their own co-brokers or within branch
CREATE POLICY "insert_co_brokers" ON public.co_brokers
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = auth.uid())
);

-- Users can update co-brokers within their tenant (Soft delete is an UPDATE)
CREATE POLICY "update_co_brokers" ON public.co_brokers
FOR UPDATE TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = auth.uid())
)
WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = auth.uid())
);

-- Hard DELETE restricted to ADMIN
CREATE POLICY "hard_delete_co_brokers" ON public.co_brokers
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_members 
    WHERE profile_id = auth.uid() AND role = 'ADMIN'
  )
);

-- 4. Ensure soft delete column and index
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'co_brokers' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.co_brokers ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_co_brokers_deleted_at ON public.co_brokers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_co_brokers_tenant_id ON public.co_brokers(tenant_id);

-- 5. Co-Broker Documents Metadata Table
CREATE TABLE IF NOT EXISTS public.co_broker_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co_broker_id UUID NOT NULL REFERENCES public.co_brokers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.co_broker_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_documents" ON public.co_broker_documents
FOR SELECT TO authenticated
USING (tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = auth.uid()));

CREATE POLICY "manage_documents" ON public.co_broker_documents
FOR ALL TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM public.tenant_members WHERE profile_id = auth.uid())
  AND EXISTS (SELECT 1 FROM public.tenant_members WHERE profile_id = auth.uid() AND role IN ('ADMIN', 'MANAGER'))
);
