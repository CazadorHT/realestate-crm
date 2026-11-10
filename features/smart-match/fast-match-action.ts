"use server";

import { requireAuthContext, assertStaff } from "@/lib/authz";
import { generateText } from "@/lib/ai/gemini";
import { getNearbyNeighborhoods } from "@/lib/utils/nearby-areas";

export interface FastMatchProperty {
  id: string;
  title: string;
  project_name?: string | null;
  rental_price: number | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  district: string | null;
  popular_area: string | null;
  property_type: string | null;
  transit_station_name?: string | null;
  transit_distance_meters?: number | null;
  image_url: string | null;
  slug?: string | null;
}

export interface FastMatchResult {
  success: boolean;
  text?: string;
  matchedProperties?: FastMatchProperty[];
  otherProperties?: FastMatchProperty[];
  nearbyPopularAreas?: string[];
  parsedCases?: any[];
  error?: string;
}

// In-memory cache for popular areas (TTL: 15 minutes)
let cachedPopularAreas: string[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

async function getAvailablePopularAreas(supabase: any): Promise<string[]> {
  const now = Date.now();
  if (
    cachedPopularAreas &&
    cachedPopularAreas.length > 0 &&
    now - lastCacheTime < CACHE_TTL_MS
  ) {
    return cachedPopularAreas;
  }

  const areas = new Set<string>();

  try {
    // 1. Fetch from popular_areas_v3 table
    const { data: v3Data } = await supabase
      .from("popular_areas_v3")
      .select("name, name_th, name_en")
      .eq("is_active", true);

    if (Array.isArray(v3Data)) {
      for (const row of v3Data) {
        if (row.name_th && typeof row.name_th === "string")
          areas.add(row.name_th.trim());
        if (row.name_en && typeof row.name_en === "string")
          areas.add(row.name_en.trim());
        if (typeof row.name === "string" && row.name.trim()) {
          areas.add(row.name.trim());
        } else if (typeof row.name === "object" && row.name) {
          if (row.name.th) areas.add(row.name.th.trim());
          if (row.name.en) areas.add(row.name.en.trim());
        }
      }
    }
  } catch (err) {
    // Ignore error if table not accessible
  }

  try {
    // 2. Fetch distinct popular_area from active properties
    const { data: propAreas } = await supabase
      .from("properties")
      .select("popular_area")
      .eq("status", "ACTIVE")
      .is("deleted_at", null)
      .not("popular_area", "is", null);

    if (Array.isArray(propAreas)) {
      for (const p of propAreas) {
        if (
          p.popular_area &&
          typeof p.popular_area === "string" &&
          p.popular_area.trim()
        ) {
          areas.add(p.popular_area.trim());
        }
      }
    }
  } catch (err) {
    // Ignore error
  }

  const result = Array.from(areas).filter(Boolean);
  if (result.length > 0) {
    cachedPopularAreas = result;
    lastCacheTime = now;
    return result;
  }

  return [
    "ทองหล่อ",
    "สุขุมวิท",
    "พร้อมพงษ์",
    "เอกมัย",
    "อโศก",
    "นานา",
    "เพลินจิต",
    "ชิดลม",
    "สยาม",
    "สาทร",
    "สีลม",
    "พระราม 9",
    "รัชดา",
    "ลาดพร้าว",
    "อารีย์",
    "พญาไท",
    "ราชเทวี",
    "จตุจักร",
    "บางซื่อ",
    "พระโขนง",
    "อ่อนนุช",
    "อุดมสุข",
  ];
}

/**
 * Safely extracts the bilingual project name (Thai + English) from property data
 * Example: "เดอะ เครสท์ สุขุมวิท 34 (The Crest Sukhumvit 34)"
 */
function extractProjectName(p: any): string | null {
  const proj = p.projects || p.project;
  if (proj) {
    const nameObj = Array.isArray(proj) ? proj[0]?.name : proj?.name;
    if (typeof nameObj === "string" && nameObj.trim()) return nameObj.trim();
    if (typeof nameObj === "object" && nameObj) {
      const th = (nameObj.th || proj.name_th || "").trim();
      const en = (nameObj.en || proj.name_en || "").trim();

      if (th && en) {
        // If Thai name already contains English name or they are identical, don't duplicate
        if (
          th.toLowerCase() === en.toLowerCase() ||
          th.toLowerCase().includes(en.toLowerCase())
        ) {
          return th;
        }
        // Combine Thai and English: e.g. "เดอะ เครสท์ สุขุมวิท 34 (The Crest Sukhumvit 34)"
        return `${th} (${en})`;
      }
      return th || en || null;
    }
  }

  // Fallback: If title has pipes e.g. "คอนโดหรู | The Crest Sukhumvit 34"
  if (p.title && typeof p.title === "string") {
    if (p.title.includes("|")) {
      const parts = p.title.split("|").map((s: string) => s.trim());
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.length > 2 && lastPart.length < 50) {
        return lastPart;
      }
    }
  }

  return null;
}

/**
 * ⚡ AI Instant Chat Matcher
 * Parses messy, unstructured chat messages from LINE/FB/Co-brokers,
 * searches the portfolio with broker-style flexibility (+15% budget, adjacent zones, cross-type solutions),
 * and generates a high-converting sales pitch ready to copy and send in LINE.
 */
export async function fastMatchChatAction(
  rawText: string,
  preferredLanguage: "th" | "en" = "th",
): Promise<FastMatchResult> {
  let supabase: any;
  try {
    const authCtx = await requireAuthContext();
    assertStaff(authCtx.role);
    supabase = authCtx.supabase;
  } catch (authErr) {
    if (process.env.NODE_ENV !== "production") {
      const { createClient } = await import("@supabase/supabase-js");
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
    } else {
      throw authErr;
    }
  }

  if (!rawText || !rawText.trim()) {
    return { success: false, error: "กรุณาระบุข้อความความต้องการของลูกค้า" };
  }

  try {
    // -------------------------------------------------------------
    // STEP 1: AI Parse Raw Requirement with Real DB Popular Areas
    // -------------------------------------------------------------
    const dbPopularAreas = await getAvailablePopularAreas(supabase);
    const popularAreasSnippet = dbPopularAreas.slice(0, 50).join(", ");

    const parsePrompt = `คุณเป็น AI ผู้ช่วยอสังหาริมทรัพย์ระดับมืออาชีพ
วิเคราะห์ข้อความความต้องการของลูกค้าต่อไปนี้ และแปลงเป็น JSON array ของแต่ละเคส
(รองรับทั้งแบบมี 1 ลูกค้า หรือหลายลูกค้า/หลายเคส เช่น เคส 1, เคส 2)

ข้อความจากแชท:
"""
${rawText}
"""

รายชื่อทำเลยอดนิยม (Popular Areas) จริงในฐานข้อมูลระบบของเรา:
[${popularAreasSnippet}]

คำสั่งสำคัญสำหรับการจับคู่ทำเลและสถานีรถไฟฟ้า:
- ให้อ่านความต้องการของลูกค้า แล้วจับคู่ (Map) คำในแชท (เช่น "The Strand", "ทองหล่อ", "ซอย 34", "ใกล้เอ็มควอเทียร์", "ทาวน์อินทาวน์") เข้ากับรายชื่อ Popular Areas ข้างต้น
- ในฟิลด์ "matched_popular_areas" ให้ใส่เฉพาะชื่อย่านที่ตรงกับรายชื่อ Popular Areas ของระบบด้านบนเท่านั้น เช่น ["ทองหล่อ", "สุขุมวิท"]
- ในฟิลด์ "transit_stations" หากลูกค้าระบุชื่อสถานี BTS/MRT/ARL (เช่น "ใกล้ BTS อารีย์", "MRT พระราม 9", "BTS พร้อมพงษ์", "ติดรถไฟฟ้าทองหล่อ") ให้ถอดเฉพาะชื่อสถานีออกมา เช่น ["ทองหล่อ"], ["อารีย์"], ["พระราม 9"] ถ้าไม่ระบุให้เป็น []

คืนค่าเป็น JSON array รูปแบบนี้เท่านั้น (ห้ามใส่ Markdown code block อื่นนอกจาก JSON):
[
  {
    "client_label": "ลูกค้าที่ 1 หรือ เคส 1",
    "category": "RESIDENTIAL" (ถ้าหาคอนโด บ้าน ทาวน์โฮม ห้องพัก) หรือ "COMMERCIAL" (ถ้าหาออฟฟิศ สำนักงาน โกดัง ที่ดิน อาคารพาณิชย์),
    "purpose": "RENT" (หรือ "BUY"),
    "budget_max": ตัวเลขงบสูงสุด เช่น 80000 (ถ้าไม่ระบุให้เป็น null),
    "budget_min": ตัวเลขงบต่ำสุด เช่น 50000 (ถ้าไม่ระบุให้เป็น null),
    "size_min_sqm": ตัวเลขขนาดต่ำสุด ตร.ม. เช่น 100 (ถ้าไม่ระบุให้เป็น null),
    "bedrooms_min": ตัวเลขห้องนอนต่ำสุด เช่น 1 (ถ้าไม่ระบุให้เป็น null),
    "bedrooms_max": ตัวเลขห้องนอนสูงสุด เช่น 2 (ถ้าหา 1-2 ห้องนอนให้ใส่ 2 ถ้าไม่ระบุให้เป็น null),
    "matched_popular_areas": ["ทองหล่อ", "สุขุมวิท"] (ดึงเฉพาะที่ตรงกับรายชื่อ Popular Areas ด้านบน),
    "transit_stations": ["ทองหล่อ"] (ชื่อสถานี BTS/MRT ที่ลูกค้าระบุ ถ้าไม่มีให้เป็น []),
    "target_zones": ["ทองหล่อ", "สุขุมวิท 34", "พร้อมพงษ์", "เอกมัย", "วัฒนา", "คลองเตย"],
    "property_types": ["CONDO", "APARTMENT"] หรือ ["HOUSE", "TOWNHOME"] (ระบุเฉพาะประเภทที่ลูกค้าต้องการจริงๆ เช่น ถ้าหาคอนโดใส่เฉพาะ ["CONDO", "APARTMENT"] อย่าใส่บ้านเดี่ยว/ทาวน์โฮมปนมา ยกเว้นลูกค้าไม่ได้ระบุประเภท),
    "soft_conditions": ["น้ำฝักบัวแรง", "อาคารค่อนข้างใหม่", "ตกแต่งสวย", "พร้อมอยู่ พ.ย."]
  }
]`;

    const parseRes = await generateText(parsePrompt, "gemini-2.5-flash", 0, {
      responseMimeType: "application/json",
      temperature: 0.1,
    });

    // Sanitize JSON text from markdown fences if any
    const rawJson = parseRes.text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsedCases: any[] = [];
    try {
      const parsed = JSON.parse(rawJson);
      if (Array.isArray(parsed)) {
        parsedCases = parsed;
      } else if (parsed && typeof parsed === "object") {
        // If wrapped in an object like { cases: [...] } or { result: [...] }
        if (Array.isArray(parsed.cases)) parsedCases = parsed.cases;
        else if (Array.isArray(parsed.clients)) parsedCases = parsed.clients;
        else parsedCases = [parsed];
      }
    } catch (e) {
      console.error("JSON parse error in AI parser:", e, "Raw text:", parseRes.text);
      return { success: false, error: "ไม่สามารถวิเคราะห์ข้อความแชทได้ กรุณาระบุข้อมูล เช่น ทำเล งบประมาณ หรือประเภททรัพย์" };
    }

    if (parsedCases.length === 0) {
      return { success: false, error: "ไม่พบข้อมูลความต้องการในข้อความ กรุณาระบุรายละเอียดทรัพย์ที่ต้องการ" };
    }

    // -------------------------------------------------------------
    // STEP 2: Flexible Database Query from Active Portfolio
    // -------------------------------------------------------------
    const allSelectedProperties: FastMatchProperty[] = [];
    const allOtherProperties: FastMatchProperty[] = [];
    const allNearbyAreas: string[] = [];
    let combinedResponses: string[] = [];

    for (let i = 0; i < parsedCases.length; i++) {
      const c = parsedCases[i];
      const isRent = c.purpose !== "BUY";

      // Normalize & swap inverted budget if min > max
      if (c.budget_min && c.budget_max && Number(c.budget_min) > Number(c.budget_max)) {
        const temp = c.budget_min;
        c.budget_min = c.budget_max;
        c.budget_max = temp;
      }

      // Flexible Budget Range: +20% over max budget (room for negotiation)
      const maxBudget = c.budget_max ? c.budget_max * 1.20 : 500000;
      const minBudget = c.budget_min ? c.budget_min * 0.7 : (c.budget_max ? Math.max(15000, c.budget_max * 0.35) : 0);

      // Resolve Primary Area & Connected Nearby Popular Areas
      const isEn = preferredLanguage === "en";
      const primaryArea =
        (c.matched_popular_areas && c.matched_popular_areas[0]) ||
        (c.target_zones && c.target_zones[0]) ||
        "ทองหล่อ";

      const nearbyItems = getNearbyNeighborhoods(primaryArea, "กรุงเทพมหานคร", 4);
      const nearbyAreaNames = nearbyItems.map((item) => item.name);
      const nearbyAreaDisplay = nearbyItems.map((item) =>
        isEn ? item.name_en : item.name,
      );
      allNearbyAreas.push(...nearbyAreaDisplay);

      // Property Type Categories
      const CONDO_TYPES = ["CONDO", "APARTMENT", "PENTHOUSE"];
      const HOUSE_TYPES = [
        "HOUSE",
        "TOWNHOME",
        "TOWNHOUSE",
        "HOME_OFFICE",
        "VILLA",
        "POOL_VILLA",
      ];
      const RESIDENTIAL_TYPES = [...CONDO_TYPES, ...HOUSE_TYPES];
      const COMMERCIAL_TYPES = [
        "OFFICE_BUILDING",
        "OFFICE",
        "RETAIL",
        "SHOPHOUSE",
        "WAREHOUSE",
        "FACTORY",
        "LAND",
      ];

      const reqTypes: string[] = Array.isArray(c.property_types)
        ? c.property_types.map((t: string) => String(t).toUpperCase().trim())
        : [];

      const wantsCondo =
        reqTypes.some((t: string) => CONDO_TYPES.includes(t)) &&
        !reqTypes.some((t: string) => HOUSE_TYPES.includes(t));
      const wantsHouse =
        reqTypes.some((t: string) => HOUSE_TYPES.includes(t)) &&
        !reqTypes.some((t: string) => CONDO_TYPES.includes(t));
      const isCommercial =
        c.category === "COMMERCIAL" ||
        reqTypes.some((t: string) => COMMERCIAL_TYPES.includes(t));

      // Determine initial allowed types for database query
      let allowedDbTypes = RESIDENTIAL_TYPES;
      if (isCommercial) {
        allowedDbTypes = COMMERCIAL_TYPES;
      } else if (wantsCondo) {
        allowedDbTypes = CONDO_TYPES;
      } else if (wantsHouse) {
        allowedDbTypes = HOUSE_TYPES;
      }

      let query = (supabase as any)
        .from("properties")
        .select(
          "id, title, rental_price, price, bedrooms, bathrooms, size_sqm, land_size_sqwah, district, subdistrict, popular_area, address_line1, property_type, description, images, slug, is_pet_friendly, transit_station_name, transit_distance_meters, near_transit, projects(name)",
        )
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .in("property_type", allowedDbTypes);

      if (isRent) {
        query = query
          .in("listing_type", ["rent", "both", "RENT", "BOTH"])
          .gte("rental_price", minBudget)
          .lte("rental_price", maxBudget);
      } else {
        query = query
          .in("listing_type", ["sale", "both", "SALE", "BOTH"])
          .gte("price", minBudget)
          .lte("price", maxBudget);
      }

      let { data: dbProps, error: dbErr } = await query.limit(80);

      if (dbErr) {
        console.warn("Database query warning (projects join), retrying plain query:", dbErr);
        let safeQuery = (supabase as any)
          .from("properties")
          .select(
            "id, title, rental_price, price, bedrooms, bathrooms, size_sqm, land_size_sqwah, district, subdistrict, popular_area, address_line1, property_type, description, images, slug, is_pet_friendly, transit_station_name, transit_distance_meters, near_transit",
          )
          .eq("status", "ACTIVE")
          .is("deleted_at", null)
          .in("property_type", allowedDbTypes);

        if (isRent) {
          safeQuery = safeQuery
            .in("listing_type", ["rent", "both", "RENT", "BOTH"])
            .gte("rental_price", minBudget)
            .lte("rental_price", maxBudget);
        } else {
          safeQuery = safeQuery
            .in("listing_type", ["sale", "both", "SALE", "BOTH"])
            .gte("price", minBudget)
            .lte("price", maxBudget);
        }

        const safeRes = await safeQuery.limit(80);
        dbProps = safeRes.data || [];
      }

      // If strict subtype had 0 results, fall back to general residential types
      if ((!dbProps || dbProps.length === 0) && (wantsCondo || wantsHouse)) {
        let fallbackTypeQuery = (supabase as any)
          .from("properties")
          .select(
            "id, title, rental_price, price, bedrooms, bathrooms, size_sqm, land_size_sqwah, district, subdistrict, popular_area, address_line1, property_type, description, images, slug, is_pet_friendly, transit_station_name, transit_distance_meters, near_transit, projects(name)",
          )
          .eq("status", "ACTIVE")
          .is("deleted_at", null)
          .in("property_type", RESIDENTIAL_TYPES);

        if (isRent) {
          fallbackTypeQuery = fallbackTypeQuery
            .in("listing_type", ["rent", "both", "RENT", "BOTH"])
            .gte("rental_price", minBudget)
            .lte("rental_price", maxBudget);
        } else {
          fallbackTypeQuery = fallbackTypeQuery
            .in("listing_type", ["sale", "both", "SALE", "BOTH"])
            .gte("price", minBudget)
            .lte("price", maxBudget);
        }

        const fallbackTypeRes = await fallbackTypeQuery.limit(60);
        dbProps = fallbackTypeRes.data || [];
      }

      // Distant suburban districts to exclude when searching central/inner Bangkok zones
      const DISTANT_DISTRICTS = [
        "บางนา",
        "bang na",
        "bangna",
        "ดอนเมือง",
        "don mueang",
        "มีนบุรี",
        "min buri",
        "หนองจอก",
        "nong chok",
        "ลาดกระบัง",
        "lat krabang",
        "สายไหม",
        "sai mai",
        "บางขุนเทียน",
        "bang khun thian",
        "ทุ่งครุ",
        "thung khru",
        "ภาษีเจริญ",
        "phasi charoen",
        "บางแค",
        "bang khae",
        "ตลิ่งชัน",
        "taling chan",
        "ทวีวัฒนา",
        "thawi watthana",
        "สมุทรปราการ",
        "samut prakan",
        "นนทบุรี",
        "nonthaburi",
        "ปทุมธานี",
        "pathum thani",
      ];

      // Proximity & Location Filtering (including adjacent connected zones)
      const targetZones: string[] =
        Array.isArray(c.target_zones) && c.target_zones.length > 0
          ? c.target_zones
          : ["กรุงเทพ"];

      const isTargetCentral = targetZones.some((z: string) =>
        /ทองหล่อ|สุขุมวิท|พร้อมพงษ์|เอกมัย|อโศก|วัฒนา|คลองเตย|สาทร|สีลม|พระราม 9|รัชดา|ลาดพร้าว|อารีย์|พญาไท|thonglor|sukhumvit|phrom phong|ekkamai|asoke|sathorn|silom|rama 9/i.test(
          z,
        ),
      );

      // Score and rank candidates by Relevance (Location, Type, Bedrooms, Budget)
      const scoredCandidates: { prop: any; score: number }[] = [];

      for (const p of dbProps || []) {
        const propDistrict = `${p.district || ""} ${p.popular_area || ""}`.toLowerCase();

        // 1. Filter out distant suburb properties when client asks for central Bangkok
        if (
          isTargetCentral &&
          DISTANT_DISTRICTS.some((d) => propDistrict.includes(d))
        ) {
          continue;
        }

        let score = 0;
        const primaryLoc =
          `${p.popular_area || ""} ${p.district || ""} ${p.subdistrict || ""} ${p.title || ""} ${p.address_line1 || ""}`.toLowerCase();
        const descLoc = `${p.description || ""}`.toLowerCase();

        const matchedPopularAreas: string[] = Array.isArray(
          c.matched_popular_areas,
        )
          ? c.matched_popular_areas.map((a: string) =>
              String(a).toLowerCase().trim(),
            )
          : [];

        // 2. Location matching score
        let matchedZone = false;

        // Top Priority: Exact Database popular_area match (+150 points)
        if (p.popular_area && matchedPopularAreas.length > 0) {
          const pAreaLower = p.popular_area.toLowerCase().trim();
          if (
            matchedPopularAreas.some(
              (ma) => pAreaLower.includes(ma) || ma.includes(pAreaLower),
            )
          ) {
            score += 150;
            matchedZone = true;
          }
        }

        // Priority 2: Connected Nearby Popular Areas (+90 points)
        if (p.popular_area && nearbyAreaNames.length > 0) {
          const pAreaLower = p.popular_area.toLowerCase().trim();
          if (
            nearbyAreaNames.some(
              (na) =>
                pAreaLower.includes(na.toLowerCase()) ||
                na.toLowerCase().includes(pAreaLower),
            )
          ) {
            score += 90;
            matchedZone = true;
          }
        }

        // Priority 3: Transit Station Match (BTS / MRT / ARL) (+140 points)
        const transitStations: string[] = Array.isArray(c.transit_stations)
          ? c.transit_stations
              .map((s: string) =>
                String(s)
                  .toLowerCase()
                  .replace(/^(bts|mrt|arl|รถไฟฟ้า|สถานี)\s*/i, "")
                  .trim(),
              )
              .filter(Boolean)
          : [];

        if (transitStations.length > 0) {
          const pStation = (p.transit_station_name || "").toLowerCase();
          const inTitleOrDesc = `${p.title || ""} ${p.description || ""}`.toLowerCase();

          if (
            transitStations.some(
              (ts) =>
                (pStation && (pStation.includes(ts) || ts.includes(pStation))) ||
                inTitleOrDesc.includes(`bts ${ts}`) ||
                inTitleOrDesc.includes(`mrt ${ts}`) ||
                inTitleOrDesc.includes(`สถานี ${ts}`) ||
                inTitleOrDesc.includes(ts),
            )
          ) {
            score += 140;
            matchedZone = true;
          }
        }

        for (const z of targetZones) {
          const zoneLower = z.toLowerCase().trim();
          if (!zoneLower) continue;

          // Exact area match in title, popular area, or address (e.g. ทองหล่อ, สุขุมวิท 34, 55, พร้อมพงษ์)
          if (
            (p.title && p.title.toLowerCase().includes(zoneLower)) ||
            (p.popular_area &&
              p.popular_area.toLowerCase().includes(zoneLower)) ||
            (p.subdistrict &&
              p.subdistrict.toLowerCase().includes(zoneLower)) ||
            (p.address_line1 &&
              p.address_line1.toLowerCase().includes(zoneLower))
          ) {
            score += 120;
            matchedZone = true;
            break;
          } else if (
            p.district &&
            p.district.toLowerCase().includes(zoneLower)
          ) {
            score += 70;
            matchedZone = true;
            break;
          } else if (descLoc.includes(zoneLower)) {
            score += 15;
            matchedZone = true;
            break;
          }
        }

        // If no target zone matched at all, skip
        if (!matchedZone) continue;

        // 3. Property Type preference score
        if (wantsCondo) {
          if (CONDO_TYPES.includes(p.property_type)) score += 80;
          else score -= 120;
        } else if (wantsHouse) {
          if (HOUSE_TYPES.includes(p.property_type)) score += 80;
          else score -= 120;
        }

        // 4. Bedrooms matching score
        if (p.bedrooms != null) {
          const minBeds = c.bedrooms_min ?? 1;
          const maxBeds =
            c.bedrooms_max ?? (c.bedrooms_min ? c.bedrooms_min + 1 : 2);
          if (p.bedrooms >= minBeds && p.bedrooms <= maxBeds) {
            score += 50;
          } else if (p.bedrooms < minBeds) {
            score -= 30;
          } else if (p.bedrooms > maxBeds + 1) {
            // Severely penalize properties with 2+ extra bedrooms than requested
            score -= 60;
          }
        }

        // 5. Budget matching score
        const price = isRent ? p.rental_price : p.price;
        if (price != null && c.budget_max) {
          if (price <= c.budget_max) {
            score += 50;
          } else if (price <= c.budget_max * 1.15) {
            score += 30; // Slightly over budget, good for 1-year negotiation
          } else {
            score -= 20;
          }
        }

        if (score > 0) {
          scoredCandidates.push({ prop: p, score });
        }
      }

      // Sort by relevance score descending
      scoredCandidates.sort((a, b) => b.score - a.score);
      let candidates = scoredCandidates.map((sc) => sc.prop);

      // Fallback: If no candidate in exact zone + budget, fetch top active listings in portfolio as realistic alternatives
      if (candidates.length === 0) {
        let fallbackQuery = (supabase as any)
          .from("properties")
          .select(
            "id, title, rental_price, price, bedrooms, bathrooms, size_sqm, land_size_sqwah, district, subdistrict, popular_area, address_line1, property_type, description, images, slug, is_pet_friendly",
          )
          .eq("status", "ACTIVE")
          .is("deleted_at", null)
          .order(isRent ? "rental_price" : "price", { ascending: true });

        if (isCommercial) {
          fallbackQuery = fallbackQuery.in("property_type", COMMERCIAL_TYPES);
        } else if (wantsCondo) {
          fallbackQuery = fallbackQuery.in("property_type", CONDO_TYPES);
        } else if (wantsHouse) {
          fallbackQuery = fallbackQuery.in("property_type", HOUSE_TYPES);
        } else {
          fallbackQuery = fallbackQuery.in("property_type", RESIDENTIAL_TYPES);
        }

        const { data: fallbackProps } = await fallbackQuery.limit(10);
        if (fallbackProps && fallbackProps.length > 0) {
          candidates = fallbackProps;
        }
      }

      // Slice to optimal candidate pool of 10-12 top-scored properties for Gemini
      const topCandidates = candidates.slice(0, 12);

      // Prepare Candidate Summary for Gemini
      const candidateSummary = topCandidates
        .map((p: any, idx: number) => {
          const priceStr = isRent
            ? `${p.rental_price ? p.rental_price.toLocaleString() : "N/A"} บ./ด.`
            : `${p.price ? p.price.toLocaleString() : "N/A"} บาท`;
          const projName = extractProjectName(p);
          const transitStr = p.transit_station_name
            ? `${p.transit_station_name} ${p.transit_distance_meters ? `(${p.transit_distance_meters} ม.)` : ""}`
            : "ไม่ระบุ";
          return `[ตัวเลือก ${idx + 1}] ID: ${p.id}
ชื่อโครงการ: ${projName || p.title}
หัวข้อประกาศ: ${p.title}
ประเภท: ${p.property_type}
ราคา: ${priceStr}
ขนาด: ${p.size_sqm || "N/A"} ตร.ม. (ที่ดิน ${p.land_size_sqwah || "N/A"} ตร.ว.)
ห้อง: ${p.bedrooms || "N/A"} นอน / ${p.bathrooms || "N/A"} น้ำ
ทำเล: ${p.district || ""} / ${p.subdistrict || ""} / ${p.popular_area || ""}
ใกล้รถไฟฟ้า: ${transitStr}
สัตว์เลี้ยง: ${p.is_pet_friendly ? "รับสัตว์เลี้ยง" : "ไม่ระบุ/ไม่รับ"}
จุดเด่น/คำอธิบาย: ${(p.description || "").replace(/<[^>]*>/g, " ").slice(0, 280)}...`;
        })
        .join("\n\n");

      // -------------------------------------------------------------
      // STEP 3: Broker-Style AI Response Generation
      // -------------------------------------------------------------
      const nearbySuggestionsSnippet = nearbyAreaDisplay
        .slice(0, 3)
        .join(" / ");

      const synthesizePrompt = `You are an elite Top Producer real estate broker in Bangkok messaging a client on LINE / WhatsApp.
GOAL: Select the best 3 candidate properties that best match the client inquiry (always prioritize exact neighborhood, matching bedroom count, and preferred property type), and write an ultra-concise, mobile-friendly message that the client can read in 5 seconds on their smartphone.

LANGUAGE:
${isEn ? "English (fluent, natural, professional expat broker tone, ready to send via WhatsApp/LINE)" : "Thai (ภาษาไทย สุภาพ เป็นกันเองสไตล์เอเจนต์มืออาชีพ ไม่ใช้คำเกริ่นนำราชการหรือเรียงความยาว)"}

CLIENT REQUIREMENTS (${c.client_label || `Case ${i + 1}`}):
- Budget: ${c.budget_max ? `Max ${c.budget_max.toLocaleString()} THB/month` : "Not specified"}
- Size / Bedrooms: ${c.size_min_sqm ? `Min ${c.size_min_sqm} sqm` : ""} ${c.bedrooms_min ? `${c.bedrooms_min} bedrooms` : ""}
- Target Zones: ${targetZones.join(", ")}
- Connected Nearby Popular Areas: ${nearbySuggestionsSnippet || "None"}
- Soft Conditions: ${(c.soft_conditions || []).join(", ") || "None"}

CANDIDATE PROPERTIES IN OUR PORTFOLIO:
${candidateSummary || "No direct matching properties in current portfolio"}

STRICT FORMATTING RULES (MOBILE-FIRST / LINE CHAT FORMAT):
1. NO lengthy formal essays, NO boilerplate corporate intros like "เรียนคุณลูกค้าที่เคารพ ในฐานะ Top Producer...". Start directly with 1 short friendly greeting line.
2. Select EXACTLY 3 best properties from the above candidates (if fewer than 3 available in candidates, select all available). Always prioritize:
   - Properties located in the exact target zone (e.g. ทองหล่อ / Thonglor) over outer zones
   - Matching bedroom count and preferred property type
   - Good value / within budget
   For each property, use EXACTLY 3-4 bullet lines:
   [Number emoji: 1️⃣, 2️⃣, 3️⃣] Project / Property Name (Selling Angle, e.g. ตรงโซนที่สุด / พื้นที่ใหญ่สะใจ / เซฟงบ)
   • [Beds/Baths] | [Size sqm] | [Location highlight, e.g. ใกล้ BTS...]
   • ${isEn ? "Rent:" : "ค่าเช่า:"} [Price THB/mo] (If over budget, note in bracket that we can negotiate it down to their budget for 1-year lease)
   • ${isEn ? "Highlight:" : "ไฮไลต์:"} [1-line key feature matching client conditions, e.g. kitchen, AC, space]
3. If nearby popular areas are available (${nearbySuggestionsSnippet}), add a short 1-line note offering attractive options in those adjacent popular areas so the client has flexible choices (e.g. "💡 หรือหากสนใจเปิดรับทำเลใกล้เคียงอย่าง ${nearbySuggestionsSnippet} ทางเรามีห้องสวยในงบนี้เช่นกันครับ").
4. If applicable, add a short "💡 ${isEn ? "Alternative Option" : "ตัวเลือกสำรอง"}" section (e.g. Townhouse/House that solves parking/pets 100%).
5. If there is a key caveat (like condo motorbike parking limits), explain it in 1 short line.
6. End with 1 friendly closing line asking for preferred viewing date/time.

OUTPUT FORMAT (MUST BE VALID JSON ONLY):
{
  "selected_ids": ["Exact ID of property 1 from candidates", "Exact ID of property 2", "Exact ID of property 3"],
  "pitch_message": "The final message ready to copy and send in LINE"
}`;

      const synthRes = await generateText(synthesizePrompt, "gemini-2.5-flash", 0, {
        responseMimeType: "application/json",
        temperature: 0.2,
      });

      let pitchMessage = "";
      let selectedIds: string[] = [];

      try {
        const cleanJson = synthRes.text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();
        const parsedSynth = JSON.parse(cleanJson);
        pitchMessage = parsedSynth.pitch_message || synthRes.text;
        if (Array.isArray(parsedSynth.selected_ids)) {
          selectedIds = parsedSynth.selected_ids;
        }
      } catch {
        pitchMessage = synthRes.text;
      }

      combinedResponses.push(pitchMessage);

      // Collect ONLY the properties that were actually recommended by AI in the pitch
      const chosenCandidates = selectedIds
        .map((id: string) => candidates.find((p: any) => String(p.id).trim() === String(id).trim()))
        .filter(Boolean);

      // Fallback: If AI selected_ids could not be mapped, take top 3 candidates that are mentioned in text or from list
      const finalCandidates = chosenCandidates.length > 0 
        ? chosenCandidates 
        : candidates.filter((p: any) => pitchMessage.includes(p.title) || pitchMessage.includes(p.id)).slice(0, 3);

      const toDisplay = finalCandidates.length > 0 ? finalCandidates : candidates.slice(0, 3);

      toDisplay.forEach((p: any) => {
        let firstImg: string | null = null;
        try {
          if (p.images) {
            const parsed = typeof p.images === "string" ? JSON.parse(p.images) : p.images;
            if (Array.isArray(parsed) && parsed.length > 0) firstImg = parsed[0];
          }
        } catch {
          // ignore image parse error
        }

        if (!allSelectedProperties.some((x) => x.id === p.id)) {
          allSelectedProperties.push({
            id: p.id,
            title: p.title,
            project_name: extractProjectName(p),
            rental_price: p.rental_price,
            price: p.price,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            size_sqm: p.size_sqm,
            district: p.district,
            popular_area: p.popular_area,
            property_type: p.property_type,
            transit_station_name: p.transit_station_name,
            transit_distance_meters: p.transit_distance_meters,
            image_url: firstImg,
            slug: p.slug,
          });
        }
      });

      // Collect OTHER matching candidate properties in portfolio (for users who want to explore more)
      const otherCandidates = candidates
        .filter((p: any) => !toDisplay.some((tp: any) => tp.id === p.id))
        .slice(0, 10);

      otherCandidates.forEach((p: any) => {
        let firstImg: string | null = null;
        try {
          if (p.images) {
            const parsed = typeof p.images === "string" ? JSON.parse(p.images) : p.images;
            if (Array.isArray(parsed) && parsed.length > 0) firstImg = parsed[0];
          }
        } catch {
          // ignore image parse error
        }

        if (!allOtherProperties.some((x) => x.id === p.id) && !allSelectedProperties.some((x) => x.id === p.id)) {
          allOtherProperties.push({
            id: p.id,
            title: p.title,
            project_name: extractProjectName(p),
            rental_price: p.rental_price,
            price: p.price,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            size_sqm: p.size_sqm,
            district: p.district,
            popular_area: p.popular_area,
            property_type: p.property_type,
            transit_station_name: p.transit_station_name,
            transit_distance_meters: p.transit_distance_meters,
            image_url: firstImg,
            slug: p.slug,
          });
        }
      });
    }

    return {
      success: true,
      text: combinedResponses.join("\n\n" + "=".repeat(40) + "\n\n"),
      matchedProperties: allSelectedProperties,
      otherProperties: allOtherProperties,
      nearbyPopularAreas: Array.from(new Set(allNearbyAreas)),
      parsedCases,
    };
  } catch (error: any) {
    console.error("fastMatchChatAction error:", error);
    return {
      success: false,
      error: error?.message || "เกิดข้อผิดพลาดในการค้นหาทรัพย์",
    };
  }
}
