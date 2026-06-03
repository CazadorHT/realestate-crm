import type { ListingType, PropertyType, PropertyStatus } from "../types";

export interface PropertyAmenitiesV3 {
  floor?: number | null;
  parking_slots?: number | null;
  office_capacity?: string | number | null;
  maid_rooms?: number | null;
  halls?: number | null;
  dining_rooms?: number | null;
  is_pet_friendly?: boolean;
  is_corner_unit?: boolean;
  is_renovated?: boolean;
  is_fully_furnished?: boolean;
  is_bare_shell?: boolean;
  has_city_view?: boolean;
  has_pool_view?: boolean;
  has_garden_view?: boolean;
  has_private_pool?: boolean;
  has_river_view?: boolean;
  has_unblocked_view?: boolean;
  is_selling_with_tenant?: boolean;
  is_tax_registered?: boolean;
  is_foreigner_quota?: boolean;
  allow_smoking?: boolean;
  is_high_ceiling?: boolean;
  is_column_free?: boolean;
  is_exclusive?: boolean;
  is_grade_a?: boolean;
  is_grade_b?: boolean;
  is_grade_c?: boolean;
  has_raised_floor?: boolean;
  is_central_air?: boolean;
  is_split_air?: boolean;
  has_247_access?: boolean;
  has_fiber_optic?: boolean;
  has_multi_parking?: boolean;
  facing_east?: boolean;
  facing_north?: boolean;
  facing_south?: boolean;
  facing_west?: boolean;
  is_cbd?: boolean;
  is_smart_home?: boolean;
  has_private_elevator?: boolean;
  is_handicapped_friendly?: boolean;
  is_high_floor?: boolean;
  is_never_lived_in?: boolean;
  is_green_building?: boolean;
  has_flexible_lease?: boolean;
  is_fully_fitted?: boolean;
  has_large_kitchen?: boolean;
  has_western_kitchen?: boolean;
  has_separate_thai_kitchen?: boolean;
}

export interface PropertyAddressV3 {
  province?: { th?: string; en?: string; cn?: string; ru?: string } | string | null;
  district?: { th?: string; en?: string; cn?: string; ru?: string } | string | null;
  subdistrict?: { th?: string; en?: string; cn?: string; ru?: string } | string | null;
  popular_area?: { th?: string; en?: string; cn?: string; ru?: string } | string | null;
  popular_area_id?: string | null;
  google_maps_link?: string | null;
  address_line1?: string | null;
  address_line1_en?: string | null;
  postal_code?: string | null;
  nearby_places?: Array<{ category: string; name: string; distance?: string }>;
}

export interface PropertyMetaDataV3 {
  owner_id?: string | null;
  ai_summary_content?: string | null;
  meta_keywords?: string[];
  view_count?: number;
  trust_score?: number;
}

export interface PropertyPricingV3 {
  original_price?: number | null;
  original_rental_price?: number | null;
  min_contract_months?: number | null;
  rent_price_per_sqm?: number | null;
  price_per_sqm?: number | null;
}

export interface PropertyTransitV3 {
  type: string;
  station_name: string;
  station_name_en?: string;
  station_name_cn?: string;
  station_name_ru?: string;
  distance_meters?: number;
  time?: string;
}

export interface PropertyImageV3 {
  id: string;
  url: string;
  image_url: string;
  is_cover: boolean | null;
  sort_order: number | null;
  media_type: string | null;
  ai_scan_status: string | null;
  ai_scan_result: Record<string, any> | null;
  storage_path: string;
  created_at: string | null;
  property_id: string | null;
}

export interface PropertyWithDetails {
  id: string;
  slug: string | null;
  status: PropertyStatus;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  listing_type: ListingType;
  property_type: PropertyType;
  price: number | null;
  rental_price: number | null;
  original_price: number | null;
  original_rental_price: number | null;
  min_contract_months: number | null;
  rent_price_per_sqm?: number | null;
  price_per_sqm?: number | null;
  currency: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  land_size_sqwah: number | null;
  floor: number | null;
  parking_slots: number | null;
  office_capacity: string | number | null;
  maid_rooms?: number | null;
  halls?: number | null;
  dining_rooms?: number | null;
  
  // Location & Address (Localized Objects)
  location: unknown; // PostGIS Point
  province: { th?: string; en?: string; cn?: string; ru?: string } | string | null;
  district: { th?: string; en?: string; cn?: string; ru?: string } | string | null;
  subdistrict: { th?: string; en?: string; cn?: string; ru?: string } | string | null;
  popular_area: { th?: string; en?: string; cn?: string; ru?: string } | string | null;
  google_maps_link: string | null;
  address_line1: string | null;
  address_line1_en: string | null;
  postal_code: string | null;
  
  // Flags & Features
  verified: boolean;
  is_featured: boolean;
  is_hot_deal: boolean;
  is_pet_friendly: boolean;
  is_corner_unit: boolean;
  is_renovated: boolean;
  is_fully_furnished: boolean;
  is_bare_shell: boolean;
  has_city_view: boolean;
  has_pool_view: boolean;
  has_garden_view: boolean;
  has_private_pool: boolean;
  has_river_view: boolean;
  has_unblocked_view: boolean;
  is_selling_with_tenant: boolean;
  is_tax_registered: boolean;
  is_foreigner_quota: boolean;
  allow_smoking: boolean;
  is_high_ceiling: boolean;
  is_column_free: boolean;
  is_exclusive: boolean;
  is_grade_a: boolean;
  is_grade_b: boolean;
  is_grade_c: boolean;
  has_raised_floor: boolean;
  is_central_air: boolean;
  is_split_air: boolean;
  has_247_access: boolean;
  has_fiber_optic: boolean;
  has_multi_parking: boolean;
  facing_east: boolean;
  facing_north: boolean;
  facing_south: boolean;
  facing_west: boolean;
  
  // Transit
  near_transit: boolean | null;
  transit_station_name: string | null;
  transit_type: string | null;
  transit_distance_meters: number | null;
  nearby_places: Array<{ category: string; name: string; distance?: string }>;
  nearby_transits: PropertyTransitV3[];
  
  // AI & Metadata
  ai_summary_content: string | null;
  requires_ai_review: boolean;
  property_source: string | null;
  meta_keywords: string[] | null;
  
  // V3 Context
  tenant_name: string | null;
  branch_name: string | null;

  owner: {
    id: string;
    full_name: string;
    phone: string | null;
    line_id: string | null;
    facebook_url: string | null;
    other_contact: string | null;
    is_active: boolean;
  } | null;
  agent: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    line_id: string | null;
    wechat_user_id: string | null;
    whatsapp_user_id: string | null;
    facebook_url: string | null;
    other_contact: string | null;
    avatar_url: string | null;
    is_active: boolean;
  } | null;
  property_images: PropertyImageV3[];
  property_features: {
    features: {
      id: string;
      name: string;
      icon_key: string | null;
      category: string | null;
      name_en?: string | null;
      name_cn?: string | null;
      name_ru?: string | null;
    } | null;
  }[];
  // V3 database raw fields needed for internal logic / ACL checks
  assigned_to?: string | null;
  owner_id?: string | null;
  agents?: {
    identity?: {
      id: string;
      display_name: string | null;
      phone: string | null;
      email: string | null;
      avatar_url: string | null;
      line_id: string | null;
      is_active: boolean;
    } | null;
  }[] | null;
}

export interface RelatedDealV3 {
  id: string;
  deal_type: string;
  commission_amount: number | null;
  commission_percent: number | null;
  created_by: string | null;
  status: string;
  lead: {
    id: string;
    full_name: string;
  } | null;
}

export interface DealMetadataV3 {
  commission_percent?: number;
  deposit_amount?: number;
  lease_term_months?: number;
  [key: string]: any; // Allow for other dynamic metadata
}
