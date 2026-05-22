-- 🛡️ Add AI Summary column to leads table for "Analyze Once, Read Many" strategy
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS ai_summary_content TEXT;

COMMENT ON COLUMN public.leads.ai_summary_content IS 'AI-generated summary of lead requirements and activities. Used for instant render and context.';
