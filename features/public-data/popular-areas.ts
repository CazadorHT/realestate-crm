import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export type PopularAreaItem = {
  key: string;
  popular_area: string;
  popular_area_en: string | null;
  popular_area_cn: string | null;
  province: string;
  count: number;
  cover: string | null;
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
  ["public-provinces-list"],
  { revalidate: 86400, tags: ["provinces"] } // Cache for 24h as provinces rarely change
);

/**
 * [S-Tier] Highly Optimized Popular Areas Fetcher
 * - Wrapped with unstable_cache for extreme performance
 * - Pre-filters valid areas from the database
 */
export const getPopularAreasAction = unstable_cache(
  async (province?: string): Promise<PopularAreaItem[]> => {
    try {
      const client = await createClient();

      // Map English keys to Thai DB values
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

      const { data: covers, error: coverErr } = await client
        .from("property_images")
        .select("property_id, image_url, sort_order, is_cover")
        .in("property_id", ids)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true });

      if (coverErr) console.error("popular-areas images error:", coverErr);

      const coverByPropertyId = new Map<string, string>();
      for (const img of (covers ?? []) as any[]) {
        const pid = img?.property_id;
        const url = img?.image_url;
        if (!pid || !url) continue;
        if (!coverByPropertyId.has(pid)) coverByPropertyId.set(pid, url);
      }

      const map = new Map<string, PopularAreaItem>();

      let areasQuery = client
        .from("popular_areas")
        .select("name, name_en, name_cn, province");

      if (province && provinceMap[province]) {
        const names = provinceMap[province];
        areasQuery = areasQuery.or(
          `province.in.(${names.join(",")}),province.is.null`,
        );
      } else if (province) {
        areasQuery = areasQuery.or(`province.eq.${province},province.is.null`);
      }

      const { data: validAreasData } = await areasQuery;

      const areaTranslations = new Map<
        string,
        { en: string | null; cn: string | null }
      >();
      (validAreasData || []).forEach((a: any) => {
        areaTranslations.set(a.name, { en: a.name_en, cn: a.name_cn });
      });

      const validAreaNames = new Set(areaTranslations.keys());

      for (const p of properties as any[]) {
        const area = (p?.popular_area ?? "").trim();
        const prov = (p?.province ?? "").trim();
        if (!area || !prov) continue;
        if (validAreaNames.size > 0 && !validAreaNames.has(area)) continue;

        const key = area;
        const cover = coverByPropertyId.get(p.id) ?? null;
        const trans = areaTranslations.get(area);

        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            key: `${area}__${prov}`,
            popular_area: area,
            popular_area_en: trans?.en ?? null,
            popular_area_cn: trans?.cn ?? null,
            province: prov,
            count: 1,
            cover,
          });
        } else {
          existing.count += 1;
          if (!existing.cover && cover) existing.cover = cover;
        }
      }

      return Array.from(map.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    } catch (e) {
      console.error("getPopularAreasAction error:", e);
      return [];
    }
  },
  ["popular-areas-cache"],
  { revalidate: 3600, tags: ["popular-areas"] } // Cache for 1h as per user insight
);
