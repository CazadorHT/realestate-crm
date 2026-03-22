"use server";

import { combineDateTime } from "./utils";

import { requireAuthContext } from "@/lib/authz";
import { revalidatePath } from "next/cache";
import {redirect} from "next/navigation";

export async function createAppointment(formData: FormData) {
  const { supabase, user, tenantId, role } = await requireAuthContext();

  const leadId = formData.get("leadId") as string;
  const propertyId = formData.get("propertyId") as string;
  const date = formData.get("date") as string; // ISO string
  const time = formData.get("time") as string; // HH:mm
  const note = formData.get("note") as string;
  const activityType = (formData.get("activityType") as string) || "VIEWING";

  if (!leadId || !date || !time) {
    throw new Error("Missing required fields");
  }

  const isoString = combineDateTime(date, time);

  const config = await (await import("@/lib/actions/system-config")).getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  // Security Check: Verify lead belongs to the same tenant if multi-tenant is enabled
  if (isMultiTenant && tenantId && tenantId !== "ALL" && role !== "ADMIN") {
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("tenant_id")
      .eq("id", leadId)
      .single();

    if (leadError || !lead || lead.tenant_id !== tenantId) {
      throw new Error("Unauthorized: Lead does not belong to your branch");
    }
  }

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    property_id: propertyId === "none" ? null : propertyId,
    activity_type: activityType as any,
    created_at: isoString,
    note: note,
    created_by: user.id,
  });

  if (error) {
    console.error("Error creating appointment:", error);
    throw new Error("Failed to create appointment");
  }

  revalidatePath("/protected/calendar");
  revalidatePath("/protected"); // Update dashboard too
}
