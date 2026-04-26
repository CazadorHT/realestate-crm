import type { Database } from "@/lib/database.types";
import type { LeadActivityType } from "@/features/leads/labels";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export type LeadActivityRow =
  Database["public"]["Tables"]["lead_activities"]["Row"];
export type LeadActivityInsert =
  Database["public"]["Tables"]["lead_activities"]["Insert"];
// --- Hardened JSONB Schemas ---
export interface LeadPreferences {
  line_id?: string | null;
  online_contact?: string | null;
  is_smoker?: boolean;
  budget_flexible?: boolean;
  preferred_zones?: string[];
  pet_friendly_required?: boolean;
  [key: string]: unknown; // Allow for extensibility while prioritizing known fields
}

// --- Extended Feature Types ---
export type LeadWithJoins = Omit<LeadRow, "preferences"> & {
  ai_score?: number | null;
  ai_status_label?: string | null;
  utm_source?: string | null;
  deals_count?: number | null;
  tenants?: {
    name: string;
  } | null;
  preferences: LeadPreferences | null;
  ai_summary_content?: string | null;
};

// ใช้สำหรับแสดง leads พร้อมกับ activities
export type LeadWithActivities = LeadWithJoins & {
  lead_activities: LeadActivityRow[];
};

// ใช้สำหรับแสดง leads พร้อมกับ last activity type
export type LeadListRow = LeadWithJoins & {
  last_activity_type: LeadActivityType | null;
};

// ใช้สำหรับแสดงผล action ของ leads
export type LeadActionResult =
  | { success: true; leadId: string }
  | { success: false; message: string };

export {
  leadFormSchema,
  type LeadFormValues,
  LEAD_SOURCES,
  LEAD_STAGES,
  PROPERTY_TYPES,
} from "@/lib/validations/lead";

export {
  leadActivitySchema,
  type LeadActivityValues,
} from "@/lib/validations/lead-activity";
