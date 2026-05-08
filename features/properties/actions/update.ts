"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { type Database } from "@/lib/database.types";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
  authzFail,
  isAdmin,
} from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { getPublicImageUrl } from "../image-utils";
import { FormSchema, type PropertyFormValues } from "../schema";
import { inngest } from "@/lib/inngest/client";
import { PROPERTY_STATUS_ENUM } from "../labels";
import {
  PropertyStatus,
  PropertyUpdate,
  CreatePropertyResult,
  UpdatePropertyStatusResult,
} from "../types";
import { PropertyRow } from "@/lib/services/properties";
import {
  finalizeUploadSession,
  validatePropertyImagePaths,
  PROPERTY_IMAGES_BUCKET,
} from "../logic/images";
import { generateKeywords, prepareSEOData } from "../logic/seo";
import {
  sendStatusUpdateNotification,
  sendPriceDropNotification,
} from "../logic/notifications";
import { mapDbError } from "@/lib/db-error";
import { encrypt, generateBlindIndex } from "@/lib/crypto";

/**
 * Update property with images
 */
import { getPropertyDiff } from "../logic/diff";

/**
 * Update property with images (Elite Orchestrator Pattern)
 * Uses atomic RPC for data integrity and semantic diffing for audit transparency.
 */
export async function updatePropertyAction(
  id: string,
  values: PropertyFormValues,
  sessionId: string,
): Promise<CreatePropertyResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    // 1) Validate form data
    const parsed = FormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }
    const safeValues = parsed.data;
    const { images, agent_ids, feature_ids, ...propertyData } = safeValues;

    // 2) Fetch current state (for security check and Diff)

    const { data: existing, error: findErr } = await supabase
      .from("properties")
      .select(`
        id, tenant_id, created_by, meta_keywords, price, rental_price, 
        original_price, original_rental_price, status, title, description,
        listing_type, version, images, property_type, is_exclusive, requires_ai_review,
        address_line1, district, province, subdistrict, bedrooms, bathrooms, 
        size_sqm, land_size_sqwah,
        property_agents(agent_id), property_features(feature_id)
      `)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single() as unknown as { 
        data: {
          id: string; tenant_id: string; created_by: string; meta_keywords: string[] | null;
          price: number | null; rental_price: number | null; original_price: number | null;
          original_rental_price: number | null; status: string; title: string;
          description: string | null; listing_type: string | null; version: number;
          images: unknown[] | null; property_type: string | null; is_exclusive: boolean | null;
          requires_ai_review: boolean | null; address_line1: string | null;
          district: string | null; province: string | null; subdistrict: string | null;
          bedrooms: number | null; bathrooms: number | null; size_sqm: number | null;
          land_size_sqwah: number | null;
          property_agents: { agent_id: string }[];
          property_features: { feature_id: string }[];
        } | null;
        error: { message: string } | null;
      };
      
    if (findErr || !existing) {
      return { success: false, message: "Property not found" };
    }

    // ✅ Strict Ownership Check (Accepts Owner, Admin, or Manager)
    const canBypassOwnership = role === "ADMIN" || role === "MANAGER";
    if (existing.created_by !== user.id && !canBypassOwnership) {
      return { success: false, message: "Forbidden: You can only update your own properties" };
    }

    assertAuthenticated({ userId: user.id, role });

    // 3) Auto-Status & SEO Logic
    const listingType = (safeValues.listing_type || existing.listing_type) as "SALE" | "RENT";
    
    // Auto-Clear logic: if Admin/Manager edits manually, we assume they reviewed it.
    let auditUpdates: Partial<PropertyUpdate> = {};
    if (canBypassOwnership) {
      // Check if any significant field in propertyData has changed
      const significantFields = [
        "title", "description", "price", "rental_price", "original_price", "original_rental_price",
        "status", "listing_type", "property_type", "address_line1", "district", "province",
        "subdistrict", "bedrooms", "bathrooms", "size_sqm", "land_size_sqwah"
      ] as const;
      const hasChanged = significantFields.some(key => {
        const newVal = propertyData[key as keyof typeof propertyData];
        const oldVal = (existing as Record<string, unknown>)[key];
        
        if (newVal === undefined) return false;

        // Normalize null and undefined for comparison
        const normalizedNew = newVal === null ? undefined : newVal;
        const normalizedOld = oldVal === null ? undefined : oldVal;

        return normalizedNew !== normalizedOld;
      });

      if (hasChanged) {
        auditUpdates = {
          requires_ai_review: false,
          ai_reviewed_at: new Date().toISOString(),
          ai_reviewed_by: user.id
        };
      }
    }

    const currentRequiresAiReview = auditUpdates.requires_ai_review !== undefined 
      ? auditUpdates.requires_ai_review 
      : propertyData.requires_ai_review;

    if (currentRequiresAiReview) {
      propertyData.status = "DRAFT";
    } else if ((propertyData.sold_units ?? 0) >= (propertyData.total_units ?? 1)) {
      propertyData.status = listingType === "RENT" ? "RENTED" : "SOLD";
    }

    const finalKeywords = generateKeywords(safeValues, (existing.meta_keywords || []) as string[]);
    
    // SEO Data needs a main image
    const existingImages = (existing.images as { url: string }[]) || [];
    const mainImageUrl = images?.[0] ? getPublicImageUrl(images[0]) : (existingImages[0]?.url || "");
    
    const seoData = prepareSEOData({ ...propertyData, main_image: mainImageUrl }, safeValues);
    const mergedKeywords = Array.from(new Set([...(seoData.metaKeywords || []), ...finalKeywords]));

    // 4) ATOMIC EXECUTION (RPC)
    interface EliteRpcResult {
      id: string;
      slug: string;
    }

    const { data: updatedRow, error: rpcError } = await supabase.rpc("update_property_elite", {
      p_id: id,
      p_tenant_id: tenantId,
      p_user_id: user.id,
      p_is_admin: canBypassOwnership,
      p_version: safeValues.version ?? existing.version ?? 1,
      p_data: {
        ...propertyData,
        ...auditUpdates,
        co_agent_name: encrypt(propertyData.co_agent_name),
        co_agent_name_hash: generateBlindIndex(propertyData.co_agent_name),
        co_agent_phone: encrypt(propertyData.co_agent_phone),
        co_agent_phone_hash: generateBlindIndex(propertyData.co_agent_phone),
        slug: seoData.slug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: mergedKeywords,
        structured_data: seoData.structuredData as any,
        images: images !== undefined ? images.map((path, idx) => ({
          image_url: getPublicImageUrl(path),
          storage_path: path,
          is_cover: idx === 0,
          sort_order: idx
        })) : undefined,
        agent_ids: agent_ids ?? undefined,
        feature_ids: feature_ids ?? undefined
      }
    }) as { data: EliteRpcResult | null, error: { message?: string; code?: string } | null };

    if (rpcError) {
      console.error("RPC update_property_elite failed:", rpcError);
      if (rpcError.message?.includes("VC409") || rpcError.code === "P4090") {
        return { success: false, message: "ข้อมูลถูกแก้ไขไปแล้วโดยเอเจนต์ท่านอื่น กรุณารีเฟรชข้อมูลล่าสุด" };
      }
      return { success: false, message: mapDbError(rpcError) };
    }

    // 5) GRANULAR AUDIT (Diffing)
    // Safely extract junction table IDs ensuring they are arrays of strings
    const oldAgents = Array.isArray(existing.property_agents) 
      ? existing.property_agents.map((a) => String(a.agent_id))
      : [];
      
    const oldFeatures = Array.isArray(existing.property_features)
      ? existing.property_features.map((f) => String(f.feature_id))
      : [];
    
    // Fetch labels for semantic diff
    interface ProfileLabel { id: string; full_name: string | null }
    interface FeatureLabel { id: string; label: string }
    
    let agentLabels: { id: string; full_name: string }[] = [];
    let featureLabels: FeatureLabel[] = [];
    
    // Check if we actually need to fetch labels (any changes in junction tables?)
    const normalizedAgentIds = (agent_ids || []).map(id => String(id));
    const normalizedFeatureIds = (feature_ids || []).map(id => String(id));

    const needsLabels = JSON.stringify(oldAgents.sort()) !== JSON.stringify(normalizedAgentIds.sort()) || 
                        JSON.stringify(oldFeatures.sort()) !== JSON.stringify(normalizedFeatureIds.sort());

    if (needsLabels) {
      const [{ data: agents }, { data: features }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", [...new Set([...oldAgents, ...(agent_ids || [])])]),
        supabase.from("features").select("id, name").in("id", [...new Set([...oldFeatures, ...(feature_ids || [])])])
      ]);
      // Explicitly map null full_names to empty strings for Type Safety
      agentLabels = (agents || []).map((a) => ({ 
        id: a.id, 
        full_name: a.full_name || "Unknown Agent" 
      }));
      // Map 'name' to 'label' for compatibility with getPropertyDiff
      featureLabels = (features || []).map(f => ({ id: f.id, label: f.name }));
    }

    const diff = getPropertyDiff(
      { ...existing, agent_ids: oldAgents, feature_ids: oldFeatures } as unknown as PropertyFormValues,
      { ...safeValues, agent_ids, feature_ids },
      { allAgents: agentLabels, allFeatures: featureLabels }
    );

    await logAudit(
      { supabase, user, role },
      {
        action: "property.update",
        entity: "properties",
        entityId: id,
        metadata: {
          diff: diff.summary,
          changes: diff.details,
          old_state: diff.oldState,
          new_state: diff.newState,
          sessionId,
        },
      },
    );

    // 6) POST-UPDATE SIDE EFFECTS
    if (images !== undefined) {
      await finalizeUploadSession({ supabase, userId: user.id, sessionId, propertyId: id, usedPaths: images });

      // 🛡️ [PHASE 3] Trigger Malware Scan for all images associated with this property
      const { data: currentImages } = await supabase
        .from("property_images")
        .select("id, storage_path")
        .eq("property_id", id);
      
      if (currentImages && currentImages.length > 0) {
        const scanEvents = currentImages.map((img) => ({
          name: "app/property.image.created",
          data: {
            imageId: img.id,
            storagePath: img.storage_path,
          },
        }));
        await inngest.send(scanEvents);
      }
    }

    // Notifications
    const newStatus = safeValues.status;
    if ((newStatus === "SOLD" || newStatus === "RENTED") && existing.status !== newStatus) {
      await sendStatusUpdateNotification({ id, title: existing.title }, newStatus);
    }
    
    // Price Drop Logic (Sale & Rent)
    const currentSalePrice = Number(safeValues.price || safeValues.original_price || 0);
    const oldSalePrice = Number(existing.price || existing.original_price || 0);
    const currentRentPrice = Number(safeValues.rental_price || safeValues.original_rental_price || 0);
    const oldRentPrice = Number(existing.rental_price || existing.original_rental_price || 0);

    if (currentSalePrice > 0 && oldSalePrice > 0 && currentSalePrice < oldSalePrice) {
      await sendPriceDropNotification(existing as any, oldSalePrice, currentSalePrice, "SALE");
    } else if (currentRentPrice > 0 && oldRentPrice > 0 && currentRentPrice < oldRentPrice) {
      await sendPriceDropNotification(existing as any, oldRentPrice, currentRentPrice, "RENT");
    }

    // Cache clearing
    revalidatePath("/protected/properties");
    revalidatePath("/properties");
    revalidatePath("/(public)/properties", "page");
    revalidatePath("/(public)/properties/[slug]", "page");
    revalidatePath("/");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    revalidateTag("properties", "seconds");

    if (safeValues.requires_ai_review) {
      await inngest.send({ name: "property.created", data: { propertyId: id, userId: user.id, tenantId } });
    }

    return { 
      success: true, 
      message: "อัปเดตข้อมูลสำเร็จ", 
      propertyId: id, 
      slug: updatedRow?.slug || "" 
    };
  } catch (err: unknown) {
    console.error("updatePropertyAction error:", err);
    const errorWithCode = err as { code?: string };
    if (errorWithCode?.code === "AUTHZ_ERROR") {
      return authzFail(errorWithCode);
    }
    return { success: false, message: mapDbError(err) };
  }
}

/**
 * Update property status
 */
export async function updatePropertyStatusAction(input: {
  id: string;
  status: PropertyStatus;
  version?: number;
}): Promise<UpdatePropertyStatusResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!input?.id || !UUID_RE.test(input.id)) {
      return { success: false, message: "รูปแบบรหัสทรัพย์ไม่ถูกต้อง" };
    }

    if (!PROPERTY_STATUS_ENUM.includes(input.status)) {
      return { success: false, message: "สถานะไม่ถูกต้อง" };
    }

    const { data: existing, error: fetchErr } = await supabase
      .from("properties")
      .select("id, title, status, listing_type, requires_ai_review, version")
      .eq("id", input.id)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchErr || !existing) {
      return { success: false, message: "ไม่พบข้อมูลทรัพย์" };
    }

    if (existing?.requires_ai_review && input.status !== "DRAFT") {
      return { success: false, message: "กรุณาตรวจสอบข้อมูล AI ในหน้าแก้ไขก่อนเปลี่ยนสถานะ" };
    }

    const canBypassOwnership = role === "ADMIN" || role === "MANAGER";

    const { data: updatedRow, error: rpcError } = await supabase.rpc("update_property_status_elite", {
      p_id: input.id,
      p_tenant_id: tenantId,
      p_user_id: user.id,
      p_is_admin: canBypassOwnership,
      p_status: input.status,
      p_version: input.version ?? existing?.version ?? 1,
    }) as { data: unknown, error: { message?: string; code?: string } | null };

    if (rpcError) {
      console.error("RPC update_property_status_elite failed:", rpcError);
      if (rpcError.message?.includes("VC409") || rpcError.code === "P4090") {
        return { 
          success: false, 
          errorType: "VERSION_CONFLICT", 
          message: "ข้อมูลถูกแก้ไขไปแล้วโดยเอเจนต์ท่านอื่น กรุณาดึงข้อมูลล่าสุด" 
        };
      }
      return { success: false, message: mapDbError(rpcError) };
    }

    await logAudit(
      { supabase, user, role },
      {
        action: "property.status.update",
        entity: "properties",
        entityId: input.id,
        metadata: { status: input.status },
      },
    );

    // Workflow Notification: Sold or Rented (Simplified for status update)
    if (
      existing &&
      (input.status === "SOLD" || input.status === "RENTED") &&
      existing.status !== input.status
    ) {
      await sendStatusUpdateNotification(
        { id: existing.id, title: existing.title },
        input.status as "SOLD" | "RENTED",
      );
    }

    // protected pages
    revalidatePath("/protected/properties");
    revalidatePath("/properties");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");
    revalidateTag("properties", "seconds");

    return { success: true, message: "อัปเดตสถานะสำเร็จ" };
  } catch (e: unknown) {
    return { success: false, message: mapDbError(e) };
  }
}

/**
 * 🚀 Elite Tool: Manual AI Review Trigger
 * Allows admins to manually request an AI re-analysis for any property.
 */
export async function triggerPropertyAiReviewAction(propertyId: string) {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant context required");

    // 1. Mark as requiring review in DB
    const { error } = await supabase
      .from("properties")
      .update({ requires_ai_review: true, status: "DRAFT" })
      .eq("id", propertyId)
      .eq("tenant_id", tenantId);

    if (error) throw error;

    // 2. Send to Inngest
    await inngest.send({
      name: "property.created",
      data: { propertyId, userId: user.id, tenantId }
    });

    await logAudit(
      { supabase, user, role },
      {
        action: "property.ai_refresh",
        entity: "properties",
        entityId: propertyId,
      }
    );

    revalidatePath("/protected/properties");
    return { success: true, message: "กำลังเริ่มการประมวลผล AI หลังบ้าน..." };
  } catch (e: unknown) {
    console.error("triggerPropertyAiReviewAction error:", e);
    return { success: false, message: mapDbError(e) };
  }
}
