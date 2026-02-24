"use server";

import { requireAuthContext, assertStaff, authzFail } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { postToMetaPage } from "@/lib/meta";
import { revalidatePath } from "next/cache";

/**
 * โพสต์ข้อมูลทรัพย์ไปยัง Facebook Page อัตโนมัติ โดยใช้รูปแบบข้อความจากตั้งค่าระบบ
 */
export async function postPropertyToMetaAction(
  propertyId: string,
  platform: "FACEBOOK" | "INSTAGRAM" = "FACEBOOK",
) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    // 1. ดึงข้อมูลทรัพย์ รูปภาพ ข้อมูลเอเจนท์ สิ่งอำนวยความสะดวก และสถานที่ใกล้เคียง
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select(
        `
        *,
        property_images (
          image_url
        ),
        property_agents (
          profiles (
            full_name,
            phone,
            line_id
          )
        ),
        property_features (
          features (
            name,
            icon_key
          )
        )
      `,
      )
      .eq("id", propertyId)
      .single();

    if (propError || !property) {
      return { success: false, message: "ไม่พบข้อมูลทรัพย์" };
    }

    // 2. ดึง Template จาก Site Settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "social_post_template")
      .single();

    let template =
      (settingsData?.value as string) ||
      `🏠 {{title}}\n💰 {{price}}\n\n📍 {{location}}\n\n✨ จุดเด่น:\n{{amenities}}\n\n🚗 สถานที่ใกล้เคียง:\n{{nearby_places}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}`;

    // 3. เตรียมข้อมูลสำหรับ Tags
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const publicUrl = `${baseUrl}/properties/${property.slug || property.id}`;

    // รายการสิ่งอำนวยความสะดวก (Amenities)
    const amenities =
      (property as any).property_features
        ?.map((f: any) => `- ${f.features?.name}`)
        .filter(Boolean)
        .join("\n") || "-";

    // สถานที่ใกล้เคียง (Nearby Places & Transits)
    const nearbyPlaces =
      (property.nearby_places as any[])
        ?.map((p: any) => `- ${p.name} (${p.distance || ""})`)
        .slice(0, 5)
        .join("\n") || "-";

    const nearbyTransits =
      (property.nearby_transits as any[])
        ?.map((p: any) => `- ${p.name} (${p.distance || ""})`)
        .join("\n") || "-";

    // จัดการเรื่องราคา (Smart Price Tag)
    let priceText = "";
    if (property.listing_type === "SALE_AND_RENT") {
      const parts = [];
      if (property.price)
        parts.push(`ขาย ${property.price.toLocaleString()} บาท`);
      if (property.rental_price)
        parts.push(`เช่า ${property.rental_price.toLocaleString()} บาท/เดือน`);
      priceText = parts.join(" | ");
    } else if (property.listing_type === "RENT") {
      priceText = property.rental_price
        ? `${property.rental_price.toLocaleString()} บาท/เดือน`
        : "";
    } else {
      priceText = property.price
        ? `${property.price.toLocaleString()} บาท`
        : "";
    }

    let originalPriceText = "";
    if (property.listing_type === "SALE_AND_RENT") {
      const parts = [];
      if (property.original_price)
        parts.push(`ขาย ${property.original_price.toLocaleString()} บาท`);
      if (property.original_rental_price)
        parts.push(
          `เช่า ${property.original_rental_price.toLocaleString()} บาท/เดือน`,
        );
      originalPriceText = parts.join(" | ");
    } else if (property.listing_type === "RENT") {
      originalPriceText = property.original_rental_price
        ? `${property.original_rental_price.toLocaleString()} บาท/เดือน`
        : "";
    } else {
      originalPriceText = property.original_price
        ? `${property.original_price.toLocaleString()} บาท`
        : "";
    }

    // Granular Price Tags (Fallback to empty string instead of "-")
    const salePrice = property.price
      ? `${property.price.toLocaleString()} บาท`
      : "";
    const rentPrice = property.rental_price
      ? `${property.rental_price.toLocaleString()} บาท/เดือน`
      : "";
    const originalSalePrice = property.original_price
      ? `${property.original_price.toLocaleString()} บาท`
      : "";
    const originalRentPrice = property.original_rental_price
      ? `${property.original_rental_price.toLocaleString()} บาท/เดือน`
      : "";

    // ข้อมูลเอเจนท์ (คนแรกที่เจอ)
    const primaryAgent = property.property_agents?.[0]?.profiles;

    // 4. แทนที่ Tags ใน Template
    let content = template
      .replace(/{{title}}/g, property.title || "")
      .replace(/{{description}}/g, property.description || "")
      .replace(/{{price}}/g, priceText)
      .replace(/{{original_price}}/g, originalPriceText)
      .replace(/{{sale_price}}/g, salePrice)
      .replace(/{{rental_price}}/g, rentPrice)
      .replace(/{{original_sale_price}}/g, originalSalePrice)
      .replace(/{{original_rental_price}}/g, originalRentPrice)
      .replace(/{{bedrooms}}/g, property.bedrooms?.toString() || "-")
      .replace(/{{bathrooms}}/g, property.bathrooms?.toString() || "-")
      .replace(/{{size_sqm}}/g, property.size_sqm?.toString() || "-")
      .replace(/{{floor}}/g, property.floor?.toString() || "-")
      .replace(/{{property_type}}/g, property.property_type || "")
      .replace(
        /{{listing_type}}/g,
        property.listing_type === "SALE"
          ? "ขาย"
          : property.listing_type === "RENT"
            ? "ให้เช่า"
            : "ขาย/เช่า",
      )
      .replace(
        /{{location}}/g,
        `${property.district || ""} ${property.province || ""}`.trim(),
      )
      .replace(/{{popular_area}}/g, property.popular_area || "-")
      .replace(/{{amenities}}/g, amenities)
      .replace(/{{nearby_places}}/g, nearbyPlaces)
      .replace(/{{near_transit}}/g, nearbyTransits)
      .replace(
        /{{transit}}/g, // Keep for backward compatibility
        property.transit_station_name
          ? `${property.transit_station_name} (${property.transit_distance_meters || 0} ม.)`
          : "-",
      )
      .replace(/{{verified}}/g, property.verified ? "✅ ตรวจสอบแล้ว" : "")
      .replace(/{{exclusive}}/g, property.is_exclusive ? "💎 Exclusive" : "")
      .replace(/{{google_maps}}/g, property.google_maps_link || "")
      .replace(/{{link}}/g, publicUrl)
      .replace(/{{agent_name}}/g, primaryAgent?.full_name || "")
      .replace(/{{agent_phone}}/g, primaryAgent?.phone || "")
      .replace(/{{agent_line}}/g, primaryAgent?.line_id || "");

    // ดึงรูปภาพทั้งหมด (สูงสุด 20 รูปตามที่ Meta กำหนด)
    const images =
      property.property_images
        ?.map((img: any) => img.image_url)
        .filter(Boolean) || [];

    // 5. ส่งข้อมูลไปยัง Meta Graph API
    const result = await postToMetaPage(content, images, platform);

    if (result.success) {
      await logAudit(
        { supabase, user, role },
        {
          action: "property.social_post",
          entity: "properties",
          entityId: propertyId,
          metadata: { platform, post_id: result.data?.id },
        },
      );

      // 6. บันทึก Timestamp ลงในตาราง properties
      const updateField =
        platform === "FACEBOOK"
          ? "posted_to_facebook_at"
          : "posted_to_instagram_at";

      await supabase
        .from("properties")
        .update({ [updateField]: new Date().toISOString() })
        .eq("id", propertyId);

      revalidatePath("/(protected)/protected/properties", "page");

      return { success: true, message: `โพสต์ไปยัง ${platform} สำเร็จ` };
    } else {
      return { success: false, message: `เกิดข้อผิดพลาด: ${result.error}` };
    }
  } catch (err) {
    console.error("postPropertyToMetaAction → error:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ" };
  }
}
