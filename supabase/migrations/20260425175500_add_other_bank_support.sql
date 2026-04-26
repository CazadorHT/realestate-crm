-- Add support for "Other" bank option
INSERT INTO public.ref_banks (code, name_th, name_en) 
VALUES ('OTHER', 'อื่นๆ (โปรดระบุ)', 'Other Bank')
ON CONFLICT (code) DO NOTHING;

-- Add other_bank_name to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS other_bank_name text;

-- Add other_bank_name to co_brokers for consistency
ALTER TABLE public.co_brokers 
ADD COLUMN IF NOT EXISTS other_bank_name text;

COMMENT ON COLUMN public.profiles.other_bank_name IS 'Name of bank if bank_code is OTHER';
COMMENT ON COLUMN public.co_brokers.other_bank_name IS 'Name of bank if bank_code is OTHER';
