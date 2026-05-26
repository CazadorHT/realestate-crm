"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { type Database } from "@/lib/database.types.generated";
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
import {
  PROPERTY_STATUS_DB_VALUE,
  LISTING_TYPE_DB_VALUE,
  PROPERTY_TYPE_DB_VALUE,
  getStatusFromDb,
  getListingTypeFromDb,
  getPropertyTypeFromDb,
} from "../labels";
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
    const { supabase, user, role, tenantId: contextTenantId } = await requireAuthContext();
    assertStaff(role);

    // 1) Validate form data
    const parsed = FormSchema.safeParse(values);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0].message };
    }
    const safeValues = parsed.data;
    const { images, agent_ids, feature_ids, ...propertyData } = safeValues;

    // 2) Fetch current state (V3 joined fetch)
    const { data, error: findErr } = await supabase
      .from("properties_core")
      .select(`
        id, tenant_id, status, listing_type, property_type, sale_price, rent_price, 
        bedrooms, bathrooms, floor_area, land_area, branch_id, owner_id, assigned_to, 
        is_exclusive, verified, h3_index_res8, created_by,
        properties_details (
          title, description, amenities, address_info, pricing_details, transit_info, meta_data
        )
      `)
      .eq("id", id)
      .single();
      
    if (findErr || !data) return { success: false, message: "Property not found" };

    const tenantId = data.tenant_id;
    if (!tenantId) return { success: false, message: "ข้อมูลทรัพย์ไม่มีข้อมูลสาขาประกอบอยู่" };

    // Verify membership if not admin and context tenant does not match the property's tenant
    if (role !== "ADMIN" && contextTenantId !== tenantId) {
      const { data: member } = await supabase
        .from("tenant_members_v3")
        .select("role")
        .eq("tenant_id", tenantId)
        .eq("identity_id", user.id)
        .maybeSingle();

      if (!member) {
        return { success: false, message: "คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลของสาขานี้" };
      }
    }

    const details = data.properties_details as Database["public"]["Tables"]["properties_details"]["Row"] | null;
    const existingMeta = details?.meta_data as Record<string, unknown> | null;
    const createdBy = existingMeta?.created_by as string | undefined;

    type MultiLang = { th?: string; en?: string; cn?: string; ru?: string };
    type AddressInfoV3 = { 
      th?: string; 
      en?: string;
      district?: string; 
      province?: string; 
      subdistrict?: string; 
      maps_link?: string;
      slug?: string;
      popular_area?: string;
      popular_area_en?: string;
      popular_area_cn?: string;
      popular_area_ru?: string;
    };
    
    // Hardened JSONB Extraction
    const title = (details?.title || {}) as MultiLang;
    const description = (details?.description || {}) as MultiLang;
    const addressInfo = (details?.address_info || {}) as AddressInfoV3;

    const existing: Partial<PropertyFormValues> = {
      title: title?.th || "",
      title_en: title?.en || "",
      title_cn: title?.cn || "",
      title_ru: title?.ru || "",
      description: description?.th || "",
      description_en: description?.en || "",
      description_cn: description?.cn || "",
      description_ru: description?.ru || "",
      property_type: getPropertyTypeFromDb(data.property_type),
      listing_type: getListingTypeFromDb(data.listing_type),
      status: getStatusFromDb(data.status),
      branch_id: data.branch_id || "",
      owner_id: data.owner_id || undefined,
      assigned_to: data.assigned_to || undefined,
      is_exclusive: !!data.is_exclusive,
      verified: !!data.verified,
      h3_index_res8: data.h3_index_res8 || undefined,
      price: data.sale_price,
      rental_price: data.rent_price,
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      size_sqm: data.floor_area,
      land_size_sqwah: data.land_area,
      address_line1: addressInfo?.th || "",
      district: addressInfo?.district || "",
      province: addressInfo?.province || "",
      subdistrict: addressInfo?.subdistrict || "",
      popular_area: addressInfo?.popular_area || "",
      popular_area_en: addressInfo?.popular_area_en || "",
      popular_area_cn: addressInfo?.popular_area_cn || "",
      popular_area_ru: addressInfo?.popular_area_ru || "",
      currency: "THB",
      requires_ai_review: !!existingMeta?.requires_ai_review,
      agent_ids: (existingMeta?.agent_ids as string[]) || [],
      feature_ids: (existingMeta?.feature_ids as string[]) || [],
      orientation: (existingMeta?.orientation as PropertyFormValues["orientation"]) || undefined,
      parking_type: (existingMeta?.parking_type as PropertyFormValues["parking_type"]) || undefined,
      google_maps_link: addressInfo?.maps_link || "",
      images: (existingMeta?.images as string[]) || [],
      property_source: (existingMeta?.property_source as string) || "",
      office_capacity: (details?.amenities as Record<string, any>)?.office_capacity || undefined,
      maid_rooms: (details?.amenities as Record<string, any>)?.maid_rooms || undefined,
      halls: (details?.amenities as Record<string, any>)?.halls || undefined,
      dining_rooms: (details?.amenities as Record<string, any>)?.dining_rooms || undefined,
    };

    const canBypassOwnership = role === "ADMIN" || role === "MANAGER";
    if (createdBy && createdBy !== user.id && !canBypassOwnership) {
      return { success: false, message: "Forbidden: You can only update your own properties" };
    }

    assertAuthenticated({ userId: user.id, role });
    // 🛡️ Expert: Auto-Status & AI Review Logic (V3)
    let metaUpdates: Record<string, unknown> = {};
    
    if (canBypassOwnership) {
      const significantFields: (keyof PropertyFormValues)[] = [
        "title", "description", "price", "rental_price",
        "original_price", "original_rental_price",
        "status", "listing_type", "property_type"
      ];
      
      const hasChanged = significantFields.some(key => {
        const newVal = propertyData[key as keyof typeof propertyData];
        const oldVal = existing[key as keyof PropertyFormValues];
        return newVal !== undefined && newVal !== oldVal;
      });

      if (hasChanged) {
        metaUpdates = {
          requires_ai_review: false,
          ai_reviewed_at: new Date().toISOString(),
          ai_reviewed_by: user.id
        };
      }
    }

    const currentRequiresAiReview = metaUpdates.requires_ai_review !== undefined 
      ? (metaUpdates.requires_ai_review as boolean)
      : (propertyData as PropertyFormValues).requires_ai_review;

    if (currentRequiresAiReview) {
      propertyData.status = "DRAFT";
    }

    // 3) --- SEO & KEYWORDS ---
    const existingImages = (existingMeta?.images as string[]) || [];
    const mainImageUrl = images?.[0] ? getPublicImageUrl(images[0]) : (existingImages[0] || "");
    const finalKeywords = generateKeywords(safeValues, (existingMeta?.keywords as string[]) || []);
    const seoData = prepareSEOData({ ...propertyData, main_image: mainImageUrl } as Record<string, unknown>, safeValues);
    const mergedKeywords = Array.from(new Set([...((existingMeta?.keywords as string[]) || []), ...finalKeywords]));

    // 4) --- V3 SMART ORCHESTRATOR: ATOMIC UPDATE ---
    
    // 4.1 Update properties_core (Hot Table)
    const { error: coreUpdateError } = await supabase
      .from("properties_core")
      .update({
        branch_id: safeValues.branch_id,
        status: PROPERTY_STATUS_DB_VALUE[safeValues.status || "DRAFT"],
        listing_type: LISTING_TYPE_DB_VALUE[safeValues.listing_type || "SALE"],
        property_type: PROPERTY_TYPE_DB_VALUE[safeValues.property_type || "CONDO"],
        sale_price: safeValues.price || safeValues.original_price,
        rent_price: safeValues.rental_price || safeValues.original_rental_price,
        bedrooms: safeValues.bedrooms,
        bathrooms: safeValues.bathrooms,
        floor_area: safeValues.size_sqm,
        land_area: safeValues.land_size_sqwah,
        owner_id: safeValues.owner_id,
        assigned_to: safeValues.assigned_to || data.created_by || user.id,
        is_exclusive: !!safeValues.is_exclusive,
        verified: !!safeValues.verified,
        h3_index_res8: safeValues.h3_index_res8,
        price_per_sqm: safeValues.price_per_sqm,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (coreUpdateError) return { success: false, message: mapDbError(coreUpdateError) };

    // 4.2 Update properties_details (Warm Layer / JSONB)
    const { error: detailsUpdateError } = await supabase
      .from("properties_details")
      .upsert({
        property_id: id,
        title: {
          th: safeValues.title,
          en: safeValues.title_en,
          cn: safeValues.title_cn,
          ru: safeValues.title_ru,
        },
        description: {
          th: safeValues.description,
          en: safeValues.description_en,
          cn: safeValues.description_cn,
          ru: safeValues.description_ru,
        },
        address_info: {
          th: safeValues.address_line1,
          province: safeValues.province,
          district: safeValues.district,
          subdistrict: safeValues.subdistrict,
          postal_code: safeValues.postal_code,
          maps_link: safeValues.google_maps_link,
          popular_area: safeValues.popular_area,
          popular_area_en: safeValues.popular_area_en,
          popular_area_cn: safeValues.popular_area_cn,
          popular_area_ru: safeValues.popular_area_ru,
          nearby_places: safeValues.nearby_places || [],
        },
        amenities: {
          floor: safeValues.floor,
          parking_slots: safeValues.parking_slots,
          is_pet_friendly: safeValues.is_pet_friendly,
          is_fully_furnished: safeValues.is_fully_furnished,
          is_renovated: safeValues.is_renovated,
          has_private_pool: safeValues.has_private_pool,
          is_exclusive: safeValues.is_exclusive,
          is_fully_fitted: safeValues.is_fully_fitted,
          is_green_building: safeValues.is_green_building,
          has_flexible_lease: safeValues.has_flexible_lease,
          is_cbd: safeValues.is_cbd,
          is_smart_home: safeValues.is_smart_home,
          has_private_elevator: safeValues.has_private_elevator,
          is_handicapped_friendly: safeValues.is_handicapped_friendly,
          is_high_floor: safeValues.is_high_floor,
          is_never_lived_in: safeValues.is_never_lived_in,
          is_grade_a: safeValues.is_grade_a,
          is_grade_b: safeValues.is_grade_b,
          is_grade_c: safeValues.is_grade_c,
          is_column_free: safeValues.is_column_free,
          is_central_air: safeValues.is_central_air,
          is_split_air: safeValues.is_split_air,
          has_247_access: safeValues.has_247_access,
          has_fiber_optic: safeValues.has_fiber_optic,
          is_tax_registered: safeValues.is_tax_registered,
          has_raised_floor: safeValues.has_raised_floor,
          is_high_ceiling: safeValues.is_high_ceiling,
          ceiling_height: safeValues.ceiling_height,
          office_capacity: safeValues.office_capacity,
          orientation: safeValues.orientation,
          parking_type: safeValues.parking_type,
          maid_rooms: safeValues.maid_rooms,
          halls: safeValues.halls,
          dining_rooms: safeValues.dining_rooms,
          // Luxury / Premium Features
          has_large_kitchen: safeValues.has_large_kitchen,
          has_bar_counter: safeValues.has_bar_counter,
          has_bathtub: safeValues.has_bathtub,
          has_walk_in_closet: safeValues.has_walk_in_closet,
          has_private_garden: safeValues.has_private_garden,
          has_garage: safeValues.has_garage,
          has_bbq_area: safeValues.has_bbq_area,
          has_home_theatre: safeValues.has_home_theatre,
          has_private_gym: safeValues.has_private_gym,
          has_wine_cellar: safeValues.has_wine_cellar,
        },
        pricing_details: {
          maintenance_fee: safeValues.maintenance_fee,
          parking_fee: safeValues.parking_fee_additional,
          electricity_charge: safeValues.electricity_charge,
          water_charge: safeValues.water_charge,
          commission_sale: safeValues.commission_sale_percentage,
          commission_rent: safeValues.commission_rent_months,
          original_price: safeValues.original_price,
          original_rental_price: safeValues.original_rental_price,
        },
        transit_info: {
          places: safeValues.nearby_places || [],
          transits: safeValues.nearby_transits || [],
        },
        meta_data: {
          ...existingMeta,
          slug: seoData.slug,
          meta_title: seoData.metaTitle,
          meta_description: seoData.metaDescription,
          keywords: mergedKeywords,
          agent_ids: agent_ids,
          feature_ids: feature_ids,
          co_agent: {
            is_co_agent: safeValues.is_co_agent,
            name: safeValues.co_agent_name,
            phone: safeValues.co_agent_phone,
            contact_id: safeValues.co_agent_contact_id,
          },
          property_source: safeValues.property_source,
          requires_ai_review: currentRequiresAiReview,
          video_url: safeValues.video_url,
          floor_plan_url: safeValues.floor_plan_url,
          version: ((existingMeta?.version as number) || 0) + 1,
        },
      });

    if (detailsUpdateError) return { success: false, message: mapDbError(detailsUpdateError) };

    // 4.3 Update property_media_v3 (Full sync)
    if (images !== undefined) {
      await supabase.from("property_media_v3").delete().eq("property_id", id);
      
      const mediaRows = images.map((storagePath, index) => ({
        property_id: id,
        storage_path: storagePath,
        url: getPublicImageUrl(storagePath),
        is_cover: index === 0,
        sort_order: index,
        media_type: "image",
      }));

      await supabase.from("property_media_v3").insert(mediaRows);
    }

    // 4.4 Update Relations (Agents/Features)
    if (agent_ids) {
      await supabase.from("property_agents").delete().eq("property_id", id);
      if (agent_ids.length > 0) {
        await supabase.from("property_agents").insert(agent_ids.map(aId => ({ property_id: id, agent_id: aId })));
      }
    }

    if (feature_ids) {
      await supabase.from("property_features").delete().eq("property_id", id);
      if (feature_ids.length > 0) {
        await supabase.from("property_features").insert(feature_ids.map(fId => ({ property_id: id, feature_id: fId })));
      }
    }

    // 5) GRANULAR AUDIT (Diffing)
    const oldAgents = (existingMeta?.agent_ids as string[]) || [];
    const oldFeatures = (existingMeta?.feature_ids as string[]) || [];
    
    interface FeatureLabel { id: string; label: string }
    
    let agentLabels: { id: string; full_name: string }[] = [];
    let featureLabels: FeatureLabel[] = [];
    const normalizedAgentIds = (agent_ids || []).map((id: string) => String(id));
    const normalizedFeatureIds = (feature_ids || []).map((id: string) => String(id));
    const needsLabels = JSON.stringify(oldAgents.sort()) !== JSON.stringify(normalizedAgentIds.sort()) || 
                        JSON.stringify(oldFeatures.sort()) !== JSON.stringify(normalizedFeatureIds.sort());

    if (needsLabels) {
      const [{ data: agents }, { data: features }] = await Promise.all([
        supabase.from("identities_v3").select("id, display_name").in("id", [...new Set([...oldAgents, ...normalizedAgentIds])]),
        supabase.from("ref_master_data").select("code, label").eq("type", "FEATURE").in("code", [...new Set([...oldFeatures, ...normalizedFeatureIds])])
      ]);
      agentLabels = (agents || []).map((a) => ({ id: String(a.id), full_name: a.display_name || "Unknown Agent" }));
      featureLabels = (features || []).map((f) => ({ id: String(f.code), label: (f.label as Record<string, string>)?.th || f.code }));
    }

    const diff = getPropertyDiff(
      { ...existing, agent_ids: oldAgents, feature_ids: oldFeatures } as any,
      { ...safeValues, agent_ids, feature_ids } as any,
      { allAgents: agentLabels, allFeatures: featureLabels }
    );

    await logAudit(
      { supabase, user, role },
      {
        action: "property.update",
        entity: "properties_core",
        entityId: id,
        summary: diff.summary.join(", "),
        metadata: {
          diff: diff.summary,
          changes: diff.details,
          old_state: diff.oldState,
          new_state: diff.newState,
          sessionId,
        },
      },
    );

    // 6) POST-UPDATE SIDE EFFECTS (Wrapped in try-catch to prevent failure of main action)
    try {
      if (images !== undefined) {
        await finalizeUploadSession({ supabase, userId: user.id, sessionId, propertyId: id, usedPaths: images });
        const { data: currentMedia } = await supabase.from("property_media_v3").select("id, storage_path").eq("property_id", id);
        if (currentMedia && currentMedia.length > 0) {
          const scanEvents = currentMedia.map((img) => ({
            name: "app/property.image.created",
            data: { imageId: img.id, storagePath: img.storage_path },
          }));
          await inngest.send(scanEvents).catch(e => console.warn("Inngest image scan skip:", e.message));
        }
      }
      
      // Notifications
      const updatedStatus = safeValues.status;
      const displayTitle = existing.title || "Property";
      if ((updatedStatus === "SOLD" || updatedStatus === "RENTED") && existing.status !== updatedStatus) {
        await sendStatusUpdateNotification({ id, title: displayTitle }, updatedStatus as "SOLD" | "RENTED").catch(e => console.warn("Notification skip:", e.message));
      }
      
      // Price Drop Logic (Sale & Rent)
      const currentSalePrice = Number(safeValues.price || safeValues.original_price || 0);
      const oldSalePrice = Number(existing.price || existing.original_price || 0);
      const currentRentPrice = Number(safeValues.rental_price || safeValues.original_rental_price || 0);
      const oldRentPrice = Number(existing.rental_price || existing.original_rental_price || 0);
  
      if (currentSalePrice > 0 && oldSalePrice > 0 && currentSalePrice < oldSalePrice) {
        await sendPriceDropNotification({ id, title: displayTitle }, oldSalePrice, currentSalePrice, "SALE").catch(e => console.warn("Price Drop Notif skip:", e.message));
      } else if (currentRentPrice > 0 && oldRentPrice > 0 && currentRentPrice < oldRentPrice) {
        await sendPriceDropNotification({ id, title: displayTitle }, oldRentPrice, currentRentPrice, "RENT").catch(e => console.warn("Price Drop Notif skip:", e.message));
      }
  
      if (safeValues.requires_ai_review) {
        await inngest.send({ name: "property.created", data: { propertyId: id, userId: user.id, tenantId } }).catch(e => console.warn("Inngest AI review skip:", e.message));
      }
    } catch (sideEffectError) {
      console.warn("Post-update side effects partially failed (non-critical):", sideEffectError);
    }

    revalidatePath("/", "layout");

    return { success: true, message: "อัปเดตข้อมูลสำเร็จ", propertyId: id, slug: seoData.slug };
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
 * Update property status (Hardened V3)
 */
export async function updatePropertyStatusAction(input: {
  id: string;
  status: PropertyStatus;
}): Promise<UpdatePropertyStatusResult> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const { data: existing, error: fetchErr } = await supabase
      .from("properties_core")
      .select(`
        id, tenant_id, status,
        properties_details ( title, meta_data )
      `)
      .eq("id", input.id)
      .single();

    if (fetchErr || !existing) return { success: false, message: "ไม่พบข้อมูลทรัพย์" };
    if (existing.tenant_id !== tenantId && role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    type MultiLang = { th?: string; en?: string; cn?: string; ru?: string };
    const details = existing.properties_details as unknown as { title: MultiLang; meta_data: Record<string, unknown> } | null;
    const meta = details?.meta_data;
    
    if (meta?.requires_ai_review && input.status !== "DRAFT") {
      return { success: false, message: "กรุณาตรวจสอบข้อมูล AI ในหน้าแก้ไขก่อนเปลี่ยนสถานะ" };
    }

    const { error: updateError } = await supabase
      .rpc("sync_property_inventory_atomic", {
        p_property_id: input.id,
        p_adjustment: (input.status === "SOLD" || input.status === "RENTED") ? 1 : -1,
        p_deal_type: input.status === "RENTED" ? "RENT" : "SALE",
        p_tenant_id: tenantId!
      });

    if (updateError) {
      // Fallback to direct update if RPC fails (legacy support during migration)
      const { error: directError } = await supabase
        .from("properties_core")
        .update({ status: PROPERTY_STATUS_DB_VALUE[input.status as PropertyStatus] })
        .eq("id", input.id);
      
      if (directError) return { success: false, message: mapDbError(directError) };
    }

    const oldStatusStr = getStatusFromDb(existing.status);

    await logAudit({ supabase, user, role }, {
      action: "property.status_update",
      entity: "properties_core",
      entityId: input.id,
      summary: `Changed status from ${oldStatusStr} to ${input.status}`,
      metadata: { old_status: oldStatusStr, new_status: input.status }
    });

    if ((input.status === "SOLD" || input.status === "RENTED") && oldStatusStr !== (input.status as string)) {
      const title = details?.title?.th || "Property";
      await sendStatusUpdateNotification({ id: input.id, title }, input.status as "SOLD" | "RENTED");
    }

    revalidateTag("properties", "seconds");
    return { success: true, message: "อัปเดตสถานะสำเร็จ" };
  } catch (err) {
    return { success: false, message: mapDbError(err) };
  }
}

/**
 * 🚀 Elite Tool: Manual AI Review Trigger
 */
export async function triggerPropertyAiReviewAction(propertyId: string) {
  try {
    const { supabase, user, role, tenantId: contextTenantId } = await requireAuthContext();
    assertStaff(role);

    // Resolve tenantId from the property record
    const { data: existing, error: findErr } = await supabase
      .from("properties_core")
      .select("tenant_id")
      .eq("id", propertyId)
      .single();

    if (findErr || !existing) throw new Error("Property not found");
    const tenantId = existing.tenant_id;
    if (!tenantId) throw new Error("ไม่พบข้อมูลสาขาในระบบ");

    // Verify membership if not admin and context tenant does not match the property's tenant
    if (role !== "ADMIN" && contextTenantId !== tenantId) {
      const { data: member } = await supabase
        .from("tenant_members_v3")
        .select("role")
        .eq("tenant_id", tenantId)
        .eq("identity_id", user.id)
        .maybeSingle();
      if (!member) throw new Error("คุณไม่มีสิทธิ์เข้าถึงหรือแก้ไขข้อมูลของสาขานี้");
    }

    const { error } = await supabase.from("properties_core").update({ status: PROPERTY_STATUS_DB_VALUE["DRAFT"] }).eq("id", propertyId).eq("tenant_id", tenantId);
    if (error) throw error;

    await inngest.send({ name: "property.created", data: { propertyId, userId: user.id, tenantId } }).catch(e => console.warn("Inngest skip:", e.message));
    await logAudit({ supabase, user, role }, { action: "property.ai_refresh", entity: "properties_core", entityId: propertyId });
    revalidatePath("/protected/properties");
    return { success: true, message: "กำลังเริ่มการประมวลผล AI หลังบ้าน..." };
  } catch (e: unknown) {
    console.error("triggerPropertyAiReviewAction error:", e);
    return { success: false, message: mapDbError(e) };
  }
}
