-- 🔧 Fix: v3_approve_identity ต้อง set is_active = true ด้วย
-- Problem: เดิม RPC อัปเดตแค่ role และ tenant_id แต่ไม่ได้ set is_active = true
-- ทำให้ agent ที่อนุมัติผ่าน LINE One-Click ยังติดอยู่หน้า /auth/pending

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
            -- 🏢 ค้นหา Team/Branch ตั้งต้นของ Tenant นี้เพื่อเอามาผูกให้กับ User ใหม่
            DECLARE
                v_team_id UUID;
            BEGIN
                SELECT id INTO v_team_id
                FROM public.teams_v3
                WHERE tenant_id = v_tenant_id
                ORDER BY created_at ASC
                LIMIT 1;

                INSERT INTO public.tenant_members_v3 (identity_id, tenant_id, role, team_id, joined_at)
                VALUES (target_user_id, v_tenant_id, new_role, v_team_id, NOW())
                ON CONFLICT (identity_id, tenant_id) DO NOTHING;
            END;
        END IF;
    END IF;

    -- 3. อัปเดตบทบาท, tenant_id และ is_active ใน identities_v3
    UPDATE public.identities_v3
    SET role = new_role,
        tenant_id = COALESCE(tenant_id, v_tenant_id),
        is_active = true,  -- ✅ FIX: ต้อง set is_active = true เพื่อให้ผ่านหน้า pending
        updated_at = NOW()
    WHERE id = target_user_id;

    -- 4. Sync is_active = true ไปที่ profiles ด้วย (หน้า pending เช็คจาก profiles)
    UPDATE public.profiles
    SET role = new_role,
        is_active = true,  -- ✅ FIX: pending page เช็คจาก profiles.is_active
        updated_at = NOW()
    WHERE id = target_user_id;

    -- 5. บันทึก Audit Log
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
            'auto_assigned_tenant', true,
            'is_active', true
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
