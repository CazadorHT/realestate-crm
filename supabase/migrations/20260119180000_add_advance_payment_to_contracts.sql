-- Migration to add advance_payment_amount to rental_contracts
ALTER TABLE IF EXISTS rental_contracts
  ADD COLUMN IF NOT EXISTS advance_payment_amount numeric(12,2);

-- Update the check constraint if needed for future validations
-- (Already handled by Zod, but good for DB integrity)
COMMENT ON COLUMN rental_contracts.advance_payment_amount IS 'Amount paid in advance for the contract';
