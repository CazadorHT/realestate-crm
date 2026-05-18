import { z } from "zod";
import { Database } from "@/lib/database.types.generated";

export type DocumentType = z.infer<typeof DocumentTypeEnum>;
export type DocumentOwnerType = z.infer<typeof DocumentOwnerTypeEnum>;

export const DocumentTypeEnum = z.enum([
  "ID_CARD",
  "PASSPORT",
  "COMPANY_REGISTRATION",
  "LEASE_CONTRACT",
  "SALE_CONTRACT",
  "TITLE_DEED",
  "OTHER",
  "RESERVATION_DOCUMENT",
  "RENT_RECEIPT",
  "SLIP",
]);

export const DOC_TYPE_LABELS: Record<string, string> = {
  ID_CARD: "บัตรประชาชน",
  PASSPORT: "พาสปอร์ต",
  COMPANY_REGISTRATION: "หนังสือรับรองบริษัท",
  LEASE_CONTRACT: "สัญญาเช่า",
  SALE_CONTRACT: "สัญญาซื้อขาย",
  TITLE_DEED: "โฉนดที่ดิน",
  OTHER: "อื่นๆ",
  RESERVATION_DOCUMENT: "ใบจองทรัพย์",
  RENT_RECEIPT: "ใบเสร็จค่าเช่า",
  SLIP: "หลักฐานการโอน (Slip)",
};

export const DocumentOwnerTypeEnum = z.enum([
  "LEAD",
  "PROPERTY",
  "DEAL",
  "RENTAL_CONTRACT",
]);

export const DOC_OWNER_TYPE_LABELS: Record<string, string> = {
  LEAD: "จากลีด/ลูกค้า",
  PROPERTY: "จากทรัพย์",
  DEAL: "จากดีล",
  RENTAL_CONTRACT: "จากสัญญาเช่า",
};

export const createDocumentSchema = z.object({
  owner_id: z.string().uuid(),
  owner_type: DocumentOwnerTypeEnum,
  document_type: DocumentTypeEnum,
  file_name: z.string().min(1),
  storage_path: z.string().min(1),
  size_bytes: z.coerce.number().optional(),
  mime_type: z.string().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  version: z.number().optional().default(1),
  tenant_id: z.string().uuid().optional().nullable(),
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

// AI Analysis Schemas
export const aiAnalysisSchema = z.object({
  summary: z.string().min(1, "สรุปข้อมูลต้องไม่เป็นค่าว่าง"),
  risks: z.array(z.string()).default([]),
  key_dates: z.array(z.object({
    date: z.string(),
    description: z.string(),
  })).default([]),
  document_type_suggestion: z.string().optional(),
});

export type AIAnalysisResult = z.infer<typeof aiAnalysisSchema>;

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
