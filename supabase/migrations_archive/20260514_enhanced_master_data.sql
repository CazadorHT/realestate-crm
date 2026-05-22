-- ==========================================
-- 🚄 Migration: Enhanced Master Data with Metadata & Colors
-- ==========================================

-- 1. เพิ่มคอลัมน์ metadata (ถ้ายังไม่มี)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ref_master_data' AND column_name='metadata') THEN
        ALTER TABLE public.ref_master_data ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. อัปเดตข้อมูลรถไฟฟ้าพร้อมระบุสี (Hex Color)
DELETE FROM public.ref_master_data WHERE type = 'TRANSIT_TYPE';

INSERT INTO public.ref_master_data (type, code, label, sort_order, is_active, metadata)
VALUES 
  ('TRANSIT_TYPE', 'BTS', '{"th": "รถไฟฟ้า BTS (สายสีเขียว)", "en": "BTS Skytrain", "cn": "曼谷大眾運輸系統", "ru": "BTS Skytrain"}', 10, true, '{"color": "#129e00", "bg_color": "bg-green-500"}'),
  ('TRANSIT_TYPE', 'MRT', '{"th": "รถไฟฟ้า MRT (สายสีน้ำเงิน)", "en": "MRT Blue Line", "cn": "曼谷地鐵藍線", "ru": "MRT Blue Line"}', 20, true, '{"color": "#004099", "bg_color": "bg-blue-600"}'),
  ('TRANSIT_TYPE', 'MRT_PURPLE', '{"th": "รถไฟฟ้า MRT (สายสีม่วง)", "en": "MRT Purple Line", "cn": "曼谷地鐵紫線", "ru": "MRT Purple Line"}', 30, true, '{"color": "#7e2e8a", "bg_color": "bg-purple-600"}'),
  ('TRANSIT_TYPE', 'MRT_YELLOW', '{"th": "รถไฟฟ้า MRT (สายสีเหลือง)", "en": "MRT Yellow Line", "cn": "曼谷地鐵黃線", "ru": "MRT Yellow Line"}', 40, true, '{"color": "#ffc107", "bg_color": "bg-yellow-400"}'),
  ('TRANSIT_TYPE', 'MRT_PINK', '{"th": "รถไฟฟ้า MRT (สายสีชมพู)", "en": "MRT Pink Line", "cn": "曼谷地鐵粉紅線", "ru": "MRT Pink Line"}', 50, true, '{"color": "#f06292", "bg_color": "bg-pink-400"}'),
  ('TRANSIT_TYPE', 'ARL', '{"th": "Airport Rail Link", "en": "Airport Rail Link", "cn": "機場快線", "ru": "Airport Rail Link"}', 60, true, '{"color": "#800000", "bg_color": "bg-red-900"}'),
  ('TRANSIT_TYPE', 'SRT_RED', '{"th": "รถไฟฟ้าสายสีแดง", "en": "SRT Red Line", "cn": "泰國國家鐵路紅線", "ru": "SRT Red Line"}', 70, true, '{"color": "#c62828", "bg_color": "bg-red-600"}'),
  ('TRANSIT_TYPE', 'GOLD', '{"th": "รถไฟฟ้าสายสีทอง", "en": "Gold Line", "cn": "金線", "ru": "Gold Line"}', 80, true, '{"color": "#d4af37", "bg_color": "bg-amber-600"}'),
  ('TRANSIT_TYPE', 'BRT', '{"th": "รถโดยสารด่วนพิเศษ BRT", "en": "BRT Bus", "cn": "快速公交系統", "ru": "BRT Bus"}', 90, true, '{"color": "#fbc02d", "bg_color": "bg-yellow-600"}'),
  ('TRANSIT_TYPE', 'OTHER', '{"th": "อื่นๆ", "en": "Other", "cn": "其他", "ru": "Другое"}', 999, true, '{"color": "#64748b", "bg_color": "bg-slate-500"}');

COMMENT ON COLUMN public.ref_master_data.metadata IS 'Extended properties: {"color":"#hex", "icon":"lucide-key", ...}';
