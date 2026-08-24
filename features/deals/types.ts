import { Database } from "@/lib/database.types.generated";
import { type PropertyImage } from "@/features/properties/types";
import { CommissionRole, CommissionSplitResult } from "@/lib/finance/commissions";

export type DealStatus = "NEGOTIATING" | "SIGNED" | "CANCELLED" | "CLOSED_WIN" | "CLOSED_LOSS";
export type DealType = "SALE" | "RENT";

export type Deal = Database["public"]["Tables"]["crm_deals_v3"]["Row"] & {
  commission_amount?: number | null;
  commission_percent?: number | null;
};
export type Profile = Database["public"]["Tables"]["identities_v3"]["Row"];
export type CoBroker = Database["public"]["Tables"]["identities_v3"]["Row"];

/** 💎 Hardened Extensions for Missing/Computed Columns */
export type ProfileWithTax = Profile & {
  default_tax_rate?: number | null;
};

export type CoBrokerWithTax = CoBroker & {
  default_tax_rate?: number | null;
};

// View model that includes the joined property title/code
export type DealWithProperty = Deal & {
  commission_amount?: number | null;
  commission_percent?: number | null;
  property: {
    id: string;
    title: string;
    title_en?: string | null;
    price: number | null;
    original_price: number | null;
    rental_price: number | null;
    original_rental_price: number | null;
    province?: string | null;
    popular_area?: string | null;
    popular_area_en?: string | null;
    images?: {
      url: string; // Changed from image_url for V3
      image_url?: string; // Legacy alias
      is_cover: boolean;
    }[];
  } | null;
  lead?: {
    id: string;
    display_name: string | null;
    full_name?: string | null; // Legacy alias
    email: string | null;
    phone: string | null;
    stage: string | null;
  } | null;
  tenants?: {
    id: string;
    name: string;
  } | null;
  co_agent_online?: string | null;
  duration_months?: number | null;
  undetermined_date?: boolean | null;
};

// Type for property options in Deal forms
export type DealPropertyOption = {
  id: string;
  title: string;
  price?: number | null;
  original_price?: number | null;
  rental_price?: number | null;
  original_rental_price?: number | null;
  province?: string | null;
  popular_area?: string | null;
  commission_sale_percentage?: number | null;
  commission_rent_months?: number | null;
  cover_image?: string | null;
  image_url?: string | null; // Legacy alias
  listing_type?: string | null;
};

export type DealCommission = Database["public"]["Tables"]["crm_deal_commissions_v3"]["Row"] & {
  agent?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  deal?: {
    title: string;
  } | null;
};

export type DealListingType = "SALE" | "RENT" | "SALE_AND_RENT";

export interface DealStats {
  deal_type: Record<string, number>;
  status: Record<string, number>;
  property_type: Record<string, number>;
  listing_type: Record<string, number>;
  total: number;
  totalCommission: number;
  wonDeals: number;
  activeDeals: number;
  lostDeals: number;
}

// Result of joined query from scoped proxy
export type JoinedDealRow = Deal & {
  commission_amount?: number | null;
  commission_percent?: number | null;
  tenants: { id: string; name: string } | null;
  property: {
    id: string;
    title: string;
    listing_type: number | string | null;
    property_type: number | string | null;
    price: number | null;
    original_price: number | null;
    rental_price: number | null;
    original_rental_price: number | null;
    deleted_at: string | null;
    province: string | null;
    district: string | null;
    popular_area: string | null;
    property_images: {
      id: string;
      property_id: string;
      url: string; // Changed from image_url for V3
      image_url?: string; // Legacy alias
      is_cover: boolean;
      sort_order: number;
    }[];
  } | null;
  lead: {
    id: string;
    display_name: string | null;
    full_name?: string | null; // Legacy alias
    phone: string | null;
    email: string | null;
    stage: string | null;
  } | null;
};

export type SplitWithTax = CommissionSplitResult & {
  taxRate?: number;
};

export type InvoiceRow = Database["public"]["Views"]["invoices"]["Row"] & {
  invoice_number?: string | null;
  total_amount?: number | null;
};
