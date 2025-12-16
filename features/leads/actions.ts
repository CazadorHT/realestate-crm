"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { leadFormSchema, leadActivitySchema } from "./types";

import type { LeadActionResult } from "./types";
import type { LeadActivityFormValues } from "@/lib/types/leads";
import { LEAD_STAGE_ORDER } from "@/features/leads/labels"; // ใช้เป็น whitelist
import { LEAD_ACTIVITY_TYPE_ORDER } from "@/features/leads/labels";

export async function createLeadAction(values: unknown): Promise<LeadActionResult> {
  const parsed = leadFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "ข้อมูล Lead ไม่ถูกต้อง" };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { success: false, message: "Unauthorized" };

  const { data, error } = await supabase
    .from("leads")
    .insert({
      ...parsed.data,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    } as any)
    .select("id")
    .single();

  if (error) return { success: false, message: error.message };

  revalidatePath("/protected/leads");
  return { success: true, leadId: data.id };
}

export async function updateLeadAction(
  id: string,
  values: unknown,
): Promise<{ success: true } | { success: false; message: string }> {
  const parsed = leadFormSchema.safeParse(values);
  if (!parsed.success) return { success: false, message: "ข้อมูล Lead ไม่ถูกต้อง" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ ...parsed.data, updated_at: new Date().toISOString() } as any)
    .eq("id", id);

  if (error) return { success: false, message: error.message };

  revalidatePath("/protected/leads");
  revalidatePath(`/protected/leads/${id}`);
  return { success: true };
}

export async function deleteLeadAction(
  id: string,
): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return { success: false, message: error.message };

  revalidatePath("/protected/leads");
  return { success: true };
}

export async function createLeadActivityAction(
  leadId: string,
  values: unknown,
): Promise<{ success: true } | { success: false; message: string }> {


   // 1) validate เบื้องต้นแบบ manual
  if (!values || typeof values !== "object") {
    return { success: false, message: "ข้อมูล Activity ไม่ถูกต้อง" };
  }

  const v = values as any;
  const activity_type = v.activity_type;
  const note = v.note;
  const property_id = v.property_id;

  // 
  if (!LEAD_ACTIVITY_TYPE_ORDER.includes(activity_type)) {
    return { success: false, message: "ข้อมูล Activity ไม่ถูกต้อง (activity_type)" };
  }
  // note ต้องเป็น string (ให้ว่างได้)
  if (note !== undefined && note !== null && typeof note !== "string") {
    return { success: false, message: "ข้อมูล Activity ไม่ถูกต้อง (note)" };
  }
  // property_id ต้องเป็น string หรือ null/undefined
  if (
    property_id !== undefined &&
    property_id !== null &&
    typeof property_id !== "string"
  ) {
    return { success: false, message: "ข้อมูล Activity ไม่ถูกต้อง (property_id)" };
  }
  // 2) ทำงานจริง
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase.from("lead_activities").insert({
    lead_id: leadId,
    property_id: property_id ?? null,
    activity_type,
    note: (note ?? "").trim(),
    created_by: auth.user.id,
  });

  if (error) return { success: false, message: error.message };

  revalidatePath(`/protected/leads/${leadId}`);
  return { success: true };
}

export type PropertyPickItem = { id: string; title: string };
export async function searchPropertiesAction(
  q?: string,
): Promise<PropertyPickItem[]> {
  "use server";

  const supabase = await createClient();

  const query = (q ?? "").trim();

  let sb = supabase
    .from("properties")
    .select("id,title")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (query) {
    sb = sb.ilike("title", `%${query}%`);
  }

  const { data, error } = await sb;
  if (error) throw new Error(error.message);

  return (data ?? []).map((x) => ({ id: x.id, title: x.title }));
}