import { z } from "zod";

export const getFeatureSchema = (isEn: boolean) => z.object({
  id: z.string().optional(),
  name: z.string().min(1, isEn ? "Please enter facility name" : "กรุณาระบุชื่อ"),
  name_en: z.string().optional(),
  name_cn: z.string().optional(),
  name_ru: z.string().optional(),
  icon_key: z.string().min(1, isEn ? "Please select an icon" : "กรุณาเลือกไอคอน"),
  category: z.string().nullable().optional(),
});

export const FeatureSchema = getFeatureSchema(false);

export type FeatureFormValues = z.infer<typeof FeatureSchema>;
