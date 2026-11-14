"use server";

import { z } from "zod";
import { requireAuthContext, resolveTenantId } from "@/lib/authz";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  PROPERTY_STATUS_DB_VALUE,
  LISTING_TYPE_DB_VALUE,
  PROPERTY_TYPE_DB_VALUE,
} from "@/features/properties/labels";
import { createDealAction } from "@/features/deals/actions";
import { generateDocumentFromTemplateAction } from "./generation-actions";
import { getProjectSuggestions } from "@/features/properties/actions/project-suggestions";

import {
  quickDocumentPayloadSchema,
  type QuickDocumentPayload,
} from "./quick-document-schema";

// ==========================================
// ACTIONS
// ==========================================

/**
 * 🔍 Smart Duplicate Detection: Search existing lead by phone, email, or name
 */
export async function findExistingLeadAction(query: string) {
  if (!query || query.trim().length < 3) {
    return { success: true, leads: [] };
  }

  try {
    const { supabase, tenantId } = await requireAuthContext();
    const cleanTerm = query.trim().replace(/[-\s]/g, "");

    // Fetch candidate leads from current tenant
    let sb = supabase
      .from("crm_leads_v3")
      .select(`
        id,
        created_at,
        utm_data,
        identities_v3!identity_id (
          id,
          display_name,
          phone,
          email,
          line_id
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (tenantId) {
      sb = sb.eq("tenant_id", tenantId);
    }

    const { data, error } = await sb;
    if (error) throw error;

    const matchedLeads: Array<{
      id: string;
      full_name: string;
      phone: string;
      email: string;
      line_id: string;
      nationality?: string;
      passport?: string;
      id_card?: string;
    }> = [];

    for (const lead of data || []) {
      const iden = lead.identities_v3 as any;
      if (!iden) continue;

      const decName = decrypt(iden.display_name) || "";
      const decPhone = decrypt(iden.phone) || "";
      const decEmail = decrypt(iden.email) || "";
      const decLine = decrypt(iden.line_id) || "";

      const cleanPhone = decPhone.replace(/[-\s]/g, "");
      const cleanName = decName.toLowerCase();
      const targetQuery = query.toLowerCase().trim();

      const isMatch =
        (cleanPhone && cleanPhone.includes(cleanTerm)) ||
        (cleanName && cleanName.includes(targetQuery)) ||
        (decEmail && decEmail.toLowerCase().includes(targetQuery));

      if (isMatch) {
        const prefs = (lead.utm_data as any)?.preferences || {};
        matchedLeads.push({
          id: lead.id,
          full_name: decName,
          phone: decPhone,
          email: decEmail,
          line_id: decLine,
          nationality: prefs.nationality || "",
          passport: prefs.passport || "",
          id_card: prefs.id_card || "",
        });
      }
    }

    return { success: true, leads: matchedLeads.slice(0, 5) };
  } catch (error: any) {
    console.error("[findExistingLeadAction] Error:", error);
    return { success: false, error: error.message || "Failed to search leads", leads: [] };
  }
}

/**
 * 🏢 Project Search Action for the Search-First Combobox
 */
export async function searchProjectsForQuickDocAction(search: string) {
  try {
    const suggestions = await getProjectSuggestions(search, 15);
    return { success: true, data: suggestions };
  } catch (error: any) {
    console.error("[searchProjectsForQuickDocAction] Error:", error);
    return { success: false, data: [] };
  }
}

/**
 * Helper: Resolve existing lead by client information (phone, passport, email, or name)
 */
async function resolveExistingLeadId(
  client: QuickDocumentPayload["client"],
  tenantId: string | null,
  supabase: any
): Promise<string | null> {
  if (client.lead_id) {
    const { data } = await supabase
      .from("crm_leads_v3")
      .select("id")
      .eq("id", client.lead_id)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const cleanPhone = (client.phone || "").replace(/[-\s]/g, "").trim();
  const cleanEmail = (client.email || "").toLowerCase().trim();
  const cleanName = (client.full_name || "").toLowerCase().trim();
  const cleanPassport = (client.passport || "").toLowerCase().trim();

  if (!cleanPhone && !cleanEmail && !cleanName && !cleanPassport) return null;

  let sb = supabase
    .from("crm_leads_v3")
    .select(`
      id,
      created_at,
      utm_data,
      identities_v3!identity_id (
        id,
        display_name,
        phone,
        email,
        line_id
      )
    `);

  if (tenantId) {
    sb = sb.eq("tenant_id", tenantId);
  }

  const { data, error } = await sb
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return null;

  for (const lead of data) {
    const iden = lead.identities_v3 as any;
    if (!iden) continue;

    const decPhone = (decrypt(iden.phone) || "").replace(/[-\s]/g, "");
    const decEmail = (decrypt(iden.email) || "").toLowerCase().trim();
    const decName = (decrypt(iden.display_name) || "").toLowerCase().trim();
    const prefs = (lead.utm_data as any)?.preferences || {};
    const decPassport = (prefs.passport || "").toLowerCase().trim();

    if (
      cleanPhone &&
      cleanPhone.length >= 8 &&
      decPhone &&
      (decPhone.includes(cleanPhone) || cleanPhone.includes(decPhone))
    ) {
      return lead.id;
    }
    if (cleanPassport && decPassport && cleanPassport === decPassport) {
      return lead.id;
    }
    if (cleanEmail && decEmail && cleanEmail === decEmail) {
      return lead.id;
    }
    if (
      cleanName &&
      decName &&
      (cleanName === decName ||
        (cleanName.length > 5 &&
          (cleanName.includes(decName) || decName.includes(cleanName))))
    ) {
      return lead.id;
    }
  }

  return null;
}

/**
 * ⚡ Main Action: Quick Document Generation
 * Handles Lead Creation/Reuse -> Draft Property Creation/Reuse -> Deal Creation/Reuse -> Document Generation
 */
export async function createQuickDocumentAction(rawPayload: QuickDocumentPayload) {
  try {
    const { supabase, user, tenantId: contextTenantId } = await requireAuthContext();
    const adminClient = createAdminClient();

    // 1. Validate payload
    const payload = quickDocumentPayloadSchema.parse(rawPayload);

    // Resolve tenantId if user is in "ALL" cross-branch mode to ensure non-null tenant_id
    const tenantId = await resolveTenantId(supabase, user.id, contextTenantId);

    // ------------------------------------------------------------------
    // STEP 1: RESOLVE OR REUSE LEAD
    // ------------------------------------------------------------------
    let finalLeadId = payload.client.lead_id || null;

    if (!finalLeadId) {
      finalLeadId = await resolveExistingLeadId(payload.client, tenantId, supabase);
    }

    if (!finalLeadId) {
      // 1.1 Create Identity for Lead
      const { data: identity, error: identityErr } = await supabase
        .from("identities_v3")
        .insert({
          display_name: encrypt(payload.client.full_name) || "Unknown Lead",
          email: payload.client.email ? encrypt(payload.client.email) : null,
          phone: payload.client.phone ? encrypt(payload.client.phone) : null,
          line_id: payload.client.line_id ? encrypt(payload.client.line_id) : null,
          role: "LEAD",
          tenant_id: tenantId,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (identityErr || !identity) {
        console.error("Create identity error in quick document:", identityErr);
        throw new Error(`Failed to create client identity: ${identityErr?.message || "Unknown error"}`);
      }

      // Store in secrets
      await adminClient.from("identity_secrets_v3").insert({
        identity_id: identity.id,
        full_name_encrypted: encrypt(payload.client.full_name),
        updated_at: new Date().toISOString(),
      });

      // 1.2 Create Lead Record in crm_leads_v3
      const prefs = {
        nationality: payload.client.nationality || null,
        passport: payload.client.passport || null,
        id_card: payload.client.id_card || null,
      };

      const { data: newLead, error: leadErr } = await supabase
        .from("crm_leads_v3")
        .insert({
          identity_id: identity.id,
          tenant_id: tenantId,
          source: "QUICK_DOCUMENT",
          stage: "NEW",
          status: "ACTIVE",
          assigned_to: user.id,
          utm_data: {
            preferences: prefs,
            quick_generated: true,
          },
        })
        .select("id")
        .single();

      if (leadErr || !newLead) {
        console.error("Create lead error in quick document:", leadErr);
        throw new Error(`Failed to create client lead record: ${leadErr?.message || "Unknown error"}`);
      }

      finalLeadId = newLead.id;
    } else {
      // If lead exists, update any empty nationality or passport if provided
      if (payload.client.nationality || payload.client.passport || payload.client.id_card) {
        try {
          const { data: currentLead } = await supabase
            .from("crm_leads_v3")
            .select("utm_data")
            .eq("id", finalLeadId)
            .maybeSingle();

          const currentPrefs = (currentLead?.utm_data as any)?.preferences || {};
          const updatedPrefs = {
            ...currentPrefs,
            nationality: payload.client.nationality || currentPrefs.nationality,
            passport: payload.client.passport || currentPrefs.passport,
            id_card: payload.client.id_card || currentPrefs.id_card,
          };

          await supabase
            .from("crm_leads_v3")
            .update({
              utm_data: {
                ...(currentLead?.utm_data as any),
                preferences: updatedPrefs,
              },
            })
            .eq("id", finalLeadId);
        } catch (updateErr) {
          console.warn("Failed to update lead preferences:", updateErr);
        }
      }
    }

    // ------------------------------------------------------------------
    // STEP 2: RESOLVE OR REUSE DEAL AND PROPERTY
    // ------------------------------------------------------------------
    let finalPropertyId = payload.property.property_id || null;
    const finalProjectId = payload.property.project_id || null;
    let finalDealId: string | null = null;

    // 2.1 Check if an existing deal already exists for this customer + project/property
    if (finalLeadId) {
      const { data: existingDeals } = await supabase
        .from("crm_deals_v3")
        .select(`
          id,
          property_id,
          title,
          status,
          property:properties_core!crm_deals_v3_property_id_fkey(
            id,
            project_id
          )
        `)
        .eq("lead_id", finalLeadId)
        .order("created_at", { ascending: false });

      if (existingDeals && existingDeals.length > 0) {
        // Priority 1: Match by property_id OR project_id OR project title in deal title
        const match = existingDeals.find((d: any) => {
          if (finalPropertyId && d.property_id === finalPropertyId) return true;
          if (
            payload.property.project_id &&
            d.property?.project_id === payload.property.project_id
          )
            return true;
          if (
            payload.property.project_name &&
            d.title?.toLowerCase().includes(payload.property.project_name.toLowerCase())
          )
            return true;
          return false;
        });

        if (match) {
          finalDealId = match.id;
          finalPropertyId = match.property_id || finalPropertyId;
        } else {
          // Priority 2: Reuse active negotiating deal for this customer
          const activeDeal = existingDeals.find(
            (d: any) => !["LOST", "CLOSED", "CANCELLED"].includes(d.status),
          );
          if (activeDeal) {
            finalDealId = activeDeal.id;
            finalPropertyId = activeDeal.property_id || finalPropertyId;
          }
        }
      }
    }

    // 2.2 If still no property resolved: CHECK IF A PROPERTY ALREADY EXISTS FOR THIS PROJECT IN THE SYSTEM!
    // NEVER create duplicate properties in properties_core unless explicitly requested by user!
    const shouldCreateNewProperty = payload.property.save_as_property === true;

    if (!shouldCreateNewProperty) {
      if (!finalPropertyId && finalProjectId) {
        const { data: existingProp } = await supabase
          .from("properties_core")
          .select("id, project_id, status")
          .eq("tenant_id", tenantId)
          .eq("project_id", finalProjectId)
          .order("status", { ascending: false }) // prioritize active (1) over draft (0)
          .limit(1)
          .maybeSingle();

        if (existingProp?.id) {
          finalPropertyId = existingProp.id;
        }
      }

      // If still no property by project_id, check by project title in properties_details
      if (!finalPropertyId && payload.property.project_name) {
        const { data: propByTitle } = await supabase
          .from("properties_details")
          .select("property_id")
          .or(
            `title->>th.ilike.%${payload.property.project_name}%,title->>en.ilike.%${payload.property.project_name}%`,
          )
          .limit(1)
          .maybeSingle();

        if (propByTitle?.property_id) {
          finalPropertyId = propByTitle.property_id;
        }
      }
    }

    // 2.3 ONLY create property IF explicitly asked (save_as_property) OR NO property exists anywhere in this CRM for this project
    if (!finalPropertyId || shouldCreateNewProperty) {
      const newPropertyId = crypto.randomUUID();
      const isRent = payload.property.listing_type === "RENT";
      const propPrice = isRent
        ? payload.property.rental_price || 0
        : payload.property.sale_price || 0;

      // Insert properties_core
      const { error: coreErr } = await supabase.from("properties_core").insert({
        id: newPropertyId,
        tenant_id: tenantId,
        project_id: payload.property.project_id || null,
        status: PROPERTY_STATUS_DB_VALUE.DRAFT, // 0 = DRAFT (Safe, not visible on public site)
        listing_type: isRent
          ? LISTING_TYPE_DB_VALUE.RENT
          : LISTING_TYPE_DB_VALUE.SALE,
        property_type: PROPERTY_TYPE_DB_VALUE.CONDO,
        sale_price: !isRent ? propPrice : null,
        rent_price: isRent ? propPrice : null,
        currency: "THB",
        bedrooms: payload.property.bedrooms || 1,
        bathrooms: payload.property.bathrooms || 1,
        floor_area: payload.property.size_sqm || null,
        assigned_to: user.id,
        created_by: user.id,
        verified: false,
      });

      if (coreErr) {
        console.error("Create properties_core error in quick document:", coreErr);
        throw new Error(
          `Failed to create draft property core: ${coreErr.message}`,
        );
      }

      // Insert properties_details (Bilingual support from project if linked)
      let titleTh = payload.property.project_name;
      let titleEn = payload.property.project_name;

      if (payload.property.project_id) {
        const { data: pData } = await supabase
          .from("projects")
          .select("name")
          .eq("id", payload.property.project_id)
          .maybeSingle();

        if (pData?.name) {
          const pNameObj = pData.name as any;
          if (pNameObj.th) titleTh = pNameObj.th;
          if (pNameObj.en) titleEn = pNameObj.en;
        }
      }

      const { error: detailsErr } = await supabase
        .from("properties_details")
        .insert({
          property_id: newPropertyId,
          title: {
            th: titleTh,
            en: titleEn,
          },
          amenities: {
            floor: payload.property.floor || null,
            unit: payload.property.unit_number || null,
            unit_number: payload.property.unit_number || null,
          },
          meta_data: {
            created_via: "QUICK_DOCUMENT",
            is_draft: true,
          },
        });

      if (detailsErr) {
        console.error(
          "Create properties_details error in quick document:",
          detailsErr,
        );
        throw new Error(
          `Failed to create draft property details: ${detailsErr.message}`,
        );
      }

      finalPropertyId = newPropertyId;
    }

    // ------------------------------------------------------------------
    // STEP 3: CREATE DEAL (ONLY IF NO EXISTING DEAL WAS REUSED!)
    // ------------------------------------------------------------------
    if (!finalDealId) {
      const dealRes = await createDealAction({
        lead_id: finalLeadId,
        property_id: finalPropertyId,
        deal_type: payload.property.listing_type,
        status: "NEGOTIATING",
        source: "QUICK_DOCUMENT",
      });

      if (!dealRes.success || !dealRes.data?.id) {
        console.error("Create deal error in quick document:", dealRes);
        throw new Error(
          dealRes.message || "Failed to create deal for quick document",
        );
      }

      finalDealId = dealRes.data.id;
    }

    // ------------------------------------------------------------------
    // STEP 4: GENERATE DOCUMENT WITH ALL OVERRIDES
    // ------------------------------------------------------------------
    const financialItems = payload.financials.items.map((it, idx) => ({
      item: idx + 1,
      description: it.description,
      quantity: it.quantity || 1,
      unit_price: it.unit_price,
      total: (it.quantity || 1) * it.unit_price,
    }));

    const docRes = await generateDocumentFromTemplateAction(
      payload.template_id,
      finalDealId,
      "DEAL",
      {
        language: payload.language,
        document_title: payload.document_title || "",
        slip_url: payload.payment.slip_url || payload.payment.slip_storage_path || "",
        bank_name: payload.payment.bank_name,
        bank_account_no: payload.payment.bank_account_no,
        account_name: payload.payment.account_name,
        payee_role: payload.payment.payee_role || undefined,
        payment_method: payload.payment.payment_method || "Transfer",
        client_name_override: payload.client.full_name,
        client_phone_override: payload.client.phone || undefined,
        client_line_override: payload.client.line_id || undefined,
        client_nationality: payload.client.nationality || "",
        client_passport: payload.client.passport || "",
        client_id_card: payload.client.id_card || "",
        unit_number_override: payload.property.unit_number || "",
        floor_override: payload.property.floor || "",
        project_name_override: payload.property.project_name || undefined,
        bedrooms_override: payload.property.bedrooms ?? undefined,
        bathrooms_override: payload.property.bathrooms ?? undefined,
        size_sqm_override: payload.property.size_sqm ?? undefined,
        contract_due_date: payload.financials.contract_due_date || "",
        items: financialItems,
      }
    );

    if (!docRes.success) {
      throw new Error(docRes.message || "Failed to generate document content");
    }

    // Revalidate paths so new Deal, Lead, and Property show up smoothly
    revalidatePath("/protected/deals");
    revalidatePath("/protected/documents");
    revalidatePath(`/protected/leads/${finalLeadId}`);

    return {
      success: true,
      dealId: finalDealId,
      leadId: finalLeadId,
      propertyId: finalPropertyId,
      documentId: docRes.data?.id || "",
      storagePath: docRes.data?.storage_path || "",
    };
  } catch (error: any) {
    console.error("[createQuickDocumentAction] Critical Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred during quick document creation",
    };
  }
}

/**
 * 🏢 Fetch existing properties in the user's CRM that belong to a given project_id.
 * Allows agents to quickly pick an existing room/unit from their portfolio or know what's already listed.
 */
export async function getExistingPropertiesByProjectAction(projectId: string) {
  try {
    const { supabase, tenantId: contextTenantId, user } = await requireAuthContext();
    const tenantId = await resolveTenantId(supabase, user.id, contextTenantId);

    const { data, error } = await supabase
      .from("properties_core")
      .select(`
        id,
        status,
        bedrooms,
        bathrooms,
        floor_area,
        rent_price,
        sale_price,
        listing_type,
        properties_details (
          amenities,
          title
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .neq("status", -1)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !data) return { success: false, data: [] };

    const mapped = data.map((p) => {
      const details = Array.isArray(p.properties_details)
        ? p.properties_details[0]
        : p.properties_details;
      const amenities = (details as any)?.amenities || {};
      const unit = amenities.unit || amenities.unit_number || "";
      const floor = amenities.floor || "";
      return {
        id: p.id,
        unit_number: unit ? String(unit) : "",
        floor: floor ? String(floor) : "",
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        size_sqm: p.floor_area ?? null,
        rent_price: p.rent_price ?? null,
        sale_price: p.sale_price ?? null,
        listing_type: p.listing_type === 1 ? "RENT" : "SALE",
      };
    });

    return { success: true, data: mapped };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}
