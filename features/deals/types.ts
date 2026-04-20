import { Database } from "@/lib/database.types";
import { type PropertyImage } from "@/features/properties/types";
import { CommissionRole, CommissionSplitResult } from "@/lib/finance/commissions";

export type DealStatus = Database["public"]["Enums"]["deal_status"];
export type DealType = Database["public"]["Enums"]["deal_type"];

export type Deal = Database["public"]["Tables"]["deals"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type CoBroker = Database["public"]["Tables"]["co_brokers"]["Row"];

/** 💎 Hardened Extensions for Missing/Computed Columns */
export type ProfileWithTax = Profile & {
  default_tax_rate?: number | null;
};

export type CoBrokerWithTax = CoBroker & {
  default_tax_rate?: number | null;
};

// View model that includes the joined property title/code
export type DealWithProperty = Deal & {
  property: {
    id: string;
    title: string;
    price: number | null;
    original_price: number | null;
    rental_price: number | null;
    original_rental_price: number | null;
    province?: string | null;
    popular_area?: string | null;
    images?: {
      image_url: string;
      is_cover: boolean;
    }[];
  } | null;
  lead?: {
    id: string;
    full_name: string | null;
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
  listing_type?: string | null;
};

export type DealCommission = Database["public"]["Tables"]["deal_commissions"]["Row"] & {
  agent?: {
    id: string;
    full_name: string | null;
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
  tenants: { id: string; name: string } | null;
  property: {
    id: string;
    title: string;
    listing_type: string | null;
    property_type: string | null;
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
      image_url: string;
      is_cover: boolean;
      sort_order: number;
    }[];
  } | null;
  lead: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    stage: string | null;
  } | null;
};

export type SplitWithTax = CommissionSplitResult & {
  taxRate?: number;
};
