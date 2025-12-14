export type PropertyStatus = 'active' | 'sold' | 'rented' | 'inactive';

export interface Property {
  id: string; // uuid
  title: string;
  description: string | null;
  slug: string;
  listing_type: 'sale' | 'rent';
  price: number;
  location_text: string | null;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
  // Add other fields as necessary, matching the DB schema
}
