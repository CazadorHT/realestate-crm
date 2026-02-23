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

    // 1. ดึงข้อมูลทรัพย์ รูปภาพ และข้อมูลเอเจนท์ผู้ดูแล
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
      `🏠 {{title}}\n💰 {{price}}\n\nดูรายละเอียดเพิ่มเติมได้ที่: {{link}}`;

    // 3. เตรียมข้อมูลสำหรับ Tags
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const publicUrl = `${baseUrl}/properties/${property.slug || property.id}`;

    // จัดการเรื่องราคา
    const priceText =
      property.listing_type === "RENT"
        ? property.rental_price
          ? `${property.rental_price.toLocaleString()} บาท/เดือน`
          : ""
        : property.price
          ? `${property.price.toLocaleString()} บาท`
          : "";

    const originalPriceText =
      property.listing_type === "RENT"
        ? property.original_rental_price
          ? `${property.original_rental_price.toLocaleString()} บาท/เดือน`
          : ""
        : property.original_price
          ? `${property.original_price.toLocaleString()} บาท`
          : "";

    // ข้อมูลเอเจนท์ (คนแรกที่เจอ)
    const primaryAgent = property.property_agents?.[0]?.profiles;

    // 4. แทนที่ Tags ใน Template
    let content = template
      .replace(/{{title}}/g, property.title || "")
      .replace(/{{description}}/g, property.description || "")
      .replace(/{{price}}/g, priceText)
      .replace(/{{original_price}}/g, originalPriceText)
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
      .replace(
        /{{transit}}/g,
        property.transit_station_name
          ? `${property.transit_station_name} (${property.transit_distance_meters || 0} ม.)`
          : "-",
      )
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
      return { success: true, message: `โพสต์ไปยัง ${platform} สำเร็จ` };
    } else {
      return { success: false, message: `เกิดข้อผิดพลาด: ${result.error}` };
    }
  } catch (err) {
    console.error("postPropertyToMetaAction → error:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ" };
  }
}
