"use server";
import { revalidatePath } from "next/cache";
import { type Database } from "@/lib/database.types";
import { randomUUID } from "crypto";
import { inngest } from "@/lib/inngest/client";
import { requireAuthContext, assertStaff, authzFail, AuthzError } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { getPublicImageUrl } from "../image-utils";
import { PropertyFormValues } from "../schema";
import {
  CreatePropertyResult,
  DuplicatePropertyResult,
  PropertyRow,
} from "../types";
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
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);
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

    const { images, agent_ids, feature_ids, ...propertyData } = safeValues;

    // 🧠 Auto-Status Logic: AI Draft Enforcement
    // Skip review for staff manual creation
    if (role === "ADMIN" || role === "MANAGER") {
      propertyData.requires_ai_review = false;
    }

    if (propertyData.requires_ai_review) {
      propertyData.status = "DRAFT";
    } else if ((propertyData.sold_units ?? 0) >= (propertyData.total_units ?? 1)) {
      if (propertyData.listing_type === "RENT") {
        propertyData.status = "RENTED";
      } else {
        propertyData.status = "SOLD";
      }
    } else if (
      propertyData.status === "SOLD" ||
      propertyData.status === "RENTED"
    ) {
      // If stock remains, force ACTIVE (prevent premature SOLD/RENTED status)
      propertyData.status = "ACTIVE";
    }

    // ✅ image paths ต้องอยู่ภายใต้ properties/
    if (images?.length) {
      const mustStartWith = "properties/";
      const invalid = images.find((p) => !p.startsWith(mustStartWith));
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

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        ...propertyData,
        co_agent_name: encrypt(propertyData.co_agent_name),
        co_agent_name_hash: generateBlindIndex(propertyData.co_agent_name),
        co_agent_phone: encrypt(propertyData.co_agent_phone),
        co_agent_phone_hash: generateBlindIndex(propertyData.co_agent_phone),
        co_agent_contact_id: encrypt(propertyData.co_agent_contact_id),
        tenant_id: tenantId,
        original_price: propertyData.original_price, // Force include
        original_rental_price: propertyData.original_rental_price,
        created_by: user.id,
        slug: seoData.slug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: mergedKeywords,
        structured_data: seoData.structuredData as Database["public"]["Tables"]["properties"]["Insert"]["structured_data"],
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, message: mapDbError(error) };
    }

    if (images && images.length > 0) {
      // 1) Validate path format
      const valid = validatePropertyImagePaths(images);
      if (!valid.ok) {
        await supabase
          .from("properties")
          .delete()
          .eq("id", property.id)
          .eq("tenant_id", tenantId);
        return { success: false, message: valid.message };
      }

      // 3) Insert rows
      const imageRows = images.map((storagePath, index) => ({
        property_id: property.id,
        storage_path: storagePath,
        image_url: getPublicImageUrl(storagePath),
        is_cover: index === 0,
        sort_order: index,
      }));

      const { data: insertedImages, error: imagesError } = await supabase
        .from("property_images")
        .insert(imageRows)
        .select("id, storage_path");

      if (imagesError) {
        console.error("Images insertion error:", imagesError);

        // ✅ Rollback: ลบ property เพื่อไม่ให้เกิด half-created data
        await supabase
          .from("properties")
          .delete()
          .eq("id", property.id)
          .eq("tenant_id", tenantId);

        return { success: false, message: "Failed to attach images" };
      }

      // 🛡️ [PHASE 3] Trigger Malware Scan for each image
      if (insertedImages && insertedImages.length > 0) {
        const scanEvents = insertedImages.map((img) => ({
          name: "app/property.image.created",
          data: {
            imageId: img.id,
            storagePath: img.storage_path,
          },
        }));
        await inngest.send(scanEvents);
      }
    }
    await finalizeUploadSession({
      supabase,
      userId: user.id,
      sessionId,
      propertyId: property.id,
      usedPaths: images ?? [],
    });

    // 4) Insert agents
    if (agent_ids && agent_ids.length > 0) {
      const agentRows = agent_ids.map((agentId) => ({
        property_id: property.id,
        agent_id: agentId,
      }));

      const { error: agentsError } = await supabase
        .from("property_agents")
        .insert(agentRows);

      if (agentsError) {
        console.error("Agents insertion error:", agentsError);
      }
    }

    // 5) Insert features/amenities
    if (feature_ids && feature_ids.length > 0) {
      const featureRows = feature_ids.map((featureId) => ({
        property_id: property.id,
        feature_id: featureId,
      }));

      const { error: featuresError } = await supabase
        .from("property_features")
        .insert(featureRows);

      if (featuresError) {
        console.error("Features insertion error:", featuresError);
        // Non-blocking: continue even if features fail to save
      }
    }

    await logAudit(
      { supabase, user, role },
      {
        action: "property.create",
        entity: "properties",
        entityId: property.id,
        metadata: {
          imagesCount: images?.length ?? 0,
          sessionId,
        },
      },
    );
    revalidatePath("/protected/properties");

    // 🚀 Step 6: Background Job (Non-blocking)
    await inngest.send({
      name: "property.created",
      data: { 
        propertyId: property.id,
        userId: user.id,
        tenantId: tenantId
      },
    });

    return { 
      success: true, 
      message: "สร้างทรัพย์ใหม่สำเร็จ",
      propertyId: property.id, 
      slug: seoData.slug 
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
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);
    if (!tenantId) throw new Error("Tenant ID is required but missing");

    const { data: src, error: srcErr } = await supabase
      .from("properties")
      .select("id, title, property_type, listing_type, status, price, rental_price, bedrooms, bathrooms, size_sqm, district, subdistrict, province, near_transit, is_pet_friendly, is_corner_unit, is_renovated, is_fully_furnished, floor, has_city_view, has_pool_view, has_garden_view, is_selling_with_tenant, is_tax_registered, is_foreigner_quota, google_maps_link, address_line1, postal_code, description, meta_title, meta_description, meta_keywords, tenant_id, property_images(image_url, is_cover)")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (srcErr || !src)
      return { success: false, message: "ไม่พบทรัพย์ต้นฉบับ" };

    const newTitle = `${src.title ?? "ไม่ระบุชื่อ"} (คัดลอก)`;

    // regenerate SEO + slug (กันชน unique)
    const { generatePropertySEO } = await import("@/lib/seo-utils");
    const seoData = generatePropertySEO({
      title: newTitle,
      property_type: src.property_type ?? undefined,
      listing_type: src.listing_type ?? undefined,

      bedrooms: src.bedrooms ?? undefined,
      bathrooms: src.bathrooms ?? undefined,
      size_sqm: src.size_sqm ?? undefined,
      price: src.price ?? undefined,
      rental_price: src.rental_price ?? undefined,

      district: src.district ?? undefined,
      province: src.province ?? undefined,
      address_line1: src.address_line1 ?? undefined,
      postal_code: src.postal_code ?? undefined,
      description: src.description ?? undefined,
      main_image: (src.property_images as unknown as { is_cover: boolean; image_url: string }[])?.find((img) => img.is_cover)?.image_url || undefined, // Carry over cover image if available
    });

    const uniqueSlug = `${seoData.slug}-${randomUUID().slice(0, 8)}`;

    const {
      id: _id,
      tenant_id: _tenant_id,
      created_at: _created_at,
      updated_at: _updated_at,
      created_by: _created_by,
      slug: _slug,
      meta_title: _meta_title,
      meta_description: _meta_description,
      meta_keywords: _meta_keywords,
      structured_data: _structured_data,
      // ✨ Hardening: รีเซ็ตข้อมูลส่วนตัวของทรัพย์ต้นฉบับ
      view_count: _view_count,
      posted_to_facebook_at: _posted_to_facebook_at,
      posted_to_line_at: _posted_to_line_at,
      posted_to_instagram_at: _posted_to_instagram_at,
      posted_to_tiktok_at: _posted_to_tiktok_at,
      ai_reviewed_at: _ai_reviewed_at,
      ai_reviewed_by: _ai_reviewed_by,
      verified: _verified,
      ...rest
    } = src as unknown as PropertyRow;

    const { data: inserted, error: insErr } = await supabase
      .from("properties")
      .insert({
        ...rest,
        title: newTitle,
        status: "DRAFT", // แนะนำให้เป็น draft เสมอ
        tenant_id: tenantId,
        created_by: user.id,
        slug: uniqueSlug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: seoData.metaKeywords,
        structured_data: seoData.structuredData as Database["public"]["Tables"]["properties"]["Insert"]["structured_data"],
        // ✨ Reset metrics & shares
        view_count: 0,
        verified: false,
        posted_to_facebook_at: null,
        posted_to_line_at: null,
        posted_to_instagram_at: null,
        posted_to_tiktok_at: null,
        ai_reviewed_at: null,
        ai_reviewed_by: null,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      return {
        success: false,
        message: mapDbError(insErr) ?? "Duplicate ไม่สำเร็จ",
      };
    }
    const newPropertyId = inserted.id;
    // ✅ Step 4.2: copy images rows & files
    const { data: imgs } = await supabase
      .from("property_images")
      .select("image_url, storage_path, is_cover, sort_order")
      .eq("property_id", id)
      .order("sort_order", { ascending: true });

    if (imgs?.length) {
      const copyPromises = imgs.map(async (img) => {
        if (!img.storage_path) return null;
        const ext = img.storage_path.split(".").pop() || "webp";
        const newPath = `properties/${user.id}/dup-${randomUUID()}.${ext}`;

        const { error: copyErr } = await supabase.storage
          .from(PROPERTY_IMAGES_BUCKET)
          .copy(img.storage_path, newPath);

        if (copyErr) {
          console.error("duplicatePropertyAction: storage copy failed", copyErr);
          return null;
        }

        return {
          property_id: newPropertyId,
          image_url: getPublicImageUrl(newPath),
          storage_path: newPath,
          is_cover: img.is_cover,
          sort_order: img.sort_order,
        };
      });

      const newRows = (await Promise.all(copyPromises)).filter(
        (r): r is NonNullable<typeof r> => !!r,
      );

      if (newRows.length > 0) {
        await supabase.from("property_images").insert(newRows);
      }
    }

    // ✅ Step 4.3: copy agents
    const { data: agents } = await supabase
      .from("property_agents")
      .select("agent_id")
      .eq("property_id", id);

    if (agents?.length) {
      const agentRows = agents.map(a => ({
        property_id: newPropertyId,
        agent_id: a.agent_id
      }));
      await supabase.from("property_agents").insert(agentRows);
    }

    // ✅ Step 4.4: copy features (amenities)
    const { data: features } = await supabase
      .from("property_features")
      .select("feature_id")
      .eq("property_id", id);

    if (features?.length) {
      const featureRows = features.map(f => ({
        property_id: newPropertyId,
        feature_id: f.feature_id
      }));
      await supabase.from("property_features").insert(featureRows);
    }

    await logAudit(
      { supabase, user, role },
      {
        action: "property.create",
        entity: "properties",
        entityId: newPropertyId,
        metadata: { duplicated_from: id },
      },
    );

    revalidatePath("/protected/properties");

    // 🚀 Step 4.5: Background Job (Non-blocking)
    await inngest.send({
      name: "property.created",
      data: { 
        propertyId: newPropertyId,
        userId: user.id,
        tenantId: tenantId
      },
    });

    return { success: true, message: "คัดลอกทรัพย์สำเร็จ", propertyId: newPropertyId };
  } catch (err: unknown) {
    console.error("duplicatePropertyAction → error:", err);
    if (err instanceof AuthzError) {
      return authzFail(err);
    }
    return { success: false, message: mapDbError(err) };
  }
}
