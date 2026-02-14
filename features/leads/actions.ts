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
  values: unknown,
): Promise<LeadActionResult> {
  try {
    const parsed = leadFormSchema.safeParse(values);
    if (!parsed.success)
      return { success: false, message: "ข้อมูล Lead ไม่ถูกต้อง" };
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const payload: LeadInsert = {
      ...parsed.data,
      nationality: Array.isArray(parsed.data.nationality)
        ? parsed.data.nationality.join(", ")
        : parsed.data.nationality,
      preferred_locations: parsed.data.preferred_locations ?? null,
      lead_type: parsed.data.lead_type ?? undefined,
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
  values: unknown,
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
      nationality: Array.isArray(parsed.data.nationality)
        ? parsed.data.nationality.join(", ")
        : parsed.data.nationality,
      preferred_locations: parsed.data.preferred_locations ?? null,
      lead_type: parsed.data.lead_type ?? undefined,
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
  id: string,
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
  values: unknown,
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

export async function updateLeadActivityAction(
  activityId: string,
  leadId: string,
  values: unknown,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const parsed = leadActivitySchema.safeParse(values);
    if (!parsed.success)
      return { success: false, message: "ข้อมูล Activity ไม่ถูกต้อง" };

    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { error } = await ctx.supabase
      .from("lead_activities")
      .update({
        activity_type: parsed.data.activity_type,
        note: parsed.data.note.trim(),
        property_id: parsed.data.property_id ?? null,
      })
      .eq("id", activityId);

    if (error) return { success: false, message: error.message };

    await logAudit(ctx, {
      action: "lead_activity.update",
      entity: "lead_activities",
      entityId: activityId,
      metadata: { leadId },
    });
    revalidatePath(`/protected/leads/${leadId}`);
    return { success: true };
  } catch (err) {
    return authzFail(err);
  }
}

export async function deleteLeadActivityAction(
  activityId: string,
  leadId: string,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { error } = await ctx.supabase
      .from("lead_activities")
      .delete()
      .eq("id", activityId);

    if (error) return { success: false, message: error.message };

    await logAudit(ctx, {
      action: "lead_activity.delete",
      entity: "lead_activities",
      entityId: activityId,
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
  stage: string,
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
  q?: string,
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

export async function generateLeadSummaryAction(leadId: string) {
  const { getLeadWithActivitiesQuery } = await import("./queries");
  const { generateText } = await import("@/lib/ai/gemini");

  const lead = await getLeadWithActivitiesQuery(leadId);
  if (!lead) throw new Error("ไม่พบข้อมูลลีด");

  const activitiesText = (lead.lead_activities ?? [])
    .map(
      (a) =>
        `- [${new Date(a.created_at).toLocaleDateString("th-TH")}] ${
          a.activity_type
        }: ${a.note}`,
    )
    .join("\n");

  const prompt = `
    คุณเป็นผู้ช่วยเอเจนต์อสังหาริมทรัพย์มืออาชีพ
    หน้าที่ของคุณคือสรุปข้อมูลของลูกค้า (Lead) เพื่อให้เอเจนต์เข้าใจภาพรวมได้รวดเร็วที่สุด

    ข้อมูลลูกค้า:
    - ชื่อ: ${lead.full_name}
    - สถานะปัจจุบัน: ${lead.stage}
    - ทำเลที่สนใจ: ${lead.preferred_locations?.join(", ") || "ไม่ระบุ"}
    - งบประมาณ: ${lead.budget_min || 0} - ${lead.budget_max || "ไม่จำกัด"}
    - สเปค: ${lead.min_bedrooms || "-"} ห้องนอน, ${
      lead.min_bathrooms || "-"
    } ห้องน้ำ, ขนาด ${lead.min_size_sqm || 0}-${
      lead.max_size_sqm || "ไม่จำกัด"
    } ตร.ม.
    - อื่นๆ: เลี้ยงสัตว์ ${lead.has_pets ? "ได้" : "ไม่ได้"}, จำนวนผู้พักอาศัย ${
      lead.num_occupants || "-"
    } คน

    ประวัติกิจกรรม:
    ${activitiesText || "ยังไม่มีประวัติกิจกรรม"}

    คำสั่ง:
    1. สรุปเป็น 3-4 บรรทัด (Bullet points) ในภาษาไทยที่เป็นทางการและจับประเด็นสำคัญ
    2. เน้นจุดที่เอเจนต์ควรให้ความสำคัญเป็นพิเศษ (เช่น งบที่แน่นอน, ความเร่งด่วน, หรือเงื่อนไขที่ห้ามขาด)
    3. ส่งกลับเฉพาะข้อความสรุป ไม่ต้องมีคำเกริ่น
    4. ใช้ Emoji เพื่อให้อ่านง่าย
  `;

  try {
    const summary = await generateText(prompt);
    return summary;
  } catch (error) {
    console.error("AI Lead Summary Error:", error);
    throw new Error("ไม่สามารถสรุปข้อมูลด้วย AI ได้ในขณะนี้");
  }
}

export async function updateLeadPDPAAction(
  id: string,
  consent: boolean,
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const { error } = await ctx.supabase
      .from("leads")
      .update({
        pdpa_consent: consent,
        consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { success: false, message: error.message };

    await logAudit(ctx, {
      action: "lead.pdpa_update",
      entity: "leads",
      entityId: id,
      metadata: { consent },
    });

    revalidatePath(`/protected/leads/${id}`);
    return { success: true };
  } catch (err) {
    return authzFail(err);
  }
}
