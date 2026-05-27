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
        if (province) query = query.eq("province", province);
        const { data } = await query;
        return (data || []).map((item: any) => {
          if (typeof item.name === "string") return item.name;
          return item.name?.th || item.name?.en || item.name?.default || "";
        }).filter(Boolean);
      }

      // 🚀 Public Mode: Full optimization for landing page
      const provinceMap: Record<string, string[]> = {
        Bangkok: ["กรุงเทพมหานคร"],
        Phuket: ["ภูเก็ต", "Phuket"],
      };

      let query = client
        .from("properties")
        .select("id, popular_area, province, created_at")
        .eq("status", "ACTIVE");

      if (province && provinceMap[province]) {
        query = query.in("province", provinceMap[province]);
      } else if (province) {
        query = query.eq("province", province);
      }

      const { data: props, error: propErr } = await query
        .order("created_at", { ascending: false })
        .limit(300);

      if (propErr) throw propErr;
      const properties = Array.isArray(props) ? props : [];
      const ids = properties.map((p: any) => p.id).filter(Boolean);

      if (ids.length === 0) return [];

      const { data: covers } = await client
        .from("property_images")
        .select("property_id, image_url, sort_order, is_cover")
        .in("property_id", ids)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true });

      const coverByPropertyId = new Map<string, string>();
      for (const img of (covers ?? []) as any[]) {
        if (img?.property_id && img?.image_url && !coverByPropertyId.has(img.property_id)) {
          coverByPropertyId.set(img.property_id, img.image_url);
        }
      }

      const map = new Map<string, PopularAreaItem>();
      let areasQuery = client.from("popular_areas_v3").select("name, province");

      if (province && provinceMap[province]) {
        areasQuery = areasQuery.or(`province.in.(${provinceMap[province].join(",")}),province.is.null`);
      } else if (province) {
        areasQuery = areasQuery.or(`province.eq.${province},province.is.null`);
      }

      const { data: validAreasData } = await areasQuery;
      const areaTranslations = new Map<string, any>();
      (validAreasData || []).forEach((a: any) => {
        const areaNameTh = typeof a.name === "string" ? a.name : a.name?.th || a.name?.default || "";
        const areaNameEn = typeof a.name === "string" ? null : a.name?.en || null;
        const areaNameCn = typeof a.name === "string" ? null : a.name?.cn || null;
        const areaNameRu = typeof a.name === "string" ? null : a.name?.ru || null;
        areaTranslations.set(areaNameTh, { en: areaNameEn, cn: areaNameCn, ru: areaNameRu });
      });

      const validAreaNames = new Set(areaTranslations.keys());

      for (const p of properties as any[]) {
        const area = (p?.popular_area ?? "").trim();
        const prov = (p?.province ?? "").trim();
        if (!area || !prov || (validAreaNames.size > 0 && !validAreaNames.has(area))) continue;

        const trans = areaTranslations.get(area);
        const cover = coverByPropertyId.get(p.id) ?? null;

        const existing = map.get(area);
        if (!existing) {
          map.set(area, {
            key: `${area}__${prov}`,
            name: area, // Legacy Support
            popular_area: area,
            popular_area_en: trans?.en ?? null,
            popular_area_cn: trans?.cn ?? null,
            popular_area_ru: trans?.ru ?? null,
            name_en: trans?.en ?? null, // Legacy Support
            name_cn: trans?.cn ?? null, // Legacy Support
            name_ru: trans?.ru ?? null, // Legacy Support
            province: prov,
            count: 1,
            cover,
          });
        } else {
          existing.count += 1;
          if (!existing.cover && cover) existing.cover = cover;
        }
      }

      return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 8);
    } catch (e) {
      console.error("getPopularAreasAction error:", e);
      return [];
    }
  },
  ["popular-areas-cache-v7"],
  { revalidate: 60, tags: ["popular-areas", "public-data"] }
);

