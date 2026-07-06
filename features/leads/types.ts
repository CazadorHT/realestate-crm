import type { Database, Json } from "@/lib/database.types.generated";
import type { LeadActivityType } from "@/features/leads/labels";

export type LeadRow = Database["public"]["Tables"]["crm_leads_v3"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["crm_leads_v3"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["crm_leads_v3"]["Update"];

export type LeadActivityRow =
  Database["public"]["Tables"]["activity_timeline_v3"]["Row"];
export type LeadActivityInsert =
  Database["public"]["Tables"]["activity_timeline_v3"]["Insert"];
// --- Hardened JSONB Schemas ---
export interface LeadPreferences {
  line_id?: string | null;
  online_contact?: string | null;
  is_smoker?: boolean;
  budget_flexible?: boolean;
  preferred_zones?: string[];
  pet_friendly_required?: boolean;
  whatsapp_id?: string | null;
  wechat_id?: string | null;
  preferred_language?: string | null;
  id_card?: string | null;
  passport?: string | null;
}

// --- Extended Feature Types (V3 Hardened) ---
export type LeadWithJoins = LeadRow & {
  ai_score?: number | null;
  ai_status_label?: string | null;
  utm_source?: string | null;
  deals_count?: number | null;
  tenants?: {
    name: string;
  } | null;
  identity?: {
    display_name: string | null;
    email: string | null;
    phone: string | null;
    line_id: string | null;
    social_links: Json | null;
  } | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  line_id?: string | null;
  wechat_id?: string | null;
  whatsapp?: string | null;
  facebook_psid?: string | null;
  instagram_sid?: string | null;
  property_id?: string | null;
  lead_type?: string | null;
  preferences?: Json | null;
  is_foreigner?: boolean | null;
  nationality?: string | null;
  id_card?: string | null;
  passport?: string | null;
  preferred_property_types?: string[] | null;
  [key: string]: any;
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
