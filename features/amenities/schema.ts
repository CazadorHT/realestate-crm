import { z } from "zod";

export const FeatureSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  name_en: z.string().optional(),
  name_cn: z.string().optional(),
  icon_key: z.string().min(1, "กรุณาเลือกไอคอน"),
  category: z.string().nullable().optional(),
});

export type FeatureFormValues = z.infer<typeof FeatureSchema>;
