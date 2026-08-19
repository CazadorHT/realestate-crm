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
  sizeMin?: number;
  sizeMax?: number;
}

export interface PropertyMatch {
  id: string;
  slug?: string | null;
  title: string;
  title_en?: string | null;
  title_cn?: string | null;
  title_ru?: string | null;
  project_name?: string | null;
  project_name_en?: string | null;
  project_name_cn?: string | null;
  project_name_ru?: string | null;
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
  size_sqm?: number | null;
  popular_area?: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  popular_area_ru?: string | null;
  district?: string | null;
  province?: string | null;
  near_transit?: boolean;
  transit_station_name?: string;
  transit_station_name_en?: string | null;
  transit_station_name_cn?: string | null;
  transit_station_name_ru?: string | null;
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
