import { z } from "zod";

// --- Zod Schemas (Item Level) ---

export const provinceSchema = z.object({
  id: z.number(),
  name_th: z.string(),
  name_en: z.string(),
  geography_id: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
});

export const districtSchema = z.object({
  id: z.number(),
  name_th: z.string(),
  name_en: z.string(),
  province_id: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
});

export const subDistrictSchema = z.object({
  id: z.number(),
  zip_code: z.number(),
  name_th: z.string(),
  name_en: z.string(),
  district_id: z.number(),
  lat: z.number().nullable().optional(),
  long: z.number().nullable().optional(), // "long" in JSON, "lng" in some standards, sticking to JSON
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
});

// --- TypeScript Interfaces ---

export type Province = z.infer<typeof provinceSchema>;
export type District = z.infer<typeof districtSchema>;
export type SubDistrict = z.infer<typeof subDistrictSchema>;

// --- Collection Types (for internal use) ---
// We don't validate the whole array with Zod in production for performance,
// but we define the type for TypeScript.

export type ProvinceList = Province[];
export type DistrictList = District[];
export type SubDistrictList = SubDistrict[];
