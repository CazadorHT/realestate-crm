
-- 🇷🇺 CRM Hardening: Update Russian (RU) Translations for Amenities/Features
-- Target Table: public.features

BEGIN;

-- 1. Air Conditioning
UPDATE public.features SET name_ru = 'Кондиционер' WHERE name_en = 'Air Conditioning' OR name = 'เครื่องปรับอากาศ';

-- 2. Bare Shell
UPDATE public.features SET name_ru = 'Черновая отделка' WHERE name_en = 'Bare Shell';

-- 3. Fully Furnished
UPDATE public.features SET name_ru = 'Полная меблировка' WHERE name_en = 'Fully Furnished' OR name = 'เฟอร์ครบ';

-- 4. Smart Home System
UPDATE public.features SET name_ru = 'Система «Умный дом»' WHERE name_en = 'Smart Home System' OR name = 'ระบบบ้านอัจฉริยะ';

-- 5. Walk-in Closet (Interior/Residential)
UPDATE public.features SET name_ru = 'Гардеробная' WHERE name_en = 'Walk-in Closet' OR name LIKE '%ห้องแต่งตัว%';

-- 6. Keycard Access
UPDATE public.features SET name_ru = 'Доступ по карте' WHERE name_en = 'Keycard Access' OR name = 'เข้า-ออก คีย์การ์ด';

-- 7. Digital Door Lock
UPDATE public.features SET name_ru = 'Электронный замок' WHERE name_en = 'Digital Door Lock' OR name LIKE '%ล็อคประตูแบบดิจิทัล%';

-- 8. CCTV
UPDATE public.features SET name_ru = 'Видеонаблюдение' WHERE name_en = 'CCTV' OR name LIKE '%กล้องวงจรปิด%';

-- 9. 24/7 Security
UPDATE public.features SET name_ru = 'Круглосуточная охрана' WHERE name_en = '24/7 Security' OR name LIKE '%รักษาความปลอดภัยตลอด 24 ชั่วโมง%';

-- 10. Shuttle Bus
UPDATE public.features SET name_ru = 'Трансфер (Шаттл)' WHERE name_en = 'Shuttle Bus' OR name = 'รถรับส่ง';

-- 11. Laundry service
UPDATE public.features SET name_ru = 'Услуги прачечной' WHERE name_en = 'Laundry service' OR name LIKE '%บริการซักรีด%';

-- 12. Solar Cell
UPDATE public.features SET name_ru = 'Солнечные панели' WHERE name_en = 'Solar Cell' OR name LIKE '%โซลาร์เซลล์%';

-- 13. Playground
UPDATE public.features SET name_ru = 'Детская площадка' WHERE name_en = 'Playground' OR name = 'สนามเด็กเล่น';

-- 14. Kids Room
UPDATE public.features SET name_ru = 'Детская игровая комната' WHERE name_en = 'Kids Room' OR name = 'ห้องเด็กเล่น';

COMMIT;
