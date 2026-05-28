-- Migration: Add RLS Select Policy for system_task_queue
-- This allows clients/realtime listeners to safely fetch and receive updates on tasks they own or belong to their tenant.

DROP POLICY IF EXISTS "Tenant/User select: system_task_queue" ON public.system_task_queue;

CREATE POLICY "Tenant/User select: system_task_queue" ON public.system_task_queue
FOR SELECT
TO authenticated
USING (
  public.is_system_admin() OR
  (payload->>'user_id' = auth.uid()::text) OR
  (payload->>'tenant_id' IS NOT NULL AND public.is_tenant_member((payload->>'tenant_id')::uuid))
);
