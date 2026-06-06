-- Seed comprehensive Bangkok transit stations into ref_master_data
-- Supports BTS (Sukhumvit/Silom), MRT (Blue/Purple/Yellow/Pink), ARL, Gold, SRT Red, and BRT

INSERT INTO public.ref_master_data (type, code, label, is_active, sort_order, metadata) VALUES
-- ==========================================
-- 🟢 BTS Sukhumvit Line
-- ==========================================
('TRANSIT_STATION', 'bts_siam', '{"th": "สยาม", "en": "Siam", "cn": "暹罗", "ru": "Сиам"}', true, 10, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_chit_lom', '{"th": "ชิดลม", "en": "Chit Lom", "cn": "奇隆", "ru": "Чิตлом"}', true, 15, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_phloen_chit', '{"th": "เพลินจิต", "en": "Phloen Chit", "cn": "菲隆奇", "ru": "Пхленчит"}', true, 20, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_nana', '{"th": "นานา", "en": "Nana", "cn": "ナナ", "ru": "Нана"}', true, 25, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_asok', '{"th": "อโศก", "en": "Asok", "cn": "阿索克", "ru": "Асок"}', true, 30, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_phrom_phong', '{"th": "พร้อมพงษ์", "en": "Phrom Phong", "cn": "蓬蓬", "ru": "Промпонг"}', true, 35, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_thong_lo', '{"th": "ทองหล่อ", "en": "Thong Lo", "cn": "东罗", "ru": "Тонгло"}', true, 40, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_ekkamai', '{"th": "เอกมัย", "en": "Ekkamai", "cn": "伊卡迈", "ru": "Эккамай"}', true, 45, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_phra_khanong', '{"th": "พระโขนง", "en": "Phra Khanong", "cn": "帕卡隆", "ru": "Пракханонг"}', true, 50, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_on_nut', '{"th": "อ่อนนุช", "en": "On Nut", "cn": "安努", "ru": "Оннут"}', true, 55, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_bang_chak', '{"th": "บางจาก", "en": "Bang Chak", "cn": "邦泽", "ru": "Бангчак"}', true, 60, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_punnawithi', '{"th": "ปุณณวิถี", "en": "Punnawithi", "cn": "普那วิถี", "ru": "Пунนาвитхи"}', true, 65, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_udom_suk', '{"th": "อุดมสุข", "en": "Udom Suk", "cn": "乌东สุข", "ru": "Удомсук"}', true, 70, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_bang_na', '{"th": "บางนา", "en": "Bang Na", "cn": "班纳", "ru": "Бангна"}', true, 75, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_bearing', '{"th": "แบริ่ง", "en": "Bearing", "cn": "贝林", "ru": "Беринг"}', true, 80, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_samrong', '{"th": "สำโรง", "en": "Samrong", "cn": "三榕", "ru": "Самронг"}', true, 85, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_pu_chao', '{"th": "ปู่เจ้า", "en": "Pu Chao", "cn": "普照", "ru": "Пу Чао"}', true, 86, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_chang_erawan', '{"th": "ช้างเอราวัณ", "en": "Chang Erawan", "cn": "爱侣湾", "ru": "Чанг Эраван"}', true, 87, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_pak_nam', '{"th": "ปากน้ำ", "en": "Pak Nam", "cn": "北榄", "ru": "Пакнам"}', true, 88, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_kheha', '{"th": "เคหะฯ", "en": "Kheha", "cn": "凯哈", "ru": "Кеха"}', true, 89, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_ratchathewi', '{"th": "ราชเทวี", "en": "Ratchathewi", "cn": "拉差贴威", "ru": "Ратчатхеви"}', true, 90, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_phaya_thai', '{"th": "พญาไท", "en": "Phaya Thai", "cn": "披耶泰", "ru": "Пхаятхаи"}', true, 95, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_victory_monument', '{"th": "อนุสาวรีย์ชัยสมรภูมิ", "en": "Victory Monument", "cn": "胜利纪念碑", "ru": "Монумент Победы"}', true, 100, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_sanam_pao', '{"th": "สนามเป้า", "en": "Sanam Pao", "cn": "沙南包", "ru": "Санампао"}', true, 105, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_ari', '{"th": "อารีย์", "en": "Ari", "cn": "阿里", "ru": "Ари"}', true, 110, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_saphan_khwai', '{"th": "สะพานควาย", "en": "Saphan Khwai", "cn": "水牛桥", "ru": "Сапханкхуай"}', true, 115, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_mo_chit', '{"th": "หมอชิต", "en": "Mo Chit", "cn": "蒙奇", "ru": "Мочит"}', true, 120, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_ha_yaek_lat_phrao', '{"th": "ห้าแยกลาดพร้าว", "en": "Ha Yaek Lat Phrao", "cn": "叻พร้าว五路口", "ru": "Пятиуличный Lатпхрау"}', true, 125, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_ratchayothin', '{"th": "รัชโยธิน", "en": "Ratchayothin", "cn": "拉差โยธิน", "ru": "Ратчайоthin"}', true, 130, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_sena_nikhom', '{"th": "เสนานิคม", "en": "Sena Nikhom", "cn": "塞纳尼空", "ru": "Сена Никхом"}', true, 132, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_kasetsart_university', '{"th": "มหาวิทยาลัยเกษตรศาสตร์", "en": "Kasetsart University", "cn": "农业大学", "ru": "Университет Касетсарт"}', true, 135, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_bang_bua', '{"th": "บางบัว", "en": "Bang Bua", "cn": "邦博", "ru": "Банг Буа"}', true, 136, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_wat_phra_sri_mahathat', '{"th": "วัดพระศรีมหาธาตุ", "en": "Wat Phra Sri Mahathat", "cn": "法寺", "ru": "Ват Пхра Шри Махатхат"}', true, 137, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_sai_yud', '{"th": "สายหยุด", "en": "Sai Yud", "cn": "赛育", "ru": "Сай Йуд"}', true, 138, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_khu_khot', '{"th": "คูคต", "en": "Khu Khot", "cn": "库คต", "ru": "Кхукхот"}', true, 140, '{"transit_type": "BTS"}'),

-- ==========================================
-- 🟢 BTS Silom Line
-- ==========================================
('TRANSIT_STATION', 'bts_national_stadium', '{"th": "สนามกีฬาแห่งชาติ", "en": "National Stadium", "cn": "国家体育馆", "ru": "Национальный стадион"}', true, 150, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_ratchadamri', '{"th": "ราชดำริ", "en": "Ratchadamri", "cn": "拉差damri", "ru": "Ратчадамри"}', true, 155, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_sala_daeng', '{"th": "ศาลาแดง", "en": "Sala Daeng", "cn": "莎拉当", "ru": "Саладаенг"}', true, 160, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_chong_nonsi', '{"th": "ช่องนนทรี", "en": "Chong Nonsi", "cn": "钟那席", "ru": "Чонг Нอนси"}', true, 165, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_saint_louis', '{"th": "เซนต์หลุยส์", "en": "Saint Louis", "cn": "圣路易斯", "ru": "Сент-Луис"}', true, 170, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_surasak', '{"th": "สุรศักดิ์", "en": "Surasak", "cn": "苏拉萨", "ru": "Surasak"}', true, 175, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_saphan_taksin', '{"th": "สะพานตากสิน", "en": "Saphan Taksin", "cn": "郑皇桥", "ru": "Сапхан Таксин"}', true, 180, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_krung_thon_buri', '{"th": "กรุงธนบุรี", "en": "Krung Thon Buri", "cn": "吞武里", "ru": "Крунг Тхон Бури"}', true, 185, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_wongwian_yai', '{"th": "วงเวียนใหญ่", "en": "Wongwian Yai", "cn": "大箩斗", "ru": "Вонгвиан Яй"}', true, 190, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_pho_nimit', '{"th": "โพธิ์นิมิตร", "en": "Pho Nimit", "cn": "菩尼密", "ru": "Пхо Нимит"}', true, 191, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_talat_phlu', '{"th": "ตลาดพลู", "en": "Talat Phlu", "cn": "哒叻普", "ru": "Талат Пхлу"}', true, 192, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_wutthakat', '{"th": "วุฒากาศ", "en": "Wutthakat", "cn": "武他甲", "ru": "Вуттхакат"}', true, 193, '{"transit_type": "BTS"}'),
('TRANSIT_STATION', 'bts_bang_wa', '{"th": "บางหว้า", "en": "Bang Wa", "cn": "邦瓦", "ru": "Бангва"}', true, 194, '{"transit_type": "BTS"}'),

-- ==========================================
-- 🔵 MRT Blue Line
-- ==========================================
('TRANSIT_STATION', 'mrt_hua_lamphong', '{"th": "หัวลำโพง", "en": "Hua Lamphong", "cn": "华南蓬", "ru": "Хуалампхонг"}', true, 200, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_sam_yan', '{"th": "สามย่าน", "en": "Sam Yan", "cn": "山燕", "ru": "Самьян"}', true, 205, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_silom', '{"th": "สีลม", "en": "Silom", "cn": "席隆", "ru": "Силом"}', true, 210, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_lumphini', '{"th": "ลุมพินี", "en": "Lumphini", "cn": "伦披尼", "ru": "Лумпхини"}', true, 215, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_khlong_toei', '{"th": "คลองเตย", "en": "Khlong Toei", "cn": "孔提", "ru": "Клонгтей"}', true, 220, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_queen_sirikit', '{"th": "ศูนย์การประชุมแห่งชาติสิริกิติ์", "en": "Queen Sirikit Center", "cn": "诗丽吉会展中心", "ru": "Центр Королевы Сирикит"}', true, 225, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_sukhumvit', '{"th": "สุขุมวิท", "en": "Sukhumvit", "cn": "素坤逸", "ru": "Сукхумвит"}', true, 230, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_phetchaburi', '{"th": "เพชรบุรี", "en": "Phetchaburi", "cn": "碧武里", "ru": "Пхетчабури"}', true, 235, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_phra_ram_9', '{"th": "พระราม 9", "en": "Phra Ram 9", "cn": "帕ราม 9", "ru": "Пхра Рам 9"}', true, 240, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_thailand_cultural_centre', '{"th": "ศูนย์วัฒนธรรมแห่งประเทศไทย", "en": "Thailand Cultural Centre", "cn": "泰国文化中心", "ru": "Культурный центр Таиланда"}', true, 245, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_huai_khwang', '{"th": "ห้วยขวาง", "en": "Huai Khwang", "cn": "輝煌", "ru": "Хуайкхванг"}', true, 250, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_sutthisan', '{"th": "สุทธิสาร", "en": "Sutthisan", "cn": "苏ธิสาร", "ru": "Сутхисан"}', true, 255, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_ratchadaphisek', '{"th": "รัชดาภิเษก", "en": "Ratchadaphisek", "cn": "拉差达披色", "ru": "Ратчадапхисек"}', true, 260, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_lat_phrao', '{"th": "ลาดพร้าว", "en": "Lat Phrao", "cn": "拉พร้าว", "ru": "Латпхрау"}', true, 265, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_phahon_yothin', '{"th": "พหลโยธิน", "en": "Phahon Yothin", "cn": "拍หลโยธิน", "ru": "Пхахонйотхин"}', true, 270, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_chatuchak_park', '{"th": "สวนจตุจักร", "en": "Chatuchak Park", "cn": "乍都乍公园", "ru": "Парк Чатучак"}', true, 275, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_kamphaeng_phet', '{"th": "กำแพงเพชร", "en": "Kamphaeng Phet", "cn": "甘烹碧", "ru": "Кампхенгпхет"}', true, 280, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_bang_sue', '{"th": "บางซื่อ", "en": "Bang Sue", "cn": "邦士", "ru": "Бангсу"}', true, 285, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_tao_poon_blue', '{"th": "เตาปูน (สายสีน้ำเงิน)", "en": "Tao Poon (Blue Line)", "cn": "涛本 (蓝线)", "ru": "Таопун (Синяя)"}', true, 290, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_bang_po', '{"th": "บางโพ", "en": "Bang Pho", "cn": "邦坡", "ru": "Бангпхо"}', true, 292, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_bang_o', '{"th": "บางอ้อ", "en": "Bang O", "cn": "Bang O", "ru": "Банго"}', true, 294, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_bang_phlat', '{"th": "บางพลัด", "en": "Bang Phlat", "cn": "邦帕", "ru": "Банг Пхлат"}', true, 295, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_sirindhorn', '{"th": "สิรินธร", "en": "Sirindhorn", "cn": "诗琳通", "ru": "Сириндхорн"}', true, 296, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_bang_yi_khan', '{"th": "บางยี่ขัน", "en": "Bang Yi Khan", "cn": "邦伊坎", "ru": "Банг Йи Кхан"}', true, 297, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_bang_khun_non', '{"th": "บางขุนนนท์", "en": "Bang Khun Non", "cn": "邦坤农", "ru": "Бангкхуннон"}', true, 298, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_fai_chai', '{"th": "ไฟฉาย", "en": "Fai Chai", "cn": "发猜", "ru": "Фай Чай"}', true, 299, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_charan_13', '{"th": "จรัญฯ 13", "en": "Charan 13", "cn": "乍兰13", "ru": "Чаран 13"}', true, 300, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_itsaraphap', '{"th": "อิสรภาพ", "en": "Itsaraphap", "cn": "自由路", "ru": "Итсарапхап"}', true, 301, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_wat_mangkon', '{"th": "วัดมังกร", "en": "Wat Mangkon", "cn": "龙莲寺", "ru": "Ват Мангкон"}', true, 305, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_sam_yot', '{"th": "สามยอด", "en": "Sam Yot", "cn": "三峰", "ru": "Сам Йот"}', true, 306, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_sanam_chai', '{"th": "สนามไชย", "en": "Sanam Chai", "cn": "沙南猜", "ru": "Санам Чай"}', true, 307, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_tha_phra', '{"th": "ท่าพระ", "en": "Tha Phra", "cn": "塔帕", "ru": "Тха Пхра"}', true, 308, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_bang_phai', '{"th": "บางไผ่", "en": "Bang Phai", "cn": "邦派", "ru": "Банг Пхай"}', true, 309, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_phasi_charoen', '{"th": "ภาษีเจริญ", "en": "Phasi Charoen", "cn": "帕世乍能", "ru": "Пхаси Чароен"}', true, 310, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_bang_khae', '{"th": "บางแค", "en": "Bang Khae", "cn": "邦凯", "ru": "Банг Кэ"}', true, 311, '{"transit_type": "MRT"}'),
('TRANSIT_STATION', 'mrt_lak_song', '{"th": "หลักสอง", "en": "Lak Song", "cn": "叻松", "ru": "Лак Сонг"}', true, 312, '{"transit_type": "MRT"}'),

-- ==========================================
-- 🟣 MRT Purple Line
-- ==========================================
('TRANSIT_STATION', 'mrt_khlong_bang_phai', '{"th": "คลองบางไผ่", "en": "Khlong Bang Phai", "cn": "空邦派", "ru": "Клонг Банг Пхай"}', true, 395, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_talad_bang_yai', '{"th": "ตลาดบางใหญ่", "en": "Talad Bang Yai", "cn": "邦艾市场", "ru": "Talad Bang Yai"}', true, 396, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_sam_yaek_bang_yai', '{"th": "สามแยกบางใหญ่", "en": "Sam Yaek Bang Yai", "cn": "邦艾三岔路口", "ru": "Сам Йек Банг Яй"}', true, 397, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_bang_rak_noi_tha_it', '{"th": "บางรักน้อยท่าอิฐ", "en": "Bang Rak Noi Tha It", "cn": "邦叻内塔伊", "ru": "Банг Рак Ной Тха Ит"}', true, 398, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_sai_ma', '{"th": "ไทรม้า", "en": "Sai Ma", "cn": "赛马", "ru": "Сай Ма"}', true, 399, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_tao_poon', '{"th": "เตาปูน", "en": "Tao Poon", "cn": "涛本", "ru": "Таопун"}', true, 400, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_bang_son', '{"th": "บางซ่อน", "en": "Bang Son", "cn": "挽松", "ru": "Банг Сอน"}', true, 405, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_wongsawan', '{"th": "วงศ์สว่าง", "en": "Wongsawang", "cn": "翁萨旺", "ru": "Вонгсаванг"}', true, 410, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_yaek_tiwanon', '{"th": "แยกติวานนท์", "en": "Yaek Tiwanon", "cn": "提瓦农路口", "ru": "Перекресток Тиванон"}', true, 415, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_ministry_of_public_health', '{"th": "กระทรวงสาธารณสุข", "en": "Ministry of Public Health", "cn": "卫生部", "ru": "Министерство здравоохранения"}', true, 420, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_nonthaburi_civic_center', '{"th": "ศูนย์ราชการนนทบุรี", "en": "Nonthaburi Civic Center", "cn": "暖武里市政中心", "ru": "Гражданский центр Нонтхабури"}', true, 425, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_bang_krasor', '{"th": "บางกระสอ", "en": "Bang Krasor", "cn": "班格索", "ru": "Бангкрасо"}', true, 430, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_yaek_nonthaburi_1', '{"th": "แยกนนทบุรี 1", "en": "Yaek Nonthaburi 1", "cn": "暖武里1交叉口", "ru": "Перекресток Нонтхабури 1"}', true, 432, '{"transit_type": "MRT_PURPLE"}'),
('TRANSIT_STATION', 'mrt_phra_nang_klao', '{"th": "สะพานพระนั่งเกล้า", "en": "Phra Nang Klao Bridge", "cn": "帕喃告大桥", "ru": "Мост Пхра Нанг Клао"}', true, 435, '{"transit_type": "MRT_PURPLE"}'),

-- ==========================================
-- 🟡 MRT Yellow Line
-- ==========================================
('TRANSIT_STATION', 'mrt_yellow_lat_phrao', '{"th": "ลาดพร้าว (สายสีเหลือง)", "en": "Lat Phrao (Yellow Line)", "cn": "拉差达 (黄线)", "ru": "Латпхрау (Желтая линия)"}', true, 440, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_chok_chai_4', '{"th": "โชคชัย 4", "en": "Chok Chai 4", "cn": "措猜 4", "ru": "Чокчай 4"}', true, 442, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_bang_kapi', '{"th": "บางกะปิ", "en": "Bang Kapi", "cn": "邦甲比", "ru": "Бангкапи"}', true, 444, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_lam_sali', '{"th": "แยกลำสาลี", "en": "Lam Sali", "cn": "蓝萨利", "ru": "Лามสาลิ"}', true, 446, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_srinagarindra', '{"th": "ศรีนครินทร์ 38", "en": "Srinagarindra 38", "cn": "诗纳卡琳38", "ru": "Шринагариндра 38"}', true, 447, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_phatthanakan', '{"th": "พัฒนาการ", "en": "Phattanakan", "cn": "发展路", "ru": "Пхаттханакан"}', true, 448, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_kalantan', '{"th": "กลันตัน", "en": "Kalantan", "cn": "格兰丹", "ru": "Калантан"}', true, 449, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_sri_nut', '{"th": "ศรีนุช", "en": "Sri Nut", "cn": "诗努", "ru": "Шринут"}', true, 450, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_suan_luang_rama_9', '{"th": "สวนหลวง ร.9", "en": "Suan Luang Rama 9", "cn": "九世王公园", "ru": "Парк Рамы IX"}', true, 452, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_si_iam', '{"th": "ศรีเอี่ยม", "en": "Si Iam", "cn": "诗艾姆", "ru": "Шри-иам"}', true, 454, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_si_la_salle', '{"th": "ศรีลาซาล", "en": "Si La Salle", "cn": "诗拉萨", "ru": "Шри Ла Саль"}', true, 456, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_si_dan', '{"th": "ศรีด่าน", "en": "Si Dan", "cn": "诗丹", "ru": "Шри Дан"}', true, 457, '{"transit_type": "MRT_YELLOW"}'),
('TRANSIT_STATION', 'mrt_samrong_yellow', '{"th": "สำโรง (สายสีเหลือง)", "en": "Samrong (Yellow Line)", "cn": "三榕 (黄线)", "ru": "Самронг (Желтая)"}', true, 458, '{"transit_type": "MRT_YELLOW"}'),

-- ==========================================
-- 🩷 MRT Pink Line
-- ==========================================
('TRANSIT_STATION', 'mrt_pink_civic_center', '{"th": "ศูนย์ราชการนนทบุรี (สายสีชมพู)", "en": "Nonthaburi Civic Center (Pink)", "cn": "暖武里市政中心 (粉红)", "ru": "Гражданский центр Нонтхабури (Розовая)"}', true, 460, '{"transit_type": "MRT_PINK"}'),
('TRANSIT_STATION', 'mrt_pak_kret_bypass', '{"th": "เลี่ยงเมืองปากเกร็ด", "en": "Pak Kret Bypass", "cn": "白革绕道", "ru": "Объезд Паккрет"}', true, 462, '{"transit_type": "MRT_PINK"}'),
('TRANSIT_STATION', 'mrt_chaeng_watthana_14', '{"th": "แจ้งวัฒนะ 14", "en": "Chaeng Watthana 14", "cn": "江วัฒนะ 14", "ru": "Ченгваттхана 14"}', true, 464, '{"transit_type": "MRT_PINK"}'),
('TRANSIT_STATION', 'mrt_government_complex', '{"th": "ศูนย์ราชการเฉลิมพระเกียรติ", "en": "Government Complex", "cn": "政府综合大楼", "ru": "Правительственный комплекс"}', true, 466, '{"transit_type": "MRT_PINK"}'),
('TRANSIT_STATION', 'mrt_lak_si', '{"th": "หลักสี่ (สายสีชมพู)", "en": "Lak Si (Pink)", "cn": "拉席 (粉红)", "ru": "Лакси (Розовая)"}', true, 468, '{"transit_type": "MRT_PINK"}'),
('TRANSIT_STATION', 'mrt_wat_phra_sri_mahathat_pink', '{"th": "วัดพระศรีมหาธาตุ (สายสีชมพู)", "en": "Wat Phra Sri Mahathat (Pink)", "cn": "法寺 (粉红)", "ru": "Ват Пхра Шри Махатхат (Розовая)"}', true, 470, '{"transit_type": "MRT_PINK"}'),
('TRANSIT_STATION', 'mrt_ram_inthra_3', '{"th": "รามอินทรา 3", "en": "Ram Inthra 3", "cn": "兰茵他 3", "ru": "Рам Интхра 3"}', true, 471, '{"transit_type": "MRT_PINK"}'),
('TRANSIT_STATION', 'mrt_vacharaphol', '{"th": "วัชรพล", "en": "Vacharaphol", "cn": "瓦查拉蓬", "ru": "Вачарапхон"}', true, 472, '{"transit_type": "MRT_PINK"}'),
('TRANSIT_STATION', 'mrt_nopparat', '{"th": "นพรัตน์", "en": "Nopparat", "cn": "诺帕拉", "ru": "Ноппарат"}', true, 473, '{"transit_type": "MRT_PINK"}'),
('TRANSIT_STATION', 'mrt_min_buri', '{"th": "มีนบุรี", "en": "Min Buri", "cn": "民武里", "ru": "Минбури"}', true, 474, '{"transit_type": "MRT_PINK"}'),

-- ==========================================
-- ✈️ Airport Rail Link (ARL)
-- ==========================================
('TRANSIT_STATION', 'arl_phaya_thai', '{"th": "พญาไท (ARL)", "en": "Phaya Thai (ARL)", "cn": "披耶泰 (ARL)", "ru": "Пхаятхаи (ARL)"}', true, 500, '{"transit_type": "ARL"}'),
('TRANSIT_STATION', 'arl_ratchaprarop', '{"th": "ราชปรารภ", "en": "Ratchaprarop", "cn": "拉差巴洛", "ru": "Ратчапрароп"}', true, 510, '{"transit_type": "ARL"}'),
('TRANSIT_STATION', 'arl_makkasan', '{"th": "มักกะสัน (ARL)", "en": "Makkasan (ARL)", "cn": "目甲讪 (ARL)", "ru": "Маккасан (ARL)"}', true, 520, '{"transit_type": "ARL"}'),
('TRANSIT_STATION', 'arl_ramkhamhaeng', '{"th": "รามคำแหง", "en": "Ramkhamhaeng (ARL)", "cn": "兰甘亨 (ARL)", "ru": "Рамкхамхенг"}', true, 525, '{"transit_type": "ARL"}'),
('TRANSIT_STATION', 'arl_hua_mak', '{"th": "หัวหมาก (ARL)", "en": "Hua Mak (ARL)", "cn": "华目 (ARL)", "ru": "Хуа Мак (ARL)"}', true, 530, '{"transit_type": "ARL"}'),
('TRANSIT_STATION', 'arl_ban_thap_chang', '{"th": "บ้านทับช้าง", "en": "Ban Thap Chang", "cn": "班塔昌", "ru": "Бан Тхап Чанг"}', true, 532, '{"transit_type": "ARL"}'),
('TRANSIT_STATION', 'arl_lat_krabang', '{"th": "ลาดกระบัง", "en": "Lat Krabang (ARL)", "cn": "拉格拉邦 (ARL)", "ru": "Латкрабанг"}', true, 535, '{"transit_type": "ARL"}'),
('TRANSIT_STATION', 'arl_suvarnabhumi', '{"th": "สุวรรณภูมิ", "en": "Suvarnabhumi Airport", "cn": "素万那普机场", "ru": "Аэропорт Суварнабхуми"}', true, 540, '{"transit_type": "ARL"}'),

-- ==========================================
-- 🪙 Gold Line
-- ==========================================
('TRANSIT_STATION', 'gold_krung_thon_buri', '{"th": "กรุงธนบุรี (สายสีทอง)", "en": "Krung Thon Buri (Gold)", "cn": "吞武里 (金线)", "ru": "Крунг Тхон Бури (Золотая)"}', true, 545, '{"transit_type": "GOLD"}'),
('TRANSIT_STATION', 'gold_charoen_nakhon', '{"th": "เจริญนคร (ไอคอนสยาม)", "en": "Charoen Nakhon (IconSiam)", "cn": "韶华路 (IconSiam)", "ru": "Чароен Накхон (ИконСиам)"}', true, 550, '{"transit_type": "GOLD"}'),
('TRANSIT_STATION', 'gold_khlong_san', '{"th": "คลองสาน", "en": "Khlong San", "cn": "空讪", "ru": "Клонг Сан"}', true, 560, '{"transit_type": "GOLD"}'),

-- ==========================================
-- 🔴 SRT Red Line (Dark/Light)
-- ==========================================
('TRANSIT_STATION', 'srt_taling_chan', '{"th": "ตลิ่งชัน", "en": "Taling Chan", "cn": "大林江", "ru": "Талинг Чан"}', true, 565, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_bang_bamru', '{"th": "บางบำหรุ", "en": "Bang Bamru", "cn": "邦班鲁", "ru": "Банг Бамру"}', true, 566, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_krung_thep_aphiwat', '{"th": "สถานีกลางกรุงเทพอภิวัฒน์", "en": "Krung Thep Aphiwat Central Terminal", "cn": "曼谷阿皮瓦中央车站", "ru": "Центральный вокзал Крунг Тхеп Апхиват"}', true, 570, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_chatuchak', '{"th": "จตุจักร (สายสีแดง)", "en": "Chatuchak (Red Line)", "cn": "乍都乍 (红线)", "ru": "Чатучак (Красная линия)"}', true, 572, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_wat_samian_nari', '{"th": "วัดเสมียนนารี", "en": "Wat Samian Nari", "cn": "萨米安娜丽寺", "ru": "Ват Самиан Нари"}', true, 574, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_bang_khen', '{"th": "บางเขน", "en": "Bang Khen", "cn": "邦肯", "ru": "Банг Кхен"}', true, 576, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_thung_song_hong', '{"th": "ทุ่งสองห้อง", "en": "Thung Song Hong", "cn": "通颂洪", "ru": "Тхунг Сонг Хонг"}', true, 577, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_lak_si', '{"th": "หลักสี่ (สายสีแดง)", "en": "Lak Si (Red Line)", "cn": "拉席 (红线)", "ru": "Lакси (Красная линия)"}', true, 578, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_don_mueang', '{"th": "ดอนเมือง (สายสีแดง)", "en": "Don Mueang (Red Line)", "cn": "廊曼 (红线)", "ru": "Донмыанг (Красная линия)"}', true, 580, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_kan_kheha', '{"th": "การเคหะ", "en": "Kan Kheha", "cn": "甘克哈", "ru": "Кан Кеха"}', true, 582, '{"transit_type": "SRT_RED"}'),
('TRANSIT_STATION', 'srt_rangsit', '{"th": "รังสิต", "en": "Rangsit", "cn": "兰实", "ru": "Рангсит"}', true, 585, '{"transit_type": "SRT_RED"}'),

-- ==========================================
-- 🚌 BRT Bus Line
-- ==========================================
('TRANSIT_STATION', 'brt_sathorn', '{"th": "สาทร (BRT)", "en": "Sathorn (BRT)", "cn": "沙าทร (BRT)", "ru": "Саторн (BRT)"}', true, 600, '{"transit_type": "BRT"}'),
('TRANSIT_STATION', 'brt_akhan_songkhro', '{"th": "อาคารสงเคราะห์", "en": "Akhan Songkhro", "cn": "阿坎松科", "ru": "Акхан Сонгкро"}', true, 602, '{"transit_type": "BRT"}'),
('TRANSIT_STATION', 'brt_technic_krungthep', '{"th": "เทคนิคกรุงเทพ", "en": "Technic Krungthep", "cn": "曼谷技术学院", "ru": "Техник Крунгтхеп"}', true, 604, '{"transit_type": "BRT"}'),
('TRANSIT_STATION', 'brt_thanon_chan', '{"th": "ถนนจันทน์", "en": "Thanon Chan", "cn": "真路", "ru": "Тханон Чан"}', true, 606, '{"transit_type": "BRT"}'),
('TRANSIT_STATION', 'brt_nararam_3', '{"th": "นราราม 3", "en": "Nararam 3", "cn": "娜拉然 3", "ru": "Нарарам 3"}', true, 608, '{"transit_type": "BRT"}'),
('TRANSIT_STATION', 'brt_wat_dan', '{"th": "วัดด่าน", "en": "Wat Dan", "cn": "丹寺", "ru": "Ват Дан"}', true, 609, '{"transit_type": "BRT"}'),
('TRANSIT_STATION', 'brt_ratchaphruek', '{"th": "ราชพฤกษ์ (BRT)", "en": "Ratchaphruek (BRT)", "cn": "拉差พฤกษ์ (BRT)", "ru": "Ратчапхрык (BRT)"}', true, 610, '{"transit_type": "BRT"}')

ON CONFLICT (type, code) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  metadata = COALESCE(ref_master_data.metadata, '{}'::jsonb) || EXCLUDED.metadata;
