import { z } from "zod";

export const FeatureSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  icon_key: z.string().min(1, "Icon is required"),
  category: z.string().nullable().optional(),
});

export type FeatureFormValues = z.infer<typeof FeatureSchema>;
