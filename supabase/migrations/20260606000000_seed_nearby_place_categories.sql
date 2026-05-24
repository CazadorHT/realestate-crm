-- Seed default nearby place categories into ref_master_data
-- This aligns the admin master data list with the property form dropdown options

INSERT INTO public.ref_master_data (type, code, label, is_active, sort_order, metadata) VALUES
('NEARBY_PLACE_CATEGORY', 'School', '{"th": "โรงเรียน / มหาวิทยาลัย", "en": "School / University", "cn": "学校 / 大学", "ru": "Школа / Университет"}', true, 10, '{}'),
('NEARBY_PLACE_CATEGORY', 'Mall', '{"th": "ห้างสรรพสินค้า / ตลาด", "en": "Mall / Market", "cn": "商场 / 市场", "ru": "Торговый centro / Рынок"}', true, 20, '{}'),
('NEARBY_PLACE_CATEGORY', 'Hospital', '{"th": "โรงพยาบาล", "en": "Hospital", "cn": "医院", "ru": "Больница"}', true, 30, '{}'),
('NEARBY_PLACE_CATEGORY', 'Transport', '{"th": "ทางด่วน / การเดินทาง", "en": "Expressway / Transport", "cn": "高速公路 / 交通", "ru": "Шоссе / Транспорт"}', true, 40, '{}'),
('NEARBY_PLACE_CATEGORY', 'Park', '{"th": "สวนสาธารณะ", "en": "Park", "cn": "公园", "ru": "Парк"}', true, 50, '{}'),
('NEARBY_PLACE_CATEGORY', 'Office', '{"th": "สถานที่ทำงาน", "en": "Office", "cn": "写字楼", "ru": "Офис"}', true, 60, '{}'),
('NEARBY_PLACE_CATEGORY', 'Other', '{"th": "อื่นๆ", "en": "Other", "cn": "其他", "ru": "Другое"}', true, 999, '{}')
ON CONFLICT (type, code) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
