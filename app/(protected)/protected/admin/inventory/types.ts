export interface InventoryProperty {
  id: string;
  title: string;
  title_en?: string | null;
  project_name?: string | null;
  project_name_en?: string | null;
  property_type: string | null;
  listing_type: string | null;
  status: string | null;
  price: number | null;
  rental_price: number | null;
  tenant_name: string | null;
  main_image_url?: string | null;
  created_at?: string;
}

export interface InventoryStatsData {
  totalCount: number;
  activeCount: number;
  branchCount: number;
}

export interface InventoryFilterCounts {
  propertyTypes: Record<string, number>;
  statuses: Record<string, number>;
  listingTypes: Record<string, number>;
  branches: Record<string, number>;
}
