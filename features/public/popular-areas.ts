"use server";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export type PopularAreaItem = {
  key: string;
  name: string; // Compatibility with legacy code
  popular_area: string;
  popular_area_en: string | null;
  popular_area_cn: string | null;
  popular_area_ru: string | null;
  province: string;
  count: number;
  cover: string | null;
  name_en?: string | null; // Compatibility
  name_cn?: string | null; // Compatibility
  name_ru?: string | null; // Compatibility
  slug: string;
};

/**
 * [S-Tier] Cached Data Fetcher for Public Provinces
 * Reduces database load for the landing page.
 */
export const getPublicProvincesAction = unstable_cache(
  async () => {
    try {
      const client = await createClient();
      const { data: provData } = await client
        .from("properties")
        .select("province")
        .eq("status", "ACTIVE")
        .not("province", "is", null);

      const uniqueThai = Array.from(
        new Set((provData || []).map((p: any) => p.province).filter(Boolean)),
      );

      const displayMap: Record<string, string> = {
        กรุงเทพมหานคร: "Bangkok",
        ภูเก็ต: "Phuket",
        เชียงใหม่: "Chiang Mai",
        ชลบุรี: "Chonburi",
      };

      return uniqueThai.map((name) => ({
        id: name as string,
        display: displayMap[name as string] || (name as string),
      }));
    } catch (e) {
      console.error("getPublicProvincesAction error:", e);
      return [];
    }
  },
  ["public-provinces-list-v5"],
  { revalidate: 60, tags: ["provinces", "popular-areas", "public-data"] }
);

/**
 * [S-Tier] Highly Optimized Popular Areas Fetcher
 * - Supports both Public (Optimized) and Admin (Full List) modes
 * - Dual-layer filtering and sorting
 * [OPTIMIZED: ปรับมาดึงผ่าน Materialized View สรุปย่านยอดนิยม เพื่อเซฟ Egress เหลือใกล้ 0%]
 */
export const getPopularAreasAction = unstable_cache(
  async (params?: string | { onlyActive?: boolean; province?: string }): Promise<any> => {
    try {
      const client = await createClient();
      
      // Parse params
      const onlyActive = typeof params === "object" ? params.onlyActive !== false : true;
      const province = typeof params === "string" ? params : params?.province;

      // 🛡️ Admin Mode: Just return strings of all area names (Unoptimized but complete)
      if (!onlyActive) {
        let query = client.from("popular_areas_v3").select("name, province").order("name->>'th'");
        if (province) {
          const bangkokMetro = [
            "กรุงเทพมหานคร",
            "สมุทรปราการ",
            "นนทบุรี",
            "ปทุมธานี",
            "สมุทรสาคร",
            "นครปฐม",
          ];
          if (bangkokMetro.includes(province)) {
            query = query.in("province", bangkokMetro);
          } else {
            query = query.eq("province", province);
          }
        }
        const { data } = await query;
        return (data || []).map((item: any) => {
          if (typeof item.name === "string") return item.name;
          return item.name?.th || item.name?.en || item.name?.default || "";
        }).filter(Boolean);
      }

      // 🚀 Public Mode: Full optimization for landing page via Views & Region Mapping
      const bkkVicinity = [
        "กรุงเทพมหานคร",
        "สมุทรปราการ",
        "นนทบุรี",
        "ปทุมธานี",
        "สมุทรสาคร",
        "นครปฐม",
      ];
      const provinceMap: Record<string, string[]> = {
        Bangkok: bkkVicinity,
        กรุงเทพมหานคร: bkkVicinity,
        นนทบุรี: bkkVicinity,
        สมุทรปราการ: bkkVicinity,
        ปทุมธานี: bkkVicinity,
        สมุทรสาคร: bkkVicinity,
        นครปฐม: bkkVicinity,
        Phuket: ["ภูเก็ต", "Phuket"],
        ภูเก็ต: ["ภูเก็ต", "Phuket"],
      };

      // 1. ดึงสถิติจริงผ่านตารางสรุปวิวโครงการทันที (เบาหวิว ไม่กินแบนด์วิธ)
      const { data: statsData, error: statsError } = await client
        .from("mv_project_property_stats")
        .select("primary_popular_area, property_count, price_min, rental_min");

      if (statsError) throw statsError;

      // 2. ดึงข้อมูล Master Data ของย่านยอดนิยม โดยกรองตามเงื่อนไขจังหวัดที่ส่งมาจากหน้าบ้าน
      let areasQuery = client
        .from("popular_areas_v3")
        .select("id, name, slug, image_url, province, is_active")
        .eq("is_active", true);

      if (province && provinceMap[province]) {
        areasQuery = areasQuery.or(`province.in.(${provinceMap[province].join(",")}),province.is.null`);
      } else if (province) {
        areasQuery = areasQuery.or(`province.eq.${province},province.is.null`);
      }

      const { data: areaMaster } = await areasQuery;

      // 3. คำนวณรวบยอดสถิติย่านยอดนิยม (กรองเฉพาะย่านที่มีทรัพย์สิน ACTIVE อยู่จริงเท่านั้น)
      const optimizedAreas = (areaMaster || []).map((area: any) => {
        const areaNameTh = typeof area.name === "string" ? area.name : area.name?.th || "";
        const areaNameEn = typeof area.name === "string" ? null : area.name?.en || null;
        const areaNameCn = typeof area.name === "string" ? null : area.name?.cn || null;
        const areaNameRu = typeof area.name === "string" ? null : area.name?.ru || null;

        // คำนวณนับจำนวนทรัพย์ในโครงการที่โยงอยู่ในย่านยอดนิยมนั้น
        let totalCount = 0;
        if (statsData) {
          for (const s of statsData) {
            if (s.primary_popular_area && s.primary_popular_area.trim().toLowerCase() === areaNameTh.trim().toLowerCase()) {
              totalCount += Number(s.property_count || 0);
            }
          }
        }

        return {
          key: `${areaNameTh}__${area.province || ""}`,
          name: areaNameTh, // Legacy Support
          popular_area: areaNameTh,
          popular_area_en: areaNameEn,
          popular_area_cn: areaNameCn,
          popular_area_ru: areaNameRu,
          name_en: areaNameEn, // Legacy Support
          name_cn: areaNameCn, // Legacy Support
          name_ru: areaNameRu, // Legacy Support
          province: area.province || "",
          count: totalCount,
          cover: area.image_url || null,
          slug: area.slug || encodeURIComponent(areaNameTh),
        };
      });

      // กรองเอาเฉพาะย่านที่มีจำนวนทรัพย์จริง จัดลำดับความนิยม และแสดงผลสูงสุด 8 ย่านตามดีไซน์เดิม
      return optimizedAreas
        .filter((a: any) => a.count > 0)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 8);

    } catch (e) {
      console.error("getPopularAreasAction error via View:", e);
      return [];
    }
  },
  ["popular-areas-cache-v8"],
  { revalidate: 3600, tags: ["popular-areas", "public-data"] }
);

