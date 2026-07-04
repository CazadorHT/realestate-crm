-- Migrate any legacy deals with 'WON' status to 'CLOSED_WIN'
UPDATE "public"."crm_deals_v3"
SET status = 'CLOSED_WIN'
WHERE status = 'WON';
