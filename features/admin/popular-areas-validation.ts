import { z } from "zod";

export const popularAreaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_en: z.string().optional().nullable(),
  name_cn: z.string().optional().nullable(),
  name_ru: z.string().optional().nullable(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and dashes"),
  province: z.string().min(1, "Province is required"),
  image_url: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  description: z
    .object({
      th: z.string().optional(),
      en: z.string().optional(),
      cn: z.string().optional(),
      ru: z.string().optional(),
    })
    .optional()
    .nullable(),
  seo_title: z
    .object({
      th: z.string().optional(),
      en: z.string().optional(),
      cn: z.string().optional(),
      ru: z.string().optional(),
    })
    .optional()
    .nullable(),
  seo_description: z
    .object({
      th: z.string().optional(),
      en: z.string().optional(),
      cn: z.string().optional(),
      ru: z.string().optional(),
    })
    .optional()
    .nullable(),
  is_ai_generated: z.boolean().default(false),
});
