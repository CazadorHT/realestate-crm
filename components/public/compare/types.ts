export type CompareProperty = {
  id: string;
  title: string;
  title_en: string | null;
  title_cn: string | null;
  image_url: string | null;
  price: number | null;
  rental_price: number | null;
  original_price: number | null;
  original_rental_price: number | null;
  listing_type: string | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location: string | null;
  description: string | null;
  province: string | null;
  size_sqm: number | null;
  floor: number | null;
  parking_slots: number | null;
  updated_at: string;
  meta_keywords: string[] | null;
  verified: boolean | null;
  features: Array<{
    id: string;
    name: string;
    name_en: string | null;
    name_cn: string | null;
  }>;
  district: string | null;
  district_en: string | null;
  district_cn: string | null;
  subdistrict: string | null;
  subdistrict_en: string | null;
  subdistrict_cn: string | null;
  popular_area: string | null;
  popular_area_en: string | null;
  popular_area_cn: string | null;
  nearby_places: any | null;
  nearby_transits: any | null;
  near_transit: boolean | null;
  transit_type: string | null;
  transit_station_name: string | null;
  transit_station_name_en: string | null;
  transit_station_name_cn: string | null;
  transit_distance_meters: number | null;
  google_maps_link: string | null;
  address_line1_en: string | null;
  address_line1_cn: string | null;
};

export type ComparisonRow = {
  key: string;
  label: string;
  icon: any; // Lucide icon
};
