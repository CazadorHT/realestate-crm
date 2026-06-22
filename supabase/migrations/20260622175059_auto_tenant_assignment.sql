-- Auto-assign default tenant if user has no tenant membership when approved
CREATE OR REPLACE FUNCTION "public"."v3_approve_identity"("target_user_id" "uuid", "new_role" "text", "actor_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- 1. หา Tenant ID ของผู้ใช้งาน
    SELECT tenant_id INTO v_tenant_id 
    FROM public.tenant_members_v3 
    WHERE identity_id = target_user_id 
    LIMIT 1;

    -- 2. หากยังไม่มีการกำหนด Tenant (สมัครเข้ามาใหม่) ให้กำหนดเป็น Default Tenant แรกที่มีในระบบ
    IF v_tenant_id IS NULL THEN
        SELECT id INTO v_tenant_id 
        FROM public.tenants_v3 
        ORDER BY created_at ASC 
        LIMIT 1;

        IF v_tenant_id IS NOT NULL THEN
            INSERT INTO public.tenant_members_v3 (identity_id, tenant_id, role, joined_at)
            VALUES (target_user_id, v_tenant_id, new_role, NOW())
            ON CONFLICT (identity_id, tenant_id) DO NOTHING;
        END IF;
    END IF;

    -- 3. อัปเดตบทบาทและ tenant_id ใน identities_v3
    UPDATE public.identities_v3
    SET role = new_role,
        tenant_id = COALESCE(tenant_id, v_tenant_id),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- 4. บันทึก Audit Log
    INSERT INTO public.system_audit_logs_v3 (
        action,
        entity_table,
        entity_id,
        new_data,
        tenant_id,
        actor_id
    ) VALUES (
        'ADMIN_APPROVE_USER',
        'identities_v3',
        target_user_id,
        jsonb_build_object(
            'new_role', new_role, 
            'method', 'ONE_CLICK_RPC_V3',
            'auto_assigned_tenant', true
        ),
        v_tenant_id,
        actor_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'tenant_id', v_tenant_id
    );
END;
$$;
