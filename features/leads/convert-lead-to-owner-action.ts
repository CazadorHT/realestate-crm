"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { recordAuditLog } from "@/lib/audit";
import { encrypt, decrypt } from "@/lib/crypto";
import { mapDbError } from "@/lib/db-error";

export interface ConvertLeadToOwnerResult {
  success: boolean;
  message?: string;
  ownerId?: string;
  leadData?: {
    leadId: string;
    ownerName: string;
    phone: string | null;
    lineId: string | null;
    email: string | null;
    propertyType: string | null;
    imageUrl: string | null;
    details: string;
    titleSuggestion: string;
  };
}

export async function convertLeadToOwnerAction(leadId: string): Promise<ConvertLeadToOwnerResult> {
  try {
    const cookieStore = await cookies();
    const isEn = (cookieStore.get("language")?.value || "th") === "en";

    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    const config = await getSystemConfig();
    const isMultiTenant = config.multi_tenant_enabled;
    const targetTenantId = isMultiTenant && ctx.tenantId && ctx.tenantId !== "ALL" ? ctx.tenantId : null;

    // 1. Fetch Lead with Identity and UTM data
    const { data: lead, error: leadError } = await ctx.supabase
      .from("crm_leads_v3")
      .select("id, tenant_id, utm_data, identity:identities_v3!crm_leads_v3_identity_id_fkey!inner(id, display_name, phone, line_id, social_links)")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return {
        success: false,
        message: isEn ? "Lead not found" : "ไม่พบข้อมูลลีดที่ต้องการ",
      };
    }

    const identity = (lead as any).identity;
    const utmData = (lead.utm_data as Record<string, any>) || {};
    const social = (identity?.social_links as Record<string, any>) || {};

    const rawName = decrypt(identity?.display_name) || identity?.display_name || "Unknown";
    const rawPhone = decrypt(identity?.phone) || identity?.phone || null;
    const rawLine = decrypt(identity?.line_id) || identity?.line_id || null;
    const rawEmail = decrypt(social?.email) || social?.email || null;
    const noteDecrypted = utmData?.note_encrypted ? decrypt(utmData.note_encrypted) : utmData?.note || "";

    // 2. Parse Deposit details & Image
    let details = noteDecrypted || "";
    let imageUrl: string | null = null;
    let propertyType = utmData.property_type || null;

    if (details.includes("[ฝากทรัพย์]")) {
      const imgMatch = details.match(/Image:\s*(https?:\/\/[^\s\n\r]+)/i);
      if (imgMatch && imgMatch[1] && imgMatch[1].trim() !== "-") {
        imageUrl = imgMatch[1].trim();
      }

      const typeMatch = details.match(/Type:\s*([^\n\r]+)/i);
      if (typeMatch && typeMatch[1] && typeMatch[1].trim() !== "-") {
        propertyType = propertyType || typeMatch[1].trim();
      }

      const detailsMatch = details.match(/Details:\s*([\s\S]*)$/i);
      if (detailsMatch && detailsMatch[1]) {
        details = detailsMatch[1].trim();
        if (details === "-") details = "";
      }
    }

    // 3. Find or Create Owner Identity
    let ownerId: string | null = null;

    // Check if an Owner with same phone exists
    if (rawPhone) {
      const normalizedPhone = rawPhone.trim().replace(/[- ]/g, "");
      let query = ctx.supabase
        .from("identities_v3")
        .select("id, phone")
        .eq("category", 2)
        .eq("role", "OWNER");

      if (targetTenantId) {
        query = query.or(`tenant_id.eq.${targetTenantId},tenant_id.is.null`);
      }

      const { data: existingOwners } = await query;
      for (const o of existingOwners || []) {
        const decPhone = decrypt(o.phone)?.replace(/[- ]/g, "");
        if (decPhone === normalizedPhone) {
          ownerId = o.id;
          break;
        }
      }
    }

    // If no existing owner found, create a new Owner identity
    if (!ownerId) {
      const newOwnerPayload = {
        category: 2,
        role: "OWNER",
        display_name: encrypt(rawName) || rawName,
        phone: rawPhone ? encrypt(rawPhone) || rawPhone : null,
        line_id: rawLine ? encrypt(rawLine) || rawLine : null,
        social_links: {
          email: rawEmail ? encrypt(rawEmail) || rawEmail : null,
          facebook_url: social.facebook_url || null,
          other_contact: social.other_contact || null,
          created_by: ctx.user?.id,
          converted_from_lead_id: leadId,
          owner_type: "INDIVIDUAL",
        },
        tenant_id: targetTenantId,
        is_active: true,
      };

      const { data: createdOwner, error: createError } = await ctx.supabase
        .from("identities_v3")
        .insert(newOwnerPayload)
        .select("id")
        .single();

      if (createError || !createdOwner) {
        console.error("Error creating owner identity:", createError);
        return {
          success: false,
          message: mapDbError(createError) || (isEn ? "Failed to create owner identity" : "เกิดข้อผิดพลาดในการสร้างข้อมูลเจ้าของทรัพย์"),
        };
      }

      ownerId = createdOwner.id;
    }

    // 4. Update Lead Record with converted_to_owner_id
    const updatedUtmData = {
      ...utmData,
      converted_to_owner_id: ownerId,
      converted_to_owner_at: new Date().toISOString(),
    };

    await ctx.supabase
      .from("crm_leads_v3")
      .update({ utm_data: updatedUtmData })
      .eq("id", leadId);

    // 5. Record Activity in Timeline
    await ctx.supabase
      .from("activity_timeline_v3")
      .insert({
        target_entity: "LEAD",
        target_id: leadId,
        actor_id: ctx.user?.id,
        activity_type: "NOTE",
        description: isEn
          ? `Converted lead to Property Owner (K. ${rawName}) to create a new property listing.`
          : `แปลงข้อมูลเป็นเจ้าของทรัพย์ (Owner: K. ${rawName}) เพื่อเตรียมสร้างทรัพย์สินใหม่`,
        metadata: {
          converted_to_owner_id: ownerId,
          timestamp: new Date().toISOString(),
        },
      });

    // 6. Log Audit
    await recordAuditLog({
      action: "UPDATE",
      entity: "LEAD",
      entityId: leadId,
      userId: ctx.user?.id,
      tenantId: targetTenantId || undefined,
      metadata: { converted_to_owner_id: ownerId },
    });

    revalidatePath(`/protected/leads/${leadId}`);
    revalidatePath("/protected/leads");
    revalidatePath("/protected/owners");

    const PROPERTY_TYPE_NAMES: Record<string, string> = {
      CONDO: "คอนโด",
      HOUSE: "บ้านเดี่ยว",
      TOWNHOME: "ทาวน์โฮม",
      LAND: "ที่ดิน",
      COMMERCIAL: "อาคารพาณิชย์",
      APARTMENT: "อพาร์ทเมนท์",
      HOTEL: "โรงแรม",
      OFFICE: "สำนักงาน",
      WAREHOUSE: "โกดัง",
      FACTORY: "โรงงาน",
    };

    const typeThai = propertyType ? (PROPERTY_TYPE_NAMES[propertyType] || propertyType) : (isEn ? "Property" : "ทรัพย์สิน");
    const titleSuggestion = isEn 
      ? `Deposit: ${propertyType || "Property"} - K. ${rawName}` 
      : `ฝากทรัพย์: ${typeThai} - K. ${rawName}`;

    return {
      success: true,
      ownerId,
      leadData: {
        leadId,
        ownerName: rawName,
        phone: rawPhone,
        lineId: rawLine,
        email: rawEmail,
        propertyType,
        imageUrl,
        details,
        titleSuggestion,
      },
    };
  } catch (error: any) {
    console.error("convertLeadToOwnerAction error:", error);
    return {
      success: false,
      message: error?.message || "Internal server error",
    };
  }
}

export async function bulkConvertLeadsToOwnersAction(leadIds: string[]) {
  try {
    const cookieStore = await cookies();
    const isEn = (cookieStore.get("language")?.value || "th") === "en";

    const ctx = await requireAuthContext();
    assertStaff(ctx.role);

    if (!leadIds || leadIds.length === 0) {
      return {
        success: false,
        message: isEn ? "No leads selected" : "ไม่มีรายการที่เลือก",
      };
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const id of leadIds) {
      const res = await convertLeadToOwnerAction(id);
      if (res.success) {
        successCount++;
      } else if (res.message) {
        errors.push(res.message);
      }
    }

    revalidatePath("/protected/leads");
    revalidatePath("/protected/owners");

    return {
      success: successCount > 0,
      convertedCount: successCount,
      totalRequested: leadIds.length,
      message: isEn
        ? `Successfully converted ${successCount} leads to Property Owners`
        : `แปลงลีดเป็นเจ้าของทรัพย์สำเร็จ ${successCount} รายการ`,
    };
  } catch (error: any) {
    console.error("bulkConvertLeadsToOwnersAction error:", error);
    return {
      success: false,
      message: error?.message || "Failed to bulk convert leads",
    };
  }
}
