-- =========================================================================
-- PHUKET POPULAR AREAS & FLAGSHIP PROJECTS SEED MIGRATION
-- Migration: 20260909130000_seed_phuket_popular_areas_and_projects.sql
-- =========================================================================

-- 1. เพิ่ม/อัปเดตย่านยอดนิยมในภูเก็ต (popular_areas_v3)
INSERT INTO public.popular_areas_v3 (
    slug,
    province,
    name,
    description,
    seo_title,
    seo_description,
    image_url,
    is_active,
    featured,
    sort_order,
    updated_at
) VALUES 
(
    'bang-tao',
    'ภูเก็ต',
    '{"th": "บางเทา", "en": "Bang Tao", "cn": "邦涛", "ru": "Банг Тао", "default": "บางเทา"}'::jsonb,
    '{"th": "ย่านลักชัวรี่ไลฟ์สไตล์ระดับเวิลด์คลาส ศูนย์รวมพูลวิลล่าหรู คอนโดตากอากาศ และลากูน่าภูเก็ต", "en": "World-class luxury lifestyle enclave, home to premium pool villas and Laguna Phuket resort complex.", "ru": "Престижный район роскошных вилл и курортного комплекса Лагуна Пхукет."}'::jsonb,
    '{"th": "อสังหาฯ บางเทา ภูเก็ต - พูลวิลล่าและคอนโดหรู", "en": "Properties in Bang Tao Phuket - Luxury Villas & Condos"}'::jsonb,
    '{"th": "ค้นหาพูลวิลล่าและคอนโดตากอากาศย่านบางเทา ภูเก็ต ใกล้หาดและลากูน่า", "en": "Explore luxury pool villas and holiday condominiums in Bang Tao, Phuket."}'::jsonb,
    'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    1,
    NOW()
),
(
    'cherngtalay',
    'ภูเก็ต',
    '{"th": "เชิงทะเล", "en": "Cherngtalay", "cn": "程塔莱", "ru": "Чернгталай", "default": "เชิงทะเล"}'::jsonb,
    '{"th": "ทำเลยอดนิยมสำหรับที่อยู่อาศัยระดับไฮเอนด์ ใกล้ Boat Avenue, Porto de Phuket และร้านอาหารชั้นนำ", "en": "Prime residential hub featuring Boat Avenue, Porto de Phuket, and fine dining destinations.", "ru": "Центр светской жизни рядом с Boat Avenue и Porto de Phuket."}'::jsonb,
    '{"th": "อสังหาฯ เชิงทะเล ภูเก็ต - บ้าน วิลล่า คอนโด", "en": "Properties in Cherngtalay Phuket - Villas & Condos"}'::jsonb,
    '{"th": "รวมประกาศขายและเช่าอสังหาฯ ในเชิงทะเล ภูเก็ต ทำเลสะดวกสบายที่สุด", "en": "Discover prime properties for sale and rent in Cherngtalay, Phuket."}'::jsonb,
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    2,
    NOW()
),
(
    'layan',
    'ภูเก็ต',
    '{"th": "ลายัน", "en": "Layan", "cn": "拉扬", "ru": "Лаян", "default": "ลายัน"}'::jsonb,
    '{"th": "ชายหาดเงียบสงบ โอบล้อมด้วยธรรมชาติ อุทยานแห่งชาติ และเอสเตทวิลล่าหรูส่วนตัว", "en": "Serene beach surrounded by national parks and exclusive hillside luxury estates.", "ru": "Тихий живописный район с эксклюзивными виллами и чистейшим пляжем."}'::jsonb,
    '{"th": "พูลวิลล่าและอสังหาฯ หาดลายัน ภูเก็ต", "en": "Luxury Villas & Real Estate in Layan Beach Phuket"}'::jsonb,
    '{"th": "บ้านพักตากอากาศและวิลล่าส่วนตัวย่านหาดลายัน ภูเก็ต บรรยากาศเงียบสงบ", "en": "Find exclusive private villas in tranquil Layan Beach, Phuket."}'::jsonb,
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80',
    true,
    false,
    3,
    NOW()
),
(
    'kamala',
    'ภูเก็ต',
    '{"th": "กมลา", "en": "Kamala", "cn": "卡马拉", "ru": "Камала", "default": "กมลา"}'::jsonb,
    '{"th": "ทำเล Millionaires Mile ที่ตั้งของอัลตร้าลักชัวรี่วิลล่าริมผา ทิวทัศน์ทะเลอันดามันแบบพาโนรามา", "en": "Famed for the Millionaires Mile, featuring cliffside ultra-luxury sea-view estates.", "ru": "Знаменитая Миля Миллионеров с роскошными виллами на скалах с видом на море."}'::jsonb,
    '{"th": "วิลล่าหรูและคอนโดวิวทะเล หาดกมลา ภูเก็ต", "en": "Luxury Sea-View Villas & Condos in Kamala Phuket"}'::jsonb,
    '{"th": "อสังหาริมทรัพย์ระดับพรีเมียมในกมลา วิลล่าริมผาและคอนโดใกล้หาด", "en": "Browse ultra-luxury cliffside estates and sea-view residences in Kamala."}'::jsonb,
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    4,
    NOW()
),
(
    'patong',
    'ภูเก็ต',
    '{"th": "ป่าตอง", "en": "Patong", "cn": "芭东", "ru": "Патонг", "default": "ป่าตอง"}'::jsonb,
    '{"th": "ศูนย์กลางการท่องเที่ยวระดับโลก เหมาะสำหรับการลงทุนคอนโดเพื่อรับผลตอบแทนการเช่าสูง", "en": "Phukets vibrant tourist epicenter offering high rental yields and prime investment condos.", "ru": "Главный туристический центр острова с высоким арендным потенциалом."}'::jsonb,
    '{"th": "คอนโดเพื่อการลงทุน ป่าตอง ภูเก็ต", "en": "Investment Condos & Properties in Patong Phuket"}'::jsonb,
    '{"th": "ซื้อคอนโดและอสังหาฯ เพื่อการลงทุนปล่อยเช่าในป่าตอง ภูเก็ต ยิลด์สูง", "en": "High-yield investment condominiums and commercial properties in Patong."}'::jsonb,
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    5,
    NOW()
),
(
    'kata-karon',
    'ภูเก็ต',
    '{"th": "กะตะ - กะรน", "en": "Kata - Karon", "cn": "卡塔-卡伦", "ru": "Ката - Карон", "default": "กะตะ - กะรน"}'::jsonb,
    '{"th": "ชายหาดสวยงามสำหรับครอบครัวและนักเล่นเซิร์ฟ คอนโดและวิลล่ามองเห็นวิวทะเลกว้างไกล", "en": "Beautiful beaches ideal for surf & leisure, featuring sea-view condos and holiday homes.", "ru": "Популярные пляжи для семейного отдыха и серфинга с панорамными видами."}'::jsonb,
    '{"th": "คอนโดและบ้านวิวทะเล กะตะ กะรน ภูเก็ต", "en": "Sea-View Condos & Homes in Kata - Karon Phuket"}'::jsonb,
    '{"th": "เลือกซื้อคอนโดและวิลล่าใกล้หาดกะตะและหาดกะรน ภูเก็ต", "en": "Explore sea-view condominiums and villas in Kata and Karon beaches."}'::jsonb,
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    true,
    false,
    6,
    NOW()
),
(
    'rawai-nai-harn',
    'ภูเก็ต',
    '{"th": "ราไวย์ - ในหาน", "en": "Rawai - Nai Harn", "cn": "拉威-奈汉", "ru": "Раваи - Най Харн", "default": "ราไวย์ - ในหาน"}'::jsonb,
    '{"th": "ทำเลยอดนิยมของชาวต่างชาติตอนใต้ของเกาะ ใกล้หาดในหาน แหลมพรหมเทพ และท่าเรือซีฟู้ด", "en": "South island expat favorite near pristine Nai Harn Beach and Promthep Cape.", "ru": "Любимый экспатами юг острова рядом с пляжем Най Харн и мысом Промтхеп."}'::jsonb,
    '{"th": "พูลวิลล่าและคอนโด ราไวย์ ในหาน ภูเก็ต", "en": "Pool Villas & Condos in Rawai - Nai Harn Phuket"}'::jsonb,
    '{"th": "รวมพูลวิลล่าและคอนโดบรรยากาศสบายๆ โซนราไวย์และในหาน ภูเก็ต", "en": "Discover affordable and luxury villas and residences in Rawai and Nai Harn."}'::jsonb,
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    true,
    true,
    7,
    NOW()
),
(
    'chalong',
    'ภูเก็ต',
    '{"th": "ฉลอง", "en": "Chalong", "cn": "查龙", "ru": "Чалонг", "default": "ฉลอง"}'::jsonb,
    '{"th": "ศูนย์กลางการเดินทาง ท่าจอดเรือยอชต์อ่าวฉลอง วัดฉลอง และโรงเรียนนานาชาติชั้นนำ", "en": "Hub of yachting marinas, historical landmarks, and top international schools.", "ru": "Центр яхтенного спорта, пристаней и международных школ."}'::jsonb,
    '{"th": "บ้านเดี่ยวและวิลล่า อ่าวฉลอง ภูเก็ต", "en": "Houses & Villas in Chalong Phuket"}'::jsonb,
    '{"th": "อสังหาริมทรัพย์เพื่อการอยู่อาศัยของครอบครัวย่านฉลอง ภูเก็ต", "en": "Residential homes and private villas near Chalong Pier and international schools."}'::jsonb,
    'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    true,
    false,
    8,
    NOW()
),
(
    'phuket-old-town',
    'ภูเก็ต',
    '{"th": "เมืองภูเก็ต", "en": "Phuket Old Town", "cn": "普吉老城", "ru": "Пхукет Таун", "default": "เมืองภูเก็ต"}'::jsonb,
    '{"th": "ย่านวัฒนธรรมและเมืองเก่าชิโนโปรตุกีส คาเฟ่ ชุมชน และคอนโดมิเนียมใจกลางเมือง", "en": "Charming Sino-Portuguese historic quarter with vibrant culture and modern city condos.", "ru": "Исторический центр с колоритной архитектурой и современными кондоминиумами."}'::jsonb,
    '{"th": "คอนโดและอาคารพาณิชย์ เมืองเก่าภูเก็ต", "en": "Condos & Commercial Properties in Phuket Town"}'::jsonb,
    '{"th": "คอนโดและอสังหาฯ เพื่อการพาณิชย์ในอำเภอเมืองภูเก็ต", "en": "City condominiums and boutique heritage buildings in Phuket Old Town."}'::jsonb,
    'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80',
    true,
    false,
    9,
    NOW()
),
(
    'nai-thon-nai-yang',
    'ภูเก็ต',
    '{"th": "ในทอน - ในยาง", "en": "Nai Thon - Nai Yang", "cn": "奈通-奈扬", "ru": "Найтон - Найянг", "default": "ในทอน - ในยาง"}'::jsonb,
    '{"th": "โซนตอนเหนือใกล้สนามบินนานาชาติภูเก็ต ธรรมชาติร่มรื่น ทะเลสงบ เหมาะแก่การพักผ่อน", "en": "Tranquil northern haven adjacent to Phuket International Airport and Sirinat National Park.", "ru": "Тихий северный курортный район рядом с международным аэропортом."}'::jsonb,
    '{"th": "วิลล่าและคอนโดใกล้สนามบิน หาดในทอน ในยาง ภูเก็ต", "en": "Properties near Airport - Nai Thon & Nai Yang Phuket"}'::jsonb,
    '{"th": "บ้านพักตากอากาศและคอนโดมิเนียมใกล้สนามบินนานาชาติภูเก็ต", "en": "Holiday homes and beachfront condos in Nai Thon and Nai Yang."}'::jsonb,
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    true,
    false,
    10,
    NOW()
)
ON CONFLICT (slug) DO UPDATE SET
    province = EXCLUDED.province,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    image_url = EXCLUDED.image_url,
    is_active = EXCLUDED.is_active,
    featured = EXCLUDED.featured,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();


-- 2. เพิ่มโครงการตัวอย่างชั้นนำในภูเก็ต (Flagship Projects Master Data)
INSERT INTO public.projects (
    slug,
    name,
    province,
    district,
    subdistrict,
    property_type,
    developer,
    description,
    latitude,
    longitude,
    is_active,
    updated_at
) VALUES
(
    'laguna-phuket',
    '{"th": "ลากูน่า ภูเก็ต", "en": "Laguna Phuket", "cn": "普吉岛乐古浪", "ru": "Лагуна Пхукет"}'::jsonb,
    'ภูเก็ต',
    'ถลาง',
    'เชิงทะเล',
    8, -- VILLA
    'Banyan Group / Laguna Resorts',
    '{"th": "อาณาจักรรีสอร์ทและที่อยู่อาศัยครบวงจรระดับโลกใจกลางหาดบางเทา", "en": "Asia premier integrated destination resort and luxury residential community.", "ru": "Крупнейший курортный комплекс мирового уровня в районе Банг Тао."}'::jsonb,
    7.9942,
    98.3033,
    true,
    NOW()
),
(
    'botanica-luxury-villas',
    '{"th": "โบทานิก้า ลักชัวรี่ วิลล่า", "en": "Botanica Luxury Villas", "cn": "植物园豪华别墅", "ru": "Ботаника Лакшери Виллас"}'::jsonb,
    'ภูเก็ต',
    'ถลาง',
    'เชิงทะเล',
    9, -- POOL_VILLA
    'Botanica Luxury Phuket',
    '{"th": "แบรนด์พูลวิลล่าหรูระดับอัลตร้าลักชัวรี่ที่ได้รับความนิยมสูงสุดในภูเก็ต ดีไซน์โมเดิร์นทรอปิคอล", "en": "Phukets most renowned luxury pool villa developer featuring award-winning modern tropical architecture.", "ru": "Ведущий застройщик премиальных вилл с частным бассейном на Пхукете."}'::jsonb,
    8.0125,
    98.3114,
    true,
    NOW()
),
(
    'the-title-heritage-bang-tao',
    '{"th": "เดอะ ไทเติ้ล เฮอริเทจ บางเทา", "en": "The Title Heritage Bang-Tao", "cn": "海蒂尔文化遗产邦涛", "ru": "Зе Тайтл Херитадж Банг Тао"}'::jsonb,
    'ภูเก็ต',
    'ถลาง',
    'เชิงทะเล',
    1, -- CONDO
    'Rhom Bho Property (TITLE)',
    '{"th": "คอนโดมิเนียมสไตล์รีสอร์ทเพื่อการอยู่อาศัยและการลงทุน ใกล้ Boat Avenue และหาดบางเทา", "en": "Premium leisure condominium project near Boat Avenue and Bang Tao Beach.", "ru": "Курортный жилой комплекс премиум-класса рядом с пляжем Банг Тао."}'::jsonb,
    7.9912,
    98.3150,
    true,
    NOW()
),
(
    'the-title-halo-1-rawai',
    '{"th": "เดอะ ไทเติ้ล ฮาโล วัน ราไวย์", "en": "The Title Halo 1 Rawai", "cn": "海蒂尔光环一号拉威", "ru": "Зе Тайтл Хало 1 Раваи"}'::jsonb,
    'ภูเก็ต',
    'เมืองภูเก็ต',
    'ราไวย์',
    1, -- CONDO
    'Rhom Bho Property (TITLE)',
    '{"th": "คอนโดตากอากาศใกล้หาดในหานและราไวย์ สิ่งอำนวยความสะดวกสไตล์รีสอร์ทเต็มรูปแบบ", "en": "Resort-style condominium situated in peaceful Rawai, minutes from Nai Harn Beach.", "ru": "Кондоминиум курортного типа в спокойном районе Раваи рядом с пляжем Най Харн."}'::jsonb,
    7.7785,
    98.3188,
    true,
    NOW()
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    province = EXCLUDED.province,
    district = EXCLUDED.district,
    subdistrict = EXCLUDED.subdistrict,
    property_type = EXCLUDED.property_type,
    developer = EXCLUDED.developer,
    description = EXCLUDED.description,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
