import * as z from "zod";

export const depositLeadSchema = z.object({
  fullName: z.string().min(2, "กรุณาระบุชื่อ-นามสกุล"),
  phone: z.string().length(10, "เบอร์โทรศัพท์ต้องมี 10 หลัก"),
  lineId: z.string().optional(),
  propertyType: z.string().min(1, "กรุณาเลือกประเภททรัพย์"),
  details: z.string().optional(),
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
  phone: z.string().length(10, "เบอร์โทรศัพท์ต้องมี 10 หลัก"),
  lineId: z.string().optional(),
  message: z.string().optional(),
  propertyId: z.string().uuid("รหัสทรัพย์ไม่ถูกต้อง").optional(),
  source: z
    .enum(["PORTAL", "FACEBOOK", "LINE", "WEBSITE", "REFERRAL", "OTHER"])
    .default("WEBSITE"),
  // Marketing & GTM Fields
  marketing_attribution: z.string().optional(), // For UTM Source/Medium/Campaign
  ai_lead_score: z.number().optional(), // Initial AI Score from client
});
