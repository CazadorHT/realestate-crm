-- ==========================================
-- 🪵 RESTORE LOG_SYSTEM_ACTIVITY RPC
-- Target: Fix 404 error when logging system activity
-- ==========================================

CREATE OR REPLACE FUNCTION public.log_system_activity(
    p_action TEXT,
    p_email TEXT DEFAULT NULL,
    p_entity TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.system_audit_logs_v3 (
        action,
        entity_table,
        entity_id,
        new_data,
        actor_id,
        tenant_id
    )
    VALUES (
        p_action,
        COALESCE(p_entity, 'unknown'),
        p_entity_id,
        p_metadata || jsonb_build_object('email', p_email),
        auth.uid(),
        (SELECT tenant_id FROM public.tenant_members_v3 WHERE identity_id = auth.uid() LIMIT 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION public.log_system_activity TO authenticated, service_role, anon;
