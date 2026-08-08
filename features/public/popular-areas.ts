"use server";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { getPublicImageUrl } from "@/features/properties/image-utils";

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
      const client = createPublicClient();
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
  { revalidate: 2592000, tags: ["provinces", "popular-areas", "public-data"] }
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
      const client = createPublicClient();
      
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

      // 3. กรองเอาเฉพาะย่านที่มีจำนวนทรัพย์จริงก่อนเพื่อจัดอันดับหา Top 8 ย่านแรก
      const preMappedAreas = (areaMaster || []).map((area: any) => {
        const areaNameTh = typeof area.name === "string" ? area.name : area.name?.th || "";
        const areaNameEn = typeof area.name === "string" ? null : area.name?.en || null;
        const areaNameCn = typeof area.name === "string" ? null : area.name?.cn || null;
        const areaNameRu = typeof area.name === "string" ? null : area.name?.ru || null;

        let totalCount = 0;
        if (statsData) {
          for (const s of statsData) {
            if (s.primary_popular_area && s.primary_popular_area.trim().toLowerCase() === areaNameTh.trim().toLowerCase()) {
              totalCount += Number(s.property_count || 0);
            }
          }
        }

        return {
          id: area.id,
          nameTh: areaNameTh,
          nameEn: areaNameEn,
          nameCn: areaNameCn,
          nameRu: areaNameRu,
          province: area.province || "",
          count: totalCount,
          cover: area.image_url || null,
          slug: area.slug || encodeURIComponent(areaNameTh),
        };
      });

      // คัดเลือกเฉพาะ Top 16 ย่านที่มีจำนวนทรัพย์จริงสูงสุด
      let top16Areas = preMappedAreas
        .filter((a: any) => a.count > 0)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 16);

      // 🛡️ Fallback: หากจังหวัดนั้นไม่มี popular_area ที่ตั้งค่าไว้ ให้ดึง เขต/แขวง (district/subdistrict) จากทรัพย์ที่มีจริงในจังหวัดนั้นมาแสดงแทน
      if (top16Areas.length === 0 && province) {
        const targetProvinces = provinceMap[province] || [province];
        
        const { data: areaProps } = await client
          .from("properties")
          .select("subdistrict, district, province, main_image")
          .eq("status", "ACTIVE")
          .is("deleted_at", null)
          .in("province", targetProvinces);

        if (areaProps && areaProps.length > 0) {
          const areaCountMap = new Map<string, { count: number; cover?: string; district?: string }>();
          
          for (const p of areaProps) {
            const areaName = (p.subdistrict || p.district || "").trim();
            if (!areaName) continue;
            
            const existing = areaCountMap.get(areaName);
            if (existing) {
              existing.count += 1;
              if (!existing.cover && p.main_image) existing.cover = p.main_image;
            } else {
              areaCountMap.set(areaName, {
                count: 1,
                cover: p.main_image || undefined,
                district: p.district || undefined,
              });
            }
          }

          const fallbackList = Array.from(areaCountMap.entries()).map(([name, data]) => ({
            id: name,
            nameTh: name,
            nameEn: null,
            nameCn: null,
            nameRu: null,
            province: province,
            count: data.count,
            cover: data.cover || null,
            slug: encodeURIComponent(name),
          }));

          top16Areas = fallbackList
            .sort((a, b) => b.count - a.count)
            .slice(0, 16);
        }
      }

      if (top16Areas.length === 0) return [];

      // 4. [S-Tier Optimization] ดึงรูปภาพภาพหน้าปก (main_image) จากทรัพย์สินล่าสุดในแต่ละย่าน (เฉพาะปากช่องย่านท็อป 16 เท่านั้น)
      // การดึงเจาะจงเฉพาะกลุ่ม 16 ย่านนี้ ช่วยเซฟปริมาณดาวน์โหลด Egress เป็นศูนย์และค้นหาเสร็จ in เสี้ยววินาทีครับ
      const targetProvincesForCover = (province && provinceMap[province]) ? provinceMap[province] : (province ? [province] : []);
      const { data: recentProps } = await client
        .from("properties")
        .select("popular_area, subdistrict, district, main_image")
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .not("main_image", "is", null)
        .in("province", targetProvincesForCover)
        .order("created_at", { ascending: false });

      const areaCoverMap = new Map<string, string>();
      if (recentProps) {
        for (const p of recentProps) {
          const areaClean = (p.popular_area || p.subdistrict || p.district || "").trim().toLowerCase();
          if (areaClean && p.main_image && !areaCoverMap.has(areaClean)) {
            areaCoverMap.set(areaClean, p.main_image);
          }
        }
      }

      // 5. แมปข้อมูลย่านกลับคืนให้ผู้ใช้งานหน้าบ้านครบทุกชุด
      return top16Areas.map((area: any) => {
        // ใช้รูปภาพปกจาก Master ย่านก่อน ถ้าไม่มีค่อย Fallback ไปใช้รูปทรัพย์สินล่าสุดในย่านนั้น
        const coverImage = area.cover || areaCoverMap.get(area.nameTh.trim().toLowerCase()) || null;

        return {
          key: `${area.nameTh}__${area.province}`,
          name: area.nameTh, // Legacy Support
          popular_area: area.nameTh,
          popular_area_en: area.nameEn,
          popular_area_cn: area.nameCn,
          popular_area_ru: area.nameRu,
          name_en: area.nameEn, // Legacy Support
          name_cn: area.nameCn, // Legacy Support
          name_ru: area.nameRu, // Legacy Support
          province: area.province,
          count: area.count,
          cover: getPublicImageUrl(coverImage) || null,
          slug: area.slug,
        };
      });

    } catch (e) {
      console.error("getPopularAreasAction error via View:", e);
      return [];
    }
  },
  ["popular-areas-cache-v9"],
  { revalidate: 31536000, tags: ["popular-areas", "public-data"] }
);

export type DynamicSuggestionItem = {
  text: string;
  type: "landmark" | "transit" | "area" | "feature";
  label: string;
};

/**
 * [S-Tier] Fetch all active search suggestions dynamically from master data,
 * nearby places saved in Step 3 (projects/properties), stations, and popular areas.
 */
export const getDynamicSearchSuggestionsAction = unstable_cache(
  async (): Promise<DynamicSuggestionItem[]> => {
    try {
      const client = await createClient();

      // 1. Fetch Transit Stations & Master Data
      const { data: masterData } = await client
        .from("ref_master_data")
        .select("type, code, label")
        .eq("is_active", true);

      // 2. Fetch Projects (Names & Address Info Nearby Places)
      const { data: projectsData } = await client
        .from("projects_v3")
        .select("name, address_info")
        .eq("is_active", true);

      // 3. Fetch Popular Areas
      const { data: areasData } = await client
        .from("popular_areas_v3")
        .select("name_th")
        .eq("is_active", true);

      const itemsSet = new Map<string, DynamicSuggestionItem>();

      // Add Master Stations
      if (masterData) {
        for (const item of masterData) {
          if (item.type === "TRANSIT_STATION") {
            const labelObj = item.label as any;
            const thName = labelObj?.th || item.code;
            if (thName) {
              const textWithNear = thName.startsWith("ใกล้") ? thName : `ใกล้ ${thName}`;
              itemsSet.set(textWithNear, {
                text: textWithNear,
                type: "transit",
                label: "รถไฟฟ้า",
              });
              if (!thName.startsWith("ใกล้")) {
                itemsSet.set(thName, {
                  text: thName,
                  type: "transit",
                  label: "สถานีรถไฟฟ้า",
                });
              }
            }
          }
        }
      }

      // Add Master/Step 3 Nearby Places from Projects
      if (projectsData) {
        for (const proj of projectsData) {
          if (proj.name) {
            itemsSet.set(proj.name, {
              text: proj.name,
              type: "area",
              label: "โครงการ",
            });
          }

          const addressInfo = proj.address_info as any;
          if (addressInfo) {
            // Extract nearby_places array from Step 3
            if (Array.isArray(addressInfo.nearby_places)) {
              for (const place of addressInfo.nearby_places) {
                const placeName = place.name || place.label || place.place_name || place.name_th;
                if (placeName && typeof placeName === "string") {
                  const cleanName = placeName.trim();
                  const textWithNear = cleanName.startsWith("ใกล้") ? cleanName : `ใกล้ ${cleanName}`;
                  itemsSet.set(textWithNear, {
                    text: textWithNear,
                    type: "landmark",
                    label: "สถานที่ใกล้เคียง",
                  });
                }
              }
            }
            // Extract nearby_transits array from Step 3
            if (Array.isArray(addressInfo.nearby_transits)) {
              for (const transit of addressInfo.nearby_transits) {
                const stationName = transit.station_name || transit.name || transit.label;
                if (stationName && typeof stationName === "string") {
                  const cleanStation = stationName.trim();
                  const textWithNear = cleanStation.startsWith("ใกล้") ? cleanStation : `ใกล้ ${cleanStation}`;
                  itemsSet.set(textWithNear, {
                    text: textWithNear,
                    type: "transit",
                    label: "รถไฟฟ้า",
                  });
                }
              }
            }
          }
        }
      }

      // Add Popular Areas
      if (areasData) {
        for (const area of areasData) {
          if (area.name_th) {
            itemsSet.set(area.name_th, {
              text: area.name_th,
              type: "area",
              label: "ย่านยอดนิยม",
            });
            const nearArea = `ใกล้ ${area.name_th}`;
            itemsSet.set(nearArea, {
              text: nearArea,
              type: "landmark",
              label: "ทำเลใกล้เคียง",
            });
          }
        }
      }

      return Array.from(itemsSet.values());
    } catch (err) {
      console.error("getDynamicSearchSuggestionsAction error:", err);
      return [];
    }
  },
  ["dynamic-search-suggestions-v2"],
  { revalidate: 31536000, tags: ["suggestions", "master-data", "projects", "public-data"] }
);

