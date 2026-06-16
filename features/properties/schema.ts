import { z } from "zod";
import { Database } from "@/lib/database.types.generated";

export type PropertyType = "CONDO" | "HOUSE" | "TOWNHOME" | "LAND" | "COMMERCIAL_BUILDING" | "WAREHOUSE" | "OFFICE_BUILDING" | "VILLA" | "POOL_VILLA" | "OTHER";
export type ListingType = "SALE" | "RENT" | "SALE_AND_RENT";
export type PropertyStatus = "DRAFT" | "ACTIVE" | "UNDER_OFFER" | "RESERVED" | "SOLD" | "RENTED" | "ARCHIVED";

import {
  PROPERTY_TYPE_ENUM,
  LISTING_TYPE_ENUM,
  PROPERTY_STATUS_ENUM,
  TRANSIT_TYPE_ENUM,
} from "./labels";

/** Base Zod schema for property properties (without refinements) */
export const PropertySchema = z
  .object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "คุณยังไม่ได้กรอกชื่อทรัพย์"),
    title_en: z.string().trim().optional(),
    title_cn: z.string().trim().optional(),
    title_ru: z.string().trim().optional(),

    description: z.string().trim().optional(),
    description_en: z.string().trim().optional(),
    description_cn: z.string().trim().optional(),
    description_ru: z.string().trim().optional(),

    property_type: z.enum(PROPERTY_TYPE_ENUM, {
      message: "คุณยังไม่ได้เลือกประเภททรัพย์",
    }),
    listing_type: z.enum(LISTING_TYPE_ENUM, {
      message: "คุณยังไม่ได้เลือกรูปแบบประกาศ",
    }),
    status: z.enum(PROPERTY_STATUS_ENUM),

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
    is_total_floors: z.boolean().optional().nullable(),
    min_contract_months: z.coerce.number().optional().nullable(),
    maintenance_fee: z.coerce.number().optional().nullable(),
    parking_slots: z.coerce.number().optional().nullable(),
    zoning: z.string().optional().nullable(),
    floor_plan_url: z.string().optional().nullable(),
    video_url: z.string().optional().nullable(),
    ceiling_height: z.coerce.number().optional().nullable(),
    electricity_charge: z.string().optional().nullable(),
    water_charge: z.string().optional().nullable(),
    rent_free_period_days: z.coerce.number().optional().nullable(),
    office_capacity: z.string().optional().nullable(),
    maid_rooms: z.coerce.number().optional().nullable(),
    halls: z.coerce.number().optional().nullable(),
    dining_rooms: z.coerce.number().optional().nullable(),

    // 🏢 Stock Management
    total_units: z.coerce
      .number()
      .min(1, "จำนวนยูนิตต้องอย่างน้อย 1"),
    sold_units: z.coerce.number().min(0),

    parking_type: z.enum(["COMMON", "FIXED", "AUTO"]).optional().nullable(),
    parking_fee_additional: z.coerce.number().optional().nullable(),
    orientation: z
      .enum(["N", "S", "E", "W", "NE", "NW", "SE", "SW"])
      .optional()
      .nullable(),

    price_per_sqm: z.coerce.number().optional().nullable(),
    rent_price_per_sqm: z.coerce.number().optional().nullable(),

    currency: z.string(),

    address_line1: z.string().trim().optional().nullable(),
    address_line1_en: z.string().trim().optional(),
    address_line1_cn: z.string().trim().optional(),
    address_line1_ru: z.string().trim().optional(),
    province: z.string().min(1, "กรุณาเลือกจังหวัด"),
    district: z.string().min(1, "กรุณาเลือกจังหวัดเขต / อำเภอ"),
    subdistrict: z.string().min(1, "กรุณาเลือกจังหวัดแขวง / ตำบล"),
    postal_code: z.string().optional(),
    google_maps_link: z.string().trim().optional().nullable(),
    popular_area: z.string().optional().nullable(),
    popular_area_en: z.string().optional().nullable(),
    popular_area_cn: z.string().optional().nullable(),
    popular_area_ru: z.string().optional().nullable(),

    // 🏢 V3 Hierarchy & Operations
    tenant_id: z.string().uuid().optional(),
    branch_id: z.string().uuid({ message: "กรุณาเลือกสาขาที่ดูแลทรัพย์นี้" }),
    
    owner_id: z.string().uuid().nullable().optional(),
    assigned_to: z.string().uuid().nullable().optional(), // For primary agent
    agent_ids: z.array(z.string()).optional(), // For multiple agents
    created_by: z.string().uuid().optional(),
    
    // 📈 Analytics & Smart Search
    view_count: z.number().default(0),
    trust_score: z.number().default(1.0),
    h3_index_res8: z.string().optional().nullable(),
    fingerprint: z.string().optional().nullable(),

    property_source: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),

    commission_sale_percentage: z.coerce.number().optional().nullable(),
    commission_rent_months: z.coerce.number().optional().nullable(),
    near_transit: z.boolean(),
    transit_station_name: z.string().optional().nullable(),
    transit_station_name_en: z.string().optional().nullable(),
    transit_station_name_cn: z.string().optional().nullable(),
    transit_station_name_ru: z.string().optional().nullable(),
    transit_type: z.string().optional().nullable(),
    transit_distance_meters: z.coerce.number().optional().nullable(),

    // Multiple Transit Stations (JSONB)
    nearby_transits: z
      .array(
        z.object({
          type: z.string(),
          station_name: z.string().optional(),
          distance_meters: z.coerce.number().optional(),
          time: z.string().optional(), // เวลาเดินทาง (นาที)
          station_name_en: z.string().optional(),
          station_name_cn: z.string().optional(),
          station_name_ru: z.string().optional(),
        }),
      )
      .optional(),

    // Co-Agent Logic
    is_co_agent: z.boolean(),
    co_broker_id: z.string().uuid().optional().nullable(),
    co_agent_name: z.string().trim().optional().nullable(),
    co_agent_phone: z.string().trim().optional().nullable(),
    co_agent_contact_channel: z.string().trim().optional().nullable(),
    co_agent_contact_id: z.string().trim().optional().nullable(),
    co_agent_sale_commission_percent: z.coerce.number().optional().nullable(),
    co_agent_rent_commission_months: z.coerce.number().optional().nullable(),

    // Tags
    verified: z.boolean(),
    is_pet_friendly: z.boolean(),
    is_foreigner_quota: z.boolean(),
    allow_smoking: z.boolean(),
    allow_airbnb: z.boolean(),
    airbnb_daily_price: z.coerce.number().optional().nullable(),
    airbnb_monthly_price: z.coerce.number().optional().nullable(),
    airbnb_min_contract: z.string().optional().nullable(),
    is_renovated: z.boolean(),
    // is_unfurnished: z.boolean().default(false), // Removed in favor of is_bare_shell
    is_fully_furnished: z.boolean(),
    is_corner_unit: z.boolean(),
    has_private_pool: z.boolean(),
    is_selling_with_tenant: z.boolean(),
    is_bare_shell: z.boolean(),
    is_exclusive: z.boolean(),
    
    // New Requested Features
    has_garden_view: z.boolean(),
    has_pool_view: z.boolean(),
    has_city_view: z.boolean(),
    has_unblocked_view: z.boolean(),
    has_river_view: z.boolean(),
    facing_east: z.boolean(),
    facing_north: z.boolean(),
    facing_south: z.boolean(),
    facing_west: z.boolean(),
    has_multi_parking: z.boolean(),
    is_grade_a: z.boolean(),
    is_grade_b: z.boolean(),
    is_grade_c: z.boolean(),
    is_column_free: z.boolean(),
    is_central_air: z.boolean(),
    is_split_air: z.boolean(),
    has_247_access: z.boolean(),
    has_fiber_optic: z.boolean(),
    is_tax_registered: z.boolean(),
    has_raised_floor: z.boolean(),
    is_high_ceiling: z.boolean(),
    is_cbd: z.boolean(),
    is_smart_home: z.boolean(),
    has_private_elevator: z.boolean(),
    is_handicapped_friendly: z.boolean(),
    is_high_floor: z.boolean(),
    is_green_building: z.boolean(),
    has_flexible_lease: z.boolean(),
    is_fully_fitted: z.boolean(),
    is_never_lived_in: z.boolean(),
    requires_ai_review: z.boolean(),
    has_nearby_places: z.boolean(),

    // 🏡 Luxury / Premium Features
    has_large_kitchen: z.boolean(),
    has_western_kitchen: z.boolean(),
    has_separate_thai_kitchen: z.boolean(),
    has_bar_counter: z.boolean(),
    has_bathtub: z.boolean(),
    has_walk_in_closet: z.boolean(),
    has_private_garden: z.boolean(),
    has_garage: z.boolean(),
    has_bbq_area: z.boolean(),
    has_home_theatre: z.boolean(),
    has_private_gym: z.boolean(),
    has_wine_cellar: z.boolean(),
    version: z.number().optional(),

    feature_ids: z.array(z.string()).optional(),

    // Nearby Places (JSONB)
    nearby_places: z
      .array(
        z.object({
          category: z.string().optional(),
          name: z.string().optional(),
          distance_meters: z.coerce.number().optional(),
          time: z.string().optional(),
          name_en: z.string().optional(),
          name_cn: z.string().optional(),
          name_ru: z.string().optional(),
        }),
      )
      .optional(),
  });

/** Shared Zod schema for property forms (with full refinements) */
export const FormSchema = PropertySchema
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
