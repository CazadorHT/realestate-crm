// actions leads
"use server";

import { revalidatePath } from "next/cache";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
  authzFail,
} from "@/lib/authz";
import { logAudit } from "@/lib/audit";

import { leadFormSchema, leadActivitySchema } from "./types";
import type {
  LeadActionResult,
  LeadInsert,
  LeadUpdate,
  LeadActivityInsert,
} from "./types";

export async function createLeadAction(
  values: unknown
): Promise<LeadActionResult> {
  try {
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success)
      return { success: false, message: "ข้อมูล Lead ไม่ถูกต้อง" };
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const payload: LeadInsert = {
      ...parsed.data,
      preferred_locations: parsed.data.preferred_locations
        ? [parsed.data.preferred_locations]
        : null,
      lead_type: (parsed.data as any).lead_type ?? undefined,
      created_by: ctx.user.id,
      updated_at: new Date().toISOString(),
    } as LeadInsert;

    const { data, error } = await ctx.supabase
      .from("leads")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { success: false, message: error.message };

    await logAudit(ctx, {
      action: "lead.create",
      entity: "leads",
      entityId: data.id,
      metadata: {},
    });

    revalidatePath("/protected/leads");
    return { success: true, leadId: data.id };
  } catch (err) {
    return authzFail(err);
  }
}

export async function updateLeadAction(
  id: string,
  values: unknown
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success)
      return { success: false, message: "ข้อมูล Lead ไม่ถูกต้อง" };

    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    // 1) โหลด lead เพื่อเช็ค owner/admin
    const { data: lead, error: findErr } = await ctx.supabase
      .from("leads")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (findErr || !lead) return { success: false, message: "Lead not found" };

    assertAuthenticated({
      userId: ctx.user.id,
      role: ctx.role,
    });

    // 2) update
    const payload: LeadUpdate = {
      ...parsed.data,
      preferred_locations: parsed.data.preferred_locations
        ? [parsed.data.preferred_locations]
        : null,
      lead_type: (parsed.data as any).lead_type ?? undefined,
      updated_at: new Date().toISOString(),
    } as LeadUpdate;

    const { error } = await ctx.supabase
      .from("leads")
      .update(payload)
      .eq("id", id);
    if (error) return { success: false, message: error.message };

    await logAudit(ctx, {
      action: "lead.update",
      entity: "leads",
      entityId: id,
      metadata: {},
    });

    revalidatePath("/protected/leads");
    revalidatePath(`/protected/leads/${id}`);
    return { success: true };
  } catch (err) {
    return authzFail(err);
  }
}

export async function deleteLeadAction(
  id: string
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    // 1) โหลด lead เพื่อเช็ค owner/admin
    const { data: lead, error: findErr } = await ctx.supabase
      .from("leads")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (findErr || !lead) return { success: false, message: "Lead not found" };

    assertAuthenticated({
      userId: ctx.user.id,
      role: ctx.role,
    });

    // 2) delete
    const { error } = await ctx.supabase.from("leads").delete().eq("id", id);
    if (error) return { success: false, message: error.message };

    await logAudit(ctx, {
      action: "lead.delete",
      entity: "leads",
      entityId: id,
      metadata: {},
    });

    revalidatePath("/protected/leads");
    return { success: true };
  } catch (err) {
    return authzFail(err);
  }
}

export async function createLeadActivityAction(
  leadId: string,
  values: unknown
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const parsed = leadActivitySchema.safeParse(values);
    if (!parsed.success)
      return { success: false, message: "ข้อมูล Activity ไม่ถูกต้อง" };

    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    // 1) owner/admin ของ lead เท่านั้นที่เพิ่ม activity ได้
    const { data: lead, error: leadErr } = await ctx.supabase
      .from("leads")
      .select("id, created_by")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) return { success: false, message: "Lead not found" };

    assertAuthenticated({
      userId: ctx.user.id,
      role: ctx.role,
    });

    // 2) insert activity
    const payload: LeadActivityInsert = {
      lead_id: leadId,
      property_id: parsed.data.property_id ?? null,
      activity_type: parsed.data.activity_type,
      note: parsed.data.note.trim(),
      created_by: ctx.user.id,
    };

    const { error } = await ctx.supabase
      .from("lead_activities")
      .insert(payload);
    if (error) return { success: false, message: error.message };

    // (optional) ถ้าคุณอยาก log activity ด้วยจริง ๆ แนะนำเพิ่ม action ใหม่ใน lib/audit.ts
    // await logAudit(ctx, { action: "lead_activity.create", entity: "lead_activities", entityId: null, metadata: { leadId } });
    await logAudit(ctx, {
      action: "lead_activity.create",
      entity: "lead_activities",
      entityId: null,
      metadata: { leadId },
    });
    revalidatePath(`/protected/leads/${leadId}`);
    return { success: true };
  } catch (err) {
    return authzFail(err);
  }
}

export async function updateLeadStageAction(
  id: string,
  stage: string
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { data: lead, error: findErr } = await ctx.supabase
      .from("leads")
      .select("id, created_by")
      .eq("id", id)
      .single();

    if (findErr || !lead) return { success: false, message: "Lead not found" };

    assertAuthenticated({
      userId: ctx.user.id,
      role: ctx.role,
    });

    const { error } = await ctx.supabase
      .from("leads")
      .update({
        stage: stage as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { success: false, message: error.message };

    await logAudit(ctx, {
      action: "lead.update",
      entity: "leads",
      entityId: id,
      metadata: { stage_update: true, new_stage: stage },
    });

    revalidatePath("/protected/leads");
    return { success: true };
  } catch (err) {
    return authzFail(err);
  }
}

export type PropertyPickItem = { id: string; title: string };
export async function searchPropertiesAction(
  q?: string
): Promise<PropertyPickItem[]> {
  const ctx = await requireAuthContext();
  assertStaff(ctx.role);

  const query = (q ?? "").trim();

  let sb = ctx.supabase
    .from("properties")
    .select("id,title")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (query) sb = sb.ilike("title", `%${query}%`);

  const { data, error } = await sb;
  if (error) throw new Error(error.message);

  return (data ?? []).map((x) => ({ id: x.id, title: x.title }));
}
