-- ====================================================================
-- 💬 V3 Restore: LINE Templates Table & Policies
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.line_templates (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS
ALTER TABLE public.line_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "line_templates_select_optimized" ON public.line_templates;
DROP POLICY IF EXISTS "line_templates_insert_optimized" ON public.line_templates;
DROP POLICY IF EXISTS "line_templates_update_optimized" ON public.line_templates;
DROP POLICY IF EXISTS "line_templates_delete_optimized" ON public.line_templates;
DROP POLICY IF EXISTS "Line Templates: Admin manage" ON public.line_templates;
DROP POLICY IF EXISTS "Line Templates: Everyone see" ON public.line_templates;

-- Create policies matching standard CRM behavior
CREATE POLICY "line_templates_select_optimized" ON public.line_templates 
    FOR SELECT USING (true);

CREATE POLICY "line_templates_insert_optimized" ON public.line_templates 
    FOR INSERT WITH CHECK ((SELECT public.is_system_admin()));

CREATE POLICY "line_templates_update_optimized" ON public.line_templates 
    FOR UPDATE USING ((SELECT public.is_system_admin()));

CREATE POLICY "line_templates_delete_optimized" ON public.line_templates 
    FOR DELETE USING ((SELECT public.is_system_admin()));

-- Grant permissions to roles
GRANT ALL ON public.line_templates TO authenticated;
GRANT ALL ON public.line_templates TO service_role;
GRANT SELECT ON public.line_templates TO anon;
