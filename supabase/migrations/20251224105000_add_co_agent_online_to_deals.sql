-- Add co_agent_online column to deals if missing

ALTER TABLE IF EXISTS deals
  ADD COLUMN IF NOT EXISTS co_agent_online text;

-- No-op if exists; this will allow inserts/updates that set co_agent_online
