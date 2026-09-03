-- Migration: Add parent_id to popular_areas_v3 and configure initial hierarchy

-- 1. Add parent_id column and index
ALTER TABLE public.popular_areas_v3
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.popular_areas_v3(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_popular_areas_v3_parent_id
  ON public.popular_areas_v3(parent_id);

-- 2. Link child areas to their respective parent areas based on name
DO $$
DECLARE
  v_parent_id UUID;
BEGIN
  -- กรุงเทพกรีฑา -> กรุงเทพกรีฑาตัดใหม่
  SELECT id INTO v_parent_id FROM public.popular_areas_v3 
  WHERE (name->>'th' = 'กรุงเทพกรีฑา' OR name_th = 'กรุงเทพกรีฑา' OR slug = 'krungthep-kreetha') 
  LIMIT 1;
  IF v_parent_id IS NOT NULL THEN
    UPDATE public.popular_areas_v3 
    SET parent_id = v_parent_id 
    WHERE (name->>'th' = 'กรุงเทพกรีฑาตัดใหม่' OR name_th = 'กรุงเทพกรีฑาตัดใหม่' OR slug = 'krungthep-kreetha-new-road')
    AND id <> v_parent_id;
  END IF;

  -- พระราม 4 -> พระราม 4 - คลองเตย
  SELECT id INTO v_parent_id FROM public.popular_areas_v3 
  WHERE (name->>'th' = 'พระราม 4' OR name_th = 'พระราม 4' OR slug ILIKE 'rama-4%') 
  LIMIT 1;
  IF v_parent_id IS NOT NULL THEN
    UPDATE public.popular_areas_v3 
    SET parent_id = v_parent_id 
    WHERE (name->>'th' ILIKE 'พระราม 4 -%' OR name_th ILIKE 'พระราม 4 -%' OR name_en ILIKE 'Rama 4 -%')
    AND id <> v_parent_id;
  END IF;

  -- สุขุมวิท -> พร้อมพงษ์, ทองหล่อ, เอกมัย, อโศก, นานา
  SELECT id INTO v_parent_id FROM public.popular_areas_v3 
  WHERE (name->>'th' = 'สุขุมวิท' OR name_th = 'สุขุมวิท' OR slug = 'sukhumvit') 
  LIMIT 1;
  IF v_parent_id IS NOT NULL THEN
    UPDATE public.popular_areas_v3 
    SET parent_id = v_parent_id 
    WHERE (name->>'th' IN ('พร้อมพงษ์', 'ทองหล่อ', 'เอกมัย', 'อโศก', 'นานา') 
        OR name_th IN ('พร้อมพงษ์', 'ทองหล่อ', 'เอกมัย', 'อโศก', 'นานา'))
    AND id <> v_parent_id;
  END IF;

  -- สาทร -> ช่องนนทรี, สุรศักดิ์, ถนนจันทน์
  SELECT id INTO v_parent_id FROM public.popular_areas_v3 
  WHERE (name->>'th' = 'สาทร' OR name_th = 'สาทร' OR slug = 'sathorn') 
  LIMIT 1;
  IF v_parent_id IS NOT NULL THEN
    UPDATE public.popular_areas_v3 
    SET parent_id = v_parent_id 
    WHERE (name->>'th' IN ('ช่องนนทรี', 'สุรศักดิ์', 'ถนนจันทน์') 
        OR name_th IN ('ช่องนนทรี', 'สุรศักดิ์', 'ถนนจันทน์'))
    AND id <> v_parent_id;
  END IF;

  -- ชิดลม - เพลินจิต -> ชิดลม, เพลินจิต
  SELECT id INTO v_parent_id FROM public.popular_areas_v3 
  WHERE (name->>'th' = 'ชิดลม - เพลินจิต' OR name_th = 'ชิดลม - เพลินจิต' OR slug = 'chidlom-ploenchit') 
  LIMIT 1;
  IF v_parent_id IS NOT NULL THEN
    UPDATE public.popular_areas_v3 
    SET parent_id = v_parent_id 
    WHERE (name->>'th' IN ('ชิดลม', 'เพลินจิต') 
        OR name_th IN ('ชิดลม', 'เพลินจิต'))
    AND id <> v_parent_id;
  END IF;
END $$;
