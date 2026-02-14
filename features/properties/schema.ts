import { z } from "zod";
import type { Database } from "@/lib/database.types";

export type PropertyType = Database["public"]["Enums"]["property_type"];
export type ListingType = Database["public"]["Enums"]["listing_type"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];

import {
  PROPERTY_TYPE_ENUM,
  LISTING_TYPE_ENUM,
  PROPERTY_STATUS_ENUM,
  TRANSIT_TYPE_ENUM,
} from "./labels";

/** Shared Zod schema for property forms */
export const FormSchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "คุณยังไม่ได้กรอกชื่อทรัพย์"),
    title_en: z.string().optional(),
    title_cn: z.string().optional(),

    description: z.string().optional(),
    description_en: z.string().optional(),
    description_cn: z.string().optional(),

    property_type: z.enum(PROPERTY_TYPE_ENUM, {
      message: "คุณยังไม่ได้เลือกประเภททรัพย์",
    }),
    listing_type: z.enum(LISTING_TYPE_ENUM, {
      message: "คุณยังไม่ได้เลือกรูปแบบประกาศ",
    }),
    status: z.enum(PROPERTY_STATUS_ENUM).default("DRAFT"),

    price: z.coerce.number().optional().nullable(),
    original_price: z.coerce.number().optional(),
    rental_price: z.coerce.number().optional().nullable(),
    original_rental_price: z.coerce.number().optional(),

    bedrooms: z.coerce.number().optional(),
    bathrooms: z.coerce.number().optional(),

    size_sqm: z.coerce.number().optional().nullable(),
    land_size_sqwah: z.coerce.number().optional().nullable(),

    // New Fields
    floor: z.coerce.number().optional().nullable(),
    min_contract_months: z.coerce.number().optional().nullable(),
    maintenance_fee: z.coerce.number().optional().nullable(),
    parking_slots: z.coerce.number().optional().nullable(),
    zoning: z.string().optional().nullable(),
    ceiling_height: z.coerce.number().optional().nullable(),
    electricity_charge: z.string().optional().nullable(),
    water_charge: z.string().optional().nullable(),
    rent_free_period_days: z.coerce.number().optional().nullable(),

    // 🏢 Stock Management
    total_units: z.coerce
      .number()
      .min(1, "จำนวนยูนิตต้องอย่างน้อย 1")
      .default(1),
    sold_units: z.coerce.number().min(0).default(0),

    parking_type: z.enum(["COMMON", "FIXED", "AUTO"]).optional().nullable(),
    parking_fee_additional: z.coerce.number().optional().nullable(),
    orientation: z
      .enum(["N", "S", "E", "W", "NE", "NW", "SE", "SW"])
      .optional()
      .nullable(),

    price_per_sqm: z.coerce.number().optional().nullable(),
    rent_price_per_sqm: z.coerce.number().optional().nullable(),

    currency: z.string().default("THB"),

    address_line1: z.string().optional(),
    province: z.string().optional(),
    district: z.string().optional(),
    subdistrict: z.string().optional(),
    postal_code: z.string().optional(),
    google_maps_link: z.string().optional().nullable(),
    popular_area: z.string().optional().nullable(),

    owner_id: z.string().uuid().nullable().optional(),
    assigned_to: z.string().uuid().nullable().optional(), // For primary agent / backward compatibility
    agent_ids: z.array(z.string()).optional(), // For multiple agents

    property_source: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),

    commission_sale_percentage: z.coerce.number().optional().nullable(),
    commission_rent_months: z.coerce.number().optional().nullable(),
    near_transit: z.boolean().default(false),
    transit_station_name: z.string().optional().nullable(),
    transit_type: z.enum(TRANSIT_TYPE_ENUM).optional().nullable(),
    transit_distance_meters: z.coerce.number().optional().nullable(),

    // Multiple Transit Stations (JSONB)
    nearby_transits: z
      .array(
        z.object({
          type: z.enum(TRANSIT_TYPE_ENUM),
          station_name: z.string().min(1, "Required"),
          distance_meters: z.coerce.number().optional(),
          time: z.string().optional(), // เวลาเดินทาง (นาที)
          station_name_en: z.string().optional(),
          station_name_cn: z.string().optional(),
        }),
      )
      .optional()
      .default([]),

    // Co-Agent Logic
    is_co_agent: z.boolean().default(false),
    co_agent_name: z.string().optional().nullable(),
    co_agent_phone: z.string().optional().nullable(),
    co_agent_contact_channel: z.string().optional().nullable(),
    co_agent_contact_id: z.string().optional().nullable(),
    co_agent_sale_commission_percent: z.coerce.number().optional().nullable(),
    co_agent_rent_commission_months: z.coerce.number().optional().nullable(),

    // Tags
    verified: z.boolean().default(false),
    is_pet_friendly: z.boolean().default(false),
    is_foreigner_quota: z.boolean().default(false),
    allow_smoking: z.boolean().default(false),
    is_renovated: z.boolean().default(false),
    // is_unfurnished: z.boolean().default(false), // Removed in favor of is_bare_shell
    is_fully_furnished: z.boolean().default(false),
    is_corner_unit: z.boolean().default(false),
    has_private_pool: z.boolean().default(false),
    is_selling_with_tenant: z.boolean().default(false),
    is_bare_shell: z.boolean().default(false),
    is_exclusive: z.boolean().default(false),

    // New Requested Features
    has_garden_view: z.boolean().default(false),
    has_pool_view: z.boolean().default(false),
    has_city_view: z.boolean().default(false),
    has_unblocked_view: z.boolean().default(false),
    has_river_view: z.boolean().default(false),
    facing_east: z.boolean().default(false),
    facing_north: z.boolean().default(false),
    facing_south: z.boolean().default(false),
    facing_west: z.boolean().default(false),
    has_multi_parking: z.boolean().default(false),
    is_grade_a: z.boolean().default(false),
    is_grade_b: z.boolean().default(false),
    is_grade_c: z.boolean().default(false),
    is_column_free: z.boolean().default(false),
    is_central_air: z.boolean().default(false),
    is_split_air: z.boolean().default(false),
    has_247_access: z.boolean().default(false),
    has_fiber_optic: z.boolean().default(false),
    is_tax_registered: z.boolean().default(false),
    has_raised_floor: z.boolean().default(false),
    is_high_ceiling: z.boolean().default(false),

    feature_ids: z.array(z.string()).default([]),

    // Nearby Places (JSONB)
    nearby_places: z
      .array(
        z.object({
          category: z.string().min(1, "Required"),
          name: z.string().min(1, "Required"),
          distance: z.string().optional(),
          time: z.string().optional(),
          name_en: z.string().optional(),
          name_cn: z.string().optional(),
        }),
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    const priceMissing =
      data.original_price === undefined || Number.isNaN(data.original_price);
    const rentMissing =
      data.original_rental_price === undefined ||
      Number.isNaN(data.original_rental_price);
    // Cross-field validation: price required for SALE, rental_price required for RENT
    if (data.listing_type === "SALE" && priceMissing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["original_price"],
        message: "กรุณากรอกราคาตั้งขาย",
      });
    }
    if (data.listing_type === "RENT" && rentMissing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["original_rental_price"],
        message: "กรุณากรอกค่าเช่าต่อเดือน",
      });
    }
    // If listing type is SALE_AND_RENT, require BOTH prices
    if (data.listing_type === "SALE_AND_RENT") {
      if (priceMissing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["original_price"],
          message: "กรุณากรอกราคาตั้งขาย",
        });
      }
      if (rentMissing) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["original_rental_price"],
          message: "กรุณากรอกค่าเช่าต่อเดือน",
        });
      }
    }

    // Commission validation: require commission fields when listing type includes the corresponding mode
    const saleCommissionMissing =
      data.commission_sale_percentage === undefined ||
      Number.isNaN(data.commission_sale_percentage);
    const rentCommissionMissing =
      data.commission_rent_months === undefined ||
      Number.isNaN(data.commission_rent_months);

    if (
      (data.listing_type === "SALE" || data.listing_type === "SALE_AND_RENT") &&
      saleCommissionMissing
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commission_sale_percentage"],
        message: "กรุณาระบุ% ค่าคอมมิชชั่นการขาย",
      });
    }

    if (
      (data.listing_type === "RENT" || data.listing_type === "SALE_AND_RENT") &&
      rentCommissionMissing
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["commission_rent_months"],
        message: "กรุณาระบุจำนวนเดือนค่าคอมมิชชั่นการเช่า",
      });
    }

    // Co-Agent Validation
    if (data.is_co_agent) {
      if (!data.co_agent_name?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["co_agent_name"],
          message: "กรุณาระบุชื่อ Co-Agent",
        });
      }
      if (!data.co_agent_phone?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["co_agent_phone"],
          message: "กรุณาระบุเบอร์โทร Co-Agent",
        });
      }

      const isSale =
        data.listing_type === "SALE" || data.listing_type === "SALE_AND_RENT";
      const isRent =
        data.listing_type === "RENT" || data.listing_type === "SALE_AND_RENT";

      if (isSale) {
        if (
          data.co_agent_sale_commission_percent === undefined ||
          Number.isNaN(data.co_agent_sale_commission_percent) ||
          data.co_agent_sale_commission_percent === null
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["co_agent_sale_commission_percent"],
            message: "ระบุส่วนแบ่งขาย (%)",
          });
        }
      }

      if (isRent) {
        if (
          data.co_agent_rent_commission_months === undefined ||
          Number.isNaN(data.co_agent_rent_commission_months) ||
          data.co_agent_rent_commission_months === null
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["co_agent_rent_commission_months"],
            message: "ระบุส่วนแบ่งเช่า (เดือน)",
          });
        }
      }
    }
  });

export type PropertyFormValues = z.infer<typeof FormSchema>;
