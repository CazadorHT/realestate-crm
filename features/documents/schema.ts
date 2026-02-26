import { z } from "zod";
import { Database } from "@/lib/database.types";

export type DocumentType = Database["public"]["Enums"]["document_type"];
export type DocumentOwnerType =
  Database["public"]["Enums"]["document_owner_type"];

export const DocumentTypeEnum = z.enum([
  "ID_CARD",
  "PASSPORT",
  "COMPANY_REGISTRATION",
  "LEASE_CONTRACT",
  "SALE_CONTRACT",
  "TITLE_DEED",
  "OTHER",
  "RESERVATION_DOCUMENT",
]);

export const DocumentOwnerTypeEnum = z.enum([
  "LEAD",
  "PROPERTY",
  "DEAL",
  "RENTAL_CONTRACT",
]);

export const createDocumentSchema = z.object({
  owner_id: z.string().uuid(),
  owner_type: DocumentOwnerTypeEnum,
  document_type: DocumentTypeEnum,
  file_name: z.string().min(1),
  storage_path: z.string().min(1),
  size_bytes: z.number().optional(),
  mime_type: z.string().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  version: z.number().optional().default(1),
});

export type CreateDocumentInput = z.input<typeof createDocumentSchema>;

// Contract Template Schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  type: DocumentTypeEnum,
  is_active: z.boolean().default(true),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.partial();
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
