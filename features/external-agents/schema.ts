import { z } from "zod";

export const ExternalAgentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อเอเยนต์"),
  company: z.string().trim().optional().nullable(),
  phone: z.string().trim().min(1, "กรุณากรอกเบอร์โทรศัพท์"),
  email: z.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง").optional().nullable().or(z.literal("")),
  line_id: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  tenant_id: z.string().uuid().optional(),
});

export type ExternalAgentFormValues = z.infer<typeof ExternalAgentSchema>;
