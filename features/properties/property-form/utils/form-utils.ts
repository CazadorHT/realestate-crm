import { type PropertyFormValues } from "@/features/properties/schema";
import type { PropertyRow } from "@/features/properties/types";

export const EMPTY_VALUES: PropertyFormValues = {
  title: "",
  description: "",
  property_type: undefined as any,
  listing_type: undefined as any,
  status: "DRAFT",
  price: undefined,
  original_price: undefined,
  rental_price: undefined,
  original_rental_price: undefined,
  bedrooms: undefined,
  bathrooms: undefined,
  size_sqm: undefined,
  land_size_sqwah: undefined,
  floor: undefined,
  min_contract_months: 12, // Default to 1 year
  verified: false,

  maintenance_fee: undefined,
  parking_slots: undefined,
  zoning: undefined,
  currency: "THB",
  property_source: "",
  owner_id: null,
  assigned_to: null,
  agent_ids: [],
  images: [],
  commission_sale_percentage: 3,
  commission_rent_months: 1,
  popular_area: undefined,
  near_transit: false,
  transit_station_name: "",
  transit_type: "BTS",
  transit_distance_meters: undefined,
  is_co_agent: false,
  co_agent_name: "",
  co_agent_phone: "",
  co_agent_contact_channel: "Line",
  co_agent_contact_id: "",
  co_agent_sale_commission_percent: undefined,
  co_agent_rent_commission_months: undefined,
  is_pet_friendly: false,
  feature_ids: [],
  nearby_places: [],
};

export const STEP_FIELDS: Record<number, (keyof PropertyFormValues)[]> = {
  1: ["listing_type", "property_type", "title"],
  2: [
    "price",
    "original_price",
    "rental_price",
    "original_rental_price",
    "commission_sale_percentage",
    "commission_rent_months",
  ],
  3: ["province", "district", "subdistrict"],
  4: [],
  5: ["feature_ids"],
};

export const FIELD_LABELS: Record<keyof PropertyFormValues | string, string> = {
  listing_type: "รูปแบบประกาศ",
  property_type: "ประเภททรัพย์",
  title: "ชื่อทรัพย์",
  price: "ราคาขาย",
  original_price: "ราคาตั้งขาย (เต็ม)",
  rental_price: "ค่าเช่า",
  original_rental_price: "ค่าเช่าต่อเดือน (เต็ม)",
  commission_sale_percentage: "% คอมมิชชั่นขาย",
  commission_rent_months: "คอมมิชชั่นเช่า (เดือน)",
  province: "จังหวัด",
  district: "อำเภอ/เขต",
  subdistrict: "ตำบล/แขวง",
};

// Helper: Convert DB row to form values
export function mapRowToFormValues(
  row: PropertyRow,
  images?: string[],
): PropertyFormValues {
  const structuredData = row.structured_data as unknown as {
    is_co_agent?: boolean;
    co_agent_name?: string;
    co_agent_phone?: string;
    co_agent_contact_channel?: "LINE" | "FB" | "TEL";
    co_agent_contact_id?: string;
    co_agent_sale_commission_percent?: number;
    co_agent_rent_commission_months?: number;
  } | null;

  return {
    title: row.title ?? "",
    description: row.description ?? undefined,
    property_type: row.property_type ?? "HOUSE",
    listing_type: row.listing_type ?? "SALE",
    status: row.status ?? "DRAFT",
    price: row.price ?? undefined,
    original_price: row.original_price ?? undefined,
    rental_price: row.rental_price ?? undefined,
    original_rental_price: row.original_rental_price ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    size_sqm: row.size_sqm ?? undefined,
    land_size_sqwah: row.land_size_sqwah ?? undefined,
    floor: row.floor ?? undefined,
    min_contract_months: row.min_contract_months ?? undefined,
    maintenance_fee: row.maintenance_fee ?? undefined,
    parking_slots: row.parking_slots ?? undefined,
    zoning: row.zoning ?? undefined,
    currency: row.currency ?? "THB",
    address_line1: row.address_line1 ?? "",
    province: row.province ?? "",
    district: row.district ?? "",
    subdistrict: row.subdistrict ?? "",
    postal_code: row.postal_code ?? "",
    google_maps_link: row.google_maps_link ?? undefined,
    popular_area: row.popular_area ?? undefined,
    owner_id: row.owner_id ?? undefined,
    property_source: row.property_source ?? undefined,
    assigned_to: row.assigned_to ?? undefined,
    agent_ids: [],
    images: images ?? [],
    commission_sale_percentage: row.commission_sale_percentage ?? 3,
    commission_rent_months: row.commission_rent_months ?? 1,
    near_transit: row.near_transit ?? false,
    transit_station_name: row.transit_station_name ?? "",
    transit_type: (row.transit_type as any) ?? "BTS",
    transit_distance_meters: row.transit_distance_meters ?? undefined,
    is_co_agent: structuredData?.is_co_agent || false,
    co_agent_name: structuredData?.co_agent_name || "",
    co_agent_phone: structuredData?.co_agent_phone || "",
    co_agent_contact_channel:
      structuredData?.co_agent_contact_channel || "LINE",
    co_agent_contact_id: structuredData?.co_agent_contact_id || "",
    co_agent_sale_commission_percent:
      structuredData?.co_agent_sale_commission_percent || undefined,
    co_agent_rent_commission_months:
      structuredData?.co_agent_rent_commission_months || undefined,

    // Tags
    verified: row.verified ?? false,
    is_pet_friendly: (row.meta_keywords || []).includes("Pet Friendly"),
    feature_ids: [],
    nearby_places: (row.nearby_places as any[]) || [],
  };
}
