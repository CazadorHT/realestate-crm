import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2, "ชื่อสาขาต้องมีอย่างน้อย 2 ตัวอักษร"),
  slug: z
    .string()
    .min(2, "Slug ต้องมีอย่างน้อย 2 ตัวอักษร")
    .regex(/^[a-z0-9-]+$/, "Slug ต้องเป็นภาษาอังกฤษตัวเล็กและขีดกลางเท่านั้น"),
});
