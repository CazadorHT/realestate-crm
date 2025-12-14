/**
 * Owner types and interfaces
 */

import { Database } from "@/lib/database.types";

export type Owner = Database["public"]["Tables"]["owners"]["Row"];
export type OwnerInsert = Database["public"]["Tables"]["owners"]["Insert"];
export type OwnerUpdate = Database["public"]["Tables"]["owners"]["Update"];

export interface OwnerFormValues {
  full_name: string;
  phone?: string;
  line_id?: string;
  facebook_url?: string;
  other_contact?: string;
}
