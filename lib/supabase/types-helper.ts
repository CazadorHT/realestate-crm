/**
 * Shared Type Definitions for Supabase Query Results
 * These interfaces help resolve "Implicit Any" errors in callbacks.
 */

export interface PropertyMinimal {
  id: string;
  title: string | null;
  status: string | null;
  price: number | null;
  rental_price: number | null;
  updated_at: string;
  popular_area?: string | null;
  district?: string | null;
  province?: string | null;
  property_type?: string | null;
  address_line1?: string | null;
}

export interface RevenueData extends PropertyMinimal {
  price: number | null;
  rental_price: number | null;
}

export interface StatsData {
  price: number | null;
  rental_price: number | null;
  status: string | null;
}

export interface LeadMinimal {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
}

export interface DealMinimal {
  id: string;
  status: string | null;
  property?: { title: string | null } | { title: string | null }[];
  lead?: { full_name: string | null } | { full_name: string | null }[];
}

export interface ProfileMinimal {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface OwnerMinimal {
  id: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
}

export interface CronContract {
  id: string;
  deal_id: string | null;
  end_date: string | null;
  start_date: string | null;
  rent_price: number | null;
  deals: {
    property_id: string | null;
    properties: {
      id: string;
      title: string | null;
      property_images: {
        image_url: string;
        is_cover: boolean;
      }[];
    } | {
      id: string;
      title: string | null;
      property_images: {
        image_url: string;
        is_cover: boolean;
      }[];
    }[];
  } | null;
}

export interface CronRule {
  id: string;
  property_id: string | null;
  tenant_id: string | null;
  line_group_id: string | null;
  notification_day: number | null;
  is_active: boolean | null;
  language: string | null;
  rent_notification_history?: {
    status: string;
    created_at: string;
    retry_count: number | null;
  }[];
}
