import { createClient } from "@/lib/supabase/server";
import { Database } from "@/lib/database.types";
import { Json } from "@/lib/database.types.generated";
import { 
  getSafeImages, 
  getCoverImage, 
  getSafeNearbyPlaces, 
  getSafeNearbyTransits 
} from "@/lib/property-hardened-utils";

export type PropertyRow = {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  property_type: Database["public"]["Enums"]["property_type"] | null;
  price: number | null;
  rental_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  parking_slots: number | null;
  floor: number | null;
  created_at: string | null;
  updated_at: string | null;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  address_line1: string | null;
  popular_area: string | null;
  original_price: number | null;
  original_rental_price: number | null;
  verified: boolean | null;
  min_contract_months: number | null;
  meta_keywords: string[] | null;
  near_transit: boolean | null;
  transit_type: string | null;
  transit_station_name: string | null;
  transit_distance_meters: number | null;
  google_maps_link: string | null;
  nearby_places: Json;
  nearby_transits: Json;

  images?: Json | null;
  property_features?: Array<{ features: { id: string; name: string; icon_key: string } | null }> | null;
};


function buildLocation(row: PropertyRow) {
  const parts = [
    row.address_line1,
    row.subdistrict,
    row.district,
    row.province,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export interface ChatbotSearchOptions {
  ids?: string[];
  limit?: number;
  province?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  listingType?: "SALE" | "RENT";
  q?: string;
  bedrooms?: number;
  bathrooms?: number;
  minSize?: number;
  maxSize?: number;
}

/**
 * AI Specialized Search
 * Handles broad synonyms, location normalization, and fuzzy matching.
 */
export async function searchPropertiesForChatbot(
  options: ChatbotSearchOptions = {},
) {
  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select(
      `
      id, slug, title, description, property_type, price, rental_price,
      original_price, original_rental_price, verified, min_contract_months,
      bedrooms, meta_keywords, bathrooms, size_sqm, parking_slots, floor,
      created_at, updated_at, listing_type, popular_area, province, district,
      subdistrict, address_line1,
      images,
      property_features (features (id, name, icon_key)),
      near_transit, transit_type, transit_station_name, transit_distance_meters, google_maps_link,
      nearby_places, nearby_transits
    `,
    )
    .eq("status", "ACTIVE");

  // IDs Filter
  if (options.ids?.length) {
    query = query.in("id", options.ids);
  } else {
    query = query
      .order("created_at", { ascending: false })
      .limit(options.limit || 15);
  }

  // 1. Smart Location Normalization
  if (options.district || options.province) {
    const rawLoc = (options.district || options.province || "").trim();
    if (rawLoc) {
      const noSpace = rawLoc.replace(/\s+/g, "");
      const searchTerms = new Set<string>([rawLoc, noSpace]);
      const mapping: Record<string, string[]> = {
        "พระราม 9": ["Rama 9", "Rama9", "พระราม9", "พระรามเก้า"],
        พระราม9: ["Rama 9", "Rama9", "พระราม 9", "พระรามเก้า"],
        "rama 9": ["พระราม 9", "พระราม9", "Rama9", "พระรามเก้า"],
        rama9: ["พระราม 9", "พระราม9", "Rama 9", "พระรามเก้า"],
        sukhumvit: ["สุขุมวิท"],
        สุขุมวิท: ["Sukhumvit"],
        thonglo: ["ทองหล่อ", "Thong Lo", "Thonglor"],
        thonglor: ["ทองหล่อ", "Thong Lo", "Thonglo"],
        ทองหล่อ: ["Thong Lo", "Thonglor", "Thonglo"],
        ekkamai: ["เอกมัย"],
        เอกมัย: ["Ekkamai"],
        ratchada: ["รัชดา"],
        รัชดา: ["Ratchada"],
        ari: ["อารีย์"],
        อารีย์: ["Ari"],
        sathorn: ["สาทร"],
        สาทร: ["Sathorn"],
        silom: ["สีลม"],
        สีลม: ["Silom"],
        asoke: ["อโศก"],
        อโศก: ["Asoke"],
        // Added BTS/MRT and new popular areas
        bangsue: ["บางซื่อ"],
        บางซื่อ: ["Bangsue"],
        bangna: ["บางนา"],
        บางนา: ["Bangna"],
        "phaya thai": ["พญาไท"],
        พญาไท: ["Phaya Thai"],
        "victory monument": ["อนุสาวรีย์ชัย", "อนุสาวรีย์"],
        อนุสาวรีย์: ["Victory Monument", "อนุสาวรีย์ชัย"],
        siam: ["สยาม"],
        สยาม: ["Siam"],
        "ha yaek lat phrao": ["ห้าแยกลาดพร้าว", "ลาดพร้าว"],
        ลาดพร้าว: ["Lat Phrao", "Latphrao", "ห้าแยกลาดพร้าว"],
      };

      const lowerLoc = rawLoc.toLowerCase();
      if (mapping[lowerLoc])
        mapping[lowerLoc].forEach((t) => searchTerms.add(t));

      const columns = [
        "district",
        "province",
        "popular_area",
        "title",
        "subdistrict",
        "address_line1",
      ];
      const orConditions: string[] = [];
      searchTerms.forEach((term) => {
        const s = `%${term}%`;
        columns.forEach((col) => orConditions.push(`${col}.ilike.${s}`));
      });
      query = query.or(orConditions.join(","));
    }
  }

  // 2. Broad Property Type Synonyms & Postgres Enum Safety
  if (options.propertyType) {
    const type = options.propertyType;
    const synonyms: Record<string, string[]> = {
      OFFICE_BUILDING: [
        "ออฟฟิศ",
        "สำนักงาน",
        "ที่ทำงาน",
        "พื้นที่เช่าทำงาน",
        "Office",
        "Workplace",
        "Co-working space",
        "Service Office",
      ],
      HOUSE: [
        "บ้าน",
        "บ้านเดี่ยว",
        "วิลล่า",
        "บ้านสวน",
        "ที่พักอาศัย",
        "House",
        "Villa",
        "Single House",
      ],
      CONDO: [
        "คอนโด",
        "คอนโดมิเนียม",
        "ห้องชุด",
        "หอพัก",
        "อพาร์ทเม้นท์",
        "แฟลต",
        "ห้องเช่า",
        "Condo",
        "Condominium",
        "Apartment",
        "Room",
        "Studio",
      ],
      TOWNHOME: [
        "ทาวน์โฮม",
        "ทาวน์เฮ้าส์",
        "บ้านแฝด",
        "ทาวน์เฮาส์",
        "Townhome",
        "Townhouse",
      ],
      COMMERCIAL_BUILDING: [
        "ตึกแถว",
        "อาคารพาณิชย์",
        "โฮมออฟฟิศ",
        "ตึกขายของ",
        "หน้าร้าน",
        "อาคารแบ่งเช่า",
        "Commercial Building",
        "Shophouse",
        "Home Office",
      ],
      WAREHOUSE: [
        "โกดัง",
        "โรงงาน",
        "คลังสินค้า",
        "ที่เก็บของ",
        "Warehouse",
        "Factory",
        "Storage",
      ],
      LAND: [
        "ที่ดิน",
        "ที่เปล่า",
        "ที่สวน",
        "ที่นา",
        "ที่สร้างบ้าน",
        "Land",
        "Plot",
      ],
    };

    // Map AI/Chatbot property types to valid Postgres enum values to prevent invalid enum errors
    const dbTypeMapping: Record<string, string> = {
      TOWNHOME: "TOWNHOUSE",
      COMMERCIAL_BUILDING: "COMMERCIAL",
      OFFICE_BUILDING: "COMMERCIAL",
      WAREHOUSE: "COMMERCIAL",
      TOWNHOUSE: "TOWNHOUSE",
      COMMERCIAL: "COMMERCIAL",
      CONDO: "CONDO",
      HOUSE: "HOUSE",
      LAND: "LAND",
    };

    const validDbType = dbTypeMapping[type] || type;

    if (synonyms[type]) {
      const orSyns = synonyms[type].map((s) => {
        const st = `%${s}%`;
        return `title.ilike.${st},description.ilike.${st}`;
      });
      query = query.or(`property_type.eq.${validDbType},${orSyns.join(",")}`);
    } else {
      query = query.eq("property_type", validDbType as Database["public"]["Enums"]["property_type"]);
    }
  }

  // 3. Price Filters (With Smart Fallback for Missing Listing Type)
  if (options.minPrice) {
    if (options.listingType === "RENT") {
      query = query.gte("rental_price", options.minPrice);
    } else if (options.listingType === "SALE") {
      query = query.gte("price", options.minPrice);
    } else {
      // Smart Fallback: If listingType is not specified, check either price or rental_price
      query = query.or(`price.gte.${options.minPrice},rental_price.gte.${options.minPrice}`);
    }
  }
  if (options.maxPrice) {
    if (options.listingType === "RENT") {
      query = query.lte("rental_price", options.maxPrice);
    } else if (options.listingType === "SALE") {
      query = query.lte("price", options.maxPrice);
    } else {
      // Smart Fallback: If listingType is not specified, check either price or rental_price
      query = query.or(`price.lte.${options.maxPrice},rental_price.lte.${options.maxPrice}`);
    }
  }

  // 4. Intent Filter
  if (options.listingType) {
    if (options.listingType === "SALE")
      query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
    else if (options.listingType === "RENT")
      query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
  }

  // 5. Spec Filters
  if (options.bedrooms) query = query.gte("bedrooms", options.bedrooms);
  if (options.bathrooms) query = query.gte("bathrooms", options.bathrooms);
  if (options.minSize) query = query.gte("size_sqm", options.minSize);
  if (options.maxSize) query = query.lte("size_sqm", options.maxSize);

  // 6. Keyword Search (Robust & Bilingual Sync)
  if (options.q) {
    const rawQ = options.q.trim();
    const searchTerms = new Set<string>([rawQ]);

    // Try to apply location mapping even to keywords (in case AI puts location in keywords)
    const mapping: Record<string, string[]> = {
      "พระราม 9": ["Rama 9", "Rama9", "พระราม9", "พระรามเก้า"],
      พระราม9: ["Rama 9", "Rama9", "พระราม 9", "พระรามเก้า"],
      "rama 9": ["พระราม 9", "พระราม9", "Rama9", "พระรามเก้า"],
      rama9: ["พระราม 9", "พระราม9", "Rama 9", "พระรามเก้า"],
      สุขุมวิท: ["Sukhumvit"],
      sukhumvit: ["สุขุมวิท"],
      ทองหล่อ: ["Thong Lo", "Thonglor"],
      thonglor: ["ทองหล่อ", "Thong Lo", "Thonglo"],
    };

    const lowerQ = rawQ.toLowerCase();
    if (mapping[lowerQ]) mapping[lowerQ].forEach((t) => searchTerms.add(t));

    const kwOrConditions: string[] = [];
    searchTerms.forEach((term) => {
      const s = `%${term}%`;
      kwOrConditions.push(
        `title.ilike.${s},description.ilike.${s},popular_area.ilike.${s},meta_keywords.cs.{${term}}`,
      );
    });

    query = query.or(kwOrConditions.join(","));
  }

  const { data, error } = await query;
  if (error) {
    console.error("Chatbot Search Error:", error);
    return [];
  }

  return (data ?? []).map((r: PropertyRow) => {
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      property_type: r.property_type,
      price: r.price,
      rental_price: r.rental_price,
      original_price: r.original_price,
      original_rental_price: r.original_rental_price,
      verified: r.verified,
      min_contract_months: r.min_contract_months,
      meta_keywords: r.meta_keywords,
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      size_sqm: r.size_sqm,
      parking_slots: r.parking_slots,
      floor: r.floor,
      created_at: r.created_at,
      updated_at: r.updated_at,
      listing_type: r.listing_type,
      popular_area: r.popular_area,
      province: r.province,
      district: r.district,
      subdistrict: r.subdistrict,
      address_line1: r.address_line1,
      image_url: getCoverImage(r.images),
      images: getSafeImages(r.images),
      location: buildLocation(r),
      features: (r.property_features || [])
        .map((pf) => pf.features)
        .filter((f): f is NonNullable<typeof f> => f !== null),
      near_transit: r.near_transit,
      transit_type: r.transit_type,
      transit_station_name: r.transit_station_name,
      transit_distance_meters: r.transit_distance_meters,
      google_maps_link: r.google_maps_link,
      nearby_places: getSafeNearbyPlaces(r.nearby_places),
      nearby_transits: getSafeNearbyTransits(r.nearby_transits),
    };
  });
}
