-- Add support for DOCX templates
ALTER TABLE "public"."contract_templates"
ADD COLUMN "file_url" text,
ADD COLUMN "template_format" text DEFAULT 'HTML'::text;
