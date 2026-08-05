import { PropertyCardProps } from "@/components/public/PropertyCard";

export interface PropertyFacets {
  availableProvinces: Record<string, number>;
  availableTypes: Record<string, number>;
  availableListingTypes: {
    SALE: number;
    RENT: number;
    ALL: number;
  };
  availableAreas: Record<string, {
    count: number;
    name_en: string | null;
    name_cn: string | null;
    name_ru: string | null;
  }>;
  availableStations?: Record<string, {
    count: number;
    name_en: string | null;
    name_cn: string | null;
    name_ru: string | null;
    type: string;
  }>;
  availableQuickFilters?: {
    nearTrain: number;
    petFriendly: number;
    fullyFurnished: number;
    isForeigner: number;
    companyRegistered: number;
    isHotDeal: number;
    allowAirbnb: number;
  };
}

export interface PropertySearchResponse {
  properties: PropertyCardProps[];
  facets: PropertyFacets | null;
}

export interface FacetRPCParams {
  p_q?: string | null;
  p_province?: string | null;
  p_property_type?: string | null;
  p_listing_type?: string | null;
}
