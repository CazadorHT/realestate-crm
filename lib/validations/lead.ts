import { z } from "zod";
import { PROPERTY_TYPE_ORDER } from "@/features/properties/labels";
import { LEAD_SOURCE_ORDER, LEAD_STAGE_ORDER } from "@/features/leads/labels";

// Re-export constants to maintain compatibility with other files importing them from here
export const PROPERTY_TYPES = PROPERTY_TYPE_ORDER;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LEAD_SOURCES = LEAD_SOURCE_ORDER;
export const LEAD_STAGES = LEAD_STAGE_ORDER;

export const leadFormSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อ"),
  phone: z.string().optional().nullable(),
  email: z
    .string()
    .email("อีเมลไม่ถูกต้อง")
    .optional()
    .or(z.literal(""))
    .nullable(),

  // ✅ รับ PORTAL + รับ null
  source: z.enum(LEAD_SOURCES).nullable().optional(),

  // ✅ ใช้ค่าตาม DB จริง (มี CLOSED)
  stage: z.enum(LEAD_STAGES),

  // ในตารางคุณมี property_id (nullable) — เผื่อผูก lead กับทรัพย์เดียวใน MVP
  property_id: z.string().uuid().optional().nullable(),

  assigned_to: z.string().uuid().optional().nullable(),

  budget_min: z.coerce.number().optional().nullable(),
  budget_max: z.coerce.number().optional().nullable(),

  note: z.string().optional().nullable(),

  // ฟิลด์ใหม่ที่คุณเพิ่ม (ถ้าลงแล้ว)
  lead_type: z
    .enum(["INDIVIDUAL", "COMPANY", "JURISTIC_PERSON"])
    .optional()
    .nullable(),
  nationality: z.string().optional().nullable(),
  is_foreigner: z.coerce.boolean().optional(),

  // property_type[] จะส่งเป็น string[] ก่อน แล้วค่อย validate แบบ enum ถ้าต้องการเข้มขึ้น

  preferred_property_types: z
    .array(z.enum(PROPERTY_TYPES))
    .optional()
    .nullable(),
  preferred_locations: z.array(z.string()).optional().nullable(),

  min_bedrooms: z.coerce.number().int().optional().nullable(),
  min_bathrooms: z.coerce.number().int().optional().nullable(),
  min_size_sqm: z.coerce.number().optional().nullable(),
  max_size_sqm: z.coerce.number().optional().nullable(),
  num_occupants: z.coerce.number().int().optional().nullable(),
  has_pets: z.coerce.boolean().optional().nullable(),
  need_company_registration: z.coerce.boolean().optional().nullable(),
  allow_airbnb: z.coerce.boolean().optional().nullable(),
  preferences: z.record(z.any()).optional().nullable(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
