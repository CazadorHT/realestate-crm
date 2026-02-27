// actions leads
"use server";

import { revalidatePath } from "next/cache";
import { createSafeAction } from "@/lib/actions/safe-action";
import { leadFormSchema, leadActivitySchema } from "./types";
import type {
  LeadActionResult,
  LeadInsert,
  LeadUpdate,
  LeadActivityInsert,
} from "./types";
import { generateLeadSummary } from "./services/ai-lead-service";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@/lib/authz";
import { Database } from "@/lib/database.types";

export const createLeadAction = createSafeAction(
  leadFormSchema,
  async (data, { supabase, userId, tenantId }) => {
    const payload: LeadInsert = {
      ...data,
      tenant_id: tenantId,
      nationality: Array.isArray(data.nationality)
        ? data.nationality.join(", ")
        : data.nationality,
      preferred_locations: data.preferred_locations ?? null,
      lead_type: data.lead_type ?? undefined,
      created_by: userId,
      updated_at: new Date().toISOString(),
    } as LeadInsert;

    const { data: lead, error } = await supabase
      .from("leads")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Create lead error:", error);
      throw new Error(error.message);
    }

    revalidatePath("/protected/leads");
    return { leadId: lead.id };
  },
);

export const updateLeadAction = createSafeAction(
  leadFormSchema.extend({ id: z.string().uuid() }),
  async (data, { supabase, userId, tenantId }) => {
    const { id, ...updateData } = data;

    const payload: LeadUpdate = {
      ...updateData,
      nationality: Array.isArray(updateData.nationality)
        ? updateData.nationality.join(", ")
        : updateData.nationality,
      preferred_locations: updateData.preferred_locations ?? null,
      lead_type: updateData.lead_type ?? undefined,
      updated_at: new Date().toISOString(),
    } as LeadUpdate;

    const { error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("Update lead error:", error);
      throw new Error(error.message);
    }

    revalidatePath("/protected/leads");
    revalidatePath(`/protected/leads/${id}`);
    return { id };
  },
);

export const deleteLeadAction = createSafeAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }, { supabase, tenantId }) => {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);

    revalidatePath("/protected/leads");
    return { success: true };
  },
);

export const createLeadActivityAction = createSafeAction(
  z.object({
    leadId: z.string().uuid(),
    values: leadActivitySchema,
  }),
  async ({ leadId, values }, { supabase, userId, tenantId }) => {
    // Verify lead belongs to tenant
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .eq("tenant_id", tenantId)
      .single();

    if (leadErr || !lead)
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์");

    const payload: LeadActivityInsert = {
      lead_id: leadId,
      property_id: values.property_id ?? null,
      activity_type: values.activity_type,
      note: values.note.trim(),
      created_by: userId,
    };

    const { error } = await supabase.from("lead_activities").insert(payload);
    if (error) throw new Error(error.message);

    revalidatePath(`/protected/leads/${leadId}`);
    return { success: true };
  },
);

export const updateLeadActivityAction = createSafeAction(
  z.object({
    activityId: z.string().uuid(),
    leadId: z.string().uuid(),
    values: leadActivitySchema,
  }),
  async ({ activityId, leadId, values }, { supabase, tenantId }) => {
    // Security check for lead ownership
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .eq("tenant_id", tenantId)
      .single();

    if (leadErr || !lead)
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์");

    const { error } = await supabase
      .from("lead_activities")
      .update({
        activity_type: values.activity_type,
        note: values.note.trim(),
        property_id: values.property_id ?? null,
      })
      .eq("id", activityId);

    if (error) throw new Error(error.message);

    revalidatePath(`/protected/leads/${leadId}`);
    return { success: true };
  },
);

export const deleteLeadActivityAction = createSafeAction(
  z.object({
    activityId: z.string().uuid(),
    leadId: z.string().uuid(),
  }),
  async ({ activityId, leadId }, { supabase, tenantId }) => {
    // Security check for lead ownership
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .eq("tenant_id", tenantId)
      .single();

    if (leadErr || !lead)
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์");

    const { error } = await supabase
      .from("lead_activities")
      .delete()
      .eq("id", activityId);

    if (error) throw new Error(error.message);

    revalidatePath(`/protected/leads/${leadId}`);
    return { success: true };
  },
);

export const updateLeadStageAction = createSafeAction(
  z.object({
    id: z.string().uuid(),
    stage: z.string(),
  }),
  async ({ id, stage }, { supabase, tenantId }) => {
    const { error } = await supabase
      .from("leads")
      .update({
        stage: stage as Database["public"]["Enums"]["lead_stage"],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);

    revalidatePath("/protected/leads");
    return { success: true };
  },
);

export const searchPropertiesAction = createSafeAction(
  z.object({ q: z.string().optional() }),
  async ({ q }, { supabase, tenantId }) => {
    const queryTerm = (q ?? "").trim();

    let sb = supabase
      .from("properties")
      .select(
        "id, title, price, original_price, rental_price, original_rental_price, listing_type, province, district, popular_area, property_images(image_url, is_cover)",
      )
      .eq("tenant_id", tenantId) // Search only tenant's properties
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (queryTerm) sb = sb.ilike("title", `%${queryTerm}%`);

    const { data, error } = await sb;
    if (error) throw new Error(error.message);

    interface PropertyWithImages {
      id: string;
      title: string;
      price: number | null;
      original_price: number | null;
      rental_price: number | null;
      original_rental_price: number | null;
      listing_type: string | null;
      province: string | null;
      district: string | null;
      popular_area: string | null;
      property_images: { image_url: string; is_cover: boolean }[];
    }

    const properties = (data as unknown as PropertyWithImages[]) ?? [];

    return properties.map((x: PropertyWithImages) => ({
      id: x.id,
      title: x.title,
      price: x.price,
      original_price: x.original_price,
      rental_price: x.rental_price,
      original_rental_price: x.original_rental_price,
      listing_type: x.listing_type,
      cover_image_url:
        x.property_images?.find(
          (img: { image_url: string; is_cover: boolean }) => img.is_cover,
        )?.image_url ||
        x.property_images?.[0]?.image_url ||
        null,
      province: x.province,
      district: x.district,
      popular_area: x.popular_area,
    }));
  },
);

export const generateLeadSummaryAction = createSafeAction(
  z.object({ leadId: z.string().uuid() }),
  async ({ leadId }, { tenantId }) => {
    // Note: ideally generateLeadSummary itself should check tenant_id
    // But for now we wrap it in safeAction to ensure tenant context
    return await generateLeadSummary(leadId);
  },
);

export const updateLeadPDPAAction = createSafeAction(
  z.object({
    id: z.string().uuid(),
    consent: z.boolean(),
  }),
  async ({ id, consent }, { supabase, tenantId }) => {
    const { error } = await supabase
      .from("leads")
      .update({
        pdpa_consent: consent,
        consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(error.message);

    revalidatePath(`/protected/leads/${id}`);
    return { success: true };
  },
);

export const transferLeadAction = createSafeAction(
  z.object({
    id: z.string().uuid(),
    targetTenantId: z.string().uuid(),
  }),
  async ({ id, targetTenantId }, { supabase, tenantId, userId, role }) => {
    // 1. Verify lead exists and belongs to current tenant
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .select("full_name")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (leadErr || !lead) {
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์โอนย้ายลูกค้าคนนี้");
    }

    // 2. Perform transfer
    const { error: updateErr } = await supabase
      .from("leads")
      .update({
        tenant_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) throw new Error(updateErr.message);

    // 3. Log Audit
    await logAudit(
      {
        supabase,
        user: {
          id: userId,
          email: "",
          app_metadata: {},
          user_metadata: {},
          aud: "",
          created_at: "",
        },
        role: role as UserRole,
      },
      {
        action: "lead.transfer",
        entity: "leads",
        entityId: id,
        metadata: {
          fromTenantId: tenantId,
          toTenantId: targetTenantId,
          fullName: lead.full_name,
        },
      },
    );

    // 4. Create Notifications for Target Tenant Admins
    try {
      // Find admins/owners of the target tenant
      const { data: members } = await supabase
        .from("tenant_members")
        .select("profile_id")
        .eq("tenant_id", targetTenantId)
        .in("role", ["admin", "owner"]);

      if (members && members.length > 0) {
        const { createNotificationAction } =
          await import("@/lib/actions/notifications");
        const { data: currentTenant } = await supabase
          .from("tenants")
          .select("name")
          .eq("id", tenantId)
          .single();

        await Promise.all(
          members.map((member: { profile_id: string }) =>
            createNotificationAction({
              userId: member.profile_id,
              tenantId: targetTenantId,
              type: "LEAD_TRANSFER",
              title: "มีลูกค้าส่งต่อใหม่ (Lead Transfer)",
              message: `สาขา ${currentTenant?.name || "อื่น"} ได้ส่งต่อลูกค้า "${lead.full_name}" มายังสาขาของคุณ`,
              link: `/protected/leads/${id}`,
            }),
          ),
        );
      }
    } catch (notifyErr) {
      console.error("Failed to send transfer notifications:", notifyErr);
      // Non-blocking error for notification
    }

    revalidatePath("/protected/leads");
    revalidatePath(`/protected/leads/${id}`);

    return { success: true };
  },
);
