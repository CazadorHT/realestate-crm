-- Migration: Migrate Services to V3 Core and Cleanup Legacy
-- Created: 2026-05-15

-- 1. ลบตาราง Legacy เดิมทิ้ง (ตามคำสั่งผู้ใช้: ไม่มีข้อมูลค้างอยู่)
DROP TABLE IF EXISTS services CASCADE;

-- 2. สร้าง/อัปเดตฟังก์ชันนับยอด View (RPC) ให้ทำงานกับตาราง V3 Core (cms_content_v3)
-- ฟังก์ชันนี้จะทำการบันทึกยอด View ลงใน meta_data JSONB field
CREATE OR REPLACE FUNCTION increment_service_view(
    p_service_id UUID, 
    p_user_id UUID DEFAULT NULL, 
    p_ip_hash TEXT DEFAULT NULL, 
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE cms_content_v3
    SET meta_data = jsonb_set(
        COALESCE(meta_data, '{}'::jsonb),
        '{view_count}',
        (COALESCE((meta_data->>'view_count')::int, 0) + 1)::text::jsonb
    )
    WHERE id = p_service_id
    AND content_type = 'service';

    -- หมายเหตุ: สามารถเพิ่มการบันทึก Traffic Logs ลงในตาราง activity_timeline_v3 ได้ที่นี่ในอนาคต
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ตรวจสอบและเพิ่ม Index สำหรับ content_type เพื่อความเร็วในการ Query (ถ้ายังไม่มี)
CREATE INDEX IF NOT EXISTS idx_cms_content_v3_content_type ON cms_content_v3(content_type);
CREATE INDEX IF NOT EXISTS idx_cms_content_v3_tenant_id ON cms_content_v3(tenant_id);
