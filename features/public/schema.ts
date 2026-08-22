import * as z from "zod";

const DUMMY_PHONES = new Set([
  "0000000000", "0123456789", "0987654321", "1234567890",
  "0111111111", "0222222222", "0333333333", "0444444444",
  "0555555555", "0666666666", "0777777777", "0888888888", "0999999999"
]);

export function isValidThaiPhone(val: string): boolean {
  if (!val) return false;
  const clean = val.replace(/[^\d+]/g, "");
  if (clean.startsWith("+")) {
    return clean.length >= 10 && clean.length <= 15;
  }
  if (clean.length !== 9 && clean.length !== 10) return false;
  if (DUMMY_PHONES.has(clean)) return false;

  // Check valid prefix: Mobile (06, 08, 09), Landline (02, 03, 04, 05, 07)
  const validPrefixes = ["06", "08", "09", "02", "03", "04", "05", "07"];
  return validPrefixes.some((prefix) => clean.startsWith(prefix));
}

export const depositLeadSchema = z.object({
  fullName: z
    .string()
    .min(2, "กรุณาระบุชื่อ-นามสกุล")
    .max(100, "ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร"),
  phone: z.string().refine(
    (val) => isValidThaiPhone(val),
    { message: "เบอร์โทรศัพท์ไม่ถูกต้อง (กรุณากรอกเบอร์มือถือหรือเบอร์บ้านที่ถูกต้อง)" }
  ),
  email: z
    .string()
    .email("อีเมลไม่ถูกต้อง")
    .max(100, "อีเมลต้องไม่เกิน 100 ตัวอักษร")
    .optional()
    .or(z.literal(""))
    .nullable(),
  lineId: z.string().max(100, "Line ID ต้องไม่เกิน 100 ตัวอักษร").optional().nullable(),
  wechatId: z.string().max(100, "WeChat ID ต้องไม่เกิน 100 ตัวอักษร").optional().nullable(),
  whatsapp: z.string().max(100, "WhatsApp ต้องไม่เกิน 100 ตัวอักษร").optional().nullable(),
  propertyType: z.string().min(1, "กรุณาเลือกประเภททรัพย์"),
  details: z.string().max(1500, "รายละเอียดฝากทรัพย์ต้องไม่เกิน 1,500 ตัวอักษร").optional().nullable(),
  website_hp: z.string().optional().nullable(),
});

export const publicPropertyFilterSchema = z.object({
  q: z.string().optional(),
  listingType: z.enum(["SALE", "RENT", "SALE_AND_RENT", "ALL"]).optional(),
  propertyType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  priceType: z.enum(["SALE-RENT", "SALE", "RENT"]).optional(),
  minSize: z.coerce.number().optional(),
  maxSize: z.coerce.number().optional(),
  area: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  popular_area: z.string().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  ids: z.array(z.string()).optional(),
  filter: z.enum(["hot_deals", "all"]).default("all").optional(),
  limit: z.coerce.number().default(36).optional(),
  // Boolean filters
  nearTrain: z.coerce.boolean().optional(),
  petFriendly: z.coerce.boolean().optional(),
  fullyFurnished: z.coerce.boolean().optional(),
  isForeigner: z.coerce.boolean().optional(),
  companyRegistered: z.coerce.boolean().optional(),
  allowAirbnb: z.coerce.boolean().optional(),
  luxuryVilla: z.coerce.boolean().optional(),
  transitStation: z.string().optional(),
  includeFacets: z.coerce.boolean().default(true).optional(),
  sort: z.enum(["NEWEST", "PRICE_ASC", "PRICE_DESC", "AREA_ASC", "AREA_DESC"]).optional(),
});

export const inquiryLeadSchema = z.object({
  fullName: z
    .string()
    .min(2, "กรุณาระบุชื่อ-นามสกุล")
    .max(100, "ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร"),
  phone: z.string().refine(
    (val) => isValidThaiPhone(val),
    { message: "เบอร์โทรศัพท์ไม่ถูกต้อง (กรุณากรอกเบอร์มือถือหรือเบอร์บ้านที่ถูกต้อง)" }
  ),
  email: z
    .string()
    .email("อีเมลไม่ถูกต้อง")
    .max(100, "อีเมลต้องไม่เกิน 100 ตัวอักษร")
    .optional()
    .or(z.literal(""))
    .nullable(),
  lineId: z.string().max(100, "Line ID ต้องไม่เกิน 100 ตัวอักษร").optional().nullable(),
  wechatId: z.string().max(100, "WeChat ID ต้องไม่เกิน 100 ตัวอักษร").optional().nullable(),
  whatsapp: z.string().max(100, "WhatsApp ต้องไม่เกิน 100 ตัวอักษร").optional().nullable(),
  message: z.string().max(1500, "ข้อความต้องไม่เกิน 1,500 ตัวอักษร").optional().nullable(),
  propertyId: z.string().uuid("รหัสทรัพย์ไม่ถูกต้อง").optional().nullable(),
  source: z
    .enum(["PORTAL", "FACEBOOK", "LINE", "WEBSITE", "REFERRAL", "OTHER"])
    .default("WEBSITE"),
  // Marketing & GTM Fields
  marketing_attribution: z.string().optional(), // For UTM Source/Medium/Campaign
  ai_lead_score: z.number().optional(), // Initial AI Score from client
  website_hp: z.string().optional().nullable(),
});
