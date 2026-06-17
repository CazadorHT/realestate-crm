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
export async function generateMetaCatalogFeed() {
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
      ),
      assigned_agent:identities_v3!properties_core_assigned_to_fkey (
        display_name,
        phone
      )
    `,
    )
    .eq("status", 1) // 1 = ACTIVE
    .limit(500);

  if (error) throw error;

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

    const title = (titleObj.th ||
      titleObj.en ||
      titleObj.default ||
      "Untitled") as string;
    const description = (descObj.th ||
      descObj.en ||
      descObj.default ||
      title) as string;
    const slug = (metaObj.slug as string) || p.id;
    const propertyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-crm.com"}/properties/${slug}`;

    const originalSalePrice = (pricingObj.original_price as number) || null;
    const originalRentalPrice =
      (pricingObj.original_rental_price as number) || null;

    xml += `  <listing>\n`;

    // --- REQUIRED FIELDS ---
    xml += `    <home_listing_id>${p.id}</home_listing_id>\n`;
    xml += `    <name><![CDATA[${title}]]></name>\n`;
    xml += `    <description><![CDATA[${description}]]></description>\n`;
    xml += `    <url>${propertyUrl}</url>\n`;

    // Listing Type (Meta accepted: for_sale_by_agent, for_rent_by_agent, for_sale_by_owner, for_rent_by_owner)
    // V3 listing_type: 0=SALE, 1=RENT, 2=SALE_AND_RENT
    const listingTypeInt = p.listing_type;
    let listingType =
      listingTypeInt === 1 ? "for_rent_by_agent" : "for_sale_by_agent";
    let currentPrice = listingTypeInt === 1 ? p.rent_price : p.sale_price;
    let originalPrice =
      listingTypeInt === 1 ? originalRentalPrice : originalSalePrice;

    // If SALE_AND_RENT (2) but sale price is missing, use rental price
    if (listingTypeInt === 2 && !currentPrice && p.rent_price) {
      listingType = "for_rent_by_agent";
      currentPrice = p.rent_price;
      originalPrice = originalRentalPrice;
    }

    xml += `    <listing_type>${listingType}</listing_type>\n`;

    // Availability (Meta accepted: for_sale, for_rent, recently_sold)
    xml += `    <availability>${listingTypeInt === 1 ? "for_rent" : "for_sale"}</availability>\n`;

    // Property Type (Meta accepted: apartment, condo, house, land, manufactured, other, townhouse)
    xml += `    <property_type>${mapMetaPropertyType(p.property_type)}</property_type>\n`;

    // Price (format: "AMOUNT CURRENCY", e.g. "5000000 THB")
    if (currentPrice) {
      if (originalPrice && originalPrice > currentPrice) {
        xml += `    <price>${originalPrice} THB</price>\n`;
        xml += `    <sale_price>${currentPrice} THB</sale_price>\n`;
      } else {
        xml += `    <price>${currentPrice} THB</price>\n`;
      }
    }

    // Images — Provide both flat <image_url> and nested <image><url> blocks for maximum compatibility
    const images = p.media || [];
    if (images.length > 0) {
      xml += `    <image_url><![CDATA[${images[0].url}]]></image_url>\n`;
    }
    images.slice(0, 20).forEach((img) => {
      if (img.url) {
        xml += `    <image>\n      <url><![CDATA[${img.url}]]></url>\n    </image>\n`;
      }
    });

    // --- ADDRESS (Meta Home Listing format="simple" is REQUIRED) ---
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
    const isFullyFurnished = amenitiesObj.is_fully_furnished as
      | boolean
      | undefined;
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

    // --- CUSTOM LABELS (for Product Set targeting in Ads) ---
    let statusLabel = p.verified ? "Verified" : "";
    if (p.is_exclusive)
      statusLabel = statusLabel ? `${statusLabel} | Exclusive` : "Exclusive";
    if (p.co_broker_id)
      statusLabel = statusLabel ? `${statusLabel} | Co-Agent` : "Co-Agent";
    if (statusLabel) {
      xml += `    <custom_label_0><![CDATA[${statusLabel}]]></custom_label_0>\n`;
    }

    const hasDiscount =
      originalPrice && currentPrice && originalPrice > currentPrice;
    xml += `    <custom_label_1>${hasDiscount ? "Hot Deal" : "New Listing"}</custom_label_1>\n`;

    const nearTransit = transitObj.near_transit as boolean | undefined;
    let highlightLabel = nearTransit ? "Near Transit" : "";
    if (isPetFriendly)
      highlightLabel = highlightLabel
        ? `${highlightLabel} | Pet Friendly`
        : "Pet Friendly";
    if (highlightLabel) {
      xml += `    <custom_label_2><![CDATA[${highlightLabel}]]></custom_label_2>\n`;
    }

    const cluster = `${mapMetaPropertyType(p.property_type)} ${listingTypeInt === 1 ? "Rent" : "Sale"}`;
    xml += `    <custom_label_3><![CDATA[${cluster}]]></custom_label_3>\n`;

    if (agentName) {
      xml += `    <custom_label_4><![CDATA[Agent: ${agentName}]]></custom_label_4>\n`;
    }

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
