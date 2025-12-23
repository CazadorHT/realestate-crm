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
]);

export const DocumentOwnerTypeEnum = z.enum(["LEAD", "PROPERTY", "DEAL"]);

export const createDocumentSchema = z.object({
  owner_id: z.string().uuid(),
  owner_type: DocumentOwnerTypeEnum,
  document_type: DocumentTypeEnum,
  file_name: z.string().min(1),
  storage_path: z.string().min(1),
  size_bytes: z.number().optional(),
  mime_type: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
