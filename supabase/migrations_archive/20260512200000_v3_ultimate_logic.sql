-- ====================================================================
-- 🧠 V3 Ultimate Enterprise Architecture (Phase 8: Logic & RPCs)
-- ====================================================================

-- ==========================================
-- 1. UTILITY TRIGGERS (Auto Updated_At)
-- ==========================================
-- ฟังก์ชันกลางสำหรับอัปเดต timestamp อัตโนมัติเวลาที่มีการ UPDATE แถวในตาราง
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ตัวอย่างการผูก Trigger เข้ากับตาราง V3 (เช่น Identities)
DROP TRIGGER IF EXISTS trg_set_updated_at_identities ON public.identities_v3;
CREATE TRIGGER trg_set_updated_at_identities
BEFORE UPDATE ON public.identities_v3
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==========================================
-- 2. ENTERPRISE AI MATCHING (RPC)
-- ==========================================
-- ฟังก์ชันสำหรับหาบ้านที่ตรงกับความต้องการลูกค้า (Semantic Search)
-- โดยดึง Vector จาก properties_ai (Cold) แล้วมาจอยกับ properties_core (Hot)
CREATE OR REPLACE FUNCTION public.match_properties_v3(
    query_embedding vector(1536),
    match_threshold float,
    match_count int,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE (
    property_id uuid,
    tenant_id uuid,
    status text,
    price numeric,
    bedrooms int,
    similarity float
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as property_id,
        c.tenant_id,
        c.status,
        c.sale_price as price,
        c.bedrooms,
        1 - (ai.vector <=> query_embedding) AS similarity
    FROM public.properties_ai ai
    JOIN public.properties_core c ON c.id = ai.property_id
    WHERE 
        (p_tenant_id IS NULL OR c.tenant_id = p_tenant_id)
        AND c.status = 'AVAILABLE'
        AND 1 - (ai.vector <=> query_embedding) > match_threshold
    ORDER BY ai.vector <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.match_properties_v3(vector, float, int, uuid) FROM PUBLIC, anon, authenticated;

-- ==========================================
-- 3. FINANCIAL CALCULATIONS (RPC)
-- ==========================================
-- ฟังก์ชันคำนวณค่าคอมมิชชันสุทธิ หัก ณ ที่จ่าย และ VAT (เรียกใช้ก่อนลง Financial Ledger)
CREATE OR REPLACE FUNCTION public.calculate_net_commission_v3(
    p_amount numeric,
    p_tax_rate numeric DEFAULT 3, -- หัก ณ ที่จ่าย (WHT) 3%
    p_vat_rate numeric DEFAULT 0  -- VAT 7% (ถ้ามี)
)
RETURNS TABLE (
    gross_amount numeric,
    wht_amount numeric,
    vat_amount numeric,
    net_amount numeric
) AS $$
BEGIN
    RETURN QUERY SELECT 
        p_amount AS gross_amount,
        (p_amount * p_tax_rate / 100) AS wht_amount,
        (p_amount * p_vat_rate / 100) AS vat_amount,
        (p_amount + (p_amount * p_vat_rate / 100) - (p_amount * p_tax_rate / 100)) AS net_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = '';

-- ==========================================
-- 4. SOFT DELETE & AUDIT LOGGING (Trigger)
-- ==========================================
-- ฟังก์ชันสำหรับดักจับการลบ/แก้ไขข้อมูลสำคัญ แล้วเก็บลง Audit Logs
CREATE OR REPLACE FUNCTION public.fn_audit_log_changes_v3()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id uuid;
BEGIN
    -- พยายามดึง actor_id จาก session ถ้าดึงผ่าน Supabase Auth API
    BEGIN
        v_actor_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_actor_id := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.system_audit_logs_v3 (tenant_id, actor_id, action, entity_table, entity_id, old_data)
        VALUES (OLD.tenant_id, v_actor_id, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.system_audit_logs_v3 (tenant_id, actor_id, action, entity_table, entity_id, old_data, new_data)
        VALUES (NEW.tenant_id, v_actor_id, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.fn_audit_log_changes_v3() FROM PUBLIC, anon, authenticated;

-- นำ Trigger ไปผูกกับตารางสำคัญ เช่น Ledger เพื่อกันการโกง
DROP TRIGGER IF EXISTS trg_audit_ledger ON public.financial_ledger_v3;
CREATE TRIGGER trg_audit_ledger
AFTER UPDATE OR DELETE ON public.financial_ledger_v3
FOR EACH ROW EXECUTE PROCEDURE public.fn_audit_log_changes_v3();
