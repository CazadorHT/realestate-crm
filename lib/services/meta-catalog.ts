import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generates an XML feed for Meta Real Estate Catalog
 * Ref: https://www.facebook.com/business/help/127303027877345
 */
export async function generateMetaCatalogFeed() {
  const supabase = createAdminClient();

  // Fetch active properties
  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images(image_url, is_cover)
    `,
    )
    .eq("status", "ACTIVE")
    .limit(500);

  if (error) throw error;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<listings>\n`;
  xml += `  <title>Real Estate CRM Catalog</title>\n`;
  xml += `  <link>${process.env.NEXT_PUBLIC_APP_URL || "https://your-crm.com"}</link>\n`;

  for (const p of properties || []) {
    const propertyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://your-crm.com"}/properties/${p.slug}`;

    xml += `  <listing>\n`;
    xml += `    <listing_id>${p.id}</listing_id>\n`;
    xml += `    <name><![CDATA[${p.title}]]></name>\n`;
    xml += `    <description><![CDATA[${p.description || p.title}]]></description>\n`;
    xml += `    <property_type>${mapMetaPropertyType(p.property_type)}</property_type>\n`;
    xml += `    <listing_type>${p.listing_type === "RENT" ? "for_rent" : "for_sale"}</listing_type>\n`;

    // Price
    const priceValue = p.listing_type === "RENT" ? p.rental_price : p.price;
    if (priceValue) {
      xml += `    <price>${priceValue} THB</price>\n`;
    }

    // Address
    xml += `    <address format="simple">\n`;
    xml += `      <component name="addr1"><![CDATA[${p.address_line1 || ""}]]></component>\n`;
    xml += `      <component name="city"><![CDATA[${p.district || ""}]]></component>\n`;
    xml += `      <component name="region"><![CDATA[${p.province || ""}]]></component>\n`;
    xml += `      <component name="country">Thailand</component>\n`;
    xml += `      <component name="postal_code">${p.postal_code || ""}</component>\n`;
    xml += `    </address>\n`;

    // Images
    const images = p.property_images || [];
    if (images.length > 0) {
      images.forEach((img: any, idx: number) => {
        if (idx < 10) {
          // Meta limit
          xml += `    <image>\n`;
          xml += `      <url>${img.image_url}</url>\n`;
          xml += `    </image>\n`;
        }
      });
    }

    xml += `    <url>${propertyUrl}</url>\n`;
    xml += `    <availability>for_sale</availability>\n`;
    xml += `    <num_bedrooms>${p.bedrooms || 0}</num_bedrooms>\n`;
    xml += `    <num_bathrooms>${p.bathrooms || 0}</num_bathrooms>\n`;
    xml += `    <area_unit>sqm</area_unit>\n`;
    xml += `    <area_value>${p.size_sqm || 0}</area_value>\n`;
    xml += `  </listing>\n`;
  }

  xml += `</listings>`;
  return xml;
}

function mapMetaPropertyType(type: string): string {
  const mapping: Record<string, string> = {
    CONDO: "condominium",
    HOUSE: "house",
    TOWNHOME: "townhouse",
    LAND: "land",
    VILLA: "house",
    POOL_VILLA: "house",
    OFFICE_BUILDING: "commercial",
    COMMERCIAL_BUILDING: "commercial",
    WAREHOUSE: "other",
    OTHER: "other",
  };
  return mapping[type] || "other";
}
