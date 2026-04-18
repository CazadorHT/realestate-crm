import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z.string().optional(),
  line_id: z.string().optional(),
  line_user_id: z.string().optional(),
  facebook_url: z.string().optional(),
  whatsapp_id: z.string().optional(),
  wechat_id: z.string().optional(),
  tax_id: z.string().optional(),
  tax_address: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
