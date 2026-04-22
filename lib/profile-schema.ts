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
  bank_code: z.string().optional(),
  bank_account_no: z.string().optional(),
  bank_account_name: z.string().optional(),
  telegram_id: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "Telegram ID ต้องเป็นตัวเลขเท่านั้น",
    }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
