import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generates an XML feed for LivingInsider
 * Based on their standard XML format requirement.
 */
export async function generateLivingInsiderXML() {
  const supabase = createAdminClient();

  // Fetch active properties joined with syndication status
  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_syndication!left(*)
    `,
    )
    .eq("status", "ACTIVE")
    .limit(100);

  if (error) throw error;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<livinginsider>\n`;

  for (const p of properties || []) {
    // Only include if explicitly enabled for LivingInsider or if we want to sync all active by default
    // For now, let's include all ACTIVE ones as a demo

    xml += `  <property>\n`;
    xml += `    <external_id>${p.id}</external_id>\n`;
    xml += `    <title><![CDATA[${p.title}]]></title>\n`;
    xml += `    <description><![CDATA[${p.description || ""}]]></description>\n`;
    xml += `    <property_type>${p.property_type}</property_type>\n`;
    xml += `    <listing_type>${p.listing_type}</listing_type>\n`;
    xml += `    <price>${p.price || p.rental_price || 0}</price>\n`;
    xml += `    <province>${p.province || ""}</province>\n`;
    xml += `    <district>${p.district || ""}</district>\n`;
    xml += `    <subdistrict>${p.subdistrict || ""}</subdistrict>\n`;
    xml += `    <size_sqm>${p.size_sqm || 0}</size_sqm>\n`;
    xml += `    <bedrooms>${p.bedrooms || 0}</bedrooms>\n`;
    xml += `    <bathrooms>${p.bathrooms || 0}</bathrooms>\n`;

    // Images
    const images = Array.isArray(p.images) ? p.images : [];
    if (images.length > 0) {
      xml += `    <images>\n`;
      images.forEach((img: any) => {
        const url = typeof img === "string" ? img : img.url;
        xml += `      <image>${url}</image>\n`;
      });
      xml += `    </images>\n`;
    }

    xml += `    <last_updated>${new Date(p.updated_at).toISOString()}</last_updated>\n`;
    xml += `  </property>\n`;
  }

  xml += `</livinginsider>`;
  return xml;
}
