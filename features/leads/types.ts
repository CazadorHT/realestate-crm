import type { Database } from "@/lib/database.types";
import type { LeadActivityType } from "@/features/leads/labels";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export type LeadActivityRow =
  Database["public"]["Tables"]["lead_activities"]["Row"];
export type LeadActivityInsert =
  Database["public"]["Tables"]["lead_activities"]["Insert"];
// ใช้สำหรับแสดง leads พร้อมกับ activities
export type LeadWithActivities = LeadRow & {
  lead_activities: LeadActivityRow[];
};
// ใช้สำหรับแสดง leads พร้อมกับ last activity type
export type LeadListRow = LeadRow & {
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
