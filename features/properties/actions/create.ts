"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { type Database } from "@/lib/database.types.generated";
import { randomUUID } from "crypto";
import { inngest } from "@/lib/inngest/client";
import {
  requireAuthContext,
  assertStaff,
  authzFail,
  AuthzError,
} from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { getPublicImageUrl } from "../image-utils";
import { getSystemConfig } from "@/lib/actions/system-config";
import { PropertyFormValues } from "../schema";
import {
  CreatePropertyResult,
  DuplicatePropertyResult,
  PropertyRow,
} from "../types";
import {
  PROPERTY_STATUS_DB_VALUE,
  LISTING_TYPE_DB_VALUE,
  PROPERTY_TYPE_DB_VALUE,
  getListingTypeFromDb,
  getPropertyTypeFromDb,
} from "../labels";
import {
  finalizeUploadSession,
  validatePropertyImagePaths,
  PROPERTY_IMAGES_BUCKET,
} from "../logic/images";
import { generateKeywords, prepareSEOData } from "../logic/seo";
import { FormSchema } from "../schema";
import { mapDbError } from "@/lib/db-error";
import { encrypt, generateBlindIndex } from "@/lib/crypto";


/**
 * Create property with images
 */
export async function createPropertyAction(
  values: PropertyFormValues,
  sessionId: string,
): Promise<CreatePropertyResult> {
  try {
    // ✅ Step 1.2: require auth context (แทน getUser แบบเดิม)
    const { supabase, user, role, tenantId: contextTenantId } = await requireAuthContext();
    assertStaff(role);
    
    let tenantId = contextTenantId;
    if (!tenantId) {
      const { data: firstMember } = await supabase
        .from("tenant_members_v3")
        .select("tenant_id")
        .eq("identity_id", user.id)
        .limit(1)
        .maybeSingle();
      if (firstMember?.tenant_id) {
        tenantId = firstMember.tenant_id;
      } else {
        const { default_tenant_id } = await getSystemConfig();
        if (default_tenant_id) {
          tenantId = default_tenant_id;
        } else {
          // Ultimate fallback: get the first tenant in the system
          const { data: firstTenant } = await supabase
            .from("tenants_v3")
            .select("id")
            .limit(1)
            .maybeSingle();
          if (firstTenant?.id) {
            tenantId = firstTenant.id;
          }
        }
      }
    }
    if (!tenantId) throw new Error("Tenant ID is required but missing");
    if (!sessionId)
      return { success: false, message: "Missing upload session" };

    // 1) Validate form data คือ การตรวจสอบความถูกต้องของข้อมูลฟอร์ม
    const parsed = FormSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0].message,
      };
    }
    const safeValues = parsed.data;

    const {
      images,
      agent_ids,
      feature_ids,
      video_url,
      co_agent_name,
      co_agent_phone,
      co_agent_contact_id,
      ...propertyData
    } = safeValues;

    // 🧠 Auto-Status Logic: AI Draft Enforcement
    // Skip review for staff manual creation
    if (role === "ADMIN" || role === "MANAGER") {
      propertyData.requires_ai_review = false;
    }

    if (propertyData.requires_ai_review) {
      propertyData.status = "DRAFT";
    }

    // ✅ image paths ต้องอยู่ภายใต้ properties/ หรือ tenant_id/properties/
    if (images?.length) {
      const invalid = images.find(
        (p) => !p.startsWith("properties/") && !p.startsWith(`${tenantId}/properties/`)
      );
      if (invalid) {
        return {
          success: false,
          message: "Invalid image path (ownership mismatch)",
        };
      }
    }

    // SEO & Keywords
    const mainImageUrl = images?.[0] ? getPublicImageUrl(images[0]) : undefined;
    const finalKeywords = generateKeywords(safeValues);
    const seoData = prepareSEOData(
      {
        ...propertyData,
        main_image: mainImageUrl,
      },
      safeValues,
    );

    const mergedKeywords = Array.from(
      new Set([...(seoData.metaKeywords || []), ...finalKeywords]),
    );

    // --- V3 SMART ORCHESTRATOR: ATOMIC INSERTION ---
    
    // 1. Insert into properties_core (Hot Table)
    const { data: core, error: coreError } = await supabase
      .from("properties_core")
      .insert({
        tenant_id: tenantId,
        branch_id: safeValues.branch_id,
        status: PROPERTY_STATUS_DB_VALUE[propertyData.status || "DRAFT"],
        listing_type: LISTING_TYPE_DB_VALUE[propertyData.listing_type || "SALE"],
        property_type: PROPERTY_TYPE_DB_VALUE[propertyData.property_type || "CONDO"],
        sale_price: propertyData.price ?? propertyData.original_price,
        rent_price: propertyData.rental_price ?? propertyData.original_rental_price,
        currency: propertyData.currency || "THB",
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        floor_area: propertyData.size_sqm,
        land_area: propertyData.land_size_sqwah,
        owner_id: safeValues.owner_id,
        assigned_to: safeValues.assigned_to,
        created_by: user.id,
        is_exclusive: !!safeValues.is_exclusive,
        verified: !!safeValues.verified,
        h3_index_res8: safeValues.h3_index_res8,
        price_per_sqm: safeValues.price_per_sqm,
      })
      .select("id")
      .single();

    if (coreError || !core) {
      return { success: false, message: mapDbError(coreError) };
    }

    // 2. Insert into properties_details (Warm Layer / JSONB)
    const { error: detailsError } = await supabase
      .from("properties_details")
      .insert({
        property_id: core.id,
        title: {
          th: propertyData.title,
          en: propertyData.title_en,
          cn: propertyData.title_cn,
          ru: propertyData.title_ru,
        },
        description: {
          th: propertyData.description,
          en: propertyData.description_en,
          cn: propertyData.description_cn,
          ru: propertyData.description_ru,
        },
        address_info: {
          th: propertyData.address_line1,
          en: propertyData.address_line1_en,
          cn: propertyData.address_line1_cn,
          ru: propertyData.address_line1_ru,
          province: propertyData.province,
          district: propertyData.district,
          subdistrict: propertyData.subdistrict,
          postal_code: propertyData.postal_code,
          maps_link: propertyData.google_maps_link,
          popular_area: propertyData.popular_area,
          popular_area_en: propertyData.popular_area_en,
          popular_area_cn: propertyData.popular_area_cn,
          popular_area_ru: propertyData.popular_area_ru,
          slug: seoData.slug, // V3 Standard: Store slug in address_info too
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
        },
        pricing_details: {
          maintenance_fee: propertyData.maintenance_fee,
          parking_fee: propertyData.parking_fee_additional,
          electricity_charge: propertyData.electricity_charge,
          water_charge: propertyData.water_charge,
          commission_sale: propertyData.commission_sale_percentage,
          commission_rent: propertyData.commission_rent_months,
          original_price: propertyData.original_price,
          original_rental_price: propertyData.original_rental_price,
        },
        transit_info: {
          places: safeValues.nearby_places || [],
          transits: safeValues.nearby_transits || [],
        },
        meta_data: {
          slug: seoData.slug,
          meta_title: seoData.metaTitle,
          meta_description: seoData.metaDescription,
          keywords: mergedKeywords,
          agent_ids: agent_ids,
          feature_ids: feature_ids,
          co_agent: {
            is_co_agent: safeValues.is_co_agent,
            name: co_agent_name,
            phone: co_agent_phone,
            contact_id: co_agent_contact_id,
          },
          requires_ai_review: propertyData.requires_ai_review,
          created_by: user.id,
          property_source: propertyData.property_source,
          video_url: safeValues.video_url,
          floor_plan_url: safeValues.floor_plan_url,
          version: 1,
        },
      });

    if (detailsError) {
      // Rollback core insert on details failure
      await supabase.from("properties_core").delete().eq("id", core.id);
      return { success: false, message: mapDbError(detailsError) };
    }

    // 3. Insert Relations (Agents/Features Bridge)
    if (agent_ids && agent_ids.length > 0) {
      await supabase.from("property_agents").insert(agent_ids.map(aId => ({ property_id: core.id, agent_id: aId })));
    }
    if (feature_ids && feature_ids.length > 0) {
      await supabase.from("property_features").insert(feature_ids.map(fId => ({ property_id: core.id, feature_id: fId })));
    }

    // 4. Insert into property_media_v3
    if (images && images.length > 0) {
      const mediaRows = images.map((storagePath, index) => ({
        property_id: core.id,
        storage_path: storagePath,
        url: getPublicImageUrl(storagePath),
        is_cover: index === 0,
        sort_order: index,
        media_type: "image",
      }));

      const { error: mediaError } = await supabase
        .from("property_media_v3")
        .insert(mediaRows);

      if (mediaError) {
        // Critical rollback if media fails
        await supabase.from("properties_details").delete().eq("property_id", core.id);
        await supabase.from("properties_core").delete().eq("id", core.id);
        return { success: false, message: "บันทึกรูปภาพไม่สำเร็จ: " + mapDbError(mediaError) };
      }
    }

    await finalizeUploadSession({
      supabase,
      userId: user.id,
      sessionId,
      propertyId: core.id,
      usedPaths: images ?? [],
    });

    await logAudit(
      { supabase, user, role },
      {
        action: "property.create",
        entity: "properties_core",
        entityId: core.id,
        metadata: {
          imagesCount: images?.length ?? 0,
          sessionId,
        },
      },
    );
    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");

    // 🚀 Step 6: Background Job (Non-blocking)
    await (inngest.send({
      name: "property.created",
      data: {
        propertyId: core.id,
        userId: user.id,
        tenantId: tenantId,
      },
    }) as any)?.catch((e: any) => console.warn("Inngest property.created skip:", e.message));


    return {
      success: true,
      message: "สร้างทรัพย์ใหม่สำเร็จ",
      propertyId: core.id,
      slug: seoData.slug,
    };
  } catch (err: unknown) {
    console.error("createPropertyAction → error:", err);
    if (err instanceof AuthzError) {
      return authzFail(err);
    }
    return { success: false, message: mapDbError(err) };
  }
}

/**
 * Duplicate property
 */
export async function duplicatePropertyAction(
  id: string,
): Promise<DuplicatePropertyResult> {
  try {
    const { supabase, user, role, tenantId: contextTenantId } = await requireAuthContext();
    assertStaff(role);
    
    let tenantId = contextTenantId;
    if (!tenantId) {
      const { data: firstMember } = await supabase
        .from("tenant_members_v3")
        .select("tenant_id")
        .eq("identity_id", user.id)
        .limit(1)
        .maybeSingle();
      if (firstMember?.tenant_id) {
        tenantId = firstMember.tenant_id;
      } else {
        const { default_tenant_id } = await getSystemConfig();
        if (default_tenant_id) {
          tenantId = default_tenant_id;
        } else {
          // Ultimate fallback: get the first tenant in the system
          const { data: firstTenant } = await supabase
            .from("tenants_v3")
            .select("id")
            .limit(1)
            .maybeSingle();
          if (firstTenant?.id) {
            tenantId = firstTenant.id;
          }
        }
      }
    }
    if (!tenantId) throw new Error("Tenant ID is required but missing");


    const { data: core } = await supabase
      .from("properties_core")
      .select("branch_id, listing_type, property_type, sale_price, rent_price, currency, bedrooms, bathrooms, floor_area, land_area, price_per_sqm, owner_id, assigned_to, is_exclusive, verified, h3_index_res8")
      .eq("id", id)
      .single();
    const { data: details } = await supabase
      .from("properties_details")
      .select("title, description, address_info, amenities, pricing_details, transit_info, meta_data")
      .eq("property_id", id)
      .single();
    const { data: media } = await supabase
      .from("property_media_v3")
      .select("storage_path, url, is_cover, sort_order, media_type")
      .eq("property_id", id)
      .order("sort_order");

    if (!core) return { success: false, message: "Property not found" };

    const oldTitle = (details?.title as Record<string, string>)?.th || "";
    const newTitle = `(Copy) ${oldTitle}`;

    // Synthetic safeValues for duplication
    const syntheticSafeValues = {
      listing_type: getListingTypeFromDb(core.listing_type),
      property_type: getPropertyTypeFromDb(core.property_type),
      is_pet_friendly: (details?.amenities as Record<string, boolean>)?.is_pet_friendly,
      is_fully_furnished: (details?.amenities as Record<string, boolean>)?.is_fully_furnished,
    } as PropertyFormValues;
    
    const seoData = prepareSEOData({
      title: newTitle,
      listing_type: syntheticSafeValues.listing_type,
      property_type: syntheticSafeValues.property_type,
      address_line1: (details?.address_info as Record<string, string>)?.th || "",
      province: (details?.address_info as Record<string, string>)?.province || "",
      district: (details?.address_info as Record<string, string>)?.district || "",
      description: (details?.description as Record<string, string>)?.th || "",
      main_image: media?.find((img) => img.is_cover)?.url || undefined,
    } as Record<string, unknown>, syntheticSafeValues);
    const uniqueSlug = `${seoData.slug}-copy-${crypto.randomUUID().slice(0, 4)}`;

    // --- V3 ARCHITECTURE DUPLICATION ---
    // 1. Insert into properties_core
    const { data: insertedCore, error: coreErr } = await supabase
      .from("properties_core")
      .insert({
        tenant_id: tenantId,
        branch_id: core.branch_id,
        status: PROPERTY_STATUS_DB_VALUE["DRAFT"],
        listing_type: core.listing_type,
        property_type: core.property_type,
        sale_price: core.sale_price,
        rent_price: core.rent_price,
        currency: core.currency,
        bedrooms: core.bedrooms,
        bathrooms: core.bathrooms,
        floor_area: core.floor_area,
        land_area: core.land_area,
        price_per_sqm: core.price_per_sqm,
        owner_id: core.owner_id,
        assigned_to: core.assigned_to,
        is_exclusive: core.is_exclusive,
        verified: core.verified,
        h3_index_res8: core.h3_index_res8,
      })
      .select("id")
      .single();

    if (coreErr || !insertedCore) {
      return { success: false, message: mapDbError(coreErr) ?? "Duplicate Core ไม่สำเร็จ" };
    }

    const newPropertyId = insertedCore.id;

    // 2. Insert into properties_details
    const { error: detailsErr } = await supabase
      .from("properties_details")
      .insert({
        property_id: newPropertyId,
        title: {
          ...((details?.title as Record<string, any>) || {}),
          th: newTitle,
        },
        description: details?.description || {},
        address_info: {
          ...((details?.address_info as Record<string, any>) || {}),
          slug: uniqueSlug,
        },
        amenities: details?.amenities || {},
        pricing_details: details?.pricing_details || {},
        transit_info: details?.transit_info || [],
        meta_data: {
          ...((details?.meta_data as Record<string, any>) || {}),
          slug: uniqueSlug,
          meta_title: seoData.metaTitle,
          meta_description: seoData.metaDescription,
          keywords: seoData.metaKeywords,
          created_by: user.id,
          version: 1,
        },
      });

    if (detailsErr) {
      // Rollback core
      await supabase.from("properties_core").delete().eq("id", newPropertyId);
      return { success: false, message: mapDbError(detailsErr) ?? "Duplicate Details ไม่สำเร็จ" };
    }

    // ✅ Step 4.2: copy images rows & files
    if (media && media.length > 0) {
      const newMedia = media.map((img) => ({
        property_id: newPropertyId,
        storage_path: img.storage_path,
        url: img.url,
        is_cover: img.is_cover,
        sort_order: img.sort_order,
        media_type: img.media_type,
      }));
      await supabase.from("property_media_v3").insert(newMedia);
    }

    // ✅ Step 4.3: copy agent & feature relations
    const [{ data: oldAgents }, { data: oldFeatures }] = await Promise.all([
      supabase.from("property_agents").select("agent_id").eq("property_id", id),
      supabase.from("property_features").select("feature_id").eq("property_id", id)
    ]);

    if (oldAgents && oldAgents.length > 0) {
      await supabase.from("property_agents").insert(oldAgents.map(a => ({ property_id: newPropertyId, agent_id: a.agent_id })));
    }
    if (oldFeatures && oldFeatures.length > 0) {
      await supabase.from("property_features").insert(oldFeatures.map(f => ({ property_id: newPropertyId, feature_id: f.feature_id })));
    }

    revalidatePath("/", "layout");
    revalidatePath("/protected/properties");
    revalidateTag("properties", "seconds");
    revalidateTag("public-data", "seconds");
    revalidateTag("popular-areas", "seconds");
    revalidateTag("dashboard-stats", "seconds");
    revalidateTag("dashboard-charts", "seconds");
    revalidateTag("dashboard-performance", "seconds");

    // 🚀 Step 4.5: Background Job (Non-blocking)
    await (inngest.send({
      name: "property.created",
      data: {
        propertyId: newPropertyId,
        userId: user.id,
        tenantId: tenantId,
      },
    }) as any)?.catch((e: any) => console.warn("Inngest property.created duplicate skip:", e.message));


    return {
      success: true,
      message: "คัดลอกทรัพย์สำเร็จ",
      propertyId: newPropertyId,
    };
  } catch (err: unknown) {
    console.error("duplicatePropertyAction → error:", err);
    if (err instanceof AuthzError) {
      return authzFail(err);
    }
    return { success: false, message: mapDbError(err) };
  }
}
