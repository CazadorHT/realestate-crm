-- ============================================================================
-- 🌟 V3 Enterprise CQRS View Bridge Full Unroll & Smart Match Hardening (God Tier)
-- ============================================================================
-- Description: Recreates public.properties view with full JSONB unrolling,
-- COALESCE null-protection, and subquery-based main_image optimization (Zero N+1).
-- Creates public.property_images view bridge to property_media_v3.
-- Ensures smart_match_* tables exist with seed data and reloads PostgREST schema cache.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 🏷️ 1. Features Table & Property Features FK Bridge
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.features (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    name_cn TEXT,
    name_ru TEXT,
    icon_key TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "features_select" ON public.features;
CREATE POLICY "features_select" ON public.features FOR SELECT USING (true);

INSERT INTO public.features (id, name, name_en, name_cn, name_ru, icon_key)
VALUES 
    ('f_pool', 'สระว่ายน้ำ', 'Swimming Pool', '游泳池', 'Бассейн', 'pool'),
    ('f_gym', 'ฟิตเนส', 'Gym / Fitness', '健身房', 'Спортзал', 'dumbbell'),
    ('f_security', 'รปภ. 24 ชม.', '24/7 Security', '24小时安保', 'Круглосуточная охрана', 'shield-check'),
    ('f_parking', 'ที่จอดรถ', 'Parking', '停车场', 'Парковка', 'truck'),
    ('f_garden', 'สวนสาธารณะ', 'Garden / Park', '花园', 'Сад', 'tree'),
    ('f_elevator', 'ลิฟต์', 'Elevator', '电梯', 'Лифт', 'chevron-up-down'),
    ('f_cctv', 'กล้องวงจรปิด', 'CCTV', '监控系统', 'Видеонаблюдение', 'video-camera'),
    ('f_keycard', 'ระบบคีย์การ์ด', 'Keycard Access', '门禁卡系统', 'Доступ по ключ-карте', 'credit-card'),
    ('f_coworking', 'พื้นที่ทำงานร่วม', 'Co-working Space', '共享办公区', 'Коворкинг', 'briefcase'),
    ('f_sauna', 'ซาวน่า / สตรีม', 'Sauna / Steam Room', '桑拿房', 'Сауна / Парная', 'fire'),
    ('f_playground', 'สนามเด็กเล่น', 'Playground', '儿童游乐场', 'Детская площадка', 'face-smile'),
    ('f_pet_area', 'โซนสัตว์เลี้ยง', 'Pet Friendly Area', '宠物活动区', 'Зона для питомцев', 'heart'),
    ('f_ev_charger', 'จุดชาร์จรถยนต์ไฟฟ้า', 'EV Charging Station', '电动车充电站', 'Зарядка для ЭО', 'bolt'),
    ('f_shuttle', 'บริการรถรับส่ง', 'Shuttle Service', '接驳车服务', 'Трансфер', 'bus'),
    ('f_concierge', 'พนักงานต้อนรับ', 'Concierge Service', '礼宾服务', 'Консьерж-сервис', 'user-group'),
    ('f_rooftop', 'สวนชั้นดาดฟ้า', 'Rooftop Garden', '屋顶花园', 'Сад на крыше', 'sun'),
    ('f_lounge', 'คลับเฮ้าส์ / เลานจ์', 'Clubhouse / Lounge', '会所 / 休息室', 'Клубный дом / Лаундж', 'home-modern'),
    ('f_private_pool', 'สระว่ายน้ำส่วนตัว', 'Private Pool', '私人泳池', 'Частный бассейн', 'water'),
    ('f_maid_room', 'ห้องแม่บ้าน', 'Maid Quarter', '保姆房', 'Комната для прислуги', 'home'),
    ('f_smart_home', 'ระบบสมาร์ทโฮม', 'Smart Home System', '智能家居系统', 'Система "Умный дом"', 'cpu-chip'),
    ('f_sea_view', 'วิวทะเล', 'Sea View', '海景', 'Вид на море', 'eye'),
    ('f_city_view', 'วิวเมือง', 'City View', '城市景观', 'Вид на город', 'building-office-2'),
    ('f_mountain_view', 'วิวภูเขา', 'Mountain View', '山景', 'Вид на горы', 'photo'),
    ('f_high_ceiling', 'เพดานสูงโปร่ง', 'High Ceiling', '挑高天花板', 'Высокие потолки', 'arrows-up-down'),
    ('f_bathtub', 'อ่างอาบน้ำ', 'Bathtub', '浴缸', 'Ванна', 'sparkles')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, name_en = EXCLUDED.name_en, name_cn = EXCLUDED.name_cn, name_ru = EXCLUDED.name_ru, icon_key = EXCLUDED.icon_key;

-- Add FK from property_features to features if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'property_features_feature_id_fkey'
    ) THEN 
        ALTER TABLE public.property_features 
        ADD CONSTRAINT property_features_feature_id_fkey 
        FOREIGN KEY (feature_id) REFERENCES public.features(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 🏛️ 2. Properties View Bridge Full Unroll (God Tier Optimized)
-- ============================================================================

DROP VIEW IF EXISTS public.properties CASCADE;

CREATE OR REPLACE VIEW public.properties WITH (security_invoker = true) AS
SELECT 
    -- Core Hot Fields
    c.id,
    c.tenant_id,
    c.branch_id,
    c.status as status_int,
    CASE 
        WHEN c.status = 0 THEN 'DRAFT'
        WHEN c.status = 1 THEN 'ACTIVE'
        WHEN c.status = 2 THEN 'UNDER_OFFER'
        WHEN c.status = 3 THEN 'RESERVED'
        WHEN c.status = 4 THEN 'SOLD'
        WHEN c.status = 5 THEN 'RENTED'
        WHEN c.status = 6 THEN 'ARCHIVED'
        ELSE 'DRAFT'
    END as status,
    c.listing_type as listing_type_int,
    CASE 
        WHEN c.listing_type = 0 THEN 'SALE'
        WHEN c.listing_type = 1 THEN 'RENT'
        WHEN c.listing_type = 2 THEN 'SALE_AND_RENT'
        ELSE 'SALE'
    END as listing_type,
    c.property_type as property_type_int,
    CASE 
        WHEN c.property_type = 1 THEN 'CONDO'
        WHEN c.property_type = 2 THEN 'HOUSE'
        WHEN c.property_type = 3 THEN 'TOWNHOME'
        WHEN c.property_type = 4 THEN 'LAND'
        WHEN c.property_type = 5 THEN 'COMMERCIAL_BUILDING'
        WHEN c.property_type = 6 THEN 'WAREHOUSE'
        WHEN c.property_type = 7 THEN 'OFFICE_BUILDING'
        WHEN c.property_type = 8 THEN 'VILLA'
        WHEN c.property_type = 9 THEN 'POOL_VILLA'
        ELSE 'OTHER'
    END as property_type,
    
    c.sale_price as price,
    c.rent_price as rental_price,
    c.currency,
    c.bedrooms,
    c.bathrooms,
    c.floor_area as size_sqm,
    c.land_area as land_size_sqwah,
    c.location,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    c.owner_id,
    c.assigned_to,
    c.created_by,
    
    -- New Core Columns (Strict Boolean)
    COALESCE(c.is_hot_deal, false) as is_hot_deal,
    COALESCE(c.is_exclusive, false) as is_exclusive,
    COALESCE(c.verified, false) as verified,
    c.co_broker_id,
    c.slug,

    -- Titles (Multi-language unroll with COALESCE protection)
    COALESCE(d.title, '{}'::jsonb)->>'th' as title,
    COALESCE(d.title, '{}'::jsonb)->>'en' as title_en,
    COALESCE(d.title, '{}'::jsonb)->>'cn' as title_cn,
    COALESCE(d.title, '{}'::jsonb)->>'ru' as title_ru,

    -- Descriptions (Multi-language unroll with COALESCE protection)
    COALESCE(d.description, '{}'::jsonb)->>'th' as description,
    COALESCE(d.description, '{}'::jsonb)->>'en' as description_en,
    COALESCE(d.description, '{}'::jsonb)->>'cn' as description_cn,
    COALESCE(d.description, '{}'::jsonb)->>'ru' as description_ru,
    
    -- Address Info Unroll with COALESCE protection
    COALESCE(d.address_info, '{}'::jsonb)->>'subdistrict' as subdistrict,
    COALESCE(d.address_info, '{}'::jsonb)->>'district' as district,
    COALESCE(d.address_info, '{}'::jsonb)->>'province' as province,
    COALESCE(d.address_info, '{}'::jsonb)->>'popular_area' as popular_area,
    COALESCE(d.address_info, '{}'::jsonb)->>'popular_area_en' as popular_area_en,
    COALESCE(d.address_info, '{}'::jsonb)->>'popular_area_cn' as popular_area_cn,
    COALESCE(d.address_info, '{}'::jsonb)->>'popular_area_ru' as popular_area_ru,
    COALESCE(d.address_info, '{}'::jsonb)->>'address_line1' as address_line1,
    COALESCE(d.address_info, '{}'::jsonb)->>'address_line1_en' as address_line1_en,
    COALESCE(d.address_info, '{}'::jsonb)->>'address_line1_cn' as address_line1_cn,
    COALESCE(d.address_info, '{}'::jsonb)->>'address_line1_ru' as address_line1_ru,
    COALESCE(d.address_info, '{}'::jsonb)->>'postal_code' as postal_code,
    
    -- Pricing Details Unroll with COALESCE protection
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'original_price')::numeric as original_price,
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'original_rental_price')::numeric as original_rental_price,
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'min_contract_months')::integer as min_contract_months,
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'price_per_sqm')::numeric as price_per_sqm,
    (COALESCE(d.pricing_details, '{}'::jsonb)->>'rent_price_per_sqm')::numeric as rent_price_per_sqm,

    -- Meta Data Unroll with COALESCE protection (God Tier Comprehensive)
    COALESCE(d.meta_data, '{}'::jsonb)->'meta_keywords' as meta_keywords,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'parking_slots')::integer as parking_slots,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'floor')::integer as floor,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'total_units')::integer as total_units,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'sold_units')::integer as sold_units,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'ceiling_height')::numeric as ceiling_height,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'office_capacity')::integer as office_capacity,
    COALESCE(d.meta_data, '{}'::jsonb)->>'orientation' as orientation,
    COALESCE(d.meta_data, '{}'::jsonb)->>'parking_type' as parking_type,
    COALESCE(d.meta_data, '{}'::jsonb)->>'property_source' as property_source,
    COALESCE(d.meta_data, '{}'::jsonb)->>'co_agent_name' as co_agent_name,
    COALESCE(d.meta_data, '{}'::jsonb)->>'co_agent_phone' as co_agent_phone,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'co_agent_sale_commission_percent')::numeric as co_agent_sale_commission_percent,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'commission_sale_percentage')::numeric as commission_sale_percentage,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'commission_rent_months')::numeric as commission_rent_months,
    
    -- Boolean Flags & Amenities (Strict Boolean for Zod Validation)
    COALESCE((d.meta_data->>'is_fully_furnished')::boolean, false) as is_fully_furnished,
    COALESCE((d.meta_data->>'is_bare_shell')::boolean, false) as is_bare_shell,
    COALESCE((d.meta_data->>'is_pet_friendly')::boolean, false) as is_pet_friendly,
    COALESCE((d.meta_data->>'is_corner_unit')::boolean, false) as is_corner_unit,
    COALESCE((d.meta_data->>'is_renovated')::boolean, false) as is_renovated,
    COALESCE((d.meta_data->>'is_selling_with_tenant')::boolean, false) as is_selling_with_tenant,
    COALESCE((d.meta_data->>'is_foreigner_quota')::boolean, false) as is_foreigner_quota,
    COALESCE((d.meta_data->>'is_tax_registered')::boolean, false) as is_tax_registered,
    COALESCE((d.meta_data->>'requires_ai_review')::boolean, false) as requires_ai_review,
    COALESCE((d.meta_data->>'is_featured')::boolean, false) as is_featured,
    COALESCE((d.meta_data->>'has_city_view')::boolean, false) as has_city_view,
    COALESCE((d.meta_data->>'has_pool_view')::boolean, false) as has_pool_view,
    COALESCE((d.meta_data->>'has_garden_view')::boolean, false) as has_garden_view,
    COALESCE((d.meta_data->>'has_private_pool')::boolean, false) as has_private_pool,
    COALESCE((d.meta_data->>'has_river_view')::boolean, false) as has_river_view,
    COALESCE((d.meta_data->>'has_unblocked_view')::boolean, false) as has_unblocked_view,
    COALESCE((d.meta_data->>'allow_smoking')::boolean, false) as allow_smoking,
    COALESCE((d.meta_data->>'is_high_ceiling')::boolean, false) as is_high_ceiling,
    COALESCE((d.meta_data->>'is_column_free')::boolean, false) as is_column_free,
    COALESCE((d.meta_data->>'is_grade_a')::boolean, false) as is_grade_a,
    COALESCE((d.meta_data->>'is_grade_b')::boolean, false) as is_grade_b,
    COALESCE((d.meta_data->>'is_grade_c')::boolean, false) as is_grade_c,
    COALESCE((d.meta_data->>'has_raised_floor')::boolean, false) as has_raised_floor,
    COALESCE((d.meta_data->>'is_central_air')::boolean, false) as is_central_air,
    COALESCE((d.meta_data->>'is_split_air')::boolean, false) as is_split_air,
    COALESCE((d.meta_data->>'has_247_access')::boolean, false) as has_247_access,
    COALESCE((d.meta_data->>'has_fiber_optic')::boolean, false) as has_fiber_optic,
    COALESCE((d.meta_data->>'has_multi_parking')::boolean, false) as has_multi_parking,
    COALESCE((d.meta_data->>'facing_east')::boolean, false) as facing_east,
    COALESCE((d.meta_data->>'facing_north')::boolean, false) as facing_north,
    COALESCE((d.meta_data->>'facing_south')::boolean, false) as facing_south,
    COALESCE((d.meta_data->>'facing_west')::boolean, false) as facing_west,
    
    -- AI & Metadata Strings
    COALESCE(d.meta_data, '{}'::jsonb)->>'ai_summary_content' as ai_summary_content,
    COALESCE(d.meta_data, '{}'::jsonb)->>'ai_reviewed_at' as ai_reviewed_at,
    COALESCE(d.meta_data, '{}'::jsonb)->>'ai_reviewed_by' as ai_reviewed_by,
    COALESCE(d.meta_data, '{}'::jsonb)->>'google_maps_link' as google_maps_link,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'version')::integer as version,
    
    -- V3 Tenant & Branch Context Bridges
    (SELECT name FROM public.tenants_v3 WHERE id = c.tenant_id) as tenant_name,
    (SELECT name FROM public.branches_v3 WHERE id = c.branch_id) as branch_name,

    -- Transit Info Unroll with COALESCE protection
    COALESCE((d.transit_info->>'near_transit')::boolean, false) as near_transit,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_type' as transit_type,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_station_name' as transit_station_name,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_station_name_en' as transit_station_name_en,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_station_name_cn' as transit_station_name_cn,
    COALESCE(d.transit_info, '{}'::jsonb)->>'transit_station_name_ru' as transit_station_name_ru,
    (COALESCE(d.transit_info, '{}'::jsonb)->>'transit_distance_meters')::numeric as transit_distance_meters,

    -- Raw JSONB Blocks (For form mapping)
    d.amenities,
    d.pricing_details,
    d.meta_data,
    d.address_info,
    d.transit_info,

    -- Legacy & Relationship compatibility bridges (Fully Populated God Tier)
    (
        SELECT jsonb_agg(url ORDER BY sort_order ASC)::text 
        FROM public.property_media_v3 
        WHERE property_id = c.id
    ) as images,
    COALESCE(d.meta_data, '{}'::jsonb)->>'structured_data' as structured_data,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'view_count')::integer as view_count,
    (COALESCE(d.meta_data, '{}'::jsonb)->>'trust_score')::numeric as trust_score,
    COALESCE((d.meta_data->>'has_nearby_places')::boolean, false) as has_nearby_places,
    
    -- JSON Arrays bridges (Fully Populated God Tier)
    COALESCE(d.address_info->'nearby_places', '[]'::jsonb) as nearby_places,
    COALESCE(d.transit_info->'nearby_transits', '[]'::jsonb) as nearby_transits,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', f.id,
                'name', f.name,
                'name_en', f.name_en,
                'name_cn', f.name_cn,
                'name_ru', f.name_ru,
                'icon_key', f.icon_key,
                'category', f.category
            )
        )
        FROM public.property_features pf
        JOIN public.features f ON pf.feature_id = f.id
        WHERE pf.property_id = c.id
    ) as features,
    
    -- 🚀 GOD TIER OPTIMIZATION: Subquery main_image to eliminate N+1 joins
    (
        SELECT url 
        FROM public.property_media_v3 
        WHERE property_id = c.id AND is_cover = true 
        ORDER BY sort_order ASC 
        LIMIT 1
    ) as main_image

FROM public.properties_core c
LEFT JOIN public.properties_details d ON c.id = d.property_id;

-- ============================================================================
-- 🖼️ 3. Property Images View Bridge
-- ============================================================================

DROP VIEW IF EXISTS public.property_images CASCADE;

CREATE OR REPLACE VIEW public.property_images WITH (security_invoker = true) AS
SELECT 
    id,
    property_id,
    url,
    url as image_url,
    storage_path,
    is_cover,
    sort_order,
    media_type,
    ai_scan_status,
    ai_scan_result,
    created_at
FROM public.property_media_v3;


-- ============================================================================
-- 🤖 4. Smart Match Tables & Seed Data
-- ============================================================================

-- 3.1 smart_match_budget_ranges
CREATE TABLE IF NOT EXISTS public.smart_match_budget_ranges (
    id TEXT PRIMARY KEY,
    purpose TEXT NOT NULL,
    label TEXT NOT NULL,
    label_en TEXT,
    label_cn TEXT,
    label_ru TEXT,
    min_value NUMERIC NOT NULL,
    max_value NUMERIC NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.smart_match_budget_ranges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "smart_match_budget_ranges_select" ON public.smart_match_budget_ranges;
CREATE POLICY "smart_match_budget_ranges_select" ON public.smart_match_budget_ranges FOR SELECT USING (true);

INSERT INTO public.smart_match_budget_ranges (id, purpose, label, label_en, label_cn, label_ru, min_value, max_value, sort_order, is_active)
VALUES 
    ('range_buy_1', 'BUY', 'ไม่เกิน 3 ล้านบาท', 'Under 3M THB', '300万泰铢以下', 'До 3 млн бат', 0, 3000000, 1, true),
    ('range_buy_2', 'BUY', '3 - 5 ล้านบาท', '3M - 5M THB', '300万-500万泰铢', '3 - 5 млн бат', 3000000, 5000000, 2, true),
    ('range_buy_3', 'BUY', '5 - 10 ล้านบาท', '5M - 10M THB', '500万-1000万泰铢', '5 - 10 млн бат', 5000000, 10000000, 3, true),
    ('range_buy_4', 'BUY', '10 ล้านบาทขึ้นไป', '10M+ THB', '1000万泰铢以上', 'От 10 млн бат', 10000000, 999999999, 4, true),
    ('range_rent_1', 'RENT', 'ไม่เกิน 20,000 บาท/เดือน', 'Under 20k THB/mo', '2万泰铢/月以下', 'До 20 тыс. бат/мес', 0, 20000, 1, true),
    ('range_rent_2', 'RENT', '20,000 - 50,000 บาท/เดือน', '20k - 50k THB/mo', '2万-5万泰铢/月', '20 - 50 тыс. бат/мес', 20000, 50000, 2, true),
    ('range_rent_3', 'RENT', '50,000 บาท/เดือนขึ้นไป', '50k+ THB/mo', '5万泰铢/月以上', 'От 50 тыс. бат/мес', 50000, 9999999, 3, true)
ON CONFLICT (id) DO UPDATE SET 
    label = EXCLUDED.label, label_en = EXCLUDED.label_en, min_value = EXCLUDED.min_value, max_value = EXCLUDED.max_value, is_active = EXCLUDED.is_active;

-- 3.2 smart_match_office_sizes
CREATE TABLE IF NOT EXISTS public.smart_match_office_sizes (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    label_en TEXT,
    label_cn TEXT,
    label_ru TEXT,
    min_sqm NUMERIC NOT NULL,
    max_sqm NUMERIC NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.smart_match_office_sizes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "smart_match_office_sizes_select" ON public.smart_match_office_sizes;
CREATE POLICY "smart_match_office_sizes_select" ON public.smart_match_office_sizes FOR SELECT USING (true);

INSERT INTO public.smart_match_office_sizes (id, label, label_en, label_cn, label_ru, min_sqm, max_sqm, sort_order, is_active)
VALUES 
    ('size_1', 'ไม่เกิน 100 ตร.ม.', 'Under 100 sqm', '100平米以下', 'До 100 кв.м', 0, 100, 1, true),
    ('size_2', '100 - 300 ตร.ม.', '100 - 300 sqm', '100-300平米', '100 - 300 кв.м', 100, 300, 2, true),
    ('size_3', '300 ตร.ม. ขึ้นไป', '300+ sqm', '300平米以上', 'От 300 кв.м', 300, 99999, 3, true)
ON CONFLICT (id) DO UPDATE SET 
    label = EXCLUDED.label, label_en = EXCLUDED.label_en, min_sqm = EXCLUDED.min_sqm, max_sqm = EXCLUDED.max_sqm, is_active = EXCLUDED.is_active;

-- 3.3 smart_match_settings
CREATE TABLE IF NOT EXISTS public.smart_match_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.smart_match_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "smart_match_settings_select" ON public.smart_match_settings;
CREATE POLICY "smart_match_settings_select" ON public.smart_match_settings FOR SELECT USING (true);

INSERT INTO public.smart_match_settings (key, value)
VALUES 
    ('smart_match_config', '{"enabled": true, "default_radius_km": 10, "max_matches": 50}'::jsonb),
    ('ai_matching_weights', '{"location": 0.4, "budget": 0.3, "property_type": 0.2, "size": 0.1}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3.4 smart_match_property_types
CREATE TABLE IF NOT EXISTS public.smart_match_property_types (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    label_en TEXT,
    label_cn TEXT,
    label_ru TEXT,
    value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.smart_match_property_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "smart_match_property_types_select" ON public.smart_match_property_types;
CREATE POLICY "smart_match_property_types_select" ON public.smart_match_property_types FOR SELECT USING (true);

INSERT INTO public.smart_match_property_types (id, label, label_en, label_cn, label_ru, value, sort_order, is_active)
VALUES 
    ('pt_condo', 'คอนโด', 'Condo', '公寓', 'Кондоминиум', 'CONDO', 1, true),
    ('pt_house', 'บ้านเดี่ยว', 'House', '独栋别墅', 'Дом', 'HOUSE', 2, true),
    ('pt_townhome', 'ทาวน์โฮม', 'Townhome', '联排别墅', 'Таунхаус', 'TOWNHOME', 3, true),
    ('pt_land', 'ที่ดิน', 'Land', '土地', 'Земельный участок', 'LAND', 4, true),
    ('pt_commercial', 'อาคารพาณิชย์', 'Commercial Building', '商铺', 'Коммерческое здание', 'COMMERCIAL_BUILDING', 5, true),
    ('pt_warehouse', 'โกดัง/คลังสินค้า', 'Warehouse', '仓库', 'Склад', 'WAREHOUSE', 6, true),
    ('pt_office', 'อาคารสำนักงาน', 'Office Building', '办公楼', 'Офисное здание', 'OFFICE_BUILDING', 7, true),
    ('pt_villa', 'วิลล่า', 'Villa', '别墅', 'Вилла', 'VILLA', 8, true),
    ('pt_pool_villa', 'พูลวิลล่า', 'Pool Villa', '泳池别墅', 'Вилла с бассейном', 'POOL_VILLA', 9, true)
ON CONFLICT (id) DO UPDATE SET 
    label = EXCLUDED.label, label_en = EXCLUDED.label_en, label_cn = EXCLUDED.label_cn, label_ru = EXCLUDED.label_ru, value = EXCLUDED.value, is_active = EXCLUDED.is_active;

-- ============================================================================
-- 🔄 5. PostgREST Schema Cache Reload
-- ============================================================================

NOTIFY pgrst, 'reload schema';

COMMIT;

-- 🔗 Explicit PostgREST Foreign Key Comment for View-to-View Joins
COMMENT ON VIEW public.property_images IS '@foreignKey (property_id) references public.properties (id)';
