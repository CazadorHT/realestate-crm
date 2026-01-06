import * as z from "zod";

export const depositLeadSchema = z.object({
  fullName: z.string().min(2, "กรุณาระบุชื่อ-นามสกุล"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  lineId: z.string().optional(),
  propertyType: z.string({ required_error: "กรุณาเลือกประเภททรัพย์" }),
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
