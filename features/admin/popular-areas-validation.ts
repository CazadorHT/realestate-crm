import { z } from "zod";

export const popularAreaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_en: z.string().optional(),
  name_cn: z.string().optional(),
  province: z.string().min(1, "Province is required"),
});
