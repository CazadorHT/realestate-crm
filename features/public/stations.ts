"use server";
import { unstable_cache } from "next/cache";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/features/properties/image-utils";

// ============================================================
// Types
// ============================================================

export interface StationForSEO {
  code: string;
  slug: string;
  label: { th: string; en: string; cn?: string; ru?: string };
  transitType: string;
  lineName: string;
  lineColor: string;
  latitude?: number;
  longitude?: number;
  propertyCount?: number;
  minPrice?: number | null;
  minRentalPrice?: number | null;
}

export interface TransitLine {
  type: string;
  label: { th: string; en: string; cn?: string; ru?: string };
  color: string;
  stations: StationForSEO[];
}

export interface StationDetail extends StationForSEO {
  seoTitle?: string;
  seoDescription?: string;
  description?: { th?: string; en?: string; cn?: string; ru?: string };
  bgImage?: string | null;
  prevStation?: { slug: string; label: { th: string; en: string } } | null;
  nextStation?: { slug: string; label: { th: string; en: string } } | null;
}

export interface PublicPropertyNearStation {
  id: string;
  slug: string;
  title: string | null;
  title_en: string | null;
  title_cn: string | null;
  title_ru: string | null;
  description: string | null;
  description_en: string | null;
  description_cn: string | null;
  description_ru: string | null;
  images: any | null;
  main_image: string | null;
  price: number | null;
  rental_price: number | null;
  original_price: number | null;
  original_rental_price: number | null;
  price_per_sqm: number | null;
  rent_price_per_sqm: number | null;
  land_size_sqwah: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  property_type: string | null;
  listing_type: string | null;
  status: string | null;
  district: string | null;
  province: string | null;
  popular_area: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  popular_area_ru?: string | null;
  near_transit: boolean | null;
  transit_station_name: string | null;
  transit_station_name_en: string | null;
  transit_station_name_cn?: string | null;
  transit_station_name_ru?: string | null;
  transit_type?: string | null;
  transit_distance_meters: number | null;
  nearby_transits?: any[] | null;
  is_hot_deal: boolean | null;
  is_featured: boolean | null;
  currency: string | null;
  is_fully_furnished: boolean | null;
  is_pet_friendly: boolean | null;
  verified: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  min_contract_months?: number | null;
  features?: any[] | null;
}

// ============================================================
// Constants
// ============================================================

const LINE_LABELS: Record<string, { th: string; en: string; cn?: string; ru?: string }> = {
  BTS: { th: "BTS สกายเทรน", en: "BTS Skytrain", cn: "BTS 轻轨", ru: "BTS Скайтрейн" },
  MRT: { th: "MRT สายสีน้ำเงิน", en: "MRT Blue Line", cn: "MRT 蓝线", ru: "MRT Синяя линия" },
  MRT_PURPLE: { th: "MRT สายสีม่วง", en: "MRT Purple Line", cn: "MRT 紫线", ru: "MRT Фиолетовая линия" },
  MRT_YELLOW: { th: "MRT สายสีเหลือง", en: "MRT Yellow Line", cn: "MRT 黄线", ru: "MRT Жёлтая линия" },
  MRT_PINK: { th: "MRT สายสีชมพู", en: "MRT Pink Line", cn: "MRT 粉线", ru: "MRT Розовая линия" },
  MRT_ORANGE: { th: "MRT สายสีส้ม", en: "MRT Orange Line", cn: "MRT 橙线", ru: "MRT Оранжевая линия" },
  ARL: { th: "แอร์พอร์ต เรลลิงก์", en: "Airport Rail Link", cn: "机场快线", ru: "Аэропорт Рейл Линк" },
  SRT_RED: { th: "รถไฟฟ้าสายสีแดง", en: "SRT Red Line", cn: "SRT 红线", ru: "SRT Красная линия" },
  GOLD: { th: "รถไฟฟ้าสายสีทอง", en: "Gold Line", cn: "金线", ru: "Золотая линия" },
  BRT: { th: "BRT รถโดยสารด่วนพิเศษ", en: "BRT Bus Rapid Transit", cn: "BRT", ru: "BRT" },
};

const LINE_COLORS: Record<string, string> = {
  BTS: "#7BC542",
  MRT: "#1E3A8A",
  MRT_PURPLE: "#7C3AED",
  MRT_YELLOW: "#F59E0B",
  MRT_PINK: "#EC4899",
  MRT_ORANGE: "#F97316",
  ARL: "#DC2626",
  SRT_RED: "#EF4444",
  GOLD: "#D97706",
  BRT: "#059669",
};

// Order for display
const LINE_ORDER = ["BTS", "MRT", "MRT_PURPLE", "MRT_YELLOW", "MRT_PINK", "MRT_ORANGE", "ARL", "SRT_RED", "GOLD", "BRT"];

function generateSlug(code: string): string {
  return code.toLowerCase().replace(/_/g, "-");
}

// ============================================================
// Server Actions
// ============================================================

/**
 * Get all transit lines with their stations for the hub page
 * [OPTIMIZED: ดึงข้อมูลสรุปรวบยอดผ่าน Materialized View เพื่อเซฟท่อ Egress 99%]
 */
export const getTransitLinesWithStations = unstable_cache(
  async (): Promise<TransitLine[]> => {
    const supabase = createPublicClient();

    // 1. ดึงข้อมูลสรุปสถานีรถไฟฟ้าจาก Materialized View (คิวรีเสร็จใน 0.01 วินาที)
    const { data: statsData, error: statsError } = await supabase
      .from("mv_station_property_stats")
      .select("station_name, property_count, min_price, min_rental_price");

    if (statsError) {
      console.error("Error fetching Materialized View stats:", statsError.message);
      return [];
    }

    // แปลงข้อมูลสถิติให้อยู่ในรูป Map เพื่อความรวดเร็วสูงสุด (O(1)) ในการสืบค้นจับคู่ด้านล่าง
    const statsMap = new Map<string, { property_count: number; min_price: number | null; min_rental_price: number | null }>();
    (statsData || []).forEach((row: any) => {
      if (row.station_name) {
        statsMap.set(row.station_name.toLowerCase().trim(), {
          property_count: Number(row.property_count || 0),
          min_price: row.min_price ? Number(row.min_price) : null,
          min_rental_price: row.min_rental_price ? Number(row.min_rental_price) : null,
        });
      }
    });

    // 2. ดึงข้อมูล Master Data ของรายชื่อสถานีรถไฟฟ้าทั้งหมด (ref_master_data)
    const { data: masterStations, error: masterError } = await supabase
      .from("ref_master_data")
      .select("code, label, metadata, sort_order")
      .eq("type", "TRANSIT_STATION")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (masterError) {
      console.error("Error fetching transit stations master data:", masterError.message);
      return [];
    }

    if (!masterStations || masterStations.length === 0) return [];

    // Map โครงสร้าง Default ของสายรถไฟฟ้าแต่ละประเภท
    const lineInfoMap = new Map<string, {
      label: { th: string; en: string; cn?: string; ru?: string };
      color: string;
    }>();

    for (const type of Object.keys(LINE_LABELS)) {
      lineInfoMap.set(type, {
        label: LINE_LABELS[type],
        color: LINE_COLORS[type] || "#6B7280"
      });
    }

    const grouped = new Map<string, StationForSEO[]>();

    // 3. วนลูปแมปข้อมูล Master Data เข้ากับสถิติจริงที่ดึงมาจาก Materialized View
    for (const item of masterStations) {
      const metadata = item.metadata as Record<string, unknown> | null;
      const label = item.label as { th: string; en: string; cn?: string; ru?: string } | null;
      const transitType = (metadata?.transit_type as string) || "OTHER";
      const slug = (metadata?.slug as string) || generateSlug(item.code);

      if (!lineInfoMap.has(transitType) || metadata?.line_name || metadata?.line_name_th || metadata?.line_color) {
        const existing = lineInfoMap.get(transitType);
        lineInfoMap.set(transitType, {
          label: {
            th: (metadata?.line_name_th as string) || (metadata?.line_name as string) || existing?.label.th || transitType,
            en: (metadata?.line_name_en as string) || (metadata?.line_name as string) || existing?.label.en || transitType,
            cn: (metadata?.line_name_cn as string) || existing?.label.cn,
            ru: (metadata?.line_name_ru as string) || existing?.label.ru,
          },
          color: (metadata?.line_color as string) || existing?.color || "#6B7280"
        });
      }

      const info = lineInfoMap.get(transitType)!;

      const nameThKey = label?.th?.trim().toLowerCase() || "";
      const nameEnKey = label?.en?.trim().toLowerCase() || "";
      const codeLowerKey = item.code.trim().toLowerCase();

      // ดึงค่าสถิติจาก Map ด้วย Key ภาษาไทย, ภาษาอังกฤษ หรือรหัสสถานี (ความเร็ว O(1))
      const stat = statsMap.get(nameThKey) || statsMap.get(nameEnKey) || statsMap.get(codeLowerKey);

      // ถ้าสถานีนี้ไม่มีทรัพย์สินแสดงอยู่เลย (หรือ stat เป็น null) ให้ข้ามไปเพื่อประหยัดหน้าเว็บบอร์ด
      if (!stat || stat.property_count === 0) {
        continue; 
      }

      const station: StationForSEO = {
        code: item.code,
        slug,
        label: label || { th: item.code, en: item.code },
        transitType,
        lineName: info.label.en,
        lineColor: info.color,
        latitude: metadata?.latitude as number | undefined,
        longitude: metadata?.longitude as number | undefined,
        propertyCount: stat.property_count,
        minPrice: stat.min_price,
        minRentalPrice: stat.min_rental_price,
      };

      if (!grouped.has(transitType)) {
        grouped.set(transitType, []);
      }
      grouped.get(transitType)!.push(station);
    }

    // ประกอบโครงสร้างอาเรย์ส่งกลับตามลำดับหมวดสายรถไฟฟ้า (LINE_ORDER)
    const lines: TransitLine[] = [];
    for (const type of LINE_ORDER) {
      const stations = grouped.get(type);
      if (stations && stations.length > 0) {
        stations.sort((a, b) => (b.propertyCount || 0) - (a.propertyCount || 0));
        const info = lineInfoMap.get(type) || { label: { th: type, en: type }, color: "#6B7280" };
        lines.push({
          type,
          label: info.label,
          color: info.color,
          stations,
        });
      }
    }

    for (const [type, stations] of grouped) {
      if (!LINE_ORDER.includes(type) && stations.length > 0) {
        stations.sort((a, b) => (b.propertyCount || 0) - (a.propertyCount || 0));
        const info = lineInfoMap.get(type) || { label: { th: type, en: type }, color: "#6B7280" };
        lines.push({
          type,
          label: info.label,
          color: info.color,
          stations,
        });
      }
    }

    return lines;
  },
  ["transit-lines-with-stations-v3"],
  { revalidate: 31536000, tags: ["transit-lines", "stations", "master-data"] }
);

/**
 * Get a single station by its slug for the detail page
 */
export async function getStationBySlug(slug: string): Promise<StationDetail | null> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();

      // Fetch all stations to find by slug and determine neighbors
      const { data, error } = await supabase
        .from("ref_master_data")
        .select("code, label, metadata, sort_order")
        .eq("type", "TRANSIT_STATION")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error || !data) {
        console.error("Error fetching station by slug:", error?.message);
        return null;
      }

      // Find the station by slug
      let targetIndex = -1;
      const stationsWithMeta = data.map((item: any, index: number) => {
        const metadata = item.metadata as Record<string, unknown> | null;
        const label = item.label as { th: string; en: string; cn?: string; ru?: string } | null;
        const itemSlug = (metadata?.slug as string) || generateSlug(item.code);

        if (itemSlug === slug) {
          targetIndex = index;
        }

        return {
          code: item.code,
          slug: itemSlug,
          label: label || { th: item.code, en: item.code },
          transitType: (metadata?.transit_type as string) || "OTHER",
          metadata,
          sortOrder: item.sort_order as number,
        };
      });

      if (targetIndex === -1) return null;

      const target = stationsWithMeta[targetIndex];
      const metadata = target.metadata;

      // Prevent serving station detail pages that have no active properties.
      // Use the lightweight count query to avoid running the full properties fetch.
      try {
        const propCount = await getPropertyCountNearStation(
          (target.label?.th as string) || "",
          (target.label?.en as string) || ""
        );
        if (!propCount) {
          return null;
        }
      } catch (e) {
        // If counting fails, log and proceed (fallback to showing the page)
        console.error("Error counting properties for station slug:", slug, e);
      }

      // Find prev/next stations on the same line
      const sameLine = stationsWithMeta.filter((s: any) => s.transitType === target.transitType);
      const lineIndex = sameLine.findIndex((s: any) => s.slug === slug);

      const prevStation = lineIndex > 0 ? {
        slug: sameLine[lineIndex - 1].slug,
        label: { th: sameLine[lineIndex - 1].label.th, en: sameLine[lineIndex - 1].label.en },
      } : null;

      const nextStation = lineIndex < sameLine.length - 1 ? {
        slug: sameLine[lineIndex + 1].slug,
        label: { th: sameLine[lineIndex + 1].label.th, en: sameLine[lineIndex + 1].label.en },
      } : null;

      return {
        code: target.code,
        slug: target.slug,
        label: target.label,
        transitType: target.transitType,
        lineName: (metadata?.line_name as string) || LINE_LABELS[target.transitType]?.en || target.transitType,
        lineColor: (metadata?.line_color as string) || LINE_COLORS[target.transitType] || "#6B7280",
        latitude: metadata?.latitude as number | undefined,
        longitude: metadata?.longitude as number | undefined,
        seoTitle: metadata?.seo_title as string | undefined,
        seoDescription: metadata?.seo_description as string | undefined,
        description: metadata?.description as StationDetail["description"] | undefined,
        bgImage: (metadata?.bg_image as string) || (metadata?.image_url as string) || null,
        prevStation,
        nextStation,
      };
    },
    ["public-station-by-slug", slug],
    { revalidate: 604800, tags: ["stations", "public-data"] }
  )();
}

/**
 * Get properties near a station using JSONB containment
 */
export async function getPropertiesNearStation(
  stationNameTh: string,
  stationNameEn: string,
  filters?: {
    listing_type?: string;
    property_type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ properties: PublicPropertyNearStation[]; total: number }> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();
      const limit = filters?.limit || 12;
      const offset = filters?.offset || 0;

      // Sanitize station names to prevent injection
      const cleanTh = stationNameTh.replace(/"/g, "");
      const cleanEn = stationNameEn.replace(/"/g, "");

      const jsonTh = `[{"station_name":"${cleanTh}"}]`;
      const jsonEn = `[{"station_name_en":"${cleanEn}"}]`;

      let query = supabase
        .from("properties")
        .select(
          `id, slug, title, title_en, title_cn, title_ru, images, main_image, price, rental_price, original_price, original_rental_price, price_per_sqm, rent_price_per_sqm, land_size_sqwah, bedrooms, bathrooms, size_sqm, property_type, listing_type, status, district, province, popular_area, popular_area_en, popular_area_cn, popular_area_ru, near_transit, transit_station_name, transit_station_name_en, transit_station_name_cn, transit_station_name_ru, transit_type, transit_distance_meters, nearby_transits, is_hot_deal, is_featured, currency, is_fully_furnished, is_pet_friendly, verified, created_at, updated_at, min_contract_months`,
          { count: "exact" }
        )
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .or(
          `nearby_transits.cs."${jsonTh.replace(/"/g, '\\"')}",` +
          `nearby_transits.cs."${jsonEn.replace(/"/g, '\\"')}",` +
          `transit_station_name.eq."${cleanTh}",` +
          `transit_station_name_en.eq."${cleanEn}"`
        );

      // Apply optional filters
      if (filters?.listing_type && filters.listing_type !== "ALL") {
        query = query.eq("listing_type", filters.listing_type);
      }
      if (filters?.property_type && filters.property_type !== "ALL") {
        query = query.eq("property_type", filters.property_type);
      }

      // Ordering: featured first, then hot deals, then by price
      query = query
        .order("is_featured", { ascending: false })
        .order("is_hot_deal", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching properties near station:", error.message);
        return { properties: [], total: 0 };
      }

      const mapped = (data || []).map((row: any) => {
        const { property_features, ...rest } = row;
        return {
          ...rest,
          main_image: getPublicImageUrl(row.main_image) || null,
          features: (property_features || []).map((pf: any) => pf.features).filter((f: any) => !!f),
        };
      });

      return {
        properties: mapped as PublicPropertyNearStation[],
        total: count || 0,
      };
    },
    ["public-properties-near-station", stationNameTh, stationNameEn, JSON.stringify(filters || {})],
    { revalidate: 604800, tags: ["properties", "stations", "public-data"] }
  )();
}

/**
 * Get all active station slugs for generateStaticParams()
 * [OPTIMIZED: ดึงผ่าน Materialized View ข้อมูลเหลือไม่กี่ KB แก้ปัญหาท่อรั่วตอน Build]
 */
export const getAllStationSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createPublicClient();

    // 1. ดึงข้อมูลสถานีทั้งหมดที่เป็น Active จาก Master Data
    const { data: stations, error } = await supabase
      .from("ref_master_data")
      .select("code, label, metadata")
      .eq("type", "TRANSIT_STATION")
      .eq("is_active", true);

    if (error || !stations) {
      console.error("Error fetching station slugs:", error?.message);
      return [];
    }

    // 2. ดึงเฉพาะรายชื่อสถานีที่มีทรัพย์สินจริงจาก Materialized View (เบาหวิวระดับกิโลไบต์!)
    const { data: activeStats, error: statsError } = await supabase
      .from("mv_station_property_stats")
      .select("station_name");

    if (statsError) {
      console.error("Error fetching active station names from view:", statsError.message);
      return [];
    }

    // แปลงรายชื่อสถานีที่มีทรัพย์สินให้อยู่ใน Set เพื่อคิวรีหาได้เร็ว O(1)
    const activeStationNames = new Set<string>();
    (activeStats || []).forEach((row: any) => {
      if (row.station_name) {
        activeStationNames.add(row.station_name.trim().toLowerCase());
      }
    });

    // 3. กรองและส่งกลับเฉพาะสลัก (Slugs) ของสถานีที่มีทรัพย์สินอยู่จริงบนหน้าร้าน
    return stations
      .filter((item: any) => {
        const label = item.label as { th: string; en: string } | null;
        const nameTh = label?.th?.trim().toLowerCase() || "";
        const nameEn = label?.en?.trim().toLowerCase() || "";
        const codeLower = item.code.trim().toLowerCase();
        
        return activeStationNames.has(nameTh) || 
               activeStationNames.has(nameEn) || 
               activeStationNames.has(codeLower);
      })
      .map((item: any) => {
        const metadata = item.metadata as Record<string, unknown> | null;
        return (metadata?.slug as string) || generateSlug(item.code);
      });
  },
  ["all-station-slugs-v2"],
  { revalidate: 31536000, tags: ["station-slugs", "stations", "master-data"] }
);

/**
 * Get the count of properties near a station (lightweight query for hub page)
 */
export async function getPropertyCountNearStation(
  stationNameTh: string,
  stationNameEn: string
): Promise<number> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const cleanTh = stationNameTh.replace(/"/g, "");
      const cleanEn = stationNameEn.replace(/"/g, "");

      const jsonTh = `[{"station_name":"${cleanTh}"}]`;
      const jsonEn = `[{"station_name_en":"${cleanEn}"}]`;

      const { count, error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .or(
          `nearby_transits.cs."${jsonTh.replace(/"/g, '\\"')}",` +
          `nearby_transits.cs."${jsonEn.replace(/"/g, '\\"')}",` +
          `transit_station_name.eq."${cleanTh}",` +
          `transit_station_name_en.eq."${cleanEn}"`
        );

      if (error) {
        console.error("Error counting properties near station:", error.message);
        return 0;
      }

      return count || 0;
    },
    [`station-property-count-${stationNameTh}-${stationNameEn}`],
    { revalidate: 31536000, tags: ["properties", "stations", "public-data"] }
  )();
}
