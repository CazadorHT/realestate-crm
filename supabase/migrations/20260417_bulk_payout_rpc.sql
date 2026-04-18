-- RPC for Bulk Commission Status Updates
-- Performance-optimized for handling 50-100+ records in a single transaction

CREATE OR REPLACE FUNCTION public.bulk_mark_commissions_as_ready_to_pay(
    p_commission_ids UUID[],
    p_tenant_id UUID,
    p_user_id UUID,
    p_user_full_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INTEGER;
    v_log_metadata JSONB;
BEGIN
    -- 1. Perform the update
    UPDATE public.deal_commissions
    SET 
        status = 'READY_TO_PAY',
        updated_at = NOW()
    WHERE 
        id = ANY(p_commission_ids)
        AND tenant_id = p_tenant_id
        AND status = 'UNPAID'; -- Only unpaid ones can be set to ready

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- 2. Bulk Log to Audit (One entry for the whole action or per record?)
    -- Enterprise requirement usually prefers clear trail. 
    -- We can log one summary entry for the batch to save space, 
    -- but reference the count and the user.
    
    INSERT INTO public.audit_logs (
        tenant_id,
        user_id,
        action,
        entity,
        summary,
        metadata,
        created_at
    )
    VALUES (
        p_tenant_id,
        p_user_id,
        'finance.bulk_commission_ready',
        'deal_commissions',
        'อนุมัติรอจ่ายแบบกลุ่มจำนวน ' || v_updated_count || ' รายการ โดยคุณ ' || p_user_full_name,
        jsonb_build_object(
            'commission_ids', p_commission_ids,
            'updated_count', v_updated_count,
            'user_full_name', p_user_full_name
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'updated_count', v_updated_count
    );
END;
$$;
