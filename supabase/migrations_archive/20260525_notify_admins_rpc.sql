-- 1. Create Internal Schema for secure functions
CREATE SCHEMA IF NOT EXISTS internal;

-- 2. Create a secure RPC to notify admins of new signups
-- Moved to internal schema to hide from public PostgREST API
CREATE OR REPLACE FUNCTION internal.notify_admins_of_signup(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with postgres permissions to bypass RLS
SET search_path = public, pg_temp -- Prevent Search Path Hijacking
AS $$
BEGIN
    -- Insert notifications for all users with ADMIN role
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT id, 'SYSTEM', 'สมาชิกใหม่สมัครใช้งาน', 'มีผู้ใช้งานใหม่สมัครเข้าใช้งานระบบ: ' || p_email, '/protected/users'
    FROM public.profiles
    WHERE role = 'ADMIN';
END;
$$;

-- 3. Create a secure RPC to notify admins of new leads
CREATE OR REPLACE FUNCTION internal.notify_admins_of_lead(p_name TEXT, p_subject TEXT, p_lead_id UUID, p_is_hot BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT id, 
           CASE WHEN p_is_hot THEN 'WARNING' ELSE 'INFO' END, 
           CASE WHEN p_is_hot THEN '🔥 Hot Lead ติดต่อเข้ามา!' ELSE 'มีคนติดต่อผ่านเว็บไซต์' END, 
           p_name || ' สนใจเรื่อง ' || p_subject, 
           '/protected/leads/' || p_lead_id::TEXT
    FROM public.profiles
    WHERE role = 'ADMIN';
END;
$$;

-- 4. Strict Permissions Lockdown
-- Revoke all permissions from public/authenticated to ensure PostgREST cannot call them
REVOKE ALL ON FUNCTION internal.notify_admins_of_signup(TEXT) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION internal.notify_admins_of_lead(TEXT, TEXT, UUID, BOOLEAN) FROM public, anon, authenticated;

-- Only Service Role (used by our Server Actions) can execute
GRANT EXECUTE ON FUNCTION internal.notify_admins_of_signup(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION internal.notify_admins_of_lead(TEXT, TEXT, UUID, BOOLEAN) TO service_role;
