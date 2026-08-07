"use server";
import { unstable_cache } from "next/cache";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import type { PublicPropertyNearStation } from "./stations";

// ============================================================
// Types
// ============================================================

export interface PublicAreaDetail {
  id: string;
  name: { th: string; en: string; cn?: string; ru?: string };
  slug: string;
  imageUrl: string | null;
  province: string | null;
  description: { th?: string; en?: string; cn?: string; ru?: string } | null;
  seoTitle: { th?: string; en?: string; cn?: string; ru?: string } | null;
  seoDescription: { th?: string; en?: string; cn?: string; ru?: string } | null;
  isAiGenerated: boolean;
}

export interface PropertyTypeStat {
  type: string;
  saleMedian: number | null;
  rentMedian: number | null;
  priceSqmMedian: number | null;
  count: number;
}

export interface AreaMarketInsights {
  condo: PropertyTypeStat;
  house: PropertyTypeStat;
  byType: PropertyTypeStat[];
  hasEnoughData: boolean;
}

export interface RelatedProjectInArea {
  id: string;
  name: { th: string; en: string; cn?: string; ru?: string };
  slug: string;
  developer: string | null;
  imageUrl: string | null;
  propertyCount: number;
}

export interface RelatedStationInArea {
  code: string;
  label: { th: string; en: string; cn?: string; ru?: string };
  transitType: string;
  color: string;
  slug: string;
}

// ============================================================
// Helper Functions
// ============================================================

function getMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

const LINE_COLORS: Record<string, string> = {
  BTS: "#7BC542",
  MRT: "#1E3A8A",
  MRT_PURPLE: "#7C3AED",
  MRT_YELLOW: "#F59E0B",
  MRT_PINK: "#EC4899",
  ARL: "#DC2626",
  SRT_RED: "#EF4444",
  GOLD: "#D97706",
  BRT: "#059669",
};

// ============================================================
// Server Actions
// ============================================================

export async function getAreaBySlug(slug: string): Promise<PublicAreaDetail | null> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();

      let { data, error } = await supabase
        .from("popular_areas_v3")
        .select("id, name, province, slug, image_url, description, seo_title, seo_description, is_ai_generated")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching popular area by slug", { slug, error, data });
        return null;
      }

      if (!data) {
        // If the provided slug looks like a UUID, try a lookup by id as a fallback
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (uuidRegex.test(slug)) {
          const { data: dataById, error: errorById } = await supabase
            .from("popular_areas_v3")
            .select("id, name, province, slug, image_url, description, seo_title, seo_description, is_ai_generated")
            .eq("id", slug)
            .eq("is_active", true)
            .maybeSingle();

          if (errorById || !dataById) {
            console.error("Fallback lookup by id failed for popular area", { slug, error: errorById, data: dataById });
            return null;
          }

          console.info("Fallback: found popular area by id for incoming slug", { incoming: slug, resolvedSlug: dataById.slug });
          data = dataById as any;
        } else {
          console.info("No popular area found for slug", { slug });
          return null;
        }
      }

      if (!data) return null;

      const nameObj = (data as any).name as Record<string, string> | null || {};

      return {
        id: data.id,
        name: {
          th: nameObj.th || "",
          en: nameObj.en || "",
          cn: nameObj.cn || "",
          ru: nameObj.ru || "",
        },
        slug: data.slug || "",
        province: data.province,
        imageUrl: getPublicImageUrl(data.image_url) || null,
        description: data.description as PublicAreaDetail["description"],
        seoTitle: data.seo_title as PublicAreaDetail["seoTitle"],
        seoDescription: data.seo_description as PublicAreaDetail["seoDescription"],
        isAiGenerated: !!data.is_ai_generated,
      };
    },
    ["public-area-by-slug", slug],
    { revalidate: 604800, tags: ["popular-areas", "public-data"] }
  )();
}

export async function getAreaMarketInsights(areaNameTh: string): Promise<AreaMarketInsights> {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();

      const { data, error } = await supabase
        .from("properties")
        .select("price, rental_price, size_sqm, property_type, listing_type")
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .eq("popular_area", areaNameTh);

      if (error || !data) {
        console.error("Error fetching properties for market insights:", error?.message);
        const emptyStat = { type: "CONDO", saleMedian: null, rentMedian: null, priceSqmMedian: null, count: 0 };
        return {
          condo: emptyStat,
          house: { ...emptyStat, type: "HOUSE" },
          byType: [],
          hasEnoughData: false,
        };
      }

      const typeBuckets: Record<string, { sales: number[]; rents: number[]; sqms: number[] }> = {};

      for (const item of data) {
        const pType = (item.property_type || "OTHER").toUpperCase();
        const size = Number(item.size_sqm) || 0;
        const saleVal = Number(item.price) || 0;
        const rentVal = Number(item.rental_price) || 0;

        if (!typeBuckets[pType]) {
          typeBuckets[pType] = { sales: [], rents: [], sqms: [] };
        }

        if (saleVal > 0) {
          typeBuckets[pType].sales.push(saleVal);
          if (size > 0) typeBuckets[pType].sqms.push(saleVal / size);
        }

        if (rentVal > 0) {
          typeBuckets[pType].rents.push(rentVal);
        }
      }

      const byType: PropertyTypeStat[] = Object.entries(typeBuckets)
        .map(([pType, bucket]) => {
          const totalCount = Math.max(bucket.sales.length, bucket.rents.length, bucket.sqms.length);
          return {
            type: pType,
            saleMedian: getMedian(bucket.sales),
            rentMedian: getMedian(bucket.rents),
            priceSqmMedian: getMedian(bucket.sqms),
            count: totalCount,
          };
        })
        .filter((stat) => stat.count > 0)
        .sort((a, b) => b.count - a.count);

      const condoStat = byType.find((s) => s.type === "CONDO") || {
        type: "CONDO",
        saleMedian: null,
        rentMedian: null,
        priceSqmMedian: null,
        count: 0,
      };

      const houseStat = byType.find((s) => ["HOUSE", "TOWNHOME", "VILLA", "POOL_VILLA"].includes(s.type)) || {
        type: "HOUSE",
        saleMedian: null,
        rentMedian: null,
        priceSqmMedian: null,
        count: 0,
      };

      return {
        condo: condoStat,
        house: houseStat,
        byType,
        hasEnoughData: data.length >= 2,
      };
    },
    ["public-area-market-insights", areaNameTh],
    { revalidate: 604800, tags: ["popular-areas", "public-data"] }
  )();
}

/**
 * Fetch top projects and transit stations associated with active properties in this area
 */
export async function getTransitAndProjectsInArea(
  areaNameTh: string
): Promise<{ projects: RelatedProjectInArea[]; stations: RelatedStationInArea[] }> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      // Fetch properties matching this popular area name
      const { data: props, error } = await supabase
        .from("properties")
        .select("project_id, transit_station_name, transit_type")
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .eq("popular_area", areaNameTh);

      if (error || !props) {
        console.error("Error querying relations in area:", error?.message);
        return { projects: [], stations: [] };
      }

      // 1. Projects aggregation
      const projectCounts = new Map<string, number>();
      for (const p of props) {
        if (p.project_id) {
          projectCounts.set(p.project_id, (projectCounts.get(p.project_id) || 0) + 1);
        }
      }

      const sortedProjIds = Array.from(projectCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(entry => entry[0]);

      let relatedProjects: RelatedProjectInArea[] = [];
      if (sortedProjIds.length > 0) {
        const { data: dbProjects } = await supabase
          .from("projects")
          .select("id, name, slug, developer, image_url")
          .in("id", sortedProjIds)
          .eq("is_active", true);

        if (dbProjects) {
          // Fetch fallback cover images from active properties inside these projects if image_url is missing
          const missingImageProjIds = dbProjects
            .filter((p: any) => !p.image_url)
            .map((p: any) => p.id);

          const propertyImageMap = new Map<string, string>();
          if (missingImageProjIds.length > 0) {
            const { data: propImages } = await supabase
              .from("properties")
              .select("project_id, main_image")
              .in("project_id", missingImageProjIds)
              .eq("status", "ACTIVE")
              .is("deleted_at", null);

            if (propImages) {
              for (const pi of propImages) {
                if (pi.project_id && !propertyImageMap.has(pi.project_id)) {
                  let imgUrl = pi.main_image;
                  if (!imgUrl && pi.images) {
                    try {
                      const imgs = typeof pi.images === "string" 
                        ? JSON.parse(pi.images) 
                        : pi.images;
                      if (Array.isArray(imgs) && imgs.length > 0) {
                        imgUrl = imgs[0]?.image_url || imgs[0] || "";
                      }
                    } catch (e) {}
                  }
                  if (imgUrl) {
                    propertyImageMap.set(pi.project_id, imgUrl);
                  }
                }
              }
            }
          }

          relatedProjects = dbProjects.map((proj: any) => {
            const nameObj = proj.name as Record<string, string> | null || {};
            return {
              id: proj.id,
              name: {
                th: nameObj.th || "",
                en: nameObj.en || "",
                cn: nameObj.cn || undefined,
                ru: nameObj.ru || undefined,
              },
              slug: proj.slug || "",
              developer: proj.developer,
              imageUrl: proj.image_url || propertyImageMap.get(proj.id) || null,
              propertyCount: projectCounts.get(proj.id) || 0,
            };
          });
          // Keep descending order of listing volume
          relatedProjects.sort((a, b) => b.propertyCount - a.propertyCount);
        }
      }

      // 2. Transit stations aggregation
      const stationCodes = Array.from(
        new Set(props.map((p: any) => p.transit_station_name).filter(Boolean))
      );

      let relatedStations: RelatedStationInArea[] = [];
      if (stationCodes.length > 0) {
        const { data: stations } = await supabase
          .from("ref_master_data")
          .select("code, label, metadata")
          .eq("type", "TRANSIT_STATION")
          .eq("is_active", true)
          .in("code", stationCodes);

        if (stations) {
          relatedStations = stations.map((item: any) => {
            const labelObj = item.label as Record<string, string> | null || {};
            const meta = item.metadata as Record<string, any> | null || {};
            const transitType = meta.transit_type || "OTHER";
            return {
              code: item.code,
              label: {
                th: labelObj.th || item.code,
                en: labelObj.en || item.code,
                cn: labelObj.cn || undefined,
                ru: labelObj.ru || undefined,
              },
              transitType,
              color: meta.line_color || LINE_COLORS[transitType] || "#6B7280",
              slug: meta.slug || item.code.toLowerCase().replace(/_/g, "-"),
            };
          });
        }
      }

      return {
        projects: relatedProjects,
        stations: relatedStations,
      };
    },
    ["public-transit-and-projects-in-area", areaNameTh],
    { revalidate: 604800, tags: ["popular-areas", "public-data"] }
  )();
}

export async function getPopularAreas(limit = 6): Promise<any[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      // 1. Fetch the set of popular_area names that have active properties
      const { data: propAreas } = await supabase
        .from("properties")
        .select("popular_area")
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .not("popular_area", "is", null);

      const activeAreaNames = new Set<string>(
        (propAreas || []).map((p: any) => (p.popular_area as string)?.trim()).filter(Boolean)
      );

      // 2. Fetch candidate areas (fetch more so we can filter to the requested limit)
      const { data, error } = await supabase
        .from("popular_areas_v3")
        .select("id, name, slug, image_url, province")
        .eq("is_active", true)
        .order("sort_order")
        .limit(200);

      if (error || !data) return [];

      const result = [];
      for (const item of data) {
        if (result.length >= limit) break;

        const nameObj = item.name as Record<string, string> | null || {};
        const nameTh = (nameObj.th || "").trim();

        // Skip areas with no active properties
        if (!activeAreaNames.has(nameTh)) continue;

        let imageUrl = item.image_url;

        if (!imageUrl) {
          const { data: propImg } = await supabase
            .from("properties")
            .select("main_image")
            .eq("popular_area", nameTh)
            .eq("status", "ACTIVE")
            .is("deleted_at", null)
            .limit(1)
            .maybeSingle();

          if (propImg) {
            imageUrl = propImg.main_image;
            if (!imageUrl && propImg.images) {
              try {
                const imgs = typeof propImg.images === "string"
                  ? JSON.parse(propImg.images)
                  : propImg.images;
                if (Array.isArray(imgs) && imgs.length > 0) {
                  imageUrl = imgs[0]?.image_url || imgs[0] || "";
                }
              } catch (e) {}
            }
          }
        }

        result.push({
          id: item.id,
          name: { th: nameTh, en: nameObj.en || "" },
          slug: item.slug || "",
          imageUrl: getPublicImageUrl(imageUrl) || null,
          province: item.province,
        });
      }
      return result;
    },
    ["public-popular-areas", String(limit)],
    { revalidate: 604800, tags: ["popular-areas", "public-data"] }
  )();
}

export async function getRelatedAreas(excludeId: string, limit = 50): Promise<any[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      // 1. Fetch the set of popular_area names that have active properties
      const { data: propAreas } = await supabase
        .from("properties")
        .select("popular_area")
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .not("popular_area", "is", null);

      const activeAreaNames = new Set<string>(
        (propAreas || []).map((p: any) => (p.popular_area as string)?.trim()).filter(Boolean)
      );

      // 2. Fetch all candidate areas (excluding current)
      const { data, error } = await supabase
        .from("popular_areas_v3")
        .select("id, name, slug, image_url, province")
        .eq("is_active", true)
        .neq("id", excludeId)
        .order("sort_order")
        .limit(200); // fetch more then filter in-memory

      if (error || !data) return [];

      const result = [];
      for (const item of data) {
        if (result.length >= limit) break;

        const nameObj = item.name as Record<string, string> | null || {};
        const nameTh = (nameObj.th || "").trim();

        // Skip areas with no active properties
        if (!activeAreaNames.has(nameTh)) continue;

        let imageUrl = item.image_url;

        if (!imageUrl) {
          // Fetch fallback cover image from active properties in this popular area
          const { data: propImg } = await supabase
            .from("properties")
            .select("main_image")
            .eq("popular_area", nameTh)
            .eq("status", "ACTIVE")
            .is("deleted_at", null)
            .limit(1)
            .maybeSingle();

          if (propImg) {
            imageUrl = propImg.main_image;
            if (!imageUrl && propImg.images) {
              try {
                const imgs = typeof propImg.images === "string" 
                  ? JSON.parse(propImg.images) 
                  : propImg.images;
                if (Array.isArray(imgs) && imgs.length > 0) {
                  imageUrl = imgs[0]?.image_url || imgs[0] || "";
                }
              } catch (e) {}
            }
          }
        }

        result.push({
          id: item.id,
          name: { th: nameTh, en: nameObj.en || "" },
          slug: item.slug || "",
          imageUrl: getPublicImageUrl(imageUrl) || null,
          province: item.province,
        });
      }
      return result;
    },
    ["public-related-areas", excludeId, String(limit)],
    { revalidate: 604800, tags: ["popular-areas", "public-data"] }
  )();
}

/**
 * Get all popular area slugs for static generation
 */
export const getAllAreaSlugs = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("popular_areas_v3")
      .select("slug")
      .eq("is_active", true);

    if (error || !data) return [];
    return data.map((item: any) => item.slug).filter(Boolean);
  },
  ["all-area-slugs-v1"],
  { revalidate: 31536000, tags: ["popular-areas", "area-slugs", "public-data"] }
);

/**
 * Fetch all active properties in this area
 */
export async function getPropertiesInArea(
  areaNameTh: string
): Promise<PublicPropertyNearStation[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("properties")
        .select(
          `id, slug, title, title_en, title_cn, title_ru, images, main_image, price, rental_price, original_price, original_rental_price, price_per_sqm, rent_price_per_sqm, land_size_sqwah, bedrooms, bathrooms, size_sqm, property_type, listing_type, status, district, province, popular_area, popular_area_en, popular_area_cn, popular_area_ru, near_transit, transit_station_name, transit_station_name_en, transit_station_name_cn, transit_station_name_ru, transit_type, transit_distance_meters, nearby_transits, is_hot_deal, is_featured, currency, is_fully_furnished, is_pet_friendly, verified, created_at, updated_at, min_contract_months,
          property_features (
            features (id, name, name_en, name_cn, name_ru, icon_key)
          )`
        )
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .eq("popular_area", areaNameTh)
        .order("is_featured", { ascending: false })
        .order("is_hot_deal", { ascending: false })
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Error fetching properties in area:", error?.message);
        return [];
      }

      return (data || []).map((row: any) => {
        const { property_features, ...rest } = row;
        return {
          ...rest,
          features: (property_features || []).map((pf: any) => pf.features).filter((f: any) => !!f),
        };
      }) as PublicPropertyNearStation[];
    },
    ["public-properties-in-area", areaNameTh],
    { revalidate: 604800, tags: ["properties", "public-data"] }
  )();
}
