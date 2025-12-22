import { z } from "zod";
import type { Database } from "@/lib/database.types";

export type PropertyType = Database["public"]["Enums"]["property_type"];
export type ListingType = Database["public"]["Enums"]["listing_type"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];

import {
  PROPERTY_TYPE_ENUM,
  LISTING_TYPE_ENUM,
  PROPERTY_STATUS_ENUM,
} from "./labels";

/** Shared Zod schema for property forms */
export const FormSchema = z
  .object({
    title: z.string().trim().min(1, "คุณยังไม่ได้กรอกชื่อทรัพย์"),

    description: z.string().optional(),

    property_type: z.enum(PROPERTY_TYPE_ENUM, {
      errorMap: () => ({ message: "คุณยังไม่ได้เลือกประเภททรัพย์" }),
    }),
    listing_type: z.enum(LISTING_TYPE_ENUM, {
      errorMap: () => ({ message: "คุณยังไม่ได้เลือกรูปแบบประกาศ" }),
    }),
    status: z.enum(PROPERTY_STATUS_ENUM).default("DRAFT"),

    price: z.coerce.number().optional(),
    rental_price: z.coerce.number().optional(),

    bedrooms: z.coerce.number().optional(),
    bathrooms: z.coerce.number().optional(),

    size_sqm: z.coerce.number().optional(),
    land_size_sqwah: z.coerce.number().optional(),

    currency: z.string().default("THB"),

    address_line1: z.string().optional(),
    province: z.string().optional(),
    district: z.string().optional(),
    subdistrict: z.string().optional(),
    postal_code: z.string().optional(),
    google_maps_link: z.string().optional().nullable(),

    owner_id: z.string().uuid().nullable().optional(),
    assigned_to: z.string().uuid().nullable().optional(),

    property_source: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    const priceMissing = data.price === undefined || Number.isNaN(data.price);
    const rentMissing =
      data.rental_price === undefined || Number.isNaN(data.rental_price);
    // Cross-field validation: price required for SALE, rental_price required for RENT
    if (data.listing_type === "SALE" && priceMissing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "คุณยังไม่ได้กรอกราคาขายสำหรับประกาศขาย",
      });
    }
    if (data.listing_type === "RENT" && rentMissing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rental_price"],
        message: "คุณยังไม่ได้กรอกราคาเช่าสำหรับประกาศเช่า",
      });
    }
    // If listing type is SALE_AND_RENT, at least one of price or rental_price should be present
    if (data.listing_type === "SALE_AND_RENT" && priceMissing && rentMissing) {
      const msg = "คุณยังไม่ได้กรอกราคาขายหรือราคาเช่าอย่างน้อยหนึ่งค่า";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: msg,
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rental_price"],
        message: msg,
      });
    }
  });

export type PropertyFormValues = z.infer<typeof FormSchema>;
