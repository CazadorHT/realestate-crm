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
import { encrypt, decrypt } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const createLeadAction = createSafeAction(
  leadFormSchema,
  async (data, { supabase, userId, tenantId }) => {
    const adminClient = createAdminClient();

    // Resolve target tenant ID for the lead in case we are in the "ALL" (null) context
    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const { data: firstMember } = await supabase
        .from("tenant_members_v3")
        .select("tenant_id")
        .eq("identity_id", userId)
        .limit(1)
        .maybeSingle();
      
      if (firstMember?.tenant_id) {
        targetTenantId = firstMember.tenant_id;
      } else {
        const { default_tenant_id } = await (await import("@/lib/actions/system-config")).getSystemConfig();
        if (default_tenant_id) {
          targetTenantId = default_tenant_id;
        } else {
          // Ultimate fallback: get the first tenant in the system using Admin Client to bypass RLS limits
          const { data: firstTenant } = await adminClient
            .from("tenants_v3")
            .select("id")
            .limit(1)
            .maybeSingle();
          if (firstTenant?.id) {
            targetTenantId = firstTenant.id;
          }
        }
      }
    }

    // 1. Create Identity for the Lead
    const { data: identity, error: identityErr } = await supabase
      .from("identities_v3")
      .insert({
        display_name: encrypt(data.full_name) || "Unknown Lead",
        email: data.email ? encrypt(data.email) : null,
        phone: data.phone ? encrypt(data.phone) : null,
        line_id: data.line_id ? encrypt(data.line_id) : null,
        social_links: {
          wechat_id: data.wechat_id ? encrypt(data.wechat_id) : null,
          whatsapp: data.whatsapp ? encrypt(data.whatsapp) : null,
        },
        role: "LEAD",
        tenant_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (identityErr || !identity) {
      console.error("Create identity error:", identityErr);
      throw new Error(mapDbError(identityErr));
    }

    // 2. Store encrypted full name in secrets using Admin Client to bypass RLS
    const { error: secretErr } = await adminClient
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

    // 3. Create preferences object for utm_data.preferences
    const prefs = {
      note: data.note || null,
      lead_type: data.lead_type || null,
      nationality: data.nationality || null,
      is_foreigner: !!data.is_foreigner,
      property_types: data.preferred_property_types || null,
      min_bathrooms: data.min_bathrooms !== null && data.min_bathrooms !== undefined ? Number(data.min_bathrooms) : null,
      min_size: data.min_size_sqm !== null && data.min_size_sqm !== undefined ? Number(data.min_size_sqm) : null,
      max_size: data.max_size_sqm !== null && data.max_size_sqm !== undefined ? Number(data.max_size_sqm) : null,
      occupants: data.num_occupants !== null && data.num_occupants !== undefined ? Number(data.num_occupants) : null,
      has_pets: !!data.has_pets,
      need_company: !!data.need_company_registration,
      allow_airbnb: !!data.allow_airbnb,
      property_id: data.property_id || null,
      locations: data.preferred_locations || null,
      budget_min: data.budget_min !== null && data.budget_min !== undefined ? Number(data.budget_min) : null,
      budget_max: data.budget_max !== null && data.budget_max !== undefined ? Number(data.budget_max) : null,
      min_bedrooms: data.min_bedrooms !== null && data.min_bedrooms !== undefined ? Number(data.min_bedrooms) : null,
    };

    // 4. Create the Lead record
    const payload: LeadInsert = {
      identity_id: identity.id,
      tenant_id: targetTenantId,
      source: data.source || "DIRECT",
      stage: data.stage || "NEW",
      status: "ACTIVE",
      assigned_to: data.assigned_to || null,
      budget_min: data.budget_min !== null && data.budget_min !== undefined ? Number(data.budget_min) : null,
      budget_max: data.budget_max !== null && data.budget_max !== undefined ? Number(data.budget_max) : null,
      min_bedrooms: data.min_bedrooms !== null && data.min_bedrooms !== undefined ? Number(data.min_bedrooms) : null,
      preferred_locations: data.preferred_locations ?? null,
      utm_data: {
        preferences: prefs
      },
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
      data: { leadId: lead.id, tenantId: targetTenantId },
    }).catch(e => console.warn("Inngest lead.created skip:", e.message));

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
  async (data, { supabase, userId, tenantId, role }) => {
    const { id, ...updateData } = data;

    // 1. Get current identity ID, tenant ID, and utm_data from the lead
    const { data: leadRef, error: leadRefErr } = await supabase
      .from("crm_leads_v3")
      .select("identity_id, tenant_id, utm_data")
      .eq("id", id)
      .single();

    if (leadRefErr || !leadRef) throw new Error("ไม่พบข้อมูลลีด");

    // Security check: Verify tenant membership if not admin
    if (role !== "ADMIN" && leadRef.tenant_id) {
      if (tenantId !== leadRef.tenant_id) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", leadRef.tenant_id)
          .eq("identity_id", userId)
          .maybeSingle();

        if (!member) {
          throw new Error("คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลของสาขานี้");
        }
      }
    }

    // 2. Update Identity info
    const { error: identityErr } = await supabase
      .from("identities_v3")
      .update({
        display_name: encrypt(updateData.full_name) || "Unknown Lead",
        email: updateData.email ? encrypt(updateData.email) : null,
        phone: updateData.phone ? encrypt(updateData.phone) : null,
        line_id: updateData.line_id ? encrypt(updateData.line_id) : null,
        social_links: {
          wechat_id: updateData.wechat_id ? encrypt(updateData.wechat_id) : null,
          whatsapp: updateData.whatsapp ? encrypt(updateData.whatsapp) : null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadRef.identity_id);

    if (identityErr) throw new Error(mapDbError(identityErr));

    // Update secret name using Admin Client
    const adminClient = createAdminClient();
    const { error: secretErr } = await adminClient
      .from("identity_secrets_v3")
      .upsert({
        identity_id: leadRef.identity_id,
        full_name_encrypted: encrypt(updateData.full_name),
        updated_at: new Date().toISOString(),
      }, { onConflict: "identity_id" });

    if (secretErr) {
      console.error("Update identity secret error:", secretErr);
    }

    const currentUtmData = (leadRef.utm_data as Record<string, any>) || {};
    const newPrefs = {
      note: updateData.note || null,
      lead_type: updateData.lead_type || null,
      nationality: updateData.nationality || null,
      is_foreigner: !!updateData.is_foreigner,
      property_types: updateData.preferred_property_types || null,
      min_bathrooms: updateData.min_bathrooms !== null && updateData.min_bathrooms !== undefined ? Number(updateData.min_bathrooms) : null,
      min_size: updateData.min_size_sqm !== null && updateData.min_size_sqm !== undefined ? Number(updateData.min_size_sqm) : null,
      max_size: updateData.max_size_sqm !== null && updateData.max_size_sqm !== undefined ? Number(updateData.max_size_sqm) : null,
      occupants: updateData.num_occupants !== null && updateData.num_occupants !== undefined ? Number(updateData.num_occupants) : null,
      has_pets: !!updateData.has_pets,
      need_company: !!updateData.need_company_registration,
      allow_airbnb: !!updateData.allow_airbnb,
      property_id: updateData.property_id || null,
      locations: updateData.preferred_locations || null,
      budget_min: updateData.budget_min !== null && updateData.budget_min !== undefined ? Number(updateData.budget_min) : null,
      budget_max: updateData.budget_max !== null && updateData.budget_max !== undefined ? Number(updateData.budget_max) : null,
      min_bedrooms: updateData.min_bedrooms !== null && updateData.min_bedrooms !== undefined ? Number(updateData.min_bedrooms) : null,
    };

    // 3. Update Lead business info
    const payload: LeadUpdate = {
      source: updateData.source || undefined,
      stage: updateData.stage || undefined,
      assigned_to: updateData.assigned_to || null,
      budget_min: updateData.budget_min !== null && updateData.budget_min !== undefined ? Number(updateData.budget_min) : null,
      budget_max: updateData.budget_max !== null && updateData.budget_max !== undefined ? Number(updateData.budget_max) : null,
      min_bedrooms: updateData.min_bedrooms !== null && updateData.min_bedrooms !== undefined ? Number(updateData.min_bedrooms) : null,
      preferred_locations: updateData.preferred_locations ?? null,
      utm_data: {
        ...currentUtmData,
        preferences: newPrefs
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("crm_leads_v3")
      .update(payload)
      .eq("id", id);

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
  async ({ id }, { supabase, tenantId, userId, role }) => {
    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .select("tenant_id")
      .eq("id", id)
      .single();

    if (leadErr || !lead) throw new Error("ไม่พบข้อมูลลีด");

    if (role !== "ADMIN" && lead.tenant_id) {
      if (tenantId !== lead.tenant_id) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", lead.tenant_id)
          .eq("identity_id", userId)
          .maybeSingle();

        if (!member) {
          throw new Error("คุณไม่มีสิทธิ์ลบข้อมูลของสาขานี้");
        }
      }
    }

    const { error } = await supabase
      .from("crm_leads_v3")
      .delete()
      .eq("id", id);

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
  async ({ leadId, values }, { supabase, userId, tenantId, role }) => {
    // Verify lead exists and user has access
    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .select("tenant_id")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead)
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์");

    const leadTenantId = lead.tenant_id;
    if (role !== "ADMIN" && leadTenantId) {
      if (tenantId !== leadTenantId) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", leadTenantId)
          .eq("identity_id", userId)
          .maybeSingle();

        if (!member) {
          throw new Error("คุณไม่มีสิทธิ์เข้าถึงข้อมูลของสาขานี้");
        }
      }
    }

    const payload: LeadActivityInsert = {
      target_id: leadId,
      target_entity: "leads",
      activity_type: values.activity_type,
      description: values.note.trim(),
      actor_id: userId,
      tenant_id: leadTenantId || tenantId,
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
  async ({ activityId, leadId, values }, { supabase, tenantId, userId, role }) => {
    // Security check for lead ownership
    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .select("tenant_id")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead)
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์");

    if (role !== "ADMIN" && lead.tenant_id) {
      if (tenantId !== lead.tenant_id) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", lead.tenant_id)
          .eq("identity_id", userId)
          .maybeSingle();

        if (!member) {
          throw new Error("คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลของสาขานี้");
        }
      }
    }

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
  async ({ activityId, leadId }, { supabase, tenantId, userId, role }) => {
    // Security check for lead ownership
    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .select("tenant_id")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead)
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์");

    if (role !== "ADMIN" && lead.tenant_id) {
      if (tenantId !== lead.tenant_id) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", lead.tenant_id)
          .eq("identity_id", userId)
          .maybeSingle();

        if (!member) {
          throw new Error("คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลของสาขานี้");
        }
      }
    }

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
  async ({ id, stage }, { supabase, tenantId, userId, role }) => {
    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .select("tenant_id")
      .eq("id", id)
      .single();

    if (leadErr || !lead) throw new Error("ไม่พบข้อมูลลีด");

    if (role !== "ADMIN" && lead.tenant_id) {
      if (tenantId !== lead.tenant_id) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", lead.tenant_id)
          .eq("identity_id", userId)
          .maybeSingle();

        if (!member) {
          throw new Error("คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลของสาขานี้");
        }
      }
    }

    let query = supabase
      .from("crm_leads_v3")
      .update({
        stage: stage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (role !== "ADMIN" && tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { error } = await query;

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
  async ({ id, consent }, { supabase, tenantId, userId, role }) => {
    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .select("utm_data, tenant_id")
      .eq("id", id)
      .single();

    if (leadErr || !lead) throw new Error("ไม่พบข้อมูลลีด");

    if (role !== "ADMIN" && lead.tenant_id) {
      if (tenantId !== lead.tenant_id) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", lead.tenant_id)
          .eq("identity_id", userId)
          .maybeSingle();

        if (!member) {
          throw new Error("คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลของสาขานี้");
        }
      }
    }

    const currentMeta = (lead.utm_data as Record<string, unknown>) || {};

    const { error } = await supabase
      .from("crm_leads_v3")
      .update({
        utm_data: { ...currentMeta, pdpa_consent: consent, consent_date: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

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
    // 1. Verify lead exists
    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .select("id, tenant_id, identities_v3!identity_id(display_name)")
      .eq("id", id)
      .single();

    if (leadErr || !lead) {
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์โอนย้ายลูกค้าคนนี้");
    }

    const leadTenantId = lead.tenant_id;
    if (role !== "ADMIN" && leadTenantId) {
      if (tenantId !== leadTenantId) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", leadTenantId)
          .eq("identity_id", userId)
          .maybeSingle();

        if (!member) {
          throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์โอนย้ายลูกค้าคนนี้");
        }
      }
    }

    // 2. Perform transfer
    const { error: updateErr } = await supabase.rpc("transfer_lead_to_tenant_v3", {
      p_lead_id: id,
      p_target_tenant_id: targetTenantId,
    });

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
          fromTenantId: leadTenantId,
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
          .eq("id", leadTenantId || "")
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
        full_name: decrypt(lead.identities_v3?.display_name) || "Unknown",
        phone: decrypt(lead.identities_v3?.phone) ?? null,
        email: decrypt(lead.identities_v3?.email) ?? null,
      }));
    } catch (error: unknown) {
      console.error("Search lead error:", error);
      throw new Error(mapDbError(error));
    }
  },
);

export const requestLeadTransferAction = createSafeAction(
  z.object({
    id: z.string().uuid(),
    targetTenantId: z.string().uuid(),
    reason: z.string().optional(),
  }),
  async ({ id, targetTenantId, reason }, { supabase, tenantId, userId, role }) => {
    // 1. Verify lead exists
    const { data: lead, error: leadErr } = await supabase
      .from("crm_leads_v3")
      .select("id, tenant_id, identities_v3!identity_id(display_name)")
      .eq("id", id)
      .single();

    if (leadErr || !lead) {
      throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์เข้าถึงลูกค้าคนนี้");
    }

    const leadTenantId = lead.tenant_id;
    if (role !== "ADMIN" && leadTenantId) {
      if (tenantId !== leadTenantId) {
        const { data: member } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", leadTenantId)
          .eq("identity_id", userId)
          .maybeSingle();

        if (!member) {
          throw new Error("ไม่พบข้อมูล Lead หรือคุณไม่มีสิทธิ์เข้าถึงลูกค้าคนนี้");
        }
      }
    }

    const effectiveTenantId = leadTenantId || tenantId;
    if (!effectiveTenantId) {
      throw new Error("ไม่พบข้อมูลสาขาของลูกค้าท่านนี้");
    }

    type TransferLeadIdentity = { display_name: string | null };
    const leadData = lead as unknown as { id: string; identities_v3: TransferLeadIdentity | null };
    const leadDisplayName = leadData?.identities_v3?.display_name || "Unknown";

    // 2. Fetch requester name
    const { data: requester } = await supabase
      .from("identities_v3")
      .select("display_name")
      .eq("id", userId)
      .single();
    const requesterName = requester?.display_name || "Agent";

    // 3. Fetch current & target tenant info
    const [{ data: currentTenant }, { data: targetTenant }] = await Promise.all([
      supabase.from("tenants_v3").select("name").eq("id", effectiveTenantId).single(),
      supabase.from("tenants_v3").select("name").eq("id", targetTenantId).single(),
    ]);

    // 4. Log Request in activity timeline
    const { error: activityErr } = await supabase.from("activity_timeline_v3").insert({
      tenant_id: effectiveTenantId,
      actor_id: userId,
      target_entity: "lead",
      target_id: id,
      activity_type: "transfer_requested",
      description: `Requested transfer of lead to ${targetTenant?.name || "another branch"}. Reason: ${reason || "None"}`,
      metadata: {
        source_tenant_id: effectiveTenantId,
        target_tenant_id: targetTenantId,
        requested_by: userId,
        reason: reason || "",
      },
    });

    if (activityErr) throw new Error(mapDbError(activityErr));

    // 5. Notify managers/owners of the current tenant (to approve it)
    try {
      const { data: managers } = await supabase
        .from("tenant_members_v3")
        .select("identity_id")
        .eq("tenant_id", effectiveTenantId)
        .in("role", ["admin", "owner", "manager"]);

      if (managers && managers.length > 0) {
        const { createNotificationAction } = await import("@/lib/actions/notifications");
        await Promise.all(
          managers.map((member: { identity_id: string }) =>
            createNotificationAction({
              userId: member.identity_id,
              tenantId: effectiveTenantId,
              type: "LEAD_TRANSFER",
              title: "คำขอส่งต่อลูกค้าใหม่ ⚠️",
              message: `${requesterName} ขออนุมัติส่งต่อลูกค้า "${leadDisplayName}" ไปยังสาขา "${targetTenant?.name || "อื่น"}"`,
              link: `/protected/leads/${id}`,
            }),
          ),
        );
      }
    } catch (notifyErr) {
      console.error("Failed to send transfer request notifications:", notifyErr);
    }

    revalidatePath(`/protected/leads/${id}`);
    return { success: true };
  }
);

