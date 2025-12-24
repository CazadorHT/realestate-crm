-- Create rental_contracts table

CREATE TABLE IF NOT EXISTS rental_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
  contract_number text,
  rent_price numeric(12,2),
  lease_term_months integer,
  start_date date,
  end_date date,
  check_in_date date,
  check_out_date date,
  deposit_amount numeric(12,2),
  payment_cycle text,
  notice_period_days integer,
  other_terms text,
  status text NOT NULL DEFAULT 'DRAFT',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for queries by status
CREATE INDEX IF NOT EXISTS idx_rental_contracts_status ON rental_contracts(status);

-- Constraint for status values
ALTER TABLE rental_contracts
  ADD CONSTRAINT rental_contracts_status_check CHECK (status IN ('DRAFT','ACTIVE','TERMINATED'));

-- Trigger to update updated_at on row change
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

-- Note: We do not enforce deal_type='RENT' at DB level to avoid cross-table constraint complexity;
-- this business rule is enforced in application layer (actions) and tests.
