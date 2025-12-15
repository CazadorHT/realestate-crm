import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import type { LeadActivityValues } from "@/lib/validations/lead-activity";

export type LeadActivityRow = Database["public"]["Tables"]["lead_activities"]["Row"];

export async function getActivitiesByLeadId(leadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getActivitiesByLeadId failed: ${error.message}`);
  return data ?? [];
}

export async function createLeadActivity(
  leadId: string,
  values: LeadActivityValues,
  createdBy: string | null,
) {
  const supabase = await createClient();
  const payload = {
    lead_id: leadId,
    property_id: values.property_id ?? null,
    activity_type: values.activity_type,
    note: values.note,
    created_by: createdBy,
  };

  const { data, error } = await supabase
    .from("lead_activities")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(`createLeadActivity failed: ${error.message}`);
  return data;
}
