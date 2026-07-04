import { Database } from "@/lib/database.types.generated";
import { PropertyRow, PropertyImage ,PropertyImageMetadata} from "../types";

export type PropertyType = "CONDO" | "HOUSE" | "TOWNHOME" | "LAND" | "COMMERCIAL_BUILDING" | "WAREHOUSE" | "OFFICE_BUILDING" | "VILLA" | "POOL_VILLA" | "OTHER";
export type ListingType = "SALE" | "RENT" | "SALE_AND_RENT";
export type PropertyStatus = "DRAFT" | "ACTIVE" | "UNDER_OFFER" | "SOLD" | "RENTED" | "ARCHIVED";

export type PropertyImageRow = PropertyImage;

export type PublicPropertyImage = Pick<
  PropertyImageRow,
  "id" | "property_id" | "url" | "is_cover" | "sort_order" | "created_at"
>;


export type PublicPropertyWithImages = PropertyRow & {
  // Now using structural images from the main table
  images: PropertyImageMetadata[] | null;
};

export type PropertyStats = {
  total: number;
  available: number;
  soldOrRented: number;
  totalValue: number;
  totalSaleCommission: number;
  totalRentCommission: number;
  totalRealizedCommission: number;
  totalNetRealizedCommission: number;
  totalNetSaleCommission: number;
  byType: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
  aiReviewCount: number;
};
