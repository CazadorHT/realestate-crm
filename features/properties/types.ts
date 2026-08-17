import type { Database } from "@/lib/database.types.generated";
import { 
  PropertyAmenitiesV3, 
  PropertyAddressV3, 
  PropertyMetaDataV3, 
  PropertyPricingV3, 
  PropertyTransitV3,
  PropertyImageV3
} from "./types/v3";

export type { 
  PropertyAmenitiesV3, 
  PropertyAddressV3, 
  PropertyMetaDataV3, 
  PropertyPricingV3, 
  PropertyTransitV3,
  PropertyImageV3
};

export type PropertyType = "CONDO" | "HOUSE" | "TOWNHOME" | "LAND" | "COMMERCIAL_BUILDING" | "WAREHOUSE" | "OFFICE_BUILDING" | "VILLA" | "POOL_VILLA" | "HOME_OFFICE" | "OTHER";
export type ListingType = "SALE" | "RENT" | "SALE_AND_RENT";
export type PropertyStatus = "DRAFT" | "ACTIVE" | "UNDER_OFFER" | "RESERVED" | "SOLD" | "RENTED" | "ARCHIVED";

export type PropertyRow = Omit<Database["public"]["Views"]["properties"]["Row"], "id"> & { id: string; allow_airbnb?: boolean | null; amenities?: any | null };
export type PropertyInsert =
  Database["public"]["Tables"]["properties_core"]["Insert"];
export type PropertyUpdate =
  Database["public"]["Tables"]["properties_core"]["Update"];

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
  distance_meters: number | undefined;
  time: string | undefined;
  name_en: string | undefined;
  name_cn: string | undefined;
  name_ru: string | undefined;
}

export interface NearbyTransitItem {
  type: string; // Dynamic from ref_master_data
  station_name: string;
  distance_meters: number | undefined;
  time: string | undefined;
  station_name_en: string | undefined;
  station_name_cn: string | undefined;
  station_name_ru: string | undefined;
}

export interface PropertyTransitInfoConsolidated {
  places: NearbyItem[];
  transits: PropertyTransitV3[];
}

export type TransitType = NearbyTransitItem["type"];

// Property Image types
export type PropertyImage = Database["public"]["Tables"]["property_media_v3"]["Row"];
export type PropertyImageInsert =
  Database["public"]["Tables"]["property_media_v3"]["Insert"];

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
  slug?: string | null;
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
  agent_role?: string | null;
  agent_email?: string | null;
  assigned_to?: string | null;
  created_by?: string | null;
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
  project_name?: string | null;
  version?: number;
  ai_reviewed_at?: string | null;
  ai_reviewed_by?: string | null;
}

export interface PropertyDetail {
  id: string;
  slug: string | null;
  status: number | null;
  listing_type: ListingType; // Strict Union
  property_type: PropertyType; // Strict Union
  sale_price: number | null;
  rent_price: number | null;
  price: number | null; 
  rental_price: number | null; 
  original_price: number | null;
  original_rental_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor_area: number | null;
  size_sqm: number | null; 
  land_area: number | null;
  land_size_sqwah: number | null; 
  parking_slots: number | null;
  office_capacity: string | null;
  maid_rooms?: number | null;
  halls?: number | null;
  dining_rooms?: number | null;
  min_contract_months: number | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  google_maps_link: string | null;
  is_hot_deal: boolean | null;
  is_pet_friendly: boolean | null;
  is_exclusive: boolean | null;
  verified: boolean | null;
  is_cbd?: boolean | null;
  is_bare_shell?: boolean | null;
  is_never_lived_in?: boolean | null;
  is_smart_home?: boolean | null;
  is_high_ceiling?: boolean | null;
  has_private_elevator?: boolean | null;
  is_high_floor?: boolean | null;
  is_handicapped_friendly?: boolean | null;
  is_foreigner_quota?: boolean | null;
  is_renovated?: boolean | null;
  is_corner_unit?: boolean | null;
  is_fully_furnished?: boolean | null;
  has_private_pool?: boolean | null;
  is_selling_with_tenant?: boolean | null;
  has_river_view?: boolean | null;
  has_city_view?: boolean | null;
  has_garden_view?: boolean | null;
  has_unblocked_view?: boolean | null;
  allow_smoking?: boolean | null;
  allow_airbnb?: boolean | null;
  airbnb_daily_price?: number | null;
  airbnb_monthly_price?: number | null;
  airbnb_min_contract?: string | null;
  is_column_free?: boolean | null;
  is_grade_a?: boolean | null;
  is_grade_b?: boolean | null;
  is_grade_c?: boolean | null;
  is_tax_registered?: boolean | null;
  has_pool_view?: boolean | null;
  facing_east?: boolean | null;
  facing_north?: boolean | null;
  facing_south?: boolean | null;
  facing_west?: boolean | null;
  has_raised_floor?: boolean | null;
  is_central_air?: boolean | null;
  is_split_air?: boolean | null;
  has_247_access?: boolean | null;
  has_fiber_optic?: boolean | null;
  has_multi_parking?: boolean | null;
  is_green_building?: boolean | null;
  has_flexible_lease?: boolean | null;
  is_fully_fitted?: boolean | null;
  near_transit?: boolean | null;
  meta_keywords?: string[] | null;
  floor?: number | null;
  is_total_floors?: boolean | null;
  floor_plan_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  
  // V3 Multi-language Fields (JSONB flattened for UI/SEO)
  title: string;
  title_en?: string | null;
  title_cn?: string | null;
  title_ru?: string | null;
  
  description: string | null;
  description_en?: string | null;
  description_cn?: string | null;
  description_ru?: string | null;

  popular_area?: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  popular_area_ru?: string | null;
  popular_area_slug?: string | null;

  subdistrict_en?: string | null;
  subdistrict_cn?: string | null;
  subdistrict_ru?: string | null;

  district_en?: string | null;
  district_cn?: string | null;
  district_ru?: string | null;

  province_en?: string | null;
  province_cn?: string | null;
  province_ru?: string | null;

  address_info: PropertyAddressV3;
  amenities: PropertyAmenitiesV3;
  transit_info: PropertyTransitInfoConsolidated | null;
  nearby_places: NearbyItem[];
  nearby_transits: PropertyTransitV3[];

  // Relations
  project_id?: string | null;
  project?: {
    id: string;
    slug: string;
    name: {
      th?: string | null;
      en?: string | null;
      cn?: string | null;
      ru?: string | null;
    } | any;
  } | null;
  images: PropertyImageV3[];
  assigned_agent: {
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    line_id?: string | null;
    wechat_user_id?: string | null;
    whatsapp_user_id?: string | null;
  } | null;
  property_features: {
    features: {
      id: string;
      name: string;
      name_en?: string;
      name_cn?: string;
      name_ru?: string;
      icon_key?: string;
      category?: string;
    } | null;
  }[];
}
