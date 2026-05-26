-- Seed default transit types into ref_master_data
-- This aligns the admin master data list with the property form dropdown options

INSERT INTO public.ref_master_data (type, code, label, is_active, sort_order, metadata) VALUES
('TRANSIT_TYPE', 'BTS', '{"th": "รถไฟฟ้า BTS (สายสีเขียว)", "en": "BTS Skytrain", "cn": "曼谷大众运输系统 (BTS)", "ru": "Надземное метро BTS"}', true, 10, '{"color": "#22c55e"}'),
('TRANSIT_TYPE', 'MRT', '{"th": "รถไฟฟ้า MRT (สายสีน้ำเงิน)", "en": "MRT Blue Line", "cn": "曼谷地铁蓝线", "ru": "Метро MRT (Синяя линия)"}', true, 20, '{"color": "#3b82f6"}'),
('TRANSIT_TYPE', 'MRT_PURPLE', '{"th": "รถไฟฟ้า MRT (สายสีม่วง)", "en": "MRT Purple Line", "cn": "曼谷地铁紫线", "ru": "Метро MRT (Фиолетовая линия)"}', true, 30, '{"color": "#a855f7"}'),
('TRANSIT_TYPE', 'MRT_YELLOW', '{"th": "รถไฟฟ้า MRT (สายสีเหลือง)", "en": "MRT Yellow Line", "cn": "曼谷地铁黄线", "ru": "Метро MRT (Желтая линия)"}', true, 40, '{"color": "#eab308"}'),
('TRANSIT_TYPE', 'MRT_PINK', '{"th": "รถไฟฟ้า MRT (สายสีชมพู)", "en": "MRT Pink Line", "cn": "曼谷地铁粉红线", "ru": "Метро MRT (Розовая линия)"}', true, 50, '{"color": "#ec4899"}'),
('TRANSIT_TYPE', 'ARL', '{"th": "Airport Rail Link", "en": "Airport Rail Link", "cn": "机场快铁 (ARL)", "ru": "Аэроэкспресс ARL"}', true, 60, '{"color": "#ef4444"}'),
('TRANSIT_TYPE', 'SRT_RED', '{"th": "รถไฟฟ้าสายสีแดง", "en": "SRT Red Line", "cn": "泰国国家铁路红线", "ru": "Красная линия SRT"}', true, 70, '{"color": "#f43f5e"}'),
('TRANSIT_TYPE', 'GOLD', '{"th": "รถไฟฟ้าสายสีทอง", "en": "Gold Line", "cn": "金线", "ru": "Золотая линия"}', true, 80, '{"color": "#d97706"}'),
('TRANSIT_TYPE', 'BRT', '{"th": "รถโดยสารด่วนพิเศษ BRT", "en": "BRT Bus", "cn": "快速公交系统 BRT", "ru": "Автобус BRT"}', true, 90, '{"color": "#06b6d4"}'),
('TRANSIT_TYPE', 'EXPRESSWAY', '{"th": "จุดขึ้นลงทางด่วน", "en": "Expressway Connection", "cn": "高速公路", "ru": "Шоссе"}', true, 100, '{"color": "#f97316"}'),
('TRANSIT_TYPE', 'MAIN_ROAD', '{"th": "ถนนหลัก", "en": "Main Road", "cn": "主干道", "ru": "Главная дорога"}', true, 110, '{"color": "#8b5cf6"}'),
('TRANSIT_TYPE', 'OTHER', '{"th": "อื่นๆ", "en": "Other", "cn": "其他", "ru": "Другое"}', true, 999, '{"color": "#64748b"}')
ON CONFLICT (type, code) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = COALESCE(ref_master_data.metadata, '{}'::jsonb) || EXCLUDED.metadata;
