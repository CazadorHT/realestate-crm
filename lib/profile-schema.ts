import { z } from "zod";

export const getProfileSchema = (isEn: boolean) => z.object({
  full_name: z.string().min(1, isEn ? "Please enter full name" : "กรุณากรอกชื่อ-นามสกุล"),
  nickname: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url(isEn ? "Invalid image URL" : "URL รูปภาพไม่ถูกต้อง").optional().or(z.literal("")),
  
  // Multi-channel Identity
  line_id: z.string().optional(),
  line_user_id: z.string().optional(),
  facebook_url: z.string().optional(),
  whatsapp_id: z.string().optional(),
  whatsapp_user_id: z.string().optional(),
  wechat_id: z.string().optional(),
  wechat_user_id: z.string().optional(),
  telegram_id: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: isEn ? "Telegram ID must be digits only" : "Telegram ID ต้องเป็นตัวเลขเท่านั้น",
    }),

  // Localization & Branding
  bio_th: z.string().optional(),
  bio_en: z.string().optional(),
  position_th: z.string().optional(),
  position_en: z.string().optional(),

  // Financial & Administrative
  tax_id: z.string().optional(),
  tax_address: z.string().optional(),
  bank_code: z.string().optional(),
  bank_account_no: z.string().optional(),
  bank_account_name: z.string().optional(),
  other_bank_name: z.string().optional(),
});

export const profileSchema = getProfileSchema(false);

// Explicit type for clarity in the IDE
export type ProfileFormValues = {
  full_name: string;
  nickname?: string;
  phone?: string;
  avatar_url?: string;
  line_id?: string;
  line_user_id?: string;
  facebook_url?: string;
  whatsapp_id?: string;
  whatsapp_user_id?: string;
  wechat_id?: string;
  wechat_user_id?: string;
  telegram_id?: string;
  bio_th?: string;
  bio_en?: string;
  position_th?: string;
  position_en?: string;
  tax_id?: string;
  tax_address?: string;
  bank_code?: string;
  bank_account_no?: string;
  bank_account_name?: string;
  other_bank_name?: string;
};
