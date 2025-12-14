import type { Database } from "@/lib/database.types";

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
export type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

// Property Image types
export type PropertyImage = Database["public"]["Tables"]["property_images"]["Row"];
export type PropertyImageInsert = Database["public"]["Tables"]["property_images"]["Insert"];

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
