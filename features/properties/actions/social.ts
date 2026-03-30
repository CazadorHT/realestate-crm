"use server";

import { revalidatePath } from "next/cache";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { logAudit } from "@/lib/audit";
import { postToMetaPage } from "@/lib/meta";
import { getSiteSettings } from "@/features/site-settings/actions";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";

/**
 * Helper function for formatting prices consistently
 */
const formatPrice = (p: any) => {
  if (p === null || p === undefined) return "";
  const num = Number(p);
  return isNaN(num) ? p.toString() : num.toLocaleString();
};

/**
 * Render social template with property data
 */
export async function renderPropertySocialTemplate(template: string, property: any, lang: string) {
  if (!template) return "";
  if (!property) return template;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const publicUrl = `${baseUrl}/properties/${property.slug || property.id || ""}`;

  const tSale = lang === "th" ? "ขาย" : lang === "en" ? "Sale" : "售价";
  const tRent = lang === "th" ? "เช่า" : lang === "en" ? "Rent" : "租金";
  const tBaht = lang === "th" ? "บาท" : lang === "en" ? "THB" : "泰铢";
  const tPerMonth = lang === "th" ? "/เดือน" : lang === "en" ? "/mo" : "/月";

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

  const primaryAgent = property.property_agents?.[0]?.profiles || {};
  const tTitle = (lang === "th" ? property.title : (property as any)[`title_${lang}`]) || property.title || "";
  const tDescription = (lang === "th" ? property.description : (property as any)[`description_${lang}`]) || property.description || "";
  
  // Use same logic as PropertyCard for consistent localization
  const tPopularArea = getLocaleValue(property, "popular_area", lang);
  const tProvince = getProvinceName(property.province || "", lang);
  const tLocation = [tPopularArea, tProvince].filter(Boolean).join(lang === "th" ? " " : ", ");
  
  const PROPERTY_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: { CONDO: "คอนโด", HOUSE: "บ้าน", TOWNHOUSE: "ทาวน์เฮ้าส์", LAND: "ที่ดิน", COMMERCIAL: "อาคารพาณิชย์", OFFICE: "ออฟฟิศ", WAREHOUSE: "โกดัง" },
    en: { CONDO: "Condo", HOUSE: "House", TOWNHOUSE: "Townhouse", LAND: "Land", COMMERCIAL: "Commercial", OFFICE: "Office", WAREHOUSE: "Warehouse" },
    cn: { CONDO: "公寓", HOUSE: "别墅", TOWNHOUSE: "联排别墅", LAND: "土地", COMMERCIAL: "商用楼", OFFICE: "办公室", WAREHOUSE: "仓库" }
  };
  const tPropertyType = PROPERTY_TYPE_LABELS[lang]?.[property.property_type] || property.property_type || "";

  const LISTING_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: { SALE: "ขาย", RENT: "ให้เช่า", SALE_AND_RENT: "ขาย/เช่า" },
    en: { SALE: "Sale", RENT: "Rent", SALE_AND_RENT: "Sale/Rent" },
    cn: { SALE: "出售", RENT: "出租", SALE_AND_RENT: "出售/出租" }
  };
  const tListingType = LISTING_TYPE_LABELS[lang]?.[property.listing_type] || property.listing_type || "";

  const tAmenities = (property as any).property_features
    ?.map((f: any) => {
      const name = (lang === "th" ? f.features?.name : (f.features?.[`name_${lang}`])) || f.features?.name;
      return name ? `- ${name}` : null;
    })
    .filter(Boolean)
    .join("\n") || "-";

  const nearbyPlaces = (property.nearby_places as any[] || [])
    ?.map((p: any) => p.name ? `- ${p.name}${p.distance ? ` (${p.distance})` : ""}` : null)
    .filter(Boolean)
    .slice(0, 5)
    .join("\n") || "-";

  const nearbyTransits = (property.nearby_transits as any[] || [])
    ?.map((p: any) => p.name ? `- ${p.name}${p.distance ? ` (${p.distance})` : ""}` : null)
    .filter(Boolean)
    .join("\n") || "-";

  const closestTransitName = (lang === "th" ? property.transit_station_name : (property as any)[`transit_station_name_${lang}`]) || property.transit_station_name || "";
  const closestTransit = closestTransitName ? `${property.transit_type || ""} ${closestTransitName} (${property.transit_distance_meters || "0"}m.)` : "-";

  const formatDetails = () => {
    const parts = [
      property.bedrooms ? (lang === "th" ? `${property.bedrooms} ห้องนอน` : lang === "en" ? `${property.bedrooms} Bed` : `${property.bedrooms} 卧室`) : null,
      property.bathrooms ? (lang === "th" ? `${property.bathrooms} ห้องน้ำ` : lang === "en" ? `${property.bathrooms} Bath` : `${property.bathrooms} 浴室`) : null,
      property.size_sqm ? `${property.size_sqm} ${lang === "th" ? "ตร.ม." : "Sqm"}` : null,
      property.floor ? (lang === "th" ? `ชั้น ${property.floor}` : lang === "en" ? `Floor ${property.floor}` : `${property.floor} 层`) : null,
    ];
    return parts.filter(Boolean).join(" | ") || "-";
  };

  const formatSaleTag = (price: number, original?: number) => {
    const pStr = formatPrice(price);
    const oStr = original ? formatPrice(original) : "";
    if (original && original > price) {
      const pct = Math.round(((original - price) / original) * 100);
      return lang === "th" 
        ? `🔥 ลดพิเศษ! ${pStr} ${tBaht} (จาก ${oStr} - ลด ${pct}%)`
        : lang === "en"
          ? `🔥 Hot Deal! ${pStr} ${tBaht} (Was ${oStr} - ${pct}% OFF)`
          : `🔥 特价! ${pStr} ${tBaht} (原价 ${oStr} - 优惠 ${pct}%)`;
    }
    return lang === "th" ? `ราคาขาย: ${pStr} ${tBaht}` : lang === "en" ? `Sale Price: ${pStr} ${tBaht}` : `售价: ${pStr} ${tBaht}`;
  };

  const formatRentTag = (price: number, original?: number) => {
    const pStr = formatPrice(price);
    const oStr = original ? formatPrice(original) : "";
    if (original && original > price) {
      const pct = Math.round(((original - price) / original) * 100);
      return lang === "th"
        ? `🔥 ดีลดี! เช่า ${pStr} ${tBaht}${tPerMonth} (จาก ${oStr} - ลด ${pct}%)`
        : lang === "en"
          ? `🔥 Great Deal! Rent ${pStr} ${tBaht}${tPerMonth} (Was ${oStr} - ${pct}% OFF)`
          : `🔥 优选! 租金 ${pStr} ${tBaht}${tPerMonth} (原价 ${oStr} - 优惠 ${pct}%)`;
    }
    return lang === "th" ? `ค่าเช่า: ${pStr} ${tBaht}${tPerMonth}` : lang === "en" ? `Rent: ${pStr} ${tBaht}${tPerMonth}` : `租金: ${pStr} ${tBaht}${tPerMonth}`;
  };

  let priceTag = "";
  const contactPrice = lang === "th" ? "ติดต่อสอบถามราคา" : lang === "en" ? "Contact for Price" : "联系咨询价格";

  // Robust price extraction (matches website behavior)
  const actualPrice = property.price || property.price_per_sqm * (property.size_sqm || 0) || 0;
  const actualRentPrice = property.rental_price || property.rent_price_per_sqm * (property.size_sqm || 0) || 0;

  if (property.listing_type === "SALE_AND_RENT") {
    const parts = [];
    if (actualPrice) parts.push(formatSaleTag(actualPrice, property.original_price));
    if (actualRentPrice) parts.push(formatRentTag(actualRentPrice, property.original_rental_price));
    priceTag = parts.length > 0 ? parts.join("\n") : contactPrice;
  } else if (property.listing_type === "RENT") {
    const finalPrice = actualRentPrice || actualPrice;
    priceTag = finalPrice 
      ? formatRentTag(finalPrice, property.original_rental_price) 
      : (lang === "th" ? "ติดต่อสอบถามราคาเช่า" : lang === "en" ? "Contact for Rent" : "联系咨询租金");
  } else {
    const finalPrice = actualPrice || actualRentPrice;
    priceTag = finalPrice 
      ? formatSaleTag(finalPrice, property.original_price) 
      : (lang === "th" ? "ติดต่อสอบถามราคาขาย" : lang === "en" ? "Contact for Sale" : "联系咨询售价");
  }

  return template
    .replace(/{{title}}/g, tTitle)
    .replace(/{{description}}/g, tDescription)
    .replace(/{{price}}/g, priceText)
    .replace(/{{original_price}}/g, priceText)
    .replace(/{{sale_price}}/g, property.price ? `${formatPrice(property.price)} ${tBaht}` : "")
    .replace(/{{rental_price}}/g, property.rental_price ? `${formatPrice(property.rental_price)} ${tBaht}${tPerMonth}` : "")
    .replace(/{{original_sale_price}}/g, property.original_price ? `${formatPrice(property.original_price)} ${tBaht}` : "")
    .replace(/{{original_rental_price}}/g, property.original_rental_price ? `${formatPrice(property.original_rental_price)} ${tBaht}${tPerMonth}` : "")
    .replace(/{{price_tag}}/g, priceTag)
    .replace(/{{details}}/g, formatDetails())
    .replace(/{{location}}/g, tLocation)
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
    .replace(/{{verified}}/g, property.verified ? "Verified" : "")
    .replace(/{{exclusive}}/g, property.is_exclusive ? "Exclusive" : "")
    .replace(/{{link}}/g, publicUrl)
    .replace(/{{agent_name}}/g, primaryAgent.full_name || "")
    .replace(/{{agent_phone}}/g, primaryAgent.phone || "")
    .replace(/{{agent_line}}/g, primaryAgent.line_id || "");
}

/**
 * Get social content data for posting
 */
export async function getPropertySocialContent(
  propertyId: string,
  lang: "th" | "en" | "cn" = "th",
  platform?: "FACEBOOK" | "INSTAGRAM" | "LINE" | "TIKTOK",
) {
  const { supabase } = await requireAuthContext();

  // 1. Fetch property data
  const { data: property, error: propError } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images ( image_url ),
      property_agents ( profiles ( full_name, phone, line_id ) ),
      property_features ( features ( name, name_en, name_cn, icon_key ) )
    `,
    )
    .eq("id", propertyId)
    .single();

  if (propError || !property) {
    throw new Error("Property not found");
  }

  const settings = await getSiteSettings();
  
  const isLine = platform === "LINE";
  const isTikTok = platform === "TIKTOK";
  const isFacebook = platform === "FACEBOOK";
  const isInstagram = platform === "INSTAGRAM";
  
  const isTikTokConnected = !!settings.tiktok_auth_token;
  const isFacebookConnected = !!settings.meta_page_access_token;
  const isInstagramConnected = !!settings.meta_page_access_token; // Assuming Meta token covers both
  const isLineConnected = !!(process.env.LINE_CHANNEL_ACCESS_TOKEN || settings.line_channel_access_token);

  const isConnected = isTikTok 
    ? isTikTokConnected 
    : isLine 
      ? isLineConnected 
      : isFacebook 
        ? isFacebookConnected 
        : isInstagram 
          ? isInstagramConnected 
          : false;

  // 2. Fetch integration metadata
  let identity: { display_name?: string; avatar_url?: string } = {};

  if (isTikTok && settings.tiktok_auth_token) {
    identity = {
      display_name: settings.tiktok_auth_token.display_name,
      avatar_url: settings.tiktok_auth_token.avatar_url,
    };
  } else if (isLine && isLineConnected) {
    const { getLineBotInfo } = await import("@/lib/line");
    const botInfo = await getLineBotInfo();
    if (botInfo) {
      identity = {
        display_name: botInfo.displayName,
        avatar_url: botInfo.pictureUrl,
      };
    }
  } else if ((isFacebook || isInstagram) && settings.meta_page_name) {
    identity = {
      display_name: settings.meta_page_name,
    };
  }

  let template = "";
  if (isLine) {
    template = lang === "th" ? settings.line_post_template || "" : lang === "en" ? settings.line_post_template_en || "" : settings.line_post_template_cn || "";
  } else if (isTikTok) {
    template = lang === "th" ? settings.tiktok_post_template || "" : lang === "en" ? settings.tiktok_post_template_en || "" : settings.tiktok_post_template_cn || "";
  } else if (isInstagram) {
    template = lang === "th" ? settings.instagram_post_template || "" : lang === "en" ? settings.instagram_post_template_en || "" : settings.instagram_post_template_cn || "";
  } else {
    // Default to Facebook for Meta platforms or fallback
    template = lang === "th" ? settings.facebook_post_template || "" : lang === "en" ? settings.facebook_post_template_en || "" : settings.facebook_post_template_cn || "";
  }

  const templates = {
    th: isLine ? settings.line_post_template : isTikTok ? settings.tiktok_post_template : isInstagram ? settings.instagram_post_template : settings.facebook_post_template,
    en: isLine ? settings.line_post_template_en : isTikTok ? settings.tiktok_post_template_en : isInstagram ? settings.instagram_post_template_en : settings.facebook_post_template_en,
    cn: isLine ? settings.line_post_template_cn : isTikTok ? settings.tiktok_post_template_cn : isInstagram ? settings.instagram_post_template_cn : settings.facebook_post_template_cn
  };

  const tSale = lang === "th" ? "Sale (TH)" : lang === "en" ? "Sale" : "Sale (CN)";
  const tRent = lang === "th" ? "Rent (TH)" : lang === "en" ? "Rent" : "Rent (CN)";
  const tBaht = lang === "th" ? "Baht" : lang === "en" ? "THB" : "Baht";
  const tPerMonth = lang === "th" ? "/mo" : lang === "en" ? "/mo" : "/mo";

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

  const tTitle = (lang === "th" ? property.title : (property as any)[`title_${lang}`]) || property.title || "";
  const tDistrict = (lang === "th" ? property.district : (property as any)[`district_${lang}`]) || property.district || "";
  const tProvince = (lang === "th" ? property.province : (property as any)[`province_${lang}`]) || property.province || "";
  
  const PROPERTY_TYPE_LABELS: Record<string, Record<string, string>> = {
    th: { CONDO: "Condo", HOUSE: "House", TOWNHOUSE: "Townhouse", LAND: "Land", COMMERCIAL: "Commercial", OFFICE: "Office", WAREHOUSE: "Warehouse" },
    en: { CONDO: "Condo", HOUSE: "House", TOWNHOUSE: "Townhouse", LAND: "Land", COMMERCIAL: "Commercial", OFFICE: "Office", WAREHOUSE: "Warehouse" },
    cn: { CONDO: "Condo", HOUSE: "House", TOWNHOUSE: "Townhouse", LAND: "Land", COMMERCIAL: "Commercial", OFFICE: "Office", WAREHOUSE: "Warehouse" }
  };
  const tPropertyType = PROPERTY_TYPE_LABELS[lang]?.[property.property_type] || property.property_type;

  const content = await renderPropertySocialTemplate(template, property, lang);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const images = property.property_images?.map((img: any) => {
    const url = img.image_url;
    if (!url) return null;
    if (url.startsWith("http")) return url;
    // Fallback for relative paths in Supabase (Hardened against double slashes)
    const baseUrl = supabaseUrl?.replace(/\/$/, "");
    return `${baseUrl}/storage/v1/object/public/property-images/${url}`;
  }).filter(Boolean) as string[] || [];

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
    listingType_label: property.listing_type === "SALE" ? tSale : property.listing_type === "RENT" ? tRent : "Sale/Rent",
    isExclusive: property.is_exclusive,
    verified: property.verified,
    isConnected,
    identity
  };
}

/**
 * Post property to Meta (Facebook/Instagram)
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

    const { data: property, error: propError } = await supabase
      .from("properties")
      .select(`*, property_images(image_url), property_agents(profiles(*)), property_features(features(*))`)
      .eq("id", propertyId)
      .single();

    if (propError || !property) throw new Error("ไม่พบข้อมูลอสังหาริมทรัพย์");

    const contentData = await getPropertySocialContent(propertyId, lang, platform);
    const images = contentData.images;

    const finalContent = customContent 
      ? await renderPropertySocialTemplate(customContent, property, lang)
      : contentData.content;

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
 
      return { success: true, message: `โพสต์ไปที่ ${platform} สำเร็จแล้ว`, data: result.data };
     } else {
       return { success: false, message: `ข้อผิดพลาด: ${result.error}` };
     }
  } catch (err) {
    console.error("postPropertyToMetaAction error:", err);
    return { success: false, message: "เกิดข้อผิดพลาดในการเชื่อมต่อ" };
  }
}
