-- Add RENTAL_CONTRACT to document_owner_type enum

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'document_owner_type' AND e.enumlabel = 'RENTAL_CONTRACT'
  ) THEN
    ALTER TYPE document_owner_type ADD VALUE 'RENTAL_CONTRACT';
  END IF;
END$$;
