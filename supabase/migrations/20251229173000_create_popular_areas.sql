-- Create popular_areas table
CREATE TABLE IF NOT EXISTS public.popular_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.popular_areas ENABLE ROW LEVEL SECURITY;

-- Select policy: everyone can read
CREATE POLICY "Allow public read access" ON public.popular_areas
  FOR SELECT TO public USING (true);

-- Insert policy: authenticated users can insert
CREATE POLICY "Allow authenticated insert" ON public.popular_areas
  FOR INSERT TO authenticated WITH CHECK (true);

-- Insert initial data from labels.ts
INSERT INTO public.popular_areas (name)
VALUES
  ('อ่อนนุช'), ('บางนา'), ('ลาดพร้าว'), ('พระราม9'), ('สุขุมวิท'),
  ('อารีย์'), ('ทองหล่อ'), ('เอกมัย'), ('สยาม'), ('รัชดา'),
  ('ปิ่นเกล้า'), ('นนทบุรี'), ('รามอินทรา'), ('สาทร'), ('สีลม'),
  ('พญาไท'), ('ราชเทวี'), ('สะพานควาย'), ('พหลโยธิน'), ('เจริญกรุง'),
  ('พัฒนาการ'), ('ศรีนครินทร์'), ('เพชรบุรี'), ('พร้อมพงษ์'), ('นานา'), ('อโศก')
ON CONFLICT (name) DO NOTHING;
