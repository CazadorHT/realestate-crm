import { createAdminClient } from "@/lib/supabase/admin";
import { Database, Json } from "../database.types.generated";
import { siteConfig } from "@/lib/site-config";
import { decrypt } from "@/lib/crypto";

/**
 * Generates an XML feed for Meta Real Estate Catalog directly from V3 Core tables
 * Field names follow Meta's official spec exactly:
 * Ref: https://www.facebook.com/business/help/127303027877345
 * Ref: https://developers.facebook.com/docs/marketing-api/catalog/reference/
 */
import { unstable_cache } from "next/cache";

export async function generateMetaCatalogFeed() {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient();

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
        .limit(500);

      if (error) throw error;
      return buildMetaCatalogXml(propertiesData || []);
    },
    ["meta-catalog-feed-v1"],
    { revalidate: 86400, tags: ["meta-catalog-feed"] }
  )();
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
    const coverImage = p.media?.find(m => m.is_cover)?.url || p.media?.[0]?.url;
    if (!coverImage) continue;

    const title = (titleObj.th ||
      titleObj.en ||
      titleObj.default ||
      "Untitled") as string;
    const rawDescription = (descObj.th ||
      descObj.en ||
      descObj.default ||
      title) as string;
    const description = stripHtml(rawDescription);
    const slug = (metaObj.slug as string) || p.id;
    const propertyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-crm.com"}/properties/${slug}`;

    const originalSalePrice = (pricingObj.original_price as number) || null;
    const originalRentalPrice =
      (pricingObj.original_rental_price as number) || null;

    // --- PRICE LOGIC ---
    const listingTypeInt = p.listing_type;
    let listingType =
      listingTypeInt === 1 ? "for_rent_by_agent" : "for_sale_by_agent";
    let currentPrice = listingTypeInt === 1 ? p.rent_price : p.sale_price;
    let originalPrice =
      listingTypeInt === 1 ? originalRentalPrice : originalSalePrice;

    if (listingTypeInt === 2 && !currentPrice && p.rent_price) {
      listingType = "for_rent_by_agent";
      currentPrice = p.rent_price;
      originalPrice = originalRentalPrice;
    }

    // --- LEAN GUARD: Skip properties without price (Meta rejects them) ---
    if (!currentPrice) continue;

    xml += `  <listing>\n`;

    // --- REQUIRED FIELDS ---
    xml += `    <home_listing_id>${p.id}</home_listing_id>\n`;
    xml += `    <name><![CDATA[${title}]]></name>\n`;
    xml += `    <description><![CDATA[${description}]]></description>\n`;
    xml += `    <url>${propertyUrl}</url>\n`;

    xml += `    <listing_type>${listingType}</listing_type>\n`;
    xml += `    <availability>${listingTypeInt === 1 ? "for_rent" : "for_sale"}</availability>\n`;
    xml += `    <property_type>${mapMetaPropertyType(p.property_type)}</property_type>\n`;

    // Price
    const hasDiscount = originalPrice && currentPrice && originalPrice > currentPrice;
    if (hasDiscount) {
      xml += `    <price>${originalPrice} THB</price>\n`;
      xml += `    <sale_price>${currentPrice} THB</sale_price>\n`;
    } else {
      xml += `    <price>${currentPrice} THB</price>\n`;
    }

    // Images — Cover first via <image_url>, then all via nested <image><url>
    const images = p.media || [];
    xml += `    <image_url><![CDATA[${coverImage}]]></image_url>\n`;
    images.slice(0, 20).forEach((img) => {
      if (img.url) {
        xml += `    <image>\n      <url><![CDATA[${img.url}]]></url>\n    </image>\n`;
      }
    });

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

    // --- NEIGHBORHOOD ---
    const popularArea = addrObj.popular_area as string | undefined;
    if (popularArea) {
      xml += `    <neighborhood><![CDATA[${popularArea}]]></neighborhood>\n`;
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

    // label_0: ป้ายดึงดูด (Attention Hook) — ยัดขึ้นหัวข้อโฆษณาได้เลย
    // ผลลัพธ์: "🔥 Hot Deal", "✅ Verified", "⭐ Exclusive", "🆕 New Listing"
    let hookLabel = "";
    if (hasDiscount) hookLabel = "🔥 Hot Deal";
    else if (p.is_exclusive) hookLabel = "⭐ Exclusive";
    else if (p.verified) hookLabel = "✅ Verified";
    else hookLabel = "🆕 New Listing";
    xml += `    <custom_label_0><![CDATA[${hookLabel}]]></custom_label_0>\n`;

    // label_1: ไลฟ์สไตล์ (Lifestyle Tags) — ใช้ทำ Product Set + Dynamic Caption
    // ผลลัพธ์: "ใกล้รถไฟฟ้า | เลี้ยงสัตว์ได้ | แต่งครบพร้อมอยู่"
    const lifestyleParts: string[] = [];
    if (nearTransit) lifestyleParts.push("ใกล้รถไฟฟ้า");
    if (isPetFriendly) lifestyleParts.push("เลี้ยงสัตว์ได้");
    if (isFullyFurnished) lifestyleParts.push("แต่งครบพร้อมอยู่");
    const allowAirbnb = amenitiesObj.allow_airbnb as boolean | undefined;
    if (allowAirbnb) lifestyleParts.push("ปล่อย Airbnb ได้");
    xml += `    <custom_label_1><![CDATA[${lifestyleParts.join(" | ") || "คุณภาพจาก VCC"}]]></custom_label_1>\n`;

    // label_2: โซน/ทำเลทอง (Location Tag) — ใช้แบ่ง Product Set ตามโซน
    // ผลลัพธ์: "เอกมัย", "บางนา", "สุขุมวิท"
    const locationTag = (popularArea || district || "Bangkok").replace(/^เขต/, "");
    xml += `    <custom_label_2><![CDATA[${locationTag}]]></custom_label_2>\n`;

    // label_3: ประเภท + โหมด (Cluster) — ใช้แยก Product Set ขาย vs เช่า
    // ผลลัพธ์: "คอนโดให้เช่า", "บ้านเดี่ยวขาย"
    const typeNameMap: Record<string, string> = {
      condo: "คอนโด", house: "บ้านเดี่ยว", townhouse: "ทาวน์โฮม",
      land: "ที่ดิน", other: "อสังหาฯ",
    };
    const typeTh = typeNameMap[mapMetaPropertyType(p.property_type)] || "อสังหาฯ";
    const modeTh = listingTypeInt === 1 ? "ให้เช่า" : "ขาย";
    xml += `    <custom_label_3><![CDATA[${typeTh}${modeTh}]]></custom_label_3>\n`;

    // label_4: ช่วงราคา (Price Band) — ใช้ยิง Lookalike ตาม Budget Segment
    // ผลลัพธ์: "ต่ำกว่า 15,000", "15,000-30,000", "30,000-80,000", "80,000+"
    let priceBand = "";
    if (listingTypeInt === 1) {
      // Rent bands (ต่อเดือน)
      if (currentPrice < 15000) priceBand = "เช่าต่ำกว่า 15,000";
      else if (currentPrice < 30000) priceBand = "เช่า 15,000-30,000";
      else if (currentPrice < 80000) priceBand = "เช่า 30,000-80,000";
      else priceBand = "เช่า 80,000+";
    } else {
      // Sale bands
      if (currentPrice < 3000000) priceBand = "ขายต่ำกว่า 3 ล้าน";
      else if (currentPrice < 10000000) priceBand = "ขาย 3-10 ล้าน";
      else if (currentPrice < 30000000) priceBand = "ขาย 10-30 ล้าน";
      else priceBand = "ขาย 30 ล้าน+";
    }
    xml += `    <custom_label_4><![CDATA[${priceBand}]]></custom_label_4>\n`;

    xml += `  </listing>\n`;
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
function stripHtml(html: string): string {
  if (!html) return "";
  
  // 1. Replace block elements/breaks with newlines to preserve readability
  let text = html
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
