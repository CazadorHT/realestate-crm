"use server";
import { revalidatePath } from "next/cache";
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
import { PROPERTY_STATUS_ENUM } from "../labels";
import {
  PropertyStatus,
  CreatePropertyResult,
  UpdatePropertyStatusResult,
} from "../types";
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

/**
 * Update property with images
 */
export async function updatePropertyAction(
  id: string,
  values: PropertyFormValues,
  sessionId: string,
): Promise<CreatePropertyResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    // 1) Validate form data
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
      propertyData.status = "ACTIVE";
    }

    // 2) โหลดเจ้าของก่อน แล้วเช็คสิทธิ
    const { data: existing, error: findErr } = await supabase
      .from("properties")
      .select(
        "id, created_by, meta_keywords, price, rental_price, original_price, original_rental_price, status, title, property_images(image_url, is_cover, sort_order)",
      )
      .eq("id", id)
      .single();

    if (findErr || !existing) {
      return { success: false, message: "Property not found" };
    }

    // ✅ Strict Ownership Check: Only Owner or Admin can update
    if (existing.created_by !== user.id && !isAdmin(role)) {
      throw new Error("Forbidden: You can only update your own properties");
    }

    assertAuthenticated({ userId: user.id, role });

    // 3) กันยัด path รูปปลอม
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

    // 4) SEO metadata

    // We reuse existing keywords logic by passing existing ones
    const finalKeywords = generateKeywords(
      safeValues,
      existing.meta_keywords || [],
    );

    const seoData = prepareSEOData(propertyData, safeValues);

    const mergedKeywords = Array.from(
      new Set([...(seoData.metaKeywords || []), ...finalKeywords]),
    );

    // 5) Update property data + SEO
    const { error: updateErr } = await supabase
      .from("properties")
      .update({
        ...propertyData,
        is_bare_shell: safeValues.is_bare_shell,
        is_exclusive: safeValues.is_exclusive,
        has_raised_floor: safeValues.has_raised_floor,
        price: propertyData.price, // Force include (allow null)
        rental_price: propertyData.rental_price, // Force include (allow null)
        original_price: propertyData.original_price, // Force include
        original_rental_price: propertyData.original_rental_price,
        slug: seoData.slug,
        meta_title: seoData.metaTitle,
        meta_description: seoData.metaDescription,
        meta_keywords: mergedKeywords,
        structured_data: seoData.structuredData as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return { success: false, message: updateErr.message };
    }

    // --- Step 3: Images update with rollback ---
    // Only process images if the field was included in the request
    if (images !== undefined) {
      // A) โหลดรูปเดิมไว้ก่อน เผื่อ rollback
      const { data: oldImages, error: oldImagesErr } = await supabase
        .from("property_images")
        .select("storage_path, image_url, is_cover, sort_order")
        .eq("property_id", id);

      if (oldImagesErr) {
        console.error("Fetch old images error:", oldImagesErr);
        return { success: false, message: "Failed to read existing images" };
      }

      // B) ถ้ามีรูปใหม่: validate + existence check ก่อนทำลายของเดิม
      if (images && images.length > 0) {
        const valid = validatePropertyImagePaths(images);
        if (!valid.ok) return { success: false, message: valid.message };

        // Skip verification for images that already exist in property_images
        // (they were already verified when first uploaded)
        const existingPaths = new Set(
          (oldImages || []).map((img: any) => img.storage_path),
        );
      }

      // C) ลบรูปเดิม (ถ้าผู้ใช้ตั้งใจลบทั้งหมด images อาจว่าง → ก็ลบให้หมดได้)
      const { error: deleteError } = await supabase
        .from("property_images")
        .delete()
        .eq("property_id", id);

      if (deleteError) {
        console.error("Delete old images error:", deleteError);
        return { success: false, message: "Failed to replace images" };
      }

      // D) insert รูปใหม่ (ถ้ามี)
      if (images && images.length > 0) {
        const imageRows = images.map((storagePath, index) => ({
          property_id: id,
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

          // ✅ rollback: เอารูปเดิมกลับเข้าไป
          if (oldImages && oldImages.length > 0) {
            await supabase.from("property_images").insert(
              oldImages.map((img) => ({
                property_id: id,
                storage_path: img.storage_path,
                image_url: img.image_url,
                is_cover: img.is_cover,
                sort_order: img.sort_order,
              })),
            );
          }

          return { success: false, message: "Failed to attach images" };
        }
      }
      await finalizeUploadSession({
        supabase,
        userId: user.id,
        sessionId,
        propertyId: id,
        usedPaths: images ?? [],
      });

      // E) ลบไฟล์จริงออกจาก Storage (เฉพาะไฟล์ที่ถูกถอดออก)
      if (oldImages && oldImages.length > 0) {
        const oldPaths = new Set(
          oldImages.map((x) => x.storage_path).filter(Boolean),
        );
        const newPaths = new Set((images ?? []).filter(Boolean));

        const removed = [...oldPaths].filter(
          (p): p is string => typeof p === "string" && !newPaths.has(p),
        );

        if (removed.length > 0) {
          const { error: removeErr } = await supabase.storage
            .from(PROPERTY_IMAGES_BUCKET)
            .remove(removed);

          if (removeErr) {
            console.error("Failed to remove orphaned images:", removeErr);
          }
        }
      }
    } // End of if (images !== undefined)

    // --- Step 4: Agents update ---
    if (agent_ids !== undefined) {
      // Delete existing
      await supabase.from("property_agents").delete().eq("property_id", id);

      // Insert new
      if (agent_ids.length > 0) {
        const agentRows = agent_ids.map((agentId) => ({
          property_id: id,
          agent_id: agentId,
        }));
        const { error: agentsError } = await supabase
          .from("property_agents")
          .insert(agentRows);

        if (agentsError) {
          console.error("Agents update error:", agentsError);
        }
      }
    }

    // --- Step 5: Features/Amenities update ---
    if (feature_ids !== undefined) {
      // Delete all existing features
      await supabase.from("property_features").delete().eq("property_id", id);

      // Insert new selections
      if (feature_ids.length > 0) {
        const featureRows = feature_ids.map((featureId) => ({
          property_id: id,
          feature_id: featureId,
        }));
        const { error: featuresError } = await supabase
          .from("property_features")
          .insert(featureRows);

        if (featuresError) {
          console.error("Features update error:", featuresError);
          // Non-blocking: continue even if features fail to save
        }
      }
    }

    await logAudit(
      { supabase, user, role },
      {
        action: "property.update",
        entity: "properties",
        entityId: id,
        metadata: {
          imagesCount: images?.length ?? 0,
          sessionId,
        },
      },
    );
    // --- Workflow Notifications ---
    if (existing) {
      const newStatus = safeValues.status;
      const isDealClosure =
        (newStatus === "SOLD" || newStatus === "RENTED") &&
        existing.status !== newStatus;
      const currentSalePrice =
        safeValues.price || safeValues.original_price || 0;
      const oldSalePrice = existing.price || existing.original_price || 0;
      const currentRentPrice =
        safeValues.rental_price || safeValues.original_rental_price || 0;
      const oldRentPrice =
        existing.rental_price || existing.original_rental_price || 0;

      const priceDropped =
        currentSalePrice > 0 &&
        oldSalePrice > 0 &&
        currentSalePrice < oldSalePrice;
      const rentDropped =
        currentRentPrice > 0 &&
        oldRentPrice > 0 &&
        currentRentPrice < oldRentPrice;
      const isPriceDrop = priceDropped || rentDropped;

      // 1. Deal Closure Notification
      if (isDealClosure) {
        await sendStatusUpdateNotification(
          { id: existing.id, title: existing.title },
          newStatus,
        );
      }

      // 2. Price Drop Notification
      if (isPriceDrop && !isDealClosure) {
        await sendPriceDropNotification(
          existing,
          priceDropped ? oldSalePrice : oldRentPrice,
          priceDropped ? currentSalePrice : currentRentPrice,
          priceDropped ? "SALE" : "RENT",
        );
      }
    }

    revalidatePath("/protected/properties");
    revalidatePath(`/protected/properties/${id}`);
    return { success: true, propertyId: id, slug: seoData.slug };
  } catch (err) {
    return authzFail(err);
  }
}

/**
 * Update property status
 */
export async function updatePropertyStatusAction(input: {
  id: string;
  status: PropertyStatus;
}): Promise<UpdatePropertyStatusResult> {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!input?.id || !UUID_RE.test(input.id)) {
      return { success: false, message: "รูปแบบรหัสทรัพย์ไม่ถูกต้อง" };
    }

    if (!PROPERTY_STATUS_ENUM.includes(input.status)) {
      return { success: false, message: "สถานะไม่ถูกต้อง" };
    }

    //ดึงข้อมูลเดิมก่อนอัปเดตเพื่อใช้แจ้งเตือน
    const { data: existing } = await supabase
      .from("properties")
      .select("id, title, status, listing_type")
      .eq("id", input.id)
      .single();

    const { error } = await supabase
      .from("properties")
      .update({
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (error) {
      return { success: false, message: error.message };
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
      await sendStatusUpdateNotification(existing, input.status);
    }

    // protected pages
    revalidatePath("/protected/properties");
    revalidatePath(`/protected/properties/${input.id}`);

    // public pages ที่อาจแสดงเฉพาะ ACTIVE
    revalidatePath("/");
    revalidatePath("/properties");

    return { success: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "อัปเดตสถานะไม่สำเร็จ";
    return { success: false, message: msg };
  }
}
