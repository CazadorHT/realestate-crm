-- =========================================================================
-- FIX CHINESE LOCALIZATION FOR POPULAR AREAS AND TRANSIT STATIONS
-- Migration: 20261111000000_fix_chinese_popular_areas_and_stations.sql
-- Description:
--   1. Corrects erroneous and inconsistent Chinese transliterations in popular_areas_v3 (JSONB name).
--   2. Updates BTS Asok station name in ref_master_data to official '阿速 (Asok)'.
--   3. Synchronizes popular_area_cn in public.properties to match standard translations.
-- =========================================================================

-- 1. Update popular_areas_v3 table (JSONB name->>'cn')
UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"强瓦塔纳"')
WHERE COALESCE(name->>'th', name->>'default') = 'แจ้งวัฒนะ';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"兰印他高速沿线"')
WHERE COALESCE(name->>'th', name->>'default') = 'เลียบด่วนรามอินทรา';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"曼谷格里塔"')
WHERE COALESCE(name->>'th', name->>'default') = 'กรุงเทพกรีฑา';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"新曼谷格里塔路"')
WHERE COALESCE(name->>'th', name->>'default') = 'กรุงเทพกรีฑาตัดใหม่';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"邦莫"')
WHERE COALESCE(name->>'th', name->>'default') = 'บางมด';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"奔集"')
WHERE COALESCE(name->>'th', name->>'default') = 'เพลินจิต';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"农业大学"')
WHERE COALESCE(name->>'th', name->>'default') = 'เกษตร';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"诗纳卡琳"')
WHERE COALESCE(name->>'th', name->>'default') = 'ศรีนครินทร์';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"诗纳卡琳 - 邦纳"')
WHERE COALESCE(name->>'th', name->>'default') = 'ศรีนครินทร์ - บางนา';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"兰印他"')
WHERE COALESCE(name->>'th', name->>'default') = 'รามอินทรา';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"邦纳"')
WHERE COALESCE(name->>'th', name->>'default') = 'บางนา';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"亿甲迈"')
WHERE COALESCE(name->>'th', name->>'default') = 'เอกมัย';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"亿甲迈 – 通罗"')
WHERE COALESCE(name->>'th', name->>'default') = 'เอกมัย – ทองหล่อ';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"亿甲迈 - 兰印他"')
WHERE COALESCE(name->>'th', name->>'default') = 'เอกมัย - รามอินทรา';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"叻抛五岔路口"')
WHERE COALESCE(name->>'th', name->>'default') = 'ห้าแยกลาดพร้าว';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"乌东素"')
WHERE COALESCE(name->>'th', name->>'default') = 'อุดมสุข';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"邦汶"')
WHERE COALESCE(name->>'th', name->>'default') = 'บางบอน';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"拉差达"')
WHERE COALESCE(name->>'th', name->>'default') = 'รัชดา';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"拉差帕颂 - 奇隆"')
WHERE COALESCE(name->>'th', name->>'default') = 'ราชประสงค์ - ชิดลม';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"拉塔纳提贝"')
WHERE COALESCE(name->>'th', name->>'default') = 'รัตนาธิเบศร์';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"普拉查春"')
WHERE COALESCE(name->>'th', name->>'default') = 'ประชาชื่น';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"大环圈"')
WHERE COALESCE(name->>'th', name->>'default') = 'วงเวียนใหญ่';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"石龙军路"')
WHERE COALESCE(name->>'th', name->>'default') = 'เจริญกรุง';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"辉煌"')
WHERE COALESCE(name->>'th', name->>'default') = 'ห้วยขวาง';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"瑟里泰 - 尼达"')
WHERE COALESCE(name->>'th', name->>'default') = 'เสรีไทย - นิด้า';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"拉差普鲁"')
WHERE COALESCE(name->>'th', name->>'default') = 'ราชพฤกษ์';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"普陀蒙通"')
WHERE COALESCE(name->>'th', name->>'default') = 'พุทธมณฑล';

UPDATE public.popular_areas_v3
SET name = jsonb_set(name, '{cn}', '"沙攀松"')
WHERE COALESCE(name->>'th', name->>'default') = 'สะพานสูง';

-- 2. Update BTS Asok in ref_master_data
UPDATE public.ref_master_data
SET label = jsonb_set(label, '{cn}', '"阿速 (Asok)"')
WHERE code = 'bts_asok' AND type = 'TRANSIT_STATION';

-- 3. Synchronize properties_details table (address_info->'popular_area_cn')
UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"强瓦塔纳"')
WHERE address_info->>'popular_area' = 'แจ้งวัฒนะ';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"兰印他高速沿线"')
WHERE address_info->>'popular_area' = 'เลียบด่วนรามอินทรา';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"曼谷格里塔"')
WHERE address_info->>'popular_area' = 'กรุงเทพกรีฑา';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"新曼谷格里塔路"')
WHERE address_info->>'popular_area' = 'กรุงเทพกรีฑาตัดใหม่';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"邦莫"')
WHERE address_info->>'popular_area' = 'บางมด';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"奔集"')
WHERE address_info->>'popular_area' = 'เพลินจิต';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"农业大学"')
WHERE address_info->>'popular_area' = 'เกษตร';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"诗纳卡琳"')
WHERE address_info->>'popular_area' = 'ศรีนครินทร์';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"诗纳卡琳 - 邦纳"')
WHERE address_info->>'popular_area' = 'ศรีนครินทร์ - บางนา';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"兰印他"')
WHERE address_info->>'popular_area' = 'รามอินทรา';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"邦纳"')
WHERE address_info->>'popular_area' = 'บางนา';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"亿甲迈"')
WHERE address_info->>'popular_area' = 'เอกมัย';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"叻抛五岔路口"')
WHERE address_info->>'popular_area' = 'ห้าแยกลาดพร้าว';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"乌东素"')
WHERE address_info->>'popular_area' = 'อุดมสุข';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"邦汶"')
WHERE address_info->>'popular_area' = 'บางบอน';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"拉差达"')
WHERE address_info->>'popular_area' = 'รัชดา';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"拉差帕颂 - 奇隆"')
WHERE address_info->>'popular_area' = 'ราชประสงค์ - ชิดลม';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"拉塔纳提贝"')
WHERE address_info->>'popular_area' = 'รัตนาธิเบศร์';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"普拉查春"')
WHERE address_info->>'popular_area' = 'ประชาชื่น';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"大环圈"')
WHERE address_info->>'popular_area' = 'วงเวียนใหญ่';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"石龙军路"')
WHERE address_info->>'popular_area' = 'เจริญกรุง';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"辉煌"')
WHERE address_info->>'popular_area' = 'ห้วยขวาง';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"瑟里泰 - 尼达"')
WHERE address_info->>'popular_area' = 'เสรีไทย - นิด้า';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"拉差普鲁"')
WHERE address_info->>'popular_area' = 'ราชพฤกษ์';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"普陀蒙通"')
WHERE address_info->>'popular_area' = 'พุทธมณฑล';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"沙攀松"')
WHERE address_info->>'popular_area' = 'สะพานสูง';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"阿速"')
WHERE address_info->>'popular_area' = 'อโศก';

UPDATE public.properties_details
SET address_info = jsonb_set(address_info, '{popular_area_cn}', '"安努"')
WHERE address_info->>'popular_area' = 'อ่อนนุช';
