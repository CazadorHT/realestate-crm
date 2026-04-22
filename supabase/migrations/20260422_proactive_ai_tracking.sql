-- 🛡️ Hardening Property View Logs for AI Agent
-- This migration adds identity tracking to view logs to enable Proactive AI Agent follow-ups.

-- 1. Add identity columns
ALTER TABLE public.property_views_log 
ADD COLUMN IF NOT EXISTS visitor_id TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Add indexes for identity-based queries
CREATE INDEX IF NOT EXISTS idx_property_views_log_visitor_id ON public.property_views_log(visitor_id);
CREATE INDEX IF NOT EXISTS idx_property_views_log_user_id ON public.property_views_log(user_id);

-- 3. Create a table to track proactive triggers (for cool-down logic)
CREATE TABLE IF NOT EXISTS public.proactive_agent_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    visitor_id TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    triggered_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proactive_triggers_lookup ON public.proactive_agent_triggers(property_id, visitor_id, user_id);

-- 4. Update the increment function to support identity and cool-down
DROP FUNCTION IF EXISTS public.increment_property_view(uuid);

CREATE OR REPLACE FUNCTION public.increment_property_view(
    p_property_id uuid,
    p_visitor_id text DEFAULT NULL,
    p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
    success boolean,
    trigger_proactive_agent boolean
) AS $$
DECLARE
  v_tenant_id uuid;
  v_view_count bigint;
  v_last_trigger_at timestamptz;
BEGIN
  -- Get the tenant_id first
  SELECT tenant_id INTO v_tenant_id 
  FROM public.properties 
  WHERE id = p_property_id;

  -- 1. Increment total view_count on property
  UPDATE public.properties 
  SET view_count = COALESCE(view_count, 0) + 1,
      updated_at = now()
  WHERE id = p_property_id;

  -- 2. Log the individual view event with identity
  INSERT INTO public.property_views_log (property_id, tenant_id, visitor_id, user_id, created_at)
  VALUES (p_property_id, v_tenant_id, p_visitor_id, p_user_id, now());

  -- 3. Check Cool-down Period (e.g., 2 hours)
  SELECT triggered_at INTO v_last_trigger_at
  FROM public.proactive_agent_triggers
  WHERE property_id = p_property_id
    AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND visitor_id = p_visitor_id)
    )
  ORDER BY triggered_at DESC
  LIMIT 1;

  -- If we triggered recently, don't trigger again
  IF v_last_trigger_at IS NOT NULL AND v_last_trigger_at > now() - interval '2 hours' THEN
    RETURN QUERY SELECT true, false;
    RETURN;
  END IF;

  -- 4. Check for Proactive Threshold (e.g., 3 views in last 24h)
  SELECT count(*) INTO v_view_count
  FROM public.property_views_log
  WHERE property_id = p_property_id
    AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND visitor_id = p_visitor_id)
    )
    AND created_at > now() - interval '24 hours';

  -- 5. Trigger and Record if threshold met
  IF v_view_count >= 3 THEN
    INSERT INTO public.proactive_agent_triggers (property_id, visitor_id, user_id, triggered_at)
    VALUES (p_property_id, p_visitor_id, p_user_id, now());
    
    RETURN QUERY SELECT true, true;
  ELSE
    RETURN QUERY SELECT true, false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
