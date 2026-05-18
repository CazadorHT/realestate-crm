"use server";

import { combineDateTime } from "./utils";
import { requireAuthContext } from "@/lib/authz";
import { revalidatePath } from "next/cache";

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
      .from("crm_leads_v3")
      .select("tenant_id")
      .eq("id", leadId)
      .single();

    if (leadError || !lead || lead.tenant_id !== tenantId) {
      throw new Error("Unauthorized: Lead does not belong to your branch");
    }
  }

  const { error } = await supabase.from("activity_timeline_v3").insert({
    target_entity: "LEAD",
    target_id: leadId,
    activity_type: activityType,
    created_at: isoString,
    description: note,
    actor_id: user.id,
    tenant_id: tenantId === "ALL" ? null : tenantId,
    metadata: {
      property_id: propertyId === "none" ? null : propertyId,
      note: note
    }
  });

  if (error) {
    console.error("Error creating appointment:", error);
    throw new Error("Failed to create appointment");
  }

  revalidatePath("/protected/calendar");
  revalidatePath("/protected"); // Update dashboard too
}

export async function updateEventDate(id: string, newStart: string, type: string) {
  const { supabase } = await requireAuthContext();

  if (["viewing", "follow_up", "call", "line_chat"].includes(type)) {
     const { error } = await supabase
       .from("activity_timeline_v3")
       .update({ created_at: newStart })
       .eq("id", id);
     
     if (error) {
       console.error("Error updating activity date:", error);
       throw new Error("ไม่สามารถอัปเดตวันนัดหมายได้");
     }
  } else if (type === "deal_closing") {
     const { error } = await supabase
       .from("crm_deals_v3")
       .update({ transaction_date: newStart })
       .eq("id", id);
     
     if (error) {
       console.error("Error updating deal date:", error);
       throw new Error("ไม่สามารถอัปเดตวันที่ปิดดีลได้");
     }
  } else if (["contract_start", "contract_end", "early_termination"].includes(type)) {
     const actualId = id.replace("-start", "").replace("-end", "").replace("-terminated", "");
     let updatePayload: any = {};
     if (type === "contract_start") updatePayload = { transaction_date: newStart };
     if (type === "contract_end") updatePayload = { transaction_end_date: newStart };
     if (type === "early_termination") {
       const { data: existing } = await supabase.from("crm_deals_v3").select("metadata").eq("id", actualId).single();
       const meta = (existing?.metadata || {}) as Record<string, any>;
       updatePayload = { metadata: { ...meta, check_out_date: newStart } };
     }
     
     const { error } = await supabase
       .from("crm_deals_v3")
       .update(updatePayload)
       .eq("id", actualId);

     if (error) {
       console.error("Error updating contract date:", error);
       throw new Error("ไม่สามารถอัปเดตวันที่สัญญาได้");
     }
  }

  revalidatePath("/protected/calendar");
  revalidatePath("/protected");
  return { success: true };
}
