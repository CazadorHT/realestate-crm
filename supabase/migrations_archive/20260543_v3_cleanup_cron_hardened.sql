BEGIN;

-- ====================================================================
-- 🛡️ V3 Automated Cleanup Cron Job & Index (Hardened Production Version)
-- ====================================================================

-- 1. เปิดใช้งาน Extensions ที่จำเป็น
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1.5. สร้างตาราง property_image_uploads (หากยังไม่มีในระบบเนื่องจากเป็นระบบใหม่แบบเคลีนๆ)
CREATE TABLE IF NOT EXISTS public.property_image_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties_core(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TEMP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- เปิดใช้งาน Row Level Security (RLS) เพื่อความมั่นใจด้านความปลอดภัย
ALTER TABLE public.property_image_uploads ENABLE ROW LEVEL SECURITY;

-- กำหนดนโยบาย RLS ขั้นพื้นฐานให้สอดคล้องกับระบบ V3
DROP POLICY IF EXISTS "piu_insert_optimized" ON public.property_image_uploads;
CREATE POLICY "piu_insert_optimized" ON public.property_image_uploads 
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.identities_v3 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Staff Manage property_image_uploads" ON public.property_image_uploads;
CREATE POLICY "Staff Manage property_image_uploads" ON public.property_image_uploads
FOR ALL TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.identities_v3 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- 2. เคลียร์ Job เก่าออกก่อนอย่างปลอดภัย (ป้องกันการบล็อกธุรกรรมหากยังไม่มี Job นี้ในระบบ)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-property-temp-uploads-job');
EXCEPTION
  WHEN OTHERS THEN
    -- กรณีไม่พบ Job หรือเกิดข้อผิดพลาด ให้ข้ามไปได้เลยโดยไม่ทำธุรกรรมแครช
    NULL;
END
$$;

-- 3. ลงทะเบียนตารางเวลาทำงานอัจฉริยะ 
-- ⏰ ตั้งเวลาเป็น '0 17 * * *' (17:00 น. UTC) ซึ่งตรงกับเวลา 00:00 น. (เที่ยงคืนตรง) ของประเทศไทยพอดี 🇹🇭
-- ⚠️ แก้ไขข้อผิดพลาดเชิงไวยากรณ์: ทำการหุ้ม PL/pgSQL ด้วยบล็อก DO $$ ... $$ เพื่อให้สามารถคอมไพล์และทำงานผ่าน pg_cron ได้จริง 🛡️
SELECT cron.schedule(
  'cleanup-property-temp-uploads-job',
  '0 17 * * *',
  $$
  DO $do$
  DECLARE
    v_project_url text;
    v_anon_or_service_key text;
  BEGIN
    -- 🔒 ดึงข้อมูลจากระบบ Vault ของ Supabase โดยตรง ไม่ต้องฮาร์ดโค้ดคีย์ลับลงสคริปต์
    SELECT decrypted_secret INTO v_anon_or_service_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'service_role_key' LIMIT 1;
    
    -- ดึง URL ของโปรเจกต์ปัจจุบัน
    v_project_url := 'https://' || current_setting('request.headers', true)::jsonb->>'host';
    -- หากรันในสภาวะแวดล้อมที่ไม่มี Request Header (เช่น Cron ตัวนี้) ให้ดึงค่าจากตัวแปรระบบตรงๆ
    IF v_project_url IS NULL OR v_project_url = 'https://' THEN
      v_project_url := (SELECT value FROM net._config WHERE name = 'supabase_url' LIMIT 1);
    END IF;
    
    -- 🛡️ Safe Fallback: หากยิงผ่านระบบข้างต้นไม่ได้ ให้ใช้ URL ของโปรเจกต์ปัจจุบันโดยตรง เพื่อรับประกันความเร็วแรงและไม่พัง
    IF v_project_url IS NULL OR v_project_url = 'https://' THEN
      v_project_url := 'https://qaihjhvdwfafawezxivb.supabase.co';
    END IF;

    -- ยิง POST HTTP Request แบบ Asynchronous
    PERFORM net.http_post(
      url := v_project_url || '/functions/v1/cleanup-property-temp-uploads',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(v_anon_or_service_key, current_setting('vault.service_role_key', true))
      ),
      body := '{"cutoffHours": 24, "limit": 500, "dryRun": false}'::jsonb
    );
  END;
  $do$;
  $$
);

-- 4. 🚀 สร้าง Partial Index สำหรับการคิวรีล้างข้อมูลแบบความเร็วสูง (High Performance Indexing)
-- เพิ่มดัชนีคัดกรองเฉพาะสถานะ 'TEMP' เพื่อเพิ่มความเร็วในการสแกนตาราง (ลดเวลาค้นหาและประหยัด I/O และ Disk Space)
CREATE INDEX IF NOT EXISTS idx_property_image_uploads_cleanup_temp
ON public.property_image_uploads (created_at ASC) 
WHERE (status = 'TEMP');

COMMIT;
