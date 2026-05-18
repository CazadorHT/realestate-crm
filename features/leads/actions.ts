// actions leads
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createSafeAction } from "@/lib/actions/safe-action";
import { leadFormSchema, leadActivitySchema } from "./types";
import type {
  LeadInsert,
  LeadUpdate,
  LeadActivityInsert,
} from "./types";
import { generateLeadSummary } from "./services/ai-lead-service";
import { z } from "zod";
import { getCoverImage } from "@/lib/property-hardened-utils";
import type { PropertyAddressV3, PropertyPricingV3 } from "@/features/properties/types/v3";
import { logAudit } from "@/lib/audit";
import { UserRole } from "@/lib/authz";
import { mapDbError } from "@/lib/db-error";
import { 
  LISTING_TYPE_DB_VALUE, 
  PROPERTY_TYPE_DB_VALUE, 
  PROPERTY_STATUS_DB_VALUE,
  ListingType as ListingTypeLegacy,
  PropertyType as PropertyTypeLegacy,
  PropertyStatus as PropertyStatusLegacy,
  getStatusFromDb,
  getPropertyTypeFromDb,
  getListingTypeFromDb
} from "@/features/properties/labels";
import { encrypt } from "@/lib/crypto";

export const createLeadAction = createSafeAction(
  leadFormSchema,
  async (data, { supabase, userId, tenantId }) => {
    // 1. Create Identity for the Lead
    const { data: identity, error: identityErr } = await supabase
      .from("identities_v3")
      .insert({
        display_name: data.full_name,
        email: data.email,
        phone: data.phone,
        role: "LEAD",
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (identityErr || !identity) {
      console.error("Create identity error:", identityErr);
      throw new Error(mapDbError(identityErr));
    }

    // 2. Store encrypted full name in secrets
    const { error: secretErr } = await supabase
      .from("identity_secrets_v3")
      .insert({
        identity_id: identity.id,
        full_name_encrypted: encrypt(data.full_name),
        updated_at: new Date().toISOString(),
      });

    if (secretErr) {
      console.error("Create identity secret error:", secretErr);
      // Non-blocking but should be logged
    }

    // 3. Create the Lead record
    const payload: LeadInsert = {
      identity_id: identity.id,
      tenant_id: tenantId,
      source: data.source || "DIRECT",
      stage: data.stage || "NEW",
      status: "ACTIVE",
      budget_min: data.budget_min ? Number(data.budget_min) : null,
      budget_max: data.budget_max ? Number(data.budget_max) : null,
      min_bedrooms: data.min_bedrooms ? Number(data.min_bedrooms) : null,
      preferred_locations: data.preferred_locations ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: lead, error } = await supabase
      .from("crm_leads_v3")
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

    // 1. Get current identity ID from the lead
    const { data: leadRef, error: leadRefErr } = await supabase
      .from("crm_leads_v3")
      .select("identity_id")
      .eq("id", id)
      .single();

    if (leadRefErr || !leadRef) throw new Error("ไม่พบข้อมูลลีด");

    // 2. Update Identity info
    const { error: identityErr } = await supabase
      .from("identities_v3")
      .update({
        display_name: updateData.full_name,
        email: updateData.email,
        phone: updateData.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadRef.identity_id);

    if (identityErr) throw new Error(mapDbError(identityErr));

    // 3. Update Lead business info
    const payload: LeadUpdate = {
      source: updateData.source || undefined,
      stage: updateData.stage || undefined,
      budget_min: updateData.budget_min ? Number(updateData.budget_min) : null,
      budget_max: updateData.budget_max ? Number(updateData.budget_max) : null,
      min_bedrooms: updateData.min_bedrooms ? Number(updateData.min_bedrooms) : null,
      preferred_locations: updateData.preferred_locations ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("crm_leads_v3")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("Update lead error:", error);
      throw new Error(mapDbError(error));
    }

    revalidatePath("/protected/leads");
    revalidatePath(`/protected/leads/${id}`);
    revalidateTag("dashboard-stats", "seconds");
    return { id };
  },
);

export const deleteLeadAction = createSafeAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }, { supabase, tenantId }) => {
    const { error } = await supabase
      .from("crm_leads_v3")
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
      .from("crm_leads_v3")
      .select("id")
      .eq("id", leadId)
      .eq("tenant_id", tenantId)
      .single();

    if (leadErr || !lead)
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์");

    const payload: LeadActivityInsert = {
      target_id: leadId,
      target_entity: "leads",
      activity_type: values.activity_type,
      description: values.note.trim(),
      actor_id: userId,
      tenant_id: tenantId,
      metadata: values.property_id ? { property_id: values.property_id } : null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("activity_timeline_v3").insert(payload);
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
      .from("crm_leads_v3")
      .select("id")
      .eq("id", leadId)
      .eq("tenant_id", tenantId)
      .single();

    if (leadErr || !lead)
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์");

    const { error } = await supabase
      .from("activity_timeline_v3")
      .update({
        activity_type: values.activity_type,
        description: values.note.trim(),
        metadata: values.property_id ? { property_id: values.property_id } : null,
      })
      .eq("id", activityId)
      .eq("target_id", leadId);

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
      .from("crm_leads_v3")
      .select("id")
      .eq("id", leadId)
      .eq("tenant_id", tenantId)
      .single();

    if (leadErr || !lead)
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์");

    const { error } = await supabase
      .from("activity_timeline_v3")
      .delete()
      .eq("id", activityId)
      .eq("target_id", leadId);

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
      .from("crm_leads_v3")
      .update({
        stage: stage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) throw new Error(mapDbError(error));

    revalidatePath("/protected/leads");
    revalidateTag("dashboard-stats", "seconds");
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

    // 1. Fetch facet counts using core tables (Efficient facet calculation)
    let facetSb = supabase
      .from("properties_core")
      .select("listing_type, property_type, status")
      .is("deleted_at", null);

    if (effectiveTenantId) {
      facetSb = facetSb.eq("tenant_id", effectiveTenantId);
    }

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
          listing_type: number;
          property_type: number;
          status: number | null;
        }) => {
          const ltKey = getListingTypeFromDb(x.listing_type);
          counts.listing_type[ltKey] =
            (counts.listing_type[ltKey] || 0) + 1;
          const ptKey = getPropertyTypeFromDb(x.property_type);
          counts.property_type[ptKey] =
            (counts.property_type[ptKey] || 0) + 1;
          if (x.status !== null) {
            const stKey = getStatusFromDb(x.status);
            counts.status[stKey] = (counts.status[stKey] || 0) + 1;
          }
        },
      );
    }

    // 2. Fetch filtered properties using Core + Details Join (No Views)
    let sb = supabase
      .from("properties_core")
      .select(`
        id, 
        listing_type, 
        property_type, 
        status,
        sale_price,
        rent_price,
        properties_details!inner(title, address_info, pricing_details),
        property_media_v3(url, storage_path, is_cover, sort_order)
      `)
      .is("deleted_at", null);

    if (effectiveTenantId) {
      sb = sb.eq("tenant_id", effectiveTenantId);
    }

    if (queryTerm) {
      // Search in localized title (TH)
      sb = sb.ilike("properties_details.title->>th", `%${queryTerm}%`);
    }

    sb = sb.order("updated_at", { ascending: false }).limit(30);

    if (listing_type) {
      const type = listing_type as ListingTypeLegacy;
      if (type === "SALE") {
        sb = sb.in("listing_type", [0, 2]); // SALE or SALE_AND_RENT
      } else if (type === "RENT") {
        sb = sb.in("listing_type", [1, 2]); // RENT or SALE_AND_RENT
      } else if (type === "SALE_AND_RENT") {
        sb = sb.eq("listing_type", 2);
      }
    }

    if (property_type) {
      const dbVal = PROPERTY_TYPE_DB_VALUE[property_type as PropertyTypeLegacy];
      if (dbVal !== undefined) sb = sb.eq("property_type", dbVal);
    }

    if (popular_area) {
      sb = sb.ilike("properties_details.address_info->>popular_area", `%${popular_area}%`);
    }

    if (status) {
      if (Array.isArray(status)) {
        const dbVals = status
          .map(s => PROPERTY_STATUS_DB_VALUE[s as PropertyStatusLegacy])
          .filter(v => v !== undefined);
        if (dbVals.length > 0) sb = sb.in("status", dbVals);
      } else {
        const dbVal = PROPERTY_STATUS_DB_VALUE[status as PropertyStatusLegacy];
        if (dbVal !== undefined) sb = sb.eq("status", dbVal);
      }
    }

    const { data, error } = await sb;
    if (error) throw new Error(mapDbError(error));



    return {
      properties: (data || []).map((x) => {
        const detailsObj = (x.properties_details as unknown as { 
          title: { th?: string; en?: string; cn?: string; ru?: string } | string; 
          address_info: PropertyAddressV3; 
          pricing_details: PropertyPricingV3 
        }) || {};
        
        const titleVal = typeof detailsObj.title === "object" ? detailsObj.title?.th : detailsObj.title;
        const pricing = detailsObj.pricing_details || {};
        const address = detailsObj.address_info || {};
        const images = (x.property_media_v3 as Array<{
          url: string;
          storage_path: string;
          is_cover: boolean;
          sort_order: number;
        }>) || [];

        return {
          id: x.id,
          title: titleVal || "No Title",
          price: x.sale_price as number | null,
          original_price: (pricing.original_price as number) || null,
          rental_price: x.rent_price as number | null,
          original_rental_price: (pricing.original_rental_price as number) || null,
          listing_type: getListingTypeFromDb(x.listing_type),
          property_type: getPropertyTypeFromDb(x.property_type),
          cover_image_url: getCoverImage(images.map(img => ({
            url: img.url,
            image_url: img.url,
            storage_path: img.storage_path,
            is_cover: img.is_cover,
            sort_order: img.sort_order
          }))),
          province: (typeof address.province === "object" ? address.province?.th : address.province) || null,
          district: (typeof address.district === "object" ? address.district?.th : address.district) || null,
          popular_area: (typeof address.popular_area === "object" ? address.popular_area?.th : address.popular_area) || null,
          status: getStatusFromDb(x.status),
        };
      }),
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
    const { data: lead } = await supabase.from("crm_leads_v3").select("utm_data").eq("id", id).single();
    const currentMeta = (lead?.utm_data as Record<string, unknown>) || {};

    const { error } = await supabase
      .from("crm_leads_v3")
      .update({
        utm_data: { ...currentMeta, pdpa_consent: consent, consent_date: new Date().toISOString() },
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
      .from("crm_leads_v3")
      .select("id, identities_v3!identity_id(display_name)")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (leadErr || !lead) {
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์โอนย้ายลูกค้าคนนี้");
    }

    // 2. Perform transfer
    const { error: updateErr } = await supabase
      .from("crm_leads_v3")
      .update({
        tenant_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (updateErr) throw new Error(mapDbError(updateErr));

    type TransferLeadIdentity = { display_name: string | null };
    const leadData = lead as unknown as { id: string; identities_v3: TransferLeadIdentity | null };
    const leadDisplayName = leadData?.identities_v3?.display_name || "Unknown";

    // 3. Log Audit
    await logAudit(
      {
        supabase,
        user: { id: userId } as { id: string },
        role: role as UserRole,
      },
      {
        action: "lead.transfer",
        entity: "crm_leads_v3",
        entityId: id,
        metadata: {
          fromTenantId: tenantId,
          toTenantId: targetTenantId,
          fullName: leadDisplayName,
        },
      },
    );

    // 4. Create Notifications for Target Tenant Admins
    try {
      // Find admins/owners of the target tenant
      const { data: members } = await supabase
        .from("tenant_members_v3")
        .select("identity_id")
        .eq("tenant_id", targetTenantId)
        .in("role", ["admin", "owner"]);

      if (members && members.length > 0) {
        const { createNotificationAction } =
          await import("@/lib/actions/notifications");
        const { data: currentTenant } = await supabase
          .from("tenants_v3")
          .select("name")
          .eq("id", tenantId)
          .single();

        await Promise.all(
          members.map((member: { identity_id: string }) =>
            createNotificationAction({
              userId: member.identity_id,
              tenantId: targetTenantId,
              type: "LEAD_TRANSFER",
              title: "มีลูกค้าส่งต่อใหม่ (Lead Transfer)",
              message: `สาขา ${currentTenant?.name || "อื่น"} ได้ส่งต่อลูกค้า "${leadDisplayName}" มายังสาขาของคุณ`,
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
      // Direct Join on V3 Core Tables (Explicit Identity Join)
      let sb = supabase
        .from("crm_leads_v3")
        .select(`
          id,
          identities_v3!identity_id (
            display_name,
            phone,
            email
          )
        `);

      if (effectiveTenantId) {
        sb = sb.eq("tenant_id", effectiveTenantId);
      }

      if (queryTerm) {
        sb = sb.or(
          `display_name.ilike.%${queryTerm}%,phone.ilike.%${queryTerm}%,email.ilike.%${queryTerm}%`,
          { foreignTable: "identities_v3" }
        );
      }

      sb = sb.order("created_at", { ascending: false }).limit(20);

      const { data, error } = await sb;
      if (error) throw error;

      return (data || []).map((lead: { 
        id: string; 
        identities_v3: { 
          display_name: string | null; 
          phone: string | null; 
          email: string | null 
        } | null 
      }) => ({
        id: lead.id,
        full_name: lead.identities_v3?.display_name || "Unknown",
        phone: lead.identities_v3?.phone ?? null,
        email: lead.identities_v3?.email ?? null,
      }));
    } catch (error: unknown) {
      console.error("Search lead error:", error);
      throw new Error(mapDbError(error));
    }
  },
);
