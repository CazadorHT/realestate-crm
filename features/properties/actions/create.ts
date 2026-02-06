"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { getPublicImageUrl } from "../image-utils";
import { PropertyFormValues } from "../schema";
import { CreatePropertyResult, DuplicatePropertyResult } from "../types";
import {
  finalizeUploadSession,
  validatePropertyImagePaths,
} from "../logic/images";
import { generateKeywords, prepareSEOData } from "../logic/seo";
import { FormSchema } from "../schema";

/**
 * Create property with images
 */
export async function createPropertyAction(
  values: PropertyFormValues,
  sessionId: string,
): Promise<CreatePropertyResult> {
  try {
    // ✅ Step 1.2: require auth context (แทน getUser แบบเดิม)
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);
    if (!sessionId)
      return { success: false, message: "Missing upload session" };

    // 1) Validate form data คือ การตรวจสอบความถูกต้องของข้อมูลฟอร์ม
    const parsed = FormSchema.safeParse(values);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.format(),
      };
    }
    const safeValues = parsed.data;

    const { images, agent_ids, feature_ids, ...propertyData } = safeValues;

    // 🧠 Auto-Status Logic: Check Stock
    if ((propertyData.sold_units ?? 0) >= (propertyData.total_units ?? 1)) {
      propertyData.status = "SOLD";
    } else if (propertyData.status === "SOLD") {
      // If stock remains, force ACTIVE (prevent premature SOLD status)
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
    const finalKeywords = generateKeywords(safeValues);
    const seoData = prepareSEOData(propertyData, safeValues);

    const mergedKeywords = Array.from(
      new Set([...(seoData.metaKeywords || []), ...finalKeywords]),
    );

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        ...propertyData,
        original_price: propertyData.original_price, // Force include
        original_rental_price: propertyData.original_rental_price,
        created_by: user.id,
        slug: seoData.slug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: mergedKeywords,
        structured_data: seoData.structuredData as any,
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    if (images && images.length > 0) {
      // 1) Validate path format
      const valid = validatePropertyImagePaths(images);
      if (!valid.ok) {
        await supabase.from("properties").delete().eq("id", property.id);
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

      const { error: imagesError } = await supabase
        .from("property_images")
        .insert(imageRows);

      if (imagesError) {
        console.error("Images insertion error:", imagesError);

        // ✅ Rollback: ลบ property เพื่อไม่ให้เกิด half-created data
        await supabase.from("properties").delete().eq("id", property.id);

        return { success: false, message: "Failed to attach images" };
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
    return { success: true, propertyId: property.id, slug: seoData.slug };
  } catch (err) {
    console.error("createPropertyAction → error:", err);
    return authzFail(err);
  }
}

/**
 * Duplicate property
 */
export async function duplicatePropertyAction(
  id: string,
): Promise<DuplicatePropertyResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const { data: src, error: srcErr } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
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
    });

    const uniqueSlug = `${seoData.slug}-${randomUUID().slice(0, 8)}`;

    // omit fields ที่ไม่ควรถูก copy ตรง ๆ
    const {
      id: _id,
      created_at: _created_at,
      updated_at: _updated_at,
      created_by: _created_by,
      slug: _slug,
      meta_title: _meta_title,
      meta_description: _meta_description,
      meta_keywords: _meta_keywords,
      structured_data: _structured_data,
      ...rest
    } = src as any;

    const { data: inserted, error: insErr } = await supabase
      .from("properties")
      .insert({
        ...rest,
        title: newTitle,
        status: "DRAFT", // แนะนำให้เป็น draft เสมอ
        created_by: user.id,
        slug: uniqueSlug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: seoData.metaKeywords,
        structured_data: seoData.structuredData as any,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      return {
        success: false,
        message: insErr?.message || "Duplicate ไม่สำเร็จ",
      };
    }
    // Explicitly re-affirm inserted is not null for TS (though the if above should handle it, sometimes block scoping is tricky)
    const newPropertyId = inserted.id;

    // copy images rows (ไม่ copy ไฟล์จริงใน storage — ใช้ไฟล์เดิมได้)
    const { data: imgs } = await supabase
      .from("property_images")
      .select("image_url, storage_path, is_cover, sort_order")
      .eq("property_id", id)
      .order("sort_order", { ascending: true });

    if (imgs?.length) {
      const rows = imgs.map((img) => ({
        property_id: newPropertyId,
        image_url: img.image_url,
        storage_path: img.storage_path,
        is_cover: img.is_cover,
        sort_order: img.sort_order,
      }));

      const { error: imgErr } = await supabase
        .from("property_images")
        .insert(rows);

      if (imgErr) {
        // ไม่ถึงกับ fail ทั้งหมด แต่แจ้งไว้
        console.warn("duplicatePropertyAction: copy images failed", imgErr);
      }
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
    return { success: true, propertyId: newPropertyId };
  } catch (err) {
    console.error("duplicatePropertyAction → error:", err);
    return authzFail(err);
  }
}
