import * as z from "zod";

export const depositLeadSchema = z.object({
  fullName: z.string().min(2, "กรุณาระบุชื่อ-นามสกุล"),
  phone: z.string().refine(
    (val) => {
      const clean = val.replace(/[^\d+]/g, "");
      if (clean.startsWith("+")) {
        return clean.length >= 10 && clean.length <= 15;
      }
      return clean.length === 10;
    },
    { message: "เบอร์โทรศัพท์ต้องมี 10 หลัก" }
  ),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")).nullable(),
  lineId: z.string().optional().nullable(),
  wechatId: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  propertyType: z.string().min(1, "กรุณาเลือกประเภททรัพย์"),
  details: z.string().optional().nullable(),
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
  limit: z.coerce.number().default(60).optional(),
  // Boolean filters
  nearTrain: z.coerce.boolean().optional(),
  petFriendly: z.coerce.boolean().optional(),
  fullyFurnished: z.coerce.boolean().optional(),
  isForeigner: z.coerce.boolean().optional(),
  companyRegistered: z.coerce.boolean().optional(),
  transitStation: z.string().optional(),
  includeFacets: z.coerce.boolean().default(true).optional(),
});

export const inquiryLeadSchema = z.object({
  fullName: z.string().min(2, "กรุณาระบุชื่อ-นามสกุล"),
  phone: z.string().refine(
    (val) => {
      const clean = val.replace(/[^\d+]/g, "");
      if (clean.startsWith("+")) {
        return clean.length >= 10 && clean.length <= 15;
      }
      return clean.length === 10;
    },
    { message: "เบอร์โทรศัพท์ต้องมี 10 หลัก" }
  ),
  email: z.string().email("อีเมลไม่ถูกต้อง").optional().or(z.literal("")).nullable(),
  lineId: z.string().optional().nullable(),
  wechatId: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  propertyId: z.string().uuid("รหัสทรัพย์ไม่ถูกต้อง").optional().nullable(),
  source: z
    .enum(["PORTAL", "FACEBOOK", "LINE", "WEBSITE", "REFERRAL", "OTHER"])
    .default("WEBSITE"),
  // Marketing & GTM Fields
  marketing_attribution: z.string().optional(), // For UTM Source/Medium/Campaign
  ai_lead_score: z.number().optional(), // Initial AI Score from client
});
