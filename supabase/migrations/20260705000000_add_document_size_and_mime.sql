-- Migration to add size_bytes and mime_type to documents_v3 and update documents view

ALTER TABLE "public"."documents_v3" ADD COLUMN IF NOT EXISTS "size_bytes" bigint DEFAULT 0;
ALTER TABLE "public"."documents_v3" ADD COLUMN IF NOT EXISTS "mime_type" text;

CREATE OR REPLACE VIEW "public"."documents" WITH ("security_invoker"='true') AS
 SELECT id,
    tenant_id,
    owner_entity AS owner_type,
    owner_id,
    document_type,
    file_name,
    storage_path,
    is_encrypted,
    esign_envelope_id,
    esign_provider,
    esign_status,
    esign_signed_at,
    ai_summary,
    ai_verified_status,
    created_at,
    mime_type,
    size_bytes,
    1 AS version,
    NULL::uuid AS parent_id
   FROM public.documents_v3;
