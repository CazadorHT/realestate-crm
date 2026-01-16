import { z } from "zod";

export const FeatureSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "กรุณาระบุชื่อ"),
  icon_key: z.string().min(1, "กรุณาเลือกไอคอน"),
  category: z.string().nullable().optional(),
});

export type FeatureFormValues = z.infer<typeof FeatureSchema>;
