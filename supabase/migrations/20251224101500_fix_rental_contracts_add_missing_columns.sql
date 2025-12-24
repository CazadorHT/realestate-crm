-- Fix migration: add missing columns and constraints to rental_contracts (idempotent)

-- Add columns if they don't exist
ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS contract_number text;

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS rent_price numeric(12,2);

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS lease_term_months integer;

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS start_date date;

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS end_date date;

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS check_in_date date;

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS check_out_date date;

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS deposit_amount numeric(12,2);

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS payment_cycle text;

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS notice_period_days integer;

ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS other_terms text;

-- Ensure status column exists with default
ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'DRAFT';

-- If status column was added without NOT NULL, enforce NOT NULL and default
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rental_contracts' AND column_name='status') THEN
    ALTER TABLE rental_contracts ALTER COLUMN status SET DEFAULT 'DRAFT';
    -- set existing NULLs to default
    UPDATE rental_contracts SET status = 'DRAFT' WHERE status IS NULL;
    ALTER TABLE rental_contracts ALTER COLUMN status SET NOT NULL;
  END IF;
END;
$$;

-- Migrate from old column names if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rental_contracts' AND column_name='term_months')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rental_contracts' AND column_name='lease_term_months') THEN
    ALTER TABLE rental_contracts ADD COLUMN lease_term_months integer;
    UPDATE rental_contracts SET lease_term_months = term_months WHERE term_months IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rental_contracts' AND column_name='rent_amount')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rental_contracts' AND column_name='rent_price') THEN
    ALTER TABLE rental_contracts ADD COLUMN rent_price numeric(12,2);
    UPDATE rental_contracts SET rent_price = rent_amount WHERE rent_amount IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rental_contracts' AND column_name='deposit')
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rental_contracts' AND column_name='deposit_amount') THEN
    ALTER TABLE rental_contracts ADD COLUMN deposit_amount numeric(12,2);
    UPDATE rental_contracts SET deposit_amount = deposit WHERE deposit IS NOT NULL;
  END IF;
END;
$$;

-- Index for queries by status
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status ON rental_contracts(status);

-- Add constraint for status values if not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rental_contracts_status_check') THEN
    ALTER TABLE rental_contracts ADD CONSTRAINT rental_contracts_status_check CHECK (status IN ('DRAFT','ACTIVE','TERMINATED'));
  END IF;
END;
$$;

-- Trigger to update updated_at on row change: create function and trigger if missing
CREATE OR REPLACE FUNCTION rct_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'rct_set_updated_at') THEN
    CREATE TRIGGER rct_set_updated_at
      BEFORE UPDATE ON rental_contracts
      FOR EACH ROW
      EXECUTE PROCEDURE rct_updated_at_trigger();
  END IF;
END;
$$;