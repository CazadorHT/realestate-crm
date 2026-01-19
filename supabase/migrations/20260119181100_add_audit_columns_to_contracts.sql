-- Migration to add missing audit columns to rental_contracts
ALTER TABLE rental_contracts 
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Ensure the trigger exists and is correctly configured
CREATE OR REPLACE FUNCTION rct_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rct_set_updated_at ON rental_contracts;
CREATE TRIGGER rct_set_updated_at
BEFORE UPDATE ON rental_contracts
FOR EACH ROW
EXECUTE PROCEDURE rct_updated_at_trigger();
