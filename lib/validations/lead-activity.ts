import { z } from "zod";

export const leadActivitySchema = z.object({
  activity_type: z.enum(["CALL", "LINE_CHAT", "EMAIL", "VIEWING", "FOLLOW_UP", "NOTE", "SYSTEM"]),
  note: z.string().min(1, "กรุณากรอกข้อความ"),
  property_id: z.string().uuid().optional().nullable(),
});

export type LeadActivityValues = z.infer<typeof leadActivitySchema>;
