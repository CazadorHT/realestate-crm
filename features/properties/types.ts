import type { Database } from "@/lib/database.types";

export type PropertyType = Database["public"]["Enums"]["property_type"];
export type ListingType = Database["public"]["Enums"]["listing_type"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyInsert =
  Database["public"]["Tables"]["properties"]["Insert"];
export type PropertyUpdate =
  Database["public"]["Tables"]["properties"]["Update"];

// Property Image types
export type PropertyImage =
  Database["public"]["Tables"]["property_images"]["Row"];
export type PropertyImageInsert =
  Database["public"]["Tables"]["property_images"]["Insert"];

// Property with nested images
export type PropertyWithImages = PropertyRow & {
  property_images: PropertyImage[];
};

// Helper type for image upload data
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
};

export type UpdatePropertyStatusResult = {
  success: boolean;
  message?: string;
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
}
