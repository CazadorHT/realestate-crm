import { z } from "zod";
export const PROPERTY_TYPES = [
  "HOUSE",
  "CONDO",
  "TOWNHOME",
  "LAND",
  "OTHER",
  "OFFICE_BUILDING",
  "WAREHOUSE",
  "COMMERCIAL_BUILDING",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LEAD_SOURCES = [
  "OTHER",
  "PORTAL",
  "FACEBOOK",
  "LINE",
  "WEBSITE",
  "REFERRAL",
] as const;

export const LEAD_STAGES = [
  "NEW",
  "CONTACTED",
  "VIEWED",
  "NEGOTIATING",
  "CLOSED",
] as const;

export const leadFormSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อ"),
  phone: z.string().optional().nullable(),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().nullable(),

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
