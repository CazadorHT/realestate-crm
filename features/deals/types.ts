import { Database } from "@/lib/database.types";
import { type PropertyImage } from "@/features/properties/types";
import { CommissionRole } from "@/lib/finance/commissions";

export type DealStatus = Database["public"]["Enums"]["deal_status"];
export type DealType = Database["public"]["Enums"]["deal_type"];

export type Deal = Database["public"]["Tables"]["deals"]["Row"];

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
    property_images?: {
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
  co_agent_online?: string | null;
  duration_months?: number | null;
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
};

export type DealCommission = {
  id: string;
  deal_id: string;
  agent_id: string | null;
  role: CommissionRole;
  percentage: number;
  amount: number;
  wht_amount: number;
  net_amount: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  tenant_id: string;
  created_at: string;
  agent?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};
