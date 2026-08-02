-- Seed Airport category into ref_master_data for nearby place categories
INSERT INTO public.ref_master_data (type, code, label, is_active, sort_order, metadata) VALUES
('NEARBY_PLACE_CATEGORY', 'Airport', '{"th": "สนามบิน", "en": "Airport", "cn": "机场", "ru": "Аэропорт"}', true, 45, '{}')
ON CONFLICT (type, code) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
