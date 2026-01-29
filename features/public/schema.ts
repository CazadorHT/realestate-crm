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
  type: z.enum(["SALE", "RENT"]).optional(),
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  area: z.string().optional(),
  limit: z.number().default(10).optional(),
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
});
