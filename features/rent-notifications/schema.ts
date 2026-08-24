import { z } from "zod";

export const getRentNotificationRuleSchema = (isEn: boolean) => z.object({
  property_id: z.string().uuid(isEn ? "Please select a property" : "กรุณาเลือกทรัพย์"),
  line_group_id: z.string().min(1, isEn ? "Please select a LINE group" : "กรุณาเลือกกลุ่มไลน์"),
  notification_day: z.number()
    .min(1, isEn ? "Day must be between 1-31" : "วันที่ต้องอยู่ระหว่าง 1-31")
    .max(31, isEn ? "Day must be between 1-31" : "วันที่ต้องอยู่ระหว่าง 1-31"),
  notification_hour: z.number().min(0).max(23),
  is_active: z.boolean(),
  language: z.enum(["th", "en", "cn", "ru"]),
  tenant_id: z.string().uuid().optional().nullable(),
  custom_group_name: z.string().optional(),
});

export const rentNotificationRuleSchema = getRentNotificationRuleSchema(false);

export type RentNotificationRuleInput = z.infer<
  typeof rentNotificationRuleSchema
>;
