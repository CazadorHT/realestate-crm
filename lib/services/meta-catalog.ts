import { createPublicClient } from "@/lib/supabase/server";
import { Database, Json } from "../database.types.generated";
import { siteConfig } from "@/lib/site-config";
import { decrypt } from "@/lib/crypto";
import { getPublicImageUrl } from "@/features/properties/image-utils";

/**
 * Generates an XML feed for Meta Real Estate Catalog directly from V3 Core tables
 * Field names follow Meta's official spec exactly:
 * Ref: https://www.facebook.com/business/help/127303027877345
 * Ref: https://developers.facebook.com/docs/marketing-api/catalog/reference/
 */
import { unstable_cache } from "next/cache";

async function fetchAndBuildCatalog() {
  const supabase = createPublicClient();

  // Filter properties active and updated within the last 60 days (2 months) for fresh inventory
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch active properties directly from V3 Core tables
  // Completely eliminates select(*) to save bandwidth and reduce payload size
  const { data: propertiesData, error } = await supabase
    .from("properties_core")
    .select(
      `
      id,
      listing_type,
      property_type,
      sale_price,
      rent_price,
      bedrooms,
      bathrooms,
      floor_area,
      verified,
      is_exclusive,
      co_broker_id,
      project_id,
      updated_at,
      project:projects!properties_core_project_id_fkey (
        id,
        name,
        developer
      ),
      details:properties_details!properties_details_property_id_fkey (
        title,
        description,
        address_info,
        amenities,
        pricing_details,
        meta_data,
        transit_info
      ),
      media:property_media_v3!property_media_v3_property_id_fkey (
        url,
        is_cover
      )
    `,
    )
    .eq("status", 1) // 1 = ACTIVE
    .gte("updated_at", sixtyDaysAgo)
    .order("updated_at", { ascending: false })
    .limit(300);

  if (error) throw error;
  return buildMetaCatalogXml(propertiesData || []);
}

const getCachedMetaCatalogFeed = unstable_cache(
  fetchAndBuildCatalog,
  ["meta-catalog-feed-v1"],
  { revalidate: 86400, tags: ["meta-catalog-feed"] }
);

export async function generateMetaCatalogFeed(forceRefresh = false) {
  if (forceRefresh) {
    return fetchAndBuildCatalog();
  }
  return getCachedMetaCatalogFeed();
}

function buildMetaCatalogXml(propertiesData: any[]) {

  type PropertyFeedRow = {
    id: string;
    listing_type: number;
    property_type: number;
    sale_price: number | null;
    rent_price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    floor_area: number | null;
    verified: boolean | null;
    is_exclusive: boolean | null;
    co_broker_id: string | null;
    project_id: string | null;
    project: {
      id: string;
      name: Json;
      developer: string | null;
    } | null;
    details: {
      title: Json;
      description: Json | null;
      address_info: Json | null;
      amenities: Json | null;
      pricing_details: Json | null;
      meta_data: Json | null;
      transit_info: Json | null;
    } | null;
    media: Array<{
      url: string;
      is_cover: boolean | null;
    }>;
    assigned_agent: {
      display_name: string | null;
      phone: string | null;
    } | null;
  };

  const rows = (propertiesData || []) as PropertyFeedRow[];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<listings>\n`;
  xml += `  <title>${siteConfig.name} Catalog</title>\n`;
  xml += `  <link>${process.env.NEXT_PUBLIC_APP_URL || "https://your-crm.com"}</link>\n`;

  for (const p of rows) {
    const details = p.details;
    const titleObj = (details?.title as Record<string, unknown>) || {};
    const descObj = (details?.description as Record<string, unknown>) || {};
    const addrObj = (details?.address_info as Record<string, unknown>) || {};
    const amenitiesObj = (details?.amenities as Record<string, unknown>) || {};
    const pricingObj =
      (details?.pricing_details as Record<string, unknown>) || {};
    const metaObj = (details?.meta_data as Record<string, unknown>) || {};
    const transitObj = (details?.transit_info as Record<string, unknown>) || {};

    // --- LEAN GUARD: Skip properties without images (waste ad budget) ---
    const rawCoverImage = p.media?.find(m => m.is_cover)?.url || p.media?.[0]?.url;
    if (!rawCoverImage) continue;
    const coverImage = getPublicImageUrl(rawCoverImage);

    // --- PROJECT RESOLUTION ---
    const project = p.project;
    const projNameObj = (project?.name as Record<string, unknown>) || {};
    const projNameTh = typeof project?.name === "string" ? project.name : (projNameObj.th as string || "");
    const projNameEn = typeof project?.name === "string" ? "" : (projNameObj.en as string || "");
    const projectName = projNameTh || projNameEn;
    const projectDeveloper = project?.developer;

    let title = (titleObj.th ||
      titleObj.en ||
      titleObj.default ||
      "Untitled") as string;

    // Smart Append: Include project name in title if not already present
    if (projectName) {
      const lowerTitle = title.toLowerCase();
      const alreadyHas =
        (projNameTh && lowerTitle.includes(projNameTh.toLowerCase())) ||
        (projNameEn && lowerTitle.includes(projNameEn.toLowerCase()));
      if (!alreadyHas) {
        title = `${title} | โครงการ ${projectName}`;
      }
    }

    const rawDescription = (descObj.th ||
      descObj.en ||
      descObj.default ||
      title) as string;

    let description = stripHtml(rawDescription);

    if (projectName && !description.includes(projectName)) {
      description = `โครงการ: ${projectName}${projectDeveloper ? ` (${projectDeveloper})` : ""}\n\n${description}`;
    }
    const slug = (metaObj.slug as string) || p.id;
    const propertyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-crm.com"}/properties/${slug}`;

    const originalSalePrice = (pricingObj.original_price as number) || null;
    const originalRentalPrice =
      (pricingObj.original_rental_price as number) || null;

    type ListingMode = {
      id: string;
      mode: "sale" | "rent";
      listingType: string;
      availability: string;
      currentPrice: number;
      originalPrice: number | null;
      hasDiscount: boolean;
      title: string;
      priceBand: string;
      modeTh: string;
    };

    const modesToGenerate: ListingMode[] = [];

    const hasSale = (p.listing_type === 0 || p.listing_type === 2) && Boolean(p.sale_price && p.sale_price > 0);
    const hasRent = (p.listing_type === 1 || p.listing_type === 2) && Boolean(p.rent_price && p.rent_price > 0);
    const isBoth = hasSale && hasRent;

    if (hasSale) {
      const price = p.sale_price!;
      const orig = originalSalePrice;
      const disc = Boolean(orig && orig > price);
      let pb = "";
      if (price < 3000000) pb = "ขายต่ำกว่า 3 ล้าน";
      else if (price < 10000000) pb = "ขาย 3-10 ล้าน";
      else if (price < 30000000) pb = "ขาย 10-30 ล้าน";
      else pb = "ขาย 30 ล้าน+";

      modesToGenerate.push({
        id: isBoth ? `${p.id}-sale` : p.id,
        mode: "sale",
        listingType: "for_sale_by_agent",
        availability: "for_sale",
        currentPrice: price,
        originalPrice: orig,
        hasDiscount: disc,
        title: isBoth ? formatTitleForMode(title, "sale") : title,
        priceBand: pb,
        modeTh: "ขาย",
      });
    }

    if (hasRent) {
      const price = p.rent_price!;
      const orig = originalRentalPrice;
      const disc = Boolean(orig && orig > price);
      let pb = "";
      if (price < 15000) pb = "เช่าต่ำกว่า 15,000";
      else if (price < 30000) pb = "เช่า 15,000-30,000";
      else if (price < 80000) pb = "เช่า 30,000-80,000";
      else pb = "เช่า 80,000+";

      modesToGenerate.push({
        id: isBoth ? `${p.id}-rent` : p.id,
        mode: "rent",
        listingType: "for_rent_by_agent",
        availability: "for_rent",
        currentPrice: price,
        originalPrice: orig,
        hasDiscount: disc,
        title: isBoth ? formatTitleForMode(title, "rent") : title,
        priceBand: pb,
        modeTh: "ให้เช่า",
      });
    }

    // Fallback: If neither hasSale nor hasRent matched via flags, but there is any price:
    if (modesToGenerate.length === 0) {
      if (p.rent_price && p.rent_price > 0) {
        modesToGenerate.push({
          id: p.id,
          mode: "rent",
          listingType: "for_rent_by_agent",
          availability: "for_rent",
          currentPrice: p.rent_price,
          originalPrice: originalRentalPrice,
          hasDiscount: Boolean(originalRentalPrice && originalRentalPrice > p.rent_price),
          title: title,
          priceBand: p.rent_price < 30000 ? "เช่า 15,000-30,000" : "เช่า 30,000+",
          modeTh: "ให้เช่า",
        });
      } else if (p.sale_price && p.sale_price > 0) {
        modesToGenerate.push({
          id: p.id,
          mode: "sale",
          listingType: "for_sale_by_agent",
          availability: "for_sale",
          currentPrice: p.sale_price,
          originalPrice: originalSalePrice,
          hasDiscount: Boolean(originalSalePrice && originalSalePrice > p.sale_price),
          title: title,
          priceBand: "ขาย",
          modeTh: "ขาย",
        });
      }
    }

    // --- LEAN GUARD: Skip properties without price (Meta rejects them) ---
    if (modesToGenerate.length === 0) continue;

    for (const item of modesToGenerate) {
      xml += `  <listing>\n`;

      // --- REQUIRED FIELDS ---
      xml += `    <home_listing_id>${item.id}</home_listing_id>\n`;
      xml += `    <name><![CDATA[${item.title}]]></name>\n`;
      xml += `    <description><![CDATA[${description}]]></description>\n`;
      xml += `    <url>${propertyUrl}${item.mode === "rent" && isBoth ? "?action=rent" : ""}</url>\n`;

      xml += `    <listing_type>${item.listingType}</listing_type>\n`;
      xml += `    <availability>${item.availability}</availability>\n`;
      xml += `    <property_type>${mapMetaPropertyType(p.property_type)}</property_type>\n`;

      // Price
      if (item.hasDiscount && item.originalPrice) {
        xml += `    <price>${item.originalPrice} THB</price>\n`;
        xml += `    <sale_price>${item.currentPrice} THB</sale_price>\n`;
      } else {
        xml += `    <price>${item.currentPrice} THB</price>\n`;
      }

      // Image — Single high-converting Cover Image via <image_url> (optimal for Real Estate Carousel & Product Sets)
      // Routed through Cloudflare CDN (cdn.vccasset.com) to eliminate Supabase Storage Cached Egress
      xml += `    <image_url><![CDATA[${coverImage}]]></image_url>\n`;

      // --- ADDRESS ---
      const addrLine1 = (addrObj.address_line1 as string)?.trim() || "Bangkok";
      const district = (addrObj.district as string)?.trim() || "Bangkok";
      const province = (addrObj.province as string)?.trim() || "Bangkok";

      xml += `    <address format="simple">\n`;
      xml += `      <component name="addr1"><![CDATA[${addrLine1}]]></component>\n`;
      xml += `      <component name="city"><![CDATA[${district}]]></component>\n`;
      xml += `      <component name="region"><![CDATA[${province}]]></component>\n`;
      xml += `      <component name="country">TH</component>\n`;
      xml += `    </address>\n`;

      // --- PROPERTY DETAILS ---
      if (p.bedrooms != null) {
        xml += `    <num_beds>${p.bedrooms}</num_beds>\n`;
      }
      if (p.bathrooms != null) {
        xml += `    <num_baths>${p.bathrooms}</num_baths>\n`;
      }
      if (p.floor_area) {
        xml += `    <area_size>${Math.round(p.floor_area)}</area_size>\n`;
        xml += `    <area_unit>sq_m</area_unit>\n`;
      }
      const floor = metaObj.floor as string | undefined;
      if (floor) {
        xml += `    <floor_size>${floor}</floor_size>\n`;
      }

      // --- AMENITIES (Meta boolean fields) ---
      const isFullyFurnished = amenitiesObj.is_fully_furnished as boolean | undefined;
      if (isFullyFurnished != null) {
        xml += `    <furnish_type>${isFullyFurnished ? "furnished" : "unfurnished"}</furnish_type>\n`;
      }

      const parkingSlots = (amenitiesObj.parking_slots as number) || 0;
      xml += `    <parking_type>${parkingSlots > 0 ? "garage" : "none"}</parking_type>\n`;

      const isPetFriendly = amenitiesObj.is_pet_friendly as boolean | undefined;
      xml += `    <pet_policy>${isPetFriendly ? "all" : "none"}</pet_policy>\n`;

      // --- NEIGHBORHOOD & PROJECT ---
      const popularArea = addrObj.popular_area as string | undefined;
      const neighborhoodVal = projectName
        ? (popularArea ? `${projectName}, ${popularArea}` : projectName)
        : popularArea;
      if (neighborhoodVal) {
        xml += `    <neighborhood><![CDATA[${neighborhoodVal}]]></neighborhood>\n`;
      }

      // Meta Real Estate group_id: Groups all listings in the same housing community / project
      if (p.project_id) {
        xml += `    <group_id>${p.project_id}</group_id>\n`;
      }

      // Google Maps Link
      const googleMapsLink = addrObj.google_maps_link as string | undefined;
      if (googleMapsLink) {
        xml += `    <virtual_tour_url>${googleMapsLink}</virtual_tour_url>\n`;
      }

      // Agent Contact
      const agent = p.assigned_agent;
      const agentName = agent?.display_name;
      const agentPhone = agent?.phone ? decrypt(agent.phone) : null;

      if (agentName) {
        xml += `    <agent_name><![CDATA[${agentName}]]></agent_name>\n`;
      }
      if (agentPhone) {
        xml += `    <agent_phone><![CDATA[${agentPhone}]]></agent_phone>\n`;
      }

      // =====================================================================
      // CUSTOM LABELS — Thai Dynamic Ad Copy Engine (Lean Budget Optimizer)
      // Use in Ads Manager: {{product.custom_label_0}} etc.
      // =====================================================================

      const nearTransit = transitObj.near_transit as boolean | undefined;

      // label_0: ป้ายดึงดูด & SEO Keyword Hook (Search Intent & Advantage+ Catalog Ads)
      // ผสมคำค้นหายอดนิยม (High-Intent SEO Keywords) เพื่อให้ Meta Algorithm จับกลุ่มผู้ค้นหาได้แม่นยำขึ้น
      let hookLabel = "";
      if (item.hasDiscount) {
        hookLabel = "🔥 ราคาพิเศษ Hot Deal";
      } else if (p.is_exclusive) {
        hookLabel = "⭐ สัญญาพิเศษ Exclusive";
      } else if (isPetFriendly) {
        hookLabel = "🐾 เลี้ยงสัตว์ได้ Pet-Friendly";
      } else if (nearTransit) {
        hookLabel = "🚇 ติดรถไฟฟ้า BTS-MRT";
      } else if (isFullyFurnished) {
        hookLabel = "✨ แต่งครบพร้อมอยู่ Ready to Move";
      } else if (p.verified) {
        hookLabel = "✅ ห้องจริงตรงปก Verified";
      } else {
        hookLabel = "💎 ยูนิตคัดพิเศษ New Listing";
      }
      xml += `    <custom_label_0><![CDATA[${hookLabel}]]></custom_label_0>\n`;

      // label_1: ไลฟ์สไตล์ (Lifestyle Tags)
      const lifestyleParts: string[] = [];
      if (nearTransit) lifestyleParts.push("ใกล้รถไฟฟ้า");
      if (isPetFriendly) lifestyleParts.push("เลี้ยงสัตว์ได้");
      if (isFullyFurnished) lifestyleParts.push("แต่งครบพร้อมอยู่");
      const allowAirbnb = amenitiesObj.allow_airbnb as boolean | undefined;
      if (allowAirbnb) lifestyleParts.push("ปล่อย Airbnb ได้");
      xml += `    <custom_label_1><![CDATA[${lifestyleParts.join(" | ") || "คุณภาพจาก VCC"}]]></custom_label_1>\n`;

      // label_2: โครงการ หรือ โซนทำเล (Project / Location Tag)
      const locationTag = (popularArea || district || "Bangkok").replace(/^เขต/, "");
      const clusterTag = projectName || locationTag;
      xml += `    <custom_label_2><![CDATA[${clusterTag}]]></custom_label_2>\n`;

      // label_3: ประเภท + โหมด (Cluster) — ใช้แยก Product Set ขาย vs เช่า ได้ 100%
      const typeNameMap: Record<string, string> = {
        condo: "คอนโด", house: "บ้านเดี่ยว", townhouse: "ทาวน์โฮม",
        land: "ที่ดิน", other: "อสังหาฯ",
      };
      const typeTh = typeNameMap[mapMetaPropertyType(p.property_type)] || "อสังหาฯ";
      xml += `    <custom_label_3><![CDATA[${typeTh}${item.modeTh}]]></custom_label_3>\n`;

      // label_4: ช่วงราคา (Price Band) — ใช้ยิง Lookalike ตาม Budget Segment
      xml += `    <custom_label_4><![CDATA[${item.priceBand}]]></custom_label_4>\n`;

      xml += `  </listing>\n`;
    }
  }

  xml += `</listings>`;
  return xml;
}

/**
 * Maps V3 internal property types to Meta's accepted values:
 * apartment, condo, house, land, manufactured, other, townhouse
 */
function mapMetaPropertyType(typeInt: number): string {
  switch (typeInt) {
    case 1:
      return "condo";
    case 2:
    case 8:
    case 9:
      return "house";
    case 3:
      return "townhouse";
    case 4:
      return "land";
    case 5:
    case 6:
    case 7:
    default:
      return "other";
  }
}

/**
 * Strips HTML tags and decodes basic HTML entities to produce clean plain text
 */
function stripHtml(html: any): string {
  if (!html) return "";
  const inputStr = typeof html === "string" ? html : String(html?.text || html?.value || JSON.stringify(html) || "");
  if (!inputStr) return "";
  
  // 1. Replace block elements/breaks with newlines to preserve readability
  let text = inputStr
    .replace(/<\/p>/g, "\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/li>/g, "\n")
    .replace(/<\/h[1-6]>/g, "\n")
    .replace(/<\/div>/g, "\n");
    
  // 2. Strip all remaining HTML tags
  text = text.replace(/<[^>]*>/g, "");
  
  // 3. Clean up HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 4. Normalize multiple newlines and spaces
  text = text.replace(/\n\s*\n+/g, "\n\n").trim();
  
  return text;
}

/**
 * Adjusts title tags based on whether the listing is for sale or rent
 * e.g. converts "[ขาย/ให้เช่า] พูลวิลล่า" -> "[ขาย] พูลวิลล่า" or "[ให้เช่า] พูลวิลล่า"
 */
function formatTitleForMode(title: string, mode: "sale" | "rent"): string {
  if (mode === "rent") {
    return title
      .replace(/\[\s*(ขาย\s*\/\s*เช่า|ขาย\s*\/\s*ให้เช่า|เช่า\s*\/\s*ขาย)\s*\]/gi, "[ให้เช่า]")
      .replace(/(ขาย\s*\/\s*เช่า|ขาย\s*\/\s*ให้เช่า|เช่า\s*\/\s*ขาย)/gi, "ให้เช่า");
  } else {
    return title
      .replace(/\[\s*(ขาย\s*\/\s*เช่า|ขาย\s*\/\s*ให้เช่า|เช่า\s*\/\s*ขาย)\s*\]/gi, "[ขาย]")
      .replace(/(ขาย\s*\/\s*เช่า|ขาย\s*\/\s*ให้เช่า|เช่า\s*\/\s*ขาย)/gi, "ขาย");
  }
}
