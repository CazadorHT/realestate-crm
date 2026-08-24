import { z } from "zod";

export const getBlogPostSchema = (isEn: boolean) =>
  z
    .object({
      title: z.string().optional(),
      title_en: z.string().optional(),
      title_cn: z.string().optional(),
      title_ru: z.string().optional(),
      slug: z
        .string()
        .min(1, isEn ? "Slug is required" : "กรุณาระบุ URL Slug")
        .regex(
          /^[a-z0-9-]+$/,
          isEn
            ? "Slug must contain only lowercase letters, numbers, and hyphens"
            : "Slug ต้องประกอบด้วยตัวอักษรภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข และเครื่องหมายลบ (-) เท่านั้น",
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
        .url(isEn ? "Must be a valid URL" : "กรุณาระบุ URL รูปภาพที่ถูกต้อง")
        .optional()
        .or(z.literal("")),
      category: z.string().min(1, isEn ? "Category is required" : "กรุณาเลือกหมวดหมู่"),
      tags: z.string().optional(), // Will handle comma-separated string in form, convert to array in action
      is_published: z.boolean().optional(),
      published_at: z.string().optional(),
      structured_data: z.union([z.string(), z.record(z.any()), z.array(z.record(z.any()))]).optional(),
      requires_ai_review: z.boolean().optional(),
      seo_score: z.number().optional(),
      seo_feedback: z.string().optional(),
      social_snippets: z.record(z.any()).optional(),
      faqs: z.array(z.object({
        question: z.string(),
        answer: z.string(),
      })).optional(),
    })
    .superRefine((data, ctx) => {
      const hasAnyTitle = Boolean(
        data.title?.trim() ||
        data.title_en?.trim() ||
        data.title_cn?.trim() ||
        data.title_ru?.trim()
      );
      if (!hasAnyTitle) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [isEn && data.title_en !== undefined ? "title_en" : "title"],
          message: isEn ? "Please enter blog title" : "กรุณาระบุหัวข้อบทความ",
        });
      }
    });

export const blogPostSchema = getBlogPostSchema(false);

export const getBlogCategorySchema = (isEn: boolean) =>
  z
    .object({
      name: z.string().max(50, isEn ? "Category name must not exceed 50 characters" : "ชื่อหมวดหมู่ต้องไม่เกิน 50 ตัวอักษร").optional(),
      name_en: z.string().max(50, isEn ? "English name must not exceed 50 characters" : "ชื่อภาษาอังกฤษต้องไม่เกิน 50 ตัวอักษร").optional(),
      name_cn: z.string().max(50, isEn ? "Chinese name must not exceed 50 characters" : "ชื่อภาษาจีนต้องไม่เกิน 50 ตัวอักษร").optional(),
      name_ru: z.string().max(50, isEn ? "Russian name must not exceed 50 characters" : "ชื่อภาษารัสเซียต้องไม่เกิน 50 ตัวอักษร").optional(),
    })
    .superRefine((data, ctx) => {
      const hasAnyName = Boolean(
        data.name?.trim() ||
        data.name_en?.trim() ||
        data.name_cn?.trim() ||
        data.name_ru?.trim()
      );
      if (!hasAnyName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [isEn && data.name_en !== undefined ? "name_en" : "name"],
          message: isEn ? "Please enter category name" : "กรุณากรอกชื่อหมวดหมู่",
        });
      }
    });

export const blogCategorySchema = getBlogCategorySchema(false);
