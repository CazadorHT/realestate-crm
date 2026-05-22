-- ==========================================
-- 🚄 Migration: Dynamic Transit Types (V3)
-- ==========================================

-- 1. ล้างข้อมูลเก่า (ถ้ามี) เพื่อความสะอาด
DELETE FROM public.ref_master_data WHERE type = 'TRANSIT_TYPE';

-- 2. เพิ่มข้อมูลรถไฟฟ้าสายต่างๆ
INSERT INTO public.ref_master_data (type, code, label, sort_order, is_active)
VALUES 
  ('TRANSIT_TYPE', 'BTS', '{"th": "รถไฟฟ้า BTS (สายสีเขียว)", "en": "BTS Skytrain", "cn": "曼谷大眾運輸系統", "ru": "BTS Skytrain"}', 10, true),
  ('TRANSIT_TYPE', 'MRT', '{"th": "รถไฟฟ้า MRT (สายสีน้ำเงิน)", "en": "MRT Blue Line", "cn": "曼谷地鐵藍線", "ru": "MRT Blue Line"}', 20, true),
  ('TRANSIT_TYPE', 'MRT_PURPLE', '{"th": "รถไฟฟ้า MRT (สายสีม่วง)", "en": "MRT Purple Line", "cn": "曼谷地鐵紫線", "ru": "MRT Purple Line"}', 30, true),
  ('TRANSIT_TYPE', 'MRT_YELLOW', '{"th": "รถไฟฟ้า MRT (สายสีเหลือง)", "en": "MRT Yellow Line", "cn": "曼谷地鐵黃線", "ru": "MRT Yellow Line"}', 40, true),
  ('TRANSIT_TYPE', 'MRT_PINK', '{"th": "รถไฟฟ้า MRT (สายสีชมพู)", "en": "MRT Pink Line", "cn": "曼谷地鐵粉紅線", "ru": "MRT Pink Line"}', 50, true),
  ('TRANSIT_TYPE', 'ARL', '{"th": "Airport Rail Link", "en": "Airport Rail Link", "cn": "機場แลกเปลี่ยน", "ru": "Airport Rail Link"}', 60, true),
  ('TRANSIT_TYPE', 'SRT_RED', '{"th": "รถไฟฟ้าสายสีแดง", "en": "SRT Red Line", "cn": "泰國國家鐵路紅線", "ru": "SRT Red Line"}', 70, true),
  ('TRANSIT_TYPE', 'GOLD', '{"th": "รถไฟฟ้าสายสีทอง", "en": "Gold Line", "cn": "金線", "ru": "Gold Line"}', 80, true),
  ('TRANSIT_TYPE', 'BRT', '{"th": "รถโดยสารด่วนพิเศษ BRT", "en": "BRT Bus", "cn": "快速公交系統", "ru": "BRT Bus"}', 90, true),
  ('TRANSIT_TYPE', 'OTHER', '{"th": "อื่นๆ", "en": "Other", "cn": "其他", "ru": "Другое"}', 999, true);

COMMENT ON COLUMN public.ref_master_data.label IS 'Multilingual label: {"th":"...","en":"...","cn":"...","ru":"..."}';
