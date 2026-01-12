import { Database } from "@/lib/database.types";

export type SearchPurpose = "BUY" | "RENT" | "INVEST";
export type PropertyType = Database["public"]["Enums"]["property_type"];

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
}

export interface PropertyMatch {
  id: string;
  slug?: string | null;
  title: string;
  price: number;
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
