BEGIN;

-- 1. สร้าง Schema สำหรับระบบความปลอดภัยภายใน
CREATE SCHEMA IF NOT EXISTS security;

-- 2. สร้างตารางเก็บประวัติการใช้งาน (Rate Limit Tracking)
CREATE TABLE IF NOT EXISTS security.rate_limit_buckets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier text NOT NULL, -- เช่น user_id หรือ ip_address
    action_key text NOT NULL, -- เช่น 'send_omni_message', 'auth_attempt'
    request_count int DEFAULT 1,
    last_request timestamptz DEFAULT now(),
    UNIQUE(identifier, action_key)
);

-- สร้าง Index เพื่อความเร็วในการค้นหา
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON security.rate_limit_buckets(identifier, action_key);

-- 3. ฟังก์ชันตรวจสอบ Rate Limit
CREATE OR REPLACE FUNCTION security.check_rate_limit(
    p_identifier text,
    p_action_key text,
    p_max_requests int,
    p_window_interval interval
)
RETURNS boolean AS $$
DECLARE
    v_count int;
    v_last timestamptz;
BEGIN
    -- ทำความสะอาดข้อมูลเก่า (Optional: ใน Production ควรใช้ Cron Job แทน)
    -- DELETE FROM security.rate_limit_buckets WHERE last_request < now() - p_window_interval;

    INSERT INTO security.rate_limit_buckets (identifier, action_key, request_count, last_request)
    VALUES (p_identifier, p_action_key, 1, now())
    ON CONFLICT (identifier, action_key) DO UPDATE
    SET 
        request_count = CASE 
            WHEN security.rate_limit_buckets.last_request < now() - p_window_interval THEN 1 
            ELSE security.rate_limit_buckets.request_count + 1 
        END,
        last_request = now()
    RETURNING request_count INTO v_count;

    IF v_count > p_max_requests THEN
        RAISE EXCEPTION 'Rate limit exceeded for action: %. Please try again later.', p_action_key
            USING ERRCODE = '42900'; -- Custom SQL State for Too Many Requests
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, security;

-- 4. ติดตั้ง Trigger บนตาราง omni_messages
CREATE OR REPLACE FUNCTION public.trg_omni_messages_rate_limit()
RETURNS trigger AS $$
BEGIN
    -- จำกัด 5 ข้อความต่อ 1 นาที ต่อ User
    PERFORM security.check_rate_limit(
        (SELECT auth.uid())::text, 
        'send_omni_message', 
        5, 
        interval '1 minute'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_omni_messages_rate_limit_enforce ON public.omni_messages;
CREATE TRIGGER trg_omni_messages_rate_limit_enforce
    BEFORE INSERT ON public.omni_messages
    FOR EACH ROW EXECUTE FUNCTION public.trg_omni_messages_rate_limit();

COMMIT;
