
import { z } from "zod";

export const getPopularAreaSchema = (isEn: boolean) =>
  z
    .object({
      name: z.string().optional(),
      name_en: z.string().optional().nullable(),
      name_cn: z.string().optional().nullable(),
      name_ru: z.string().optional().nullable(),
      slug: z
        .string()
        .min(1, isEn ? "Slug is required" : "กรุณาระบุ URL Slug")
        .regex(
          /^[a-z0-9-]+$/,
          isEn 
            ? "Slug must only contain lowercase letters, numbers, and dashes" 
            : "Slug ต้องประกอบด้วยตัวอักษรภาษาอังกฤษตัวพิมพ์เล็ก ตัวเลข และเครื่องหมายลบ (-) เท่านั้น",
        ),
      province: z.string().min(1, isEn ? "Province is required" : "กรุณาเลือกจังหวัด"),
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
          message: isEn ? "Please enter area name" : "กรุณาระบุชื่อทำเล",
        });
      }
    });

export const popularAreaSchema = getPopularAreaSchema(false);

