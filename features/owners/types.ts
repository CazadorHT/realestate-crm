/**
 * Owner types and interfaces for V3 Ultimate Architecture
 * Maps external owners stored in `identities_v3` (category = 2)
 */

export interface Owner {
  id: string;
  full_name: string;
  full_name_hash?: string | null;
  phone?: string | null;
  phone_hash?: string | null;
  line_id?: string | null;
  facebook_url?: string | null;
  other_contact?: string | null;
  company_name?: string | null;
  owner_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  tenant_id?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  property_count?: number;
}

export type OwnerInsert = Partial<Owner>;
export type OwnerUpdate = Partial<Owner>;

export interface OwnerFormValues {
  full_name: string;
  phone?: string | null;
  line_id?: string | null;
  facebook_url?: string | null;
  other_contact?: string | null;
  created_by: string | null;
  updated_at: string | null;
  company_name?: string | null;
  owner_type?: string | null;
}
