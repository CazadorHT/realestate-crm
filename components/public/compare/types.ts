export type CompareProperty = {
  id: string;
  title: string;
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
  features: Array<{ id: string; name: string }>;
  district: string | null;
  subdistrict: string | null;
  popular_area: string | null;
  near_transit: boolean | null;
  transit_type: string | null;
  transit_station_name: string | null;
  transit_distance_meters: number | null;
  google_maps_link: string | null;
};

export type ComparisonRow = {
  key: string;
  label: string;
  icon: any; // Lucide icon
};
