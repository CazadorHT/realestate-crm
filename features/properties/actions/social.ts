"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { postToMetaPage } from "@/lib/meta";
import { getSiteSettings } from "@/features/site-settings/actions";

/**
 * ดึงข้อมูลเนื้อหาสำหรับโพสต์โซเชี่ยว โดยประมวลผลจาก Template ในการตั้งค่า
 */
export async function getPropertySocialContent(
  propertyId: string,
  lang: "th" | "en" | "cn" = "th",
) {
  const { supabase } = await requireAuthContext();

  // 1. ดึงข้อมูลทรัพย์สิน
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
          name_en,
          name_cn,
          icon_key
        )
      )
    `,
    )
    .eq("id", propertyId)
    .single();

  if (propError || !property) {
    throw new Error("ไม่พบข้อมูลทรัพย์สิน");
  }

  // 2. ดึง Templates จาก Site Settings
  const settings = await getSiteSettings();
  
  const social_post_template = settings.social_post_template || "";
  const social_post_template_en = settings.social_post_template_en || "";
  const social_post_template_cn = settings.social_post_template_cn || "";

  let template: string = (lang === "en" ? social_post_template_en : lang === "cn" ? social_post_template_cn : social_post_template);

  const templates = {
    th: social_post_template || "",
    en: social_post_template_en || "",
    cn: social_post_template_cn || ""
  };

  // 3. เตรียมข้อมูล
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const publicUrl = `${baseUrl}/properties/${property.slug || property.id}`;

  const amenities = (property as any).property_features
    ?.map((f: any) => `- ${f.features?.name}`)
    .filter(Boolean)
    .join("\n") || "-";

  const nearbyPlaces = (property.nearby_places as any[])
    ?.map((p: any) => `- ${p.name} (${p.distance || ""})`)
    .slice(0, 5)
    .join("\n") || "-";

  const nearbyTransits = (property.nearby_transits as any[])
    ?.map((p: any) => `- ${p.name} (${p.distance || ""})`)
    .join("\n") || "-";

  const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : "出售";
  const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : "出租";
  const tBaht = lang === "th" ? "บาท" : lang === "en" ? "THB" : "泰铢";
  const tPerMonth = lang === "th" ? "/เดือน" : lang === "en" ? "/mo" : "/月";

  const formatPrice = (p: any) => {
    if (p === null || p === undefined) return "";
    const num = Number(p);
    return isNaN(num) ? p.toString() : num.toLocaleString();
  };

  let priceText = "";
  if (property.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (property.price) parts.push(`${tSale} ${formatPrice(property.price)} ${tBaht}`);
    if (property.rental_price) parts.push(`${tRent} ${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}`);
    priceText = parts.join(" | ");
  } else if (property.listing_type === "RENT") {
    priceText = property.rental_price ? `${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}` : "";
  } else {
    priceText = property.price ? `${formatPrice(property.price)} ${tBaht}` : "";
  }

  const primaryAgent = property.property_agents?.[0]?.profiles;

  // 4. เตรียมข้อความแปล (Localization)
  const tTitle = (lang === "th" ? property.title : (property as any)[`title_${lang}`]) || property.title || "";
  const tDescription = (lang === "th" ? property.description : (property as any)[`description_${lang}`]) || property.description || "";
  const tDistrict = (lang === "th" ? property.district : (property as any)[`district_${lang}`]) || property.district || "";
  const tProvince = (lang === "th" ? property.province : (property as any)[`province_${lang}`]) || property.province || "";
  
  // แปลประเภททรัพย์
  const PROPERTY_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: { CONDO: "คอนโด", HOUSE: "บ้านเดี่ยว", TOWNHOUSE: "ทาวน์เฮ้าส์", LAND: "ที่ดิน", COMMERCIAL: "อาคารพาณิชย์", OFFICE: "สำนักงาน", WAREHOUSE: "โกดัง" },
    en: { CONDO: "Condo", HOUSE: "House", TOWNHOUSE: "Townhouse", LAND: "Land", COMMERCIAL: "Commercial", OFFICE: "Office", WAREHOUSE: "Warehouse" },
    cn: { CONDO: "公寓", HOUSE: "别墅", TOWNHOUSE: "联排别墅", LAND: "土地", COMMERCIAL: "商业", OFFICE: "办公室", WAREHOUSE: "仓库" }
  };
  const tPropertyType = PROPERTY_TYPE_LABELS[lang]?.[property.property_type] || property.property_type;

  const tAmenities = (property as any).property_features
    ?.map((f: any) => {
      const name = (lang === "th" ? f.features?.name : (f.features?.[`name_${lang}`])) || f.features?.name;
      return `- ${name}`;
    })
    .filter(Boolean)
    .join("\n") || "-";

  // 5. แทนที่ Tags
  const content = renderSocialTemplate(template, property, lang);
  const images = property.property_images?.map((img: any) => img.image_url).filter(Boolean) || [];

  return { 
    content, 
    template,
    templates, 
    images, 
    title: tTitle,
    priceDisplay: priceText,
    location: `${tDistrict} ${tProvince}`.trim(),
    propertyType: tPropertyType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    size_sqm: property.size_sqm,
    land_size_sqwah: property.land_size_sqwah,
    listingType: property.listing_type,
    listingType_label: property.listing_type === "SALE" ? tSale : property.listing_type === "RENT" ? tRent : (lang === "th" ? "ขาย/เช่า" : lang === "en" ? "Sale/Rent" : "出售/出租"),
    isExclusive: property.is_exclusive,
    verified: property.verified
  };
}

/**
 * Helper function สำหรับ Render Template ด้วยข้อมูลทรัพย์สิน
 */
export function renderSocialTemplate(template: string, property: any, lang: "th" | "en" | "cn") {
  if (!template) return "";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const publicUrl = `${baseUrl}/properties/${property.slug || property.id}`;

  const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : "出售";
  const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : "出租";
  const tBaht = lang === "th" ? "บาท" : lang === "en" ? "THB" : "泰铢";
  const tPerMonth = lang === "th" ? "/เดือน" : lang === "en" ? "/mo" : "/月";

  const formatPrice = (p: any) => {
    if (p === null || p === undefined) return "";
    const num = Number(p);
    return isNaN(num) ? p.toString() : num.toLocaleString();
  };

  let priceText = "";
  if (property.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (property.price) parts.push(`${tSale} ${formatPrice(property.price)} ${tBaht}`);
    if (property.rental_price) parts.push(`${tRent} ${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}`);
    priceText = parts.join(" | ");
  } else if (property.listing_type === "RENT") {
    priceText = property.rental_price ? `${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}` : "";
  } else {
    priceText = property.price ? `${formatPrice(property.price)} ${tBaht}` : "";
  }

  const primaryAgent = property.property_agents?.[0]?.profiles;
  const tTitle = (lang === "th" ? property.title : (property as any)[`title_${lang}`]) || property.title || "";
  const tDescription = (lang === "th" ? property.description : (property as any)[`description_${lang}`]) || property.description || "";
  const tDistrict = (lang === "th" ? property.district : (property as any)[`district_${lang}`]) || property.district || "";
  const tProvince = (lang === "th" ? property.province : (property as any)[`province_${lang}`]) || property.province || "";
  const tPopularArea = (lang === "th" ? property.popular_area : (property as any)[`popular_area_${lang}`]) || property.popular_area || "";
  
  const PROPERTY_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: { CONDO: "คอนโด", HOUSE: "บ้านเดี่ยว", TOWNHOUSE: "ทาวน์เฮ้าส์", LAND: "ที่ดิน", COMMERCIAL: "อาคารพาณิชย์", OFFICE: "สำนักงาน", WAREHOUSE: "โกดัง" },
    en: { CONDO: "Condo", HOUSE: "House", TOWNHOUSE: "Townhouse", LAND: "Land", COMMERCIAL: "Commercial", OFFICE: "Office", WAREHOUSE: "Warehouse" },
    cn: { CONDO: "公寓", HOUSE: "别墅", TOWNHOUSE: "联排别墅", LAND: "土地", COMMERCIAL: "商业", OFFICE: "办公室", WAREHOUSE: "仓库" }
  };
  const tPropertyType = PROPERTY_TYPE_LABELS[lang]?.[property.property_type] || property.property_type;

  const LISTING_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: { SALE: "ขาย", RENT: "เช่า", SALE_AND_RENT: "ขาย/เช่า" },
    en: { SALE: "Sale", RENT: "Rent", SALE_AND_RENT: "Sale/Rent" },
    cn: { SALE: "出售", RENT: "出租", SALE_AND_RENT: "出售/出租" }
  };
  const tListingType = LISTING_TYPE_LABELS[lang]?.[property.listing_type] || property.listing_type;

  const tAmenities = (property as any).property_features
    ?.map((f: any) => {
      const name = (lang === "th" ? f.features?.name : (f.features?.[`name_${lang}`])) || f.features?.name;
      return `- ${name}`;
    })
    .filter(Boolean)
    .join("\n") || "-";

  const nearbyPlaces = (property.nearby_places as any[] || [])
    ?.map((p: any) => `- ${p.name} (${p.distance || ""})`)
    .slice(0, 5)
    .join("\n") || "-";

  const nearbyTransits = (property.nearby_transits as any[] || [])
    ?.map((p: any) => `- ${p.name} (${p.distance || ""})`)
    .join("\n") || "-";

  const closestTransitName = (lang === "th" ? property.transit_station_name : (property as any)[`transit_station_name_${lang}`]) || property.transit_station_name || "";
  const closestTransit = closestTransitName ? `${property.transit_type || ""} ${closestTransitName} (${property.transit_distance_meters || "0"}m.)` : "-";

  return template
    .replace(/{{title}}/g, tTitle)
    .replace(/{{description}}/g, tDescription)
    .replace(/{{price}}/g, priceText)
    .replace(/{{original_price}}/g, priceText) // Summary of original
    .replace(/{{sale_price}}/g, property.price ? `${formatPrice(property.price)} ${tBaht}` : "")
    .replace(/{{rental_price}}/g, property.rental_price ? `${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}` : "")
    .replace(/{{original_sale_price}}/g, property.original_price ? `${formatPrice(property.original_price)} ${tBaht}` : "")
    .replace(/{{original_rental_price}}/g, property.original_rental_price ? `${formatPrice(property.original_rental_price)} ${tBaht}${tPerMonth}` : "")
    .replace(/{{location}}/g, `${tDistrict} ${tProvince}`.trim())
    .replace(/{{popular_area}}/g, tPopularArea)
    .replace(/{{amenities}}/g, tAmenities)
    .replace(/{{nearby_places}}/g, nearbyPlaces)
    .replace(/{{near_transit}}/g, nearbyTransits)
    .replace(/{{transit}}/g, closestTransit)
    .replace(/{{google_maps}}/g, property.google_maps_link || "")
    .replace(/{{property_type}}/g, tPropertyType)
    .replace(/{{listing_type}}/g, tListingType)
    .replace(/{{bedrooms}}/g, property.bedrooms?.toString() || "0")
    .replace(/{{bathrooms}}/g, property.bathrooms?.toString() || "0")
    .replace(/{{size_sqm}}/g, property.size_sqm?.toString() || "0")
    .replace(/{{floor}}/g, property.floor?.toString() || "-")
    .replace(/{{verified}}/g, property.verified ? "✅ ตรวจสอบแล้ว" : "")
    .replace(/{{exclusive}}/g, property.is_exclusive ? "🌟 Exclusive" : "")
    .replace(/{{link}}/g, publicUrl)
    .replace(/{{agent_name}}/g, primaryAgent?.full_name || "")
    .replace(/{{agent_phone}}/g, primaryAgent?.phone || "")
    .replace(/{{agent_line}}/g, primaryAgent?.line_id || "");
}

/**
 * โพสต์ไปยัง Meta (Facebook/Instagram)
 */
export async function postPropertyToMetaAction(
  propertyId: string,
  platform: "FACEBOOK" | "INSTAGRAM" = "FACEBOOK",
  customContent?: string,
  lang: "th" | "en" | "cn" = "th",
) {
  try {
    const { supabase, user, role } = await requireAuthContext();
    assertStaff(role);

    // 4. ดึงข้อมูลทรัพย์เพื่อใช้ Render Tags (ถ้ามี)
    const { data: property, error: propError } = await supabase
      .from("properties")
      .select(`*, property_images(image_url), property_agents(profiles(*)), property_features(features(*))`)
      .eq("id", propertyId)
      .single();

    if (propError || !property) throw new Error("ไม่พบข้อมูลทรัพย์สิน");

    const contentData = await getPropertySocialContent(propertyId, lang);
    const images = contentData.images;

    // หากมีการแก้ไขข้อความ (customContent) ให้ลอง Render Tags ใหม่
    const finalContent = customContent 
      ? renderSocialTemplate(customContent, property, lang)
      : contentData.content;

    // 5. ส่งข้อมูลไปยัง Meta Graph API
    const result = await postToMetaPage(finalContent, images, platform);

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

      const updateField = platform === "FACEBOOK" ? "posted_to_facebook_at" : "posted_to_instagram_at";
      await supabase.from("properties").update({ [updateField]: new Date().toISOString() }).eq("id", propertyId);

      revalidatePath("/(protected)/protected/properties", "page");
 
      return { success: true, message: `โพสต์ไปยัง ${platform} สำเร็จ`, data: result.data };
     } else {
       return { success: false, message: `เกิดข้อผิดพลาด: ${result.error}` };
     }
  } catch (err) {
    console.error("postPropertyToMetaAction → error:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ" };
  }
}
