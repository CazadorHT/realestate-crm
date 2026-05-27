import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

import { createAdminClient } from "../lib/supabase/admin";

interface FeatureDetail {
  name: string | null;
}

interface PropertyFeature {
  features: FeatureDetail | null;
}

interface Place {
  name?: string | null;
  [key: string]: unknown;
}

interface PropertyForSlug {
  id: string;
  title: string | null;
  title_en: string | null;
  slug: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  property_type: string | null;
  district: string | null;
  district_en?: string | null;
  province: string | null;
  province_en?: string | null;
  popular_area: string | null;
  popular_area_en: string | null;
  subdistrict: string | null;
  subdistrict_en?: string | null;
  original_price: number | null;
  price: number | null;
  original_rental_price: number | null;
  rental_price: number | null;
  nearby_transits: Place[] | null;
  nearby_places: Place[] | null;
  is_pet_friendly: boolean | null;
  is_corner_unit: boolean | null;
  is_renovated: boolean | null;
  is_fully_furnished: boolean | null;
  is_selling_with_tenant: boolean | null;
  is_foreigner_quota: boolean | null;
  is_hot_deal: boolean | null;
  verified: boolean | null;
  amenities: Record<string, any> | string | null;
  property_features: PropertyFeature[] | null;
}

const TRANSLIT_MAP: Record<string, string> = {
  // Actions
  ขายและเช่า: "sale-rent",
  ให้เช่า: "rent",
  ขาย: "sale",
  // Common Property Terms
  ห้องนอน: "bedroom",
  ห้องน้ำ: "bathroom",
  ตรม: "sqm",
  "ตร.ม.": "sqm",
  ตารางเมตร: "sqm",
  เมตร: "m",
  กม: "km",
  กิโลเมตร: "km",
  ชั้น: "floor",
  ที่ดิน: "land",
  บ้านเดี่ยว: "single-house",
  บ้าน: "house",
  คอนโด: "condo",
  อพาร์ทเม้น: "apartment",
  โฮมออฟฟิศ: "home-office",
  อาคารพาณิชย์: "commercial-building",
  ออฟฟิศ: "office",
  สำนักงาน: "office",
  สวย: "prime",
  หรู: "luxury",
  ถูก: "cheap",
  ลดราคา: "sale-off",
  ติดรถไฟฟ้า: "near-transit",
  ใกล้: "near",
  ใหม่: "new",
  พร้อมอยู่: "ready-to-move-in",
  // Locations
  กรุงเทพ: "bangkok",
  กรุงเทพมหานคร: "bangkok",
  ภูเก็ต: "phuket",
  เชียงใหม่: "chiang-mai",
  ชลบุรี: "chonburi",
  พัทยา: "pattaya",
  สมุทรปราการ: "samut-prakan",
  นนทบุรี: "nonthaburi",
  ปทุมธานี: "pathum-thani",
};

function transliterate(text: string): string {
  if (!text) return "";

  // 🔒 เปลี่ยนจาก .replace(/\s+/g, "") เป็นการทำให้ช่องว่างเสถียรแทน เพื่อไม่ให้คำภาษาอังกฤษติดกันเป็นพืด
  let result = text.toLowerCase().trim().replace(/\s+/g, " ");

  const sortedKeys = Object.keys(TRANSLIT_MAP).sort(
    (a, b) => b.length - a.length,
  );

  sortedKeys.forEach((th: string) => {
    // ✅ เปลี่ยนจากสลักเครื่องหมายขีดกลางซ้อน (-คำ-) เป็นการเคาะช่องว่างแทน เพื่อไม่ให้เปลืองสิทธิ์โควตาตอนโดน .slice()
    result = result.replace(new RegExp(th, "g"), ` ${TRANSLIT_MAP[th]} `);
  });

  return result;
}

/**
 * EXTREME SEO v4.3 Slug Generation (100% English & Deterministic)
 */
function generateExtremeSlug(property: PropertyForSlug): string {
  const typeMap: Record<string, string> = {
    HOUSE: "house",
    CONDO: "condo",
    TOWNHOME: "townhome",
    LAND: "land",
    OFFICE_BUILDING: "office-building",
    COMMERCIAL_BUILDING: "commercial-building",
    VILLA: "villa",
    POOL_VILLA: "pool-villa",
    WAREHOUSE: "warehouse",
    OTHER: "property",
  };

  const typeLabel = property.property_type
    ? typeMap[property.property_type] || "property"
    : "property";

  const is_hot_sale =
    (property.original_price !== null &&
      property.price !== null &&
      property.original_price > property.price) ||
    (property.original_rental_price !== null &&
      property.rental_price !== null &&
      property.original_rental_price > property.rental_price);

  const near_transit =
    (Array.isArray(property.nearby_transits)
      ? property.nearby_transits.length
      : 0) > 0;

  let amenities: Record<string, any> = {};
  if (property.amenities) {
    if (typeof property.amenities === "string") {
      try {
        amenities = JSON.parse(property.amenities);
      } catch (e) {
        console.error(
          `❌ Failed to parse amenities JSON string for ID ${property.id}:`,
          e,
        );
      }
    } else if (typeof property.amenities === "object") {
      amenities = property.amenities;
    }
  }

  const has_large_kitchen = amenities.has_large_kitchen === true;
  const has_bar_counter = amenities.has_bar_counter === true;
  const has_bathtub = amenities.has_bathtub === true;
  const has_walk_in_closet = amenities.has_walk_in_closet === true;
  const has_private_garden = amenities.has_private_garden === true;
  const has_garage = amenities.has_garage === true;
  const has_bbq_area = amenities.has_bbq_area === true;
  const has_home_theatre = amenities.has_home_theatre === true;
  const has_private_gym = amenities.has_private_gym === true;
  const has_wine_cellar = amenities.has_wine_cellar === true;

  const seoKeywords = [
    is_hot_sale && "cheap-hot-sale",
    property.is_hot_deal && "hot-deal",
    property.verified && "verified",
    near_transit && "near-transit",
    property.is_pet_friendly && "pet-friendly",
    property.is_corner_unit && "corner-unit",
    property.is_renovated && "renovated",
    property.is_fully_furnished && "fully-furnished",
    property.is_selling_with_tenant && "with-tenant",
    property.is_foreigner_quota && "foreigner-quota",

    has_large_kitchen && "large-kitchen",
    has_bar_counter && "bar-counter",
    has_bathtub && "bathtub",
    has_walk_in_closet && "walk-in-closet",
    has_private_garden && "private-garden",
    has_garage && "garage",
    has_bbq_area && "bbq-area",
    has_home_theatre && "home-theatre",
    has_private_gym && "private-gym",
    has_wine_cellar && "wine-cellar",
  ].filter(Boolean) as string[];

  const nearbyKeywords: string[] = [];
  const allPlaces: Place[] = [
    ...(Array.isArray(property.nearby_transits)
      ? property.nearby_transits
      : []),
    ...(Array.isArray(property.nearby_places) ? property.nearby_places : []),
  ];

  if (allPlaces.length > 0) {
    const sorted = allPlaces.sort((a: Place, b: Place) => {
      const aName = a?.name || "";
      const bName = b?.name || "";
      const isTransit = (t: string) =>
        t.includes("BTS") || t.includes("MRT") || t.includes("สายสี");
      if (isTransit(aName) && !isTransit(bName)) return -1;
      if (!isTransit(aName) && isTransit(bName)) return 1;
      return 0;
    });
    sorted.slice(0, 2).forEach((place: Place) => {
      const nameEn = (place?.name_en || place?.station_name_en) as
        | string
        | undefined;
      const nameTh = (place?.name || place?.station_name) as string | undefined;
      const resolvedName = nameEn || (nameTh ? transliterate(nameTh) : "");
      if (resolvedName) {
        nearbyKeywords.push(`near ${resolvedName}`);
      }
    });
  }

  const featureKeywords: string[] = [];
  if (
    Array.isArray(property.property_features) &&
    property.property_features.length > 0
  ) {
    property.property_features.slice(0, 2).forEach((pf: PropertyFeature) => {
      if (pf?.features?.name) {
        featureKeywords.push(transliterate(pf.features.name));
      }
    });
  }

  const titlePart =
    property.title_en ||
    (property.title
      ? transliterate(property.title)
      : `property-${property.id.substring(0, 8)}`);

  const parts = [
    titlePart,
    ...featureKeywords,
    ...nearbyKeywords,
    ...seoKeywords,
    property.bedrooms !== null && `${property.bedrooms}-bedrooms`,
    property.bathrooms !== null && `${property.bathrooms}-bathrooms`,
    property.size_sqm !== null && `${property.size_sqm}-sqm`,
    typeLabel,
    property.popular_area_en ||
      (property.popular_area ? transliterate(property.popular_area) : null),
    property.subdistrict_en ||
      (property.subdistrict ? transliterate(property.subdistrict) : null),
    property.district_en ||
      (property.district ? transliterate(property.district) : null),
    property.province_en ||
      (property.province ? transliterate(property.province) : null),
  ].filter(Boolean) as string[];

  const rawString = parts.join(" ");

  const cleaned = rawString
    .replace(/[^\x00-\x7F]/g, "") // ล้างอักษรไทยที่หลงเหลือตกสำรวจออกให้หมด
    .replace(/[^a-zA-Z0-9\s_-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[\s/_]+/g, "-") // ยุบ space และ slash ทั้งหมดให้กลายเป็นขีดกลางเส้นเดียว คลีนๆ
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, ""); // ลบขีดกลางที่อาจจะโผล่มาตรงหัวหรือท้ายข้อความออก

  const suffix =
    property.id.split("-").pop()?.slice(-4) || property.id.slice(-4);
  return `${cleaned.slice(0, 180)}-${suffix}`; // หั่นความยาวให้ปลอดภัย ไม่ยาวล้นโควตาแอปโซเชียลมีเดียเวลาดึงไปแสดงผล
}

async function forceRegenerateSlugs() {
  const supabase = createAdminClient();

  console.log("🔥 Force re-generating ALL slugs with EXTREME SEO v4.3...\n");

  const { data, error: fetchError } = await supabase.from("properties").select(`
      id, title, title_en, slug, bedrooms, bathrooms, size_sqm, property_type, 
      district, province, popular_area, popular_area_en, subdistrict, 
      original_price, price, original_rental_price, rental_price, nearby_transits, nearby_places,
      is_pet_friendly, is_corner_unit, is_renovated, is_fully_furnished, is_selling_with_tenant, is_foreigner_quota,
      is_hot_deal, verified, amenities,
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

  const properties = data as unknown as PropertyForSlug[] | null;

  if (!properties || properties.length === 0) {
    console.log("⚠️  No properties found!");
    return;
  }

  console.log(`📊 Found ${properties.length} properties\n`);

  const updates: { id: string; oldSlug: string | null; newSlug: string }[] = [];

  for (const property of properties) {
    const propId = property.id;
    if (!propId) continue;
    const newSlug = generateExtremeSlug(property);
    updates.push({
      id: propId,
      oldSlug: property.slug,
      newSlug: newSlug,
    });
  }

  console.log("💾 Updating database...\n");
  let successCount = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from("properties_core")
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
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
