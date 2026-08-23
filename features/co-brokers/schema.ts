import { z } from "zod";

export const getCoBrokerSchema = (isEn: boolean = false) =>
  z.object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, isEn ? "Please enter agent name" : "กรุณากรอกชื่อเอเยนต์"),
    company_name: z.string().trim().optional().nullable(),
    phone: z.string().trim().min(1, isEn ? "Please enter phone number" : "กรุณากรอกเบอร์โทรศัพท์"),
    email: z
      .string()
      .trim()
      .email(isEn ? "Invalid email format" : "รูปแบบอีเมลไม่ถูกต้อง")
      .optional()
      .nullable()
      .or(z.literal("")),
    line_id: z.string().trim().optional().nullable(),
    whatsapp: z.string().trim().optional().nullable(),
    internal_notes: z.string().trim().optional().nullable(),
    rating: z.number().min(1).max(5).default(3),
    specialized_areas: z.array(z.string()).default([]),
    property_types: z.array(z.string()).default([]),
    tax_id: z.string().trim().optional().nullable(),
    tax_address: z.string().trim().optional().nullable(),
    bank_code: z.string().trim().optional().nullable(),
    bank_account_no: z.string().trim().optional().nullable(),
    bank_account_name: z.string().trim().optional().nullable(),
    standard_commission_rate: z.number().optional().nullable(),
    tenant_id: z.string().uuid().optional(),
    is_active: z.boolean().default(true),
    broker_group: z.string().default("GENERAL"),
  });

export const CoBrokerSchema = getCoBrokerSchema(false);

export type CoBrokerFormValues = z.infer<typeof CoBrokerSchema>;

// Database Record Type (Inferred from schema + DB fields)
export interface CoBroker extends Omit<CoBrokerFormValues, 'phone' | 'rating' | 'specialized_areas' | 'property_types' | 'is_active' | 'broker_group'> {
  id: string;
  phone: string | null;
  rating: number | null;
  specialized_areas: string[] | null;
  property_types: string[] | null;
  bank_code: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  is_active: boolean | null;
  broker_group: string | null;
  created_at: string | null;
  created_by: string | null;
  tenant_id: string;
  deleted_at: string | null;
}
