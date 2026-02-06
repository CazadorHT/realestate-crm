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
