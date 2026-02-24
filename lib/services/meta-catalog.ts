import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generates an XML feed for Meta Real Estate Catalog
 * Field names follow Meta's official spec exactly:
 * Ref: https://www.facebook.com/business/help/127303027877345
 * Ref: https://developers.facebook.com/docs/marketing-api/catalog/reference/
 */
export async function generateMetaCatalogFeed() {
  const supabase = createAdminClient();

  // Fetch active properties
  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images(image_url, is_cover),
      assigned_agent:profiles!properties_assigned_to_profile_fkey (
        full_name,
        phone
      )
    `,
    )
    .eq("status", "ACTIVE")
    .limit(500);

  if (error) throw error;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<listings>\n`;
  xml += `  <title>VC Connect Asset Catalog</title>\n`;
  xml += `  <link>${process.env.NEXT_PUBLIC_APP_URL || "https://your-crm.com"}</link>\n`;

  for (const p of properties || []) {
    const propertyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-crm.com"}/properties/${p.slug}`;

    xml += `  <listing>\n`;

    // --- REQUIRED FIELDS ---
    xml += `    <home_listing_id>${p.id}</home_listing_id>\n`;
    xml += `    <name><![CDATA[${p.title}]]></name>\n`;
    xml += `    <description><![CDATA[${p.description || p.title}]]></description>\n`;
    xml += `    <url>${propertyUrl}</url>\n`;

    // Listing Type (Meta accepted: for_sale_by_agent, for_rent_by_agent, for_sale_by_owner, for_rent_by_owner)
    let listingType =
      p.listing_type === "RENT" ? "for_rent_by_agent" : "for_sale_by_agent";
    let currentPrice = p.listing_type === "RENT" ? p.rental_price : p.price;
    let originalPrice =
      p.listing_type === "RENT" ? p.original_rental_price : p.original_price;

    // If SALE_AND_RENT but sale price is missing, use rental price
    if (p.listing_type === "SALE_AND_RENT" && !currentPrice && p.rental_price) {
      listingType = "for_rent_by_agent";
      currentPrice = p.rental_price;
      originalPrice = p.original_rental_price;
    }

    xml += `    <listing_type>${listingType}</listing_type>\n`;

    // Availability (Meta accepted: for_sale, for_rent, recently_sold)
    xml += `    <availability>${p.listing_type === "RENT" ? "for_rent" : "for_sale"}</availability>\n`;

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

    // Images — XML uses nested <image> blocks (not CSV bracket notation)
    const images = p.property_images || [];
    images.slice(0, 20).forEach((img: any) => {
      if (img.image_url) {
        xml += `    <image>\n      <url>${img.image_url}</url>\n    </image>\n`;
      }
    });

    // --- ADDRESS (Meta uses flat fields, not nested) ---
    // Address — Meta XML uses nested <address> block with components
    xml += `    <address>\n`;
    xml += `      <component name="addr1"><![CDATA[${p.address_line1 || ""}]]></component>\n`;
    xml += `      <component name="city"><![CDATA[${p.district || ""}]]></component>\n`;
    xml += `      <component name="region"><![CDATA[${p.province || ""}]]></component>\n`;
    xml += `      <component name="country">TH</component>\n`;
    xml += `    </address>\n`;

    // Geo-coordinates (highly recommended for map display)

    // --- PROPERTY DETAILS ---
    if (p.bedrooms != null) {
      xml += `    <num_beds>${p.bedrooms}</num_beds>\n`;
    }
    if (p.bathrooms != null) {
      xml += `    <num_baths>${p.bathrooms}</num_baths>\n`;
    }
    if (p.size_sqm) {
      xml += `    <area_size>${p.size_sqm}</area_size>\n`;
      xml += `    <area_unit>sq_m</area_unit>\n`;
    }
    if (p.floor) {
      xml += `    <floor_size>${p.floor}</floor_size>\n`;
    }

    // --- AMENITIES (Meta boolean fields) ---
    // furnish_type: "furnished", "semi-furnished", "unfurnished"
    if (p.is_fully_furnished != null) {
      xml += `    <furnish_type>${p.is_fully_furnished ? "furnished" : "unfurnished"}</furnish_type>\n`;
    }

    // Parking (Meta accepted: "garage", "street", "no_parking")
    // parking_type: "garage", "street", "off-street", "other", "none"
    xml += `    <parking_type>${p.parking_slots && p.parking_slots > 0 ? "garage" : "none"}</parking_type>\n`;

    // Pet policy (Meta accepted: "allowed", "not_allowed", "negotiable")
    // pet_policy: "all", "cat", "dog", "none"
    xml += `    <pet_policy>${p.is_pet_friendly ? "all" : "none"}</pet_policy>\n`;

    // --- NEIGHBORHOOD ---
    if (p.popular_area) {
      xml += `    <neighborhood><![CDATA[${p.popular_area}]]></neighborhood>\n`;
    }

    // Google Maps Link
    if (p.google_maps_link) {
      xml += `    <virtual_tour_url>${p.google_maps_link}</virtual_tour_url>\n`;
    }

    // Agent Contact
    const agent = (p as any).assigned_agent;
    if (agent?.full_name) {
      xml += `    <agent_name><![CDATA[${agent.full_name}]]></agent_name>\n`;
    }
    if (agent?.phone) {
      xml += `    <agent_phone><![CDATA[${agent.phone}]]></agent_phone>\n`;
    }

    // --- CUSTOM LABELS (for Product Set targeting in Ads) ---
    // custom_label_0 → Trust badges
    let statusLabel = p.verified ? "Verified" : "";
    if (p.is_exclusive)
      statusLabel = statusLabel ? `${statusLabel} | Exclusive` : "Exclusive";
    if (p.is_co_agent)
      statusLabel = statusLabel ? `${statusLabel} | Co-Agent` : "Co-Agent";
    if (statusLabel) {
      xml += `    <custom_label_0><![CDATA[${statusLabel}]]></custom_label_0>\n`;
    }

    // custom_label_1 → Deal urgency
    const hasDiscount =
      originalPrice && currentPrice && originalPrice > currentPrice;
    xml += `    <custom_label_1>${hasDiscount ? "Hot Deal" : "New Listing"}</custom_label_1>\n`;

    // custom_label_2 → Highlights
    let highlightLabel = p.near_transit ? "Near Transit" : "";
    if (p.is_pet_friendly)
      highlightLabel = highlightLabel
        ? `${highlightLabel} | Pet Friendly`
        : "Pet Friendly";
    if (highlightLabel) {
      xml += `    <custom_label_2><![CDATA[${highlightLabel}]]></custom_label_2>\n`;
    }

    // custom_label_3 → Property cluster
    const cluster = `${mapMetaPropertyType(p.property_type)} ${p.listing_type === "RENT" ? "Rent" : "Sale"}`;
    xml += `    <custom_label_3><![CDATA[${cluster}]]></custom_label_3>\n`;

    // custom_label_4 → Agent name (for targeting by agent)
    if (agent?.full_name) {
      xml += `    <custom_label_4><![CDATA[Agent: ${agent.full_name}]]></custom_label_4>\n`;
    }

    xml += `  </listing>\n`;
  }

  xml += `</listings>`;
  return xml;
}

/**
 * Maps internal property types to Meta's accepted values:
 * apartment, condo, house, land, manufactured, other, townhouse
 */
function mapMetaPropertyType(type: string): string {
  const mapping: Record<string, string> = {
    CONDO: "condo",
    HOUSE: "house",
    TOWNHOME: "townhouse",
    LAND: "land",
    VILLA: "house",
    POOL_VILLA: "house",
    OFFICE_BUILDING: "other",
    COMMERCIAL_BUILDING: "other",
    WAREHOUSE: "other",
    OTHER: "other",
  };
  return mapping[type] || "other";
}
