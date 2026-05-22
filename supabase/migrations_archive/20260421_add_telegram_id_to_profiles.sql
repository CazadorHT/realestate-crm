-- Add telegram_id to profiles table for Back-office bot authentication
-- Also ensures we have an index for lookup by telegram_id

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'telegram_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN telegram_id TEXT;
    CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);
  END IF;
END $$;
