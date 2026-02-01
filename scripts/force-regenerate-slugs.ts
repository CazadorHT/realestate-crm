import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";

/**
 * EXTREME SEO v4 Slug Generation (Synced with lib/seo-utils.ts)
 */
function generateExtremeSlug(property: any): string {
  const typeMap: Record<string, string> = {
    HOUSE: "บ้านเดี่ยว",
    CONDO: "คอนโด",
    TOWNHOME: "ทาวน์โฮม",
    LAND: "ที่ดิน",
    OFFICE_BUILDING: "อาคารสำนักงานออฟฟิศ",
    COMMERCIAL_BUILDING: "อาคารพาณิชย์",
    WAREHOUSE: "โกดัง",
  };
  const typeLabel = property.property_type
    ? typeMap[property.property_type]
    : "";

  // Calculate special flags
  const is_hot_sale =
    (property.original_price &&
      property.price &&
      property.original_price > property.price) ||
    (property.original_rental_price &&
      property.rental_price &&
      property.original_rental_price > property.rental_price);

  const near_transit = ((property.nearby_transits as any[])?.length || 0) > 0;

  // SEO Keywords mapping
  const seoKeywords = [
    is_hot_sale && "ราคาถูก-ลดราคาพิเศษ",
    near_transit && "ใกล้รถไฟฟ้า",
    property.is_pet_friendly && "เลี้ยงสัตว์ได้",
    property.is_corner_unit && "ห้องมุม",
    property.is_renovated && "รีโนเวทใหม่",
    property.is_fully_furnished && "แต่งครบ-พร้อมอยู่",
    property.is_selling_with_tenant && "พร้อมผู้เช่า-ลงทุนคุ้ม",
    property.is_foreigner_quota && "ต่างชาติซื้อได้",
  ].filter(Boolean);

  // Extract Top 2 Nearby Places (Priority: Transit > Others)
  const nearbyKeywords: string[] = [];
  const allPlaces = [
    ...(property.nearby_transits || []),
    ...(property.nearby_places || []),
  ];
  if (allPlaces.length > 0) {
    const sorted = allPlaces.sort((a, b) => {
      const aName = a.name || "";
      const bName = b.name || "";
      const isTransit = (t: string) =>
        t.includes("BTS") || t.includes("MRT") || t.includes("สายสี");
      if (isTransit(aName) && !isTransit(bName)) return -1;
      if (!isTransit(aName) && isTransit(bName)) return 1;
      return 0;
    });
    sorted.slice(0, 2).forEach((place) => {
      if (place.name) nearbyKeywords.push(`ใกล้-${place.name}`);
    });
  }

  // Extract Top 2 Special Features (from property_features relation)
  const featureKeywords: string[] = [];
  if (property.property_features && property.property_features.length > 0) {
    property.property_features.slice(0, 2).forEach((pf: any) => {
      if (pf.features?.name) featureKeywords.push(pf.features.name);
    });
  }

  const parts = [
    property.title,
    ...featureKeywords,
    ...nearbyKeywords,
    ...seoKeywords,
    property.bedrooms && `${property.bedrooms} นอน`,
    property.bathrooms && `${property.bathrooms} น้ำ`,
    property.size_sqm && `${property.size_sqm} ตรม`,
    typeLabel,
    property.popular_area,
    property.subdistrict,
    property.district,
    property.province,
  ].filter(Boolean);

  const rawString = parts.join(" ");

  // Manual Cleaning: Keep Thai, English, Numbers, Space, Hyphens
  const cleaned = rawString
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s_-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[\s/_]+/g, "-") // Replace spaces and slashes with hyphens
    .replace(/-+/g, "-"); // Remove duplicate hyphens

  // Add random suffix for uniqueness
  const suffix = Date.now().toString(36).slice(-4);
  return `${cleaned.slice(0, 220)}-${suffix}`; // Allowed longer URLs for Extreme SEO
}

async function forceRegenerateSlugs() {
  const supabase = createAdminClient();

  console.log("🔥 Force re-generating ALL slugs with EXTREME SEO v4...\n");

  // Fetch ALL properties with associated data
  const { data: properties, error: fetchError } = await supabase.from(
    "properties",
  ).select(`
      id, title, slug, bedrooms, bathrooms, size_sqm, property_type, district, province, popular_area, subdistrict, 
      original_price, price, original_rental_price, rental_price, nearby_transits, nearby_places,
      is_pet_friendly, is_corner_unit, is_renovated, is_fully_furnished, is_selling_with_tenant, is_foreigner_quota,
      property_features (
        features (
          name
        )
      )
    `);

  if (fetchError) {
    console.error("❌ Error fetching properties:", fetchError);
    return;
  }

  if (!properties || properties.length === 0) {
    console.log("⚠️  No properties found!");
    return;
  }

  console.log(`📊 Found ${properties.length} properties\n`);

  const updates: { id: string; oldSlug: string | null; newSlug: string }[] = [];

  for (const property of properties) {
    let newSlug = generateExtremeSlug(property);
    updates.push({
      id: property.id,
      oldSlug: property.slug,
      newSlug: newSlug,
    });
  }

  console.log("💾 Updating database...\n");
  let successCount = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from("properties")
      .update({ slug: update.newSlug })
      .eq("id", update.id);

    if (error) {
      console.error(`❌ Failed to update ${update.id}:`, error.message);
    } else {
      successCount++;
    }
  }

  console.log(
    `✅ Re-generation complete! Success: ${successCount}/${properties.length}`,
  );
}

forceRegenerateSlugs()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
