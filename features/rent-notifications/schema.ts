import { z } from "zod";

export const rentNotificationRuleSchema = z.object({
  property_id: z.string().uuid("กรุณาเลือกทรัพย์"),
  line_group_id: z.string().min(1, "กรุณาเลือกกลุ่มไลน์"),
  notification_day: z.number()
    .min(1, "วันที่ต้องอยู่ระหว่าง 1-31")
    .max(31, "วันที่ต้องอยู่ระหว่าง 1-31"),
  notification_hour: z.number().min(0).max(23),
  is_active: z.boolean(),
  language: z.enum(["th", "en", "cn"]),
  tenant_id: z.string().uuid().optional().nullable(),
});

export type RentNotificationRuleInput = z.infer<
  typeof rentNotificationRuleSchema
>;
