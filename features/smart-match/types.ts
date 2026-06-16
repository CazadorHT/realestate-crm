import { Database } from "@/lib/database.types.generated";

export type SearchPurpose = "BUY" | "RENT" | "INVEST";
export type PropertyType = string;

export interface ScoreBreakdown {
  label: string;
  points: number;
}

export interface SearchCriteria {
  purpose: SearchPurpose;
  budgetMin?: number;
  budgetMax?: number;
  area?: string;
  nearTransit?: boolean;
  propertyType?: PropertyType;
  allowAirbnb?: boolean;
  language?: "en" | "th" | "cn" | "ru"; // Add language support
}

export interface PropertyMatch {
  id: string;
  slug?: string | null;
  title: string;
  price: number;
  original_price?: number;
  secondary_price?: number;
  is_sqm_price?: boolean;
  image_url: string;
  match_score: number;
  match_reasons: string[];
  score_breakdown?: ScoreBreakdown[];
  commute_time?: number;
  bedrooms?: number;
  bathrooms?: number;
  near_transit?: boolean;
  transit_station_name?: string;
  transit_type?: string;
  transit_distance_meters?: number;
  property_type?: PropertyType;
  allow_airbnb?: boolean;
  airbnb_daily_price?: number | null;
  airbnb_monthly_price?: number | null;
  airbnb_min_contract?: string | null;
}

export interface SearchSession {
  id: string;
  session_token: string;
  purpose: SearchPurpose;
  budget_min?: number;
  budget_max?: number;
  preferred_area?: string;
  created_at: string;
}
