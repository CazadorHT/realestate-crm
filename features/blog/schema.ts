import { z } from "zod";

export const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  title_en: z.string().optional(),
  title_cn: z.string().optional(),
  title_ru: z.string().optional(),
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
  excerpt_ru: z.string().optional(),
  content: z.string().optional(),
  content_en: z.string().optional(),
  content_cn: z.string().optional(),
  content_ru: z.string().optional(),
  cover_image: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  tags: z.string().optional(), // Will handle comma-separated string in form, convert to array in action
  is_published: z.boolean().optional(),
  published_at: z.string().optional(),
  structured_data: z.string().optional(),
  requires_ai_review: z.boolean().optional(),
});

export const blogCategorySchema = z.object({
  name: z
    .string()
    .min(1, "กรุณากรอกชื่อหมวดหมู่")
    .max(50, "ชื่อหมวดหมู่ต้องไม่เกิน 50 ตัวอักษร"),
  name_en: z.string().max(50, "English name too long").optional(),
  name_cn: z.string().max(50, "Chinese name too long").optional(),
  name_ru: z.string().max(50, "Russian name too long").optional(),
});
