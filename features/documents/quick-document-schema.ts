import { z } from "zod";

export const quickDocumentFinancialItemSchema = z.object({
  description: z.string().min(1, "กรุณาระบุรายละเอียดรายการ"),
  quantity: z.coerce.number().min(1).default(1),
  unit_price: z.coerce.number().min(0, "ราคาต้องไม่ต่ำกว่า 0"),
  total: z.coerce.number().optional(),
});

export const quickDocumentPayloadSchema = z.object({
  template_id: z.string().uuid("กรุณาเลือกเทมเพลต"),
  language: z.enum(["th", "en", "cn", "ru"]).default("th"),
  document_title: z.string().optional().nullable(),

  // Client Details
  client: z.object({
    lead_id: z.string().uuid().optional().nullable(),
    full_name: z.string().min(1, "กรุณาระบุชื่อลูกค้า"),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal("")),
    line_id: z.string().optional().nullable(),
    passport: z.string().optional().nullable(),
    id_card: z.string().optional().nullable(),
    nationality: z.string().optional().nullable(),
  }),

  // Property Details
  property: z.object({
    property_id: z.string().uuid().optional().nullable(),
    project_id: z.string().uuid().optional().nullable(),
    project_name: z.string().min(1, "กรุณาระบุชื่อโครงการหรือทรัพย์สิน"),
    unit_number: z.string().optional().nullable(),
    floor: z.string().optional().nullable(),
    size_sqm: z.coerce.number().optional().nullable(),
    bedrooms: z.coerce.number().optional().nullable(),
    bathrooms: z.coerce.number().optional().nullable(),
    rental_price: z.coerce.number().optional().nullable(),
    sale_price: z.coerce.number().optional().nullable(),
    listing_type: z.enum(["RENT", "SALE"]).default("RENT"),
  }),

  // Financials
  financials: z.object({
    items: z.array(quickDocumentFinancialItemSchema).min(1, "ต้องมีรายการการเงินอย่างน้อย 1 รายการ"),
    contract_due_date: z.string().optional().nullable(),
  }),

  // Payment & Bank Account (Strict Dropdown)
  payment: z.object({
    bank_name: z.string().min(1, "กรุณาระบุธนาคาร"),
    bank_account_no: z.string().min(1, "กรุณาระบุเลขที่บัญชี"),
    account_name: z.string().min(1, "กรุณาระบุชื่อบัญชี"),
    payee_role: z.string().optional().nullable(),
    payment_method: z.string().default("Transfer"),
    slip_storage_path: z.string().optional().nullable(),
    slip_url: z.string().optional().nullable(),
  }),

  // Terms & Conditions Overrides
  terms_conditions: z.array(z.string()).optional().nullable(),
});

export type QuickDocumentPayload = z.infer<typeof quickDocumentPayloadSchema>;
export type QuickDocumentFinancialItem = z.infer<typeof quickDocumentFinancialItemSchema>;

