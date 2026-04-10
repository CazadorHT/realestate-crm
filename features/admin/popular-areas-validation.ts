import { z } from "zod";

export const popularAreaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_en: z.string().optional().nullable(),
  name_cn: z.string().optional().nullable(),
  province: z.string().min(1, "Province is required"),
  image_url: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
});
