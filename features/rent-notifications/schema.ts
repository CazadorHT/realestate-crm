import { z } from "zod";

export const rentNotificationRuleSchema = z.object({
  property_id: z.string().uuid("กรุณาเลือกทรัพย์"),
  line_group_id: z.string().min(1, "กรุณาเลือกกลุ่มไลน์"),
  notification_day: z.coerce
    .number()
    .min(1, "วันที่ต้องอยู่ระหว่าง 1-31")
    .max(31, "วันที่ต้องอยู่ระหว่าง 1-31"),
  is_active: z.boolean().default(true),
  language: z.enum(["th", "en", "cn"]).default("th"),
});

export type RentNotificationRuleInput = z.infer<
  typeof rentNotificationRuleSchema
>;
