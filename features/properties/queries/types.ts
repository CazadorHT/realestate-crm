import type { Database } from "@/lib/database.types";
import { PropertyRow, PropertyImage } from "../types";

export type PropertyImageRow = PropertyImage;

export type PublicPropertyImage = Pick<
  PropertyImageRow,
  "id" | "property_id" | "image_url" | "is_cover" | "sort_order" | "created_at"
>;

export type PublicPropertyWithImages = PropertyRow & {
  property_images: PublicPropertyImage[];
};

export type PropertyStats = {
  total: number;
  available: number;
  soldOrRented: number;
  totalValue: number;
  totalSaleCommission: number;
  totalRentCommission: number;
  totalRealizedCommission: number;
  byType: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
};
