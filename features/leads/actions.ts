// actions leads
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
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
import { getCoverImage } from "@/lib/property-hardened-utils";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@/lib/authz";
import { Database } from "@/lib/database.types";
import { mapDbError } from "@/lib/db-error";
import { encrypt, decrypt, generateBlindIndex } from "@/lib/crypto";

export const createLeadAction = createSafeAction(
  leadFormSchema,
  async (data, { supabase, userId, tenantId }) => {
    const payload: LeadInsert = {
      ...data,
      full_name: encrypt(data.full_name) || "Unknown",
      full_name_hash: generateBlindIndex(data.full_name),
      phone: encrypt(data.phone),
      phone_hash: generateBlindIndex(data.phone),
      email: encrypt(data.email),
      email_hash: generateBlindIndex(data.email),
      line_id: encrypt(data.preferences?.["line_id"] as string),
      line_id_hash: generateBlindIndex(data.preferences?.["line_id"] as string),
      facebook_psid: encrypt(data.preferences?.["facebook_psid"] as string),
      instagram_sid: encrypt(data.preferences?.["instagram_sid"] as string),
      note: encrypt(data.note),
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
      throw new Error(mapDbError(error));
    }

    revalidatePath("/protected/leads");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");

    // 🤖 Trigger AI Smart Match Infrastructure
    const { inngest } = await import("@/lib/inngest/client");
    await inngest.send({
      name: "lead.created",
      data: { leadId: lead.id, tenantId },
    });

    // 🔔 Notify Admins about the new lead
    try {
      const { notifyAdminsAction } = await import("@/lib/actions/notifications");
      await notifyAdminsAction({
        type: "SYSTEM",
        title: "มีลีดใหม่สนใจทรัพย์! 🆕",
        message: `ลีดใหม่: ${data.full_name} สนใจโครงการในพื้นที่ ${data.preferred_locations || "ทั่วไป"}`,
        link: `/protected/leads/${lead.id}`,
      });
    } catch (notifyErr) {
      console.error("Failed to notify admins of new lead:", notifyErr);
    }

    return { leadId: lead.id };
  },
);

export const updateLeadAction = createSafeAction(
  leadFormSchema.extend({ id: z.string().uuid() }),
  async (data, { supabase, userId, tenantId }) => {
    const { id, ...updateData } = data;

    const payload: LeadUpdate = {
      ...updateData,
      full_name: encrypt(updateData.full_name) || "Unknown",
      full_name_hash: generateBlindIndex(updateData.full_name),
      phone: encrypt(updateData.phone),
      phone_hash: generateBlindIndex(updateData.phone),
      email: encrypt(updateData.email),
      email_hash: generateBlindIndex(updateData.email),
      line_id: encrypt(updateData.preferences?.["line_id"] as string),
      line_id_hash: generateBlindIndex(
        updateData.preferences?.["line_id"] as string,
      ),
      facebook_psid: encrypt(
        updateData.preferences?.["facebook_psid"] as string,
      ),
      instagram_sid: encrypt(
        updateData.preferences?.["instagram_sid"] as string,
      ),
      note: encrypt(updateData.note),
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
      throw new Error(mapDbError(error));
    }

    revalidatePath("/protected/leads");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    revalidatePath(`/protected/leads/${id}`);
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
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

    if (error) throw new Error(mapDbError(error));

    revalidatePath("/protected/leads");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
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
    if (error) throw new Error(mapDbError(error));

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
      .eq("id", activityId)
      .eq("lead_id", leadId);

    if (error) throw new Error(mapDbError(error));

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
      .eq("id", activityId)
      .eq("lead_id", leadId);

    if (error) throw new Error(mapDbError(error));

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

    if (error) throw new Error(mapDbError(error));

    revalidatePath("/protected/leads");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    return { success: true };
  },
);

export const searchPropertiesAction = createSafeAction(
  z.object({
    q: z.string().optional(),
    listing_type: z.string().optional(),
    property_type: z.string().optional(),
    popular_area: z.string().optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    tenantId: z.string().uuid().optional(),
  }),
  async (
    {
      q,
      listing_type,
      property_type,
      popular_area,
      status,
      tenantId: inputTenantId,
    },
    { supabase, tenantId: contextTenantId },
  ) => {
    const queryTerm = (q ?? "").trim();
    const effectiveTenantId = inputTenantId || contextTenantId;

    // 1. Fetch counts for ALL matching properties (ignoring facet-specific filters, but respecting search q)
    let facetSb = supabase
      .from("properties")
      .select("listing_type, property_type, status")
      .is("deleted_at", null);

    if (effectiveTenantId) {
      facetSb = facetSb.eq("tenant_id", effectiveTenantId);
    }

    if (queryTerm) facetSb = facetSb.ilike("title", `%${queryTerm}%`);

    const { data: facetData, error: facetError } = await facetSb;

    const counts: {
      listing_type: Record<string, number>;
      property_type: Record<string, number>;
      status: Record<string, number>;
    } = {
      listing_type: {},
      property_type: {},
      status: {},
    };

    if (facetError) {
      console.error("Facet Error:", facetError);
    } else if (facetData) {
      facetData.forEach(
        (x: {
          listing_type: string | null;
          property_type: string | null;
          status: string | null;
        }) => {
          if (x.listing_type)
            counts.listing_type[x.listing_type] =
              (counts.listing_type[x.listing_type] || 0) + 1;
          if (x.property_type)
            counts.property_type[x.property_type] =
              (counts.property_type[x.property_type] || 0) + 1;
          if (x.status)
            counts.status[x.status] = (counts.status[x.status] || 0) + 1;
        },
      );
    }

    // 2. Fetch actually filtered property results (Explicit Select Only - Price Shield Enforced)
    let sb = supabase
      .from("properties")
      .select(
        "id, title, price, original_price, rental_price, original_rental_price, listing_type, property_type, province, district, popular_area, status, images",
      )
      .is("deleted_at", null);

    if (effectiveTenantId) {
      sb = sb.eq("tenant_id", effectiveTenantId); // Search only specific tenant
    }

    sb = sb.order("updated_at", { ascending: false }).limit(30);

    if (queryTerm) sb = sb.ilike("title", `%${queryTerm}%`);

    if (listing_type) {
      if (listing_type === "SALE" || listing_type === "SALE_AND_RENT") {
        sb = sb.in("listing_type", ["SALE", "SALE_AND_RENT"]);
      } else if (listing_type === "RENT" || listing_type === "SALE_AND_RENT") {
        sb = sb.in("listing_type", ["RENT", "SALE_AND_RENT"]);
      }
    }

    if (property_type) {
      sb = sb.eq(
        "property_type",
        property_type as Database["public"]["Enums"]["property_type"],
      );
    }

    if (popular_area) {
      sb = sb.ilike("popular_area", `%${popular_area}%`);
    }

    if (status) {
      if (Array.isArray(status)) {
        sb = sb.in(
          "status",
          status as Database["public"]["Enums"]["property_status"][],
        );
      } else {
        sb = sb.eq(
          "status",
          status as Database["public"]["Enums"]["property_status"],
        );
      }
    }

    const { data, error } = await sb;
    if (error) throw new Error(mapDbError(error));

    interface PropertyResult {
      id: string;
      title: string;
      price: number | null;
      original_price: number | null;
      rental_price: number | null;
      original_rental_price: number | null;
      listing_type: string | null;
      property_type: string | null;
      province: string | null;
      district: string | null;
      popular_area: string | null;
      status: string | null;
      images: Array<{
        url: string;
        image_url?: string;
        is_cover: boolean | null;
        sort_order: number | null;
      }>;
    }

    const properties = (data as unknown as PropertyResult[]) || [];

    return {
      properties: properties.map((x) => ({
        id: x.id,
        title: x.title,
        price: x.price,
        original_price: x.original_price,
        rental_price: x.rental_price,
        original_rental_price: x.original_rental_price,
        listing_type: x.listing_type,
        property_type: x.property_type,
        cover_image_url: getCoverImage(x.images),
        province: x.province,
        district: x.district,
        popular_area: x.popular_area,
        status: x.status,
      })),
      counts,
    };
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

    if (error) throw new Error(mapDbError(error));

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
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (updateErr) throw new Error(mapDbError(updateErr));

    // 3. Log Audit
    await logAudit(
      {
        supabase,
        user: { id: userId } as { id: string },
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
    } catch (notifyErr: unknown) {
      console.error("Failed to send transfer notifications:", notifyErr);
    // Non-blocking error for notification
    }

    revalidatePath("/protected/leads");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    revalidatePath(`/protected/leads/${id}`);
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");

    return { success: true };
  },
);

export const searchLeadsAction = createSafeAction(
  z.object({
    q: z.string().optional(),
    tenantId: z.string().uuid().optional(),
  }),
  async (
    { q, tenantId: inputTenantId },
    { supabase, tenantId: contextTenantId },
  ) => {
    const queryTerm = (q ?? "").trim();
    const effectiveTenantId = inputTenantId || contextTenantId;

    try {
      let sb = supabase.from("leads").select("id, full_name, phone, email");

      if (effectiveTenantId) {
        sb = sb.eq("tenant_id", effectiveTenantId);
      }

      if (queryTerm) {
        const hash = generateBlindIndex(queryTerm);
        if (hash) {
          // Search by blind index for exact matches (fast & secure)
          sb = sb.or(
            `full_name_hash.eq.${hash},phone_hash.eq.${hash},email_hash.eq.${hash}`,
          );
        } else {
          // Fallback if hashing fails (should not happen for strings)
          sb = sb.or(
            `full_name.ilike.%${queryTerm}%,phone.ilike.%${queryTerm}%`,
          );
        }
      }

      sb = sb.order("updated_at", { ascending: false }).limit(20);

      const { data, error } = await sb;
      if (error) throw error;

      return (data || []).map((lead) => ({
        ...lead,
        full_name: decrypt(lead.full_name) || "Unknown",
        phone: decrypt(lead.phone),
        email: decrypt(lead.email),
      }));
    } catch (error: unknown) {
      console.error("Search lead error:", error);
      throw new Error(mapDbError(error));
    }
  },
);
