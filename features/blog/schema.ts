import { z } from "zod";

export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  title_en: z.string().optional(),
  title_cn: z.string().optional(),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  excerpt: z.string().optional(),
  excerpt_en: z.string().optional(),
  excerpt_cn: z.string().optional(),
  content: z.string().optional(),
  content_en: z.string().optional(),
  content_cn: z.string().optional(),
  cover_image: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  reading_time: z.string().optional(),
  tags: z.string().optional(), // Will handle comma-separated string in form, convert to array in action
  is_published: z.boolean().default(false),
  published_at: z.string().optional(),
  structured_data: z.string().optional(),
});
