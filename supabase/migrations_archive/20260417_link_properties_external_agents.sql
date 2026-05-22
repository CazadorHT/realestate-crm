-- Add external_agent_id to properties table for centralized directory linking
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS external_agent_id UUID REFERENCES public.external_agents(id) ON DELETE SET NULL;

-- Create Index for performance
CREATE INDEX IF NOT EXISTS idx_properties_external_agent ON public.properties(external_agent_id);

-- Update RLS if needed (usually inherit from parent)
-- No specific RLS needed here as the relation is simple
