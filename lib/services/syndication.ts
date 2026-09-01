import { createPublicClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/features/properties/image-utils";

/**
 * Generates an XML feed for LivingInsider
 * Based on their standard XML format requirement.
 */
export async function generateLivingInsiderXML() {
  const supabase = createPublicClient();

  // Fetch active properties joined with syndication status
  const { data: properties, error } = await supabase
    .from("properties")
    .select(
      `
      id, title, description, property_type, listing_type,
      price, rental_price, province, district, subdistrict,
      size_sqm, bedrooms, bathrooms, images, updated_at
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

    // Images (routed via Cloudflare CDN to eliminate Supabase Storage Egress)
    const images: any[] = Array.isArray(p.images) ? (p.images as any[]) : [];
    if (images.length > 0) {
      xml += `    <images>\n`;
      images.slice(0, 8).forEach((img: any) => {
        const rawUrl = typeof img === "string" ? img : img.url;
        const cdnUrl = getPublicImageUrl(rawUrl);
        if (cdnUrl) {
          xml += `      <image>${cdnUrl}</image>\n`;
        }
      });
      xml += `    </images>\n`;
    }

    xml += `    <last_updated>${new Date(p.updated_at || Date.now()).toISOString()}</last_updated>\n`;
    xml += `  </property>\n`;
  }

  xml += `</livinginsider>`;
  return xml;
}
