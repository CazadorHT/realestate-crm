-- Create banks table if not exists
CREATE TABLE IF NOT EXISTS banks (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,       -- รหัสย่อธนาคาร เช่น KBANK, SCB, BBL
    name_th VARCHAR(255) NOT NULL,          -- ชื่อภาษาไทย
    name_en VARCHAR(255) NOT NULL,          -- ชื่อภาษาอังกฤษ
    is_active BOOLEAN DEFAULT TRUE,         -- สถานะเปิดใช้งาน
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed major Thai banks
INSERT INTO banks (code, name_th, name_en, is_active)
VALUES
  ('KBANK', 'ธนาคารกสิกรไทย', 'Kasikornbank', true),
  ('SCB', 'ธนาคารไทยพาณิชย์', 'Siam Commercial Bank', true),
  ('BBL', 'ธนาคารกรุงเทพ', 'Bangkok Bank', true),
  ('KTB', 'ธนาคารกรุงไทย', 'Krung Thai Bank', true),
  ('BAY', 'ธนาคารกรุงศรีอยุธยา', 'Bank of Ayudhya', true),
  ('TTB', 'ธนาคารทหารไทยธนชาต', 'TMBThanachart Bank', true),
  ('GSB', 'ธนาคารออมสิน', 'Government Savings Bank', true),
  ('BAAC', 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', 'Bank for Agriculture and Agricultural Cooperatives', true),
  ('UOB', 'ธนาคารยูโอบี', 'United Overseas Bank', true),
  ('CIMBT', 'ธนาคารซีไอเอ็มบี ไทย', 'CIMB Thai Bank', true),
  ('LHB', 'ธนาคารแลนด์ แอนด์ เฮ้าส์', 'Land and Houses Bank', true),
  ('KKP', 'ธนาคารเกียรตินาคินภัทร', 'Kiatnakin Phatra Bank', true)
ON CONFLICT (code) DO UPDATE
SET
  name_th = EXCLUDED.name_th,
  name_en = EXCLUDED.name_en,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
