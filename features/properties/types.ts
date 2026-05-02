import type { Database } from "@/lib/database.types";

export type PropertyType = Database["public"]["Enums"]["property_type"];
export type ListingType = Database["public"]["Enums"]["listing_type"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyInsert =
  Database["public"]["Tables"]["properties"]["Insert"];
export type PropertyUpdate =
  Database["public"]["Tables"]["properties"]["Update"];

// --- Hardened JSONB Schemas ---
export interface PropertyImageMetadata {
  id: string | null | undefined;
  url: string;
  storage_path: string | null | undefined;
  alt_text: string | null | undefined;
  is_cover: boolean;
  sort_order: number;
  category: string | null | undefined;
}

export interface NearbyItem {
  category: string;
  name: string;
  distance: string | undefined;
  time: string | undefined;
  name_en: string | undefined;
  name_cn: string | undefined;
  name_ru: string | undefined;
}

export interface NearbyTransitItem {
  type: "BTS" | "MRT" | "MRT2" | "ARL" | "SRT" | "SRT2" | "SRT3" | "MRT3" | "OTHER";
  station_name: string;
  distance_meters: number | undefined;
  time: string | undefined;
  station_name_en: string | undefined;
  station_name_cn: string | undefined;
  station_name_ru: string | undefined;
}

export type TransitType = NearbyTransitItem["type"];

// Property Image types
export type PropertyImage =
  Database["public"]["Tables"]["property_images"]["Row"];
export type PropertyImageInsert =
  Database["public"]["Tables"]["property_images"]["Insert"];

// Property with hardened JSONB fields and minimal relational joins
export type PropertyWithImages = PropertyRow & {
  // Hardened JSONB accessors (Stored in the main properties table)
  images: PropertyImageMetadata[] | null;
  nearby_places?: NearbyItem[] | null;
  nearby_transits?: NearbyTransitItem[] | null;
  
  // Relational Joins (Still needed for agents/features)
  property_agents?: { agent_id: string }[];
  property_features?: { feature_id: string }[];
  reviewer?: { full_name: string | null } | null;
  tenants?: { name: string } | null;
};

// Helper type for image upload data (Legacy/Form compatible)
export type ImageUploadData = {
  storage_path: string;
  image_url: string;
  is_cover: boolean;
  sort_order: number;
};

export type CreatePropertyResult = {
  success: boolean;
  propertyId?: string;
  slug?: string;
  message?: string;
  errors?: unknown;
};

export type DuplicatePropertyResult = {
  success: boolean;
  propertyId?: string;
  message?: string;
  errors?: unknown;
};

export type UpdatePropertyStatusResult = {
  success: boolean;
  message?: string;
  errorType?: "VERSION_CONFLICT" | "UNKNOWN_ERROR";
};

export interface PropertyTableData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  property_type: PropertyType;
  listing_type: ListingType;
  price: number | null;
  rental_price: number | null;
  status: PropertyStatus;
  requires_ai_review?: boolean;
  leads_count: number;
  updated_at: string;
  created_at: string;
  closed_lead_name: string | null;
  is_hot?: boolean;
  view_count?: number;
  is_new?: boolean;
  // Optional fields for enhanced table
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  size_sqm?: number | null;
  land_size_sqwah?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  office_capacity?: number | null;
  agent_name?: string | null;
  popular_area?: string | null;
  original_price?: number | null;
  original_rental_price?: number | null;
  total_units?: number;
  sold_units?: number;
  posted_to_facebook_at?: string | null;
  posted_to_instagram_at?: string | null;
  posted_to_line_at?: string | null;
  posted_to_tiktok_at?: string | null;
  tenant_id?: string | null;
  tenant_name?: string | null;
  version?: number;
  ai_reviewed_at?: string | null;
  ai_reviewed_by?: string | null;
}

/**
 * [S-Tier] Centralized Property Detail Type
 * Pure extension of base row with mapped relations.
 * No redundant field overrides here to prevent TS conflicts.
 */
export interface PropertyDetail extends PropertyRow {
  // Hardened Relation mappings
  images: Array<{
    id: string | null | undefined;
    url: string;
    image_url?: string;
    storage_path: string | null;
    is_cover: boolean | null;
    sort_order: number | null;
  }>;
  assigned_agent: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name" | "phone" | "avatar_url" | "line_id"
  > | null;
  property_features: {
    features: Pick<
      Database["public"]["Tables"]["features"]["Row"],
      "id" | "name" | "name_en" | "name_cn" | "name_ru" | "icon_key" | "category"
    > | null;
  }[];
}
