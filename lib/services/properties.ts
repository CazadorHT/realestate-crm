import { cache } from "react";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import {
  getSafeImages,
  getCoverImage,
  getSafeNearbyPlaces,
  getSafeNearbyTransits,
} from "@/lib/property-hardened-utils";
import { 
  PropertySearchResponse, 
  PropertyFacets,
  FacetRPCParams
} from "@/features/properties/types/search";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { getPopularAreasLookupMap } from "@/features/public/popular-areas";
import { detectSearchIntent } from "../search-config";

// 🚀 Fast Memory Cache for Public Search Facets (1-hour TTL) for zero database egress across search queries
const facetsMemoryCache = new Map<string, { data: any; timestamp: number }>();
const FACETS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function invalidateFacetsMemoryCache() {
  facetsMemoryCache.clear();
}

export type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  title_cn: string | null;
  title_ru: string | null;
  project_id?: string | null;
  project_name?: string | null;
  projects?: {
    name_th?: string | null;
    name_en?: string | null;
  } | null;
  description: string | null;
  description_en: string | null;
  description_cn: string | null;
  description_ru: string | null;
  property_type: string | null;
  price: number | null;
  rental_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  parking_slots: number | null;
  floor: number | null;
  created_at: string;
  updated_at: string;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  address_line1: string | null;
  address_line1_en: string | null;
  address_line1_cn: string | null;
  address_line1_ru: string | null;
  popular_area: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  popular_area_ru?: string | null;
  original_price: number | null;
  original_rental_price: number | null;
  verified: boolean | null;
  min_contract_months: number | null;
  meta_keywords: string[] | null;
  structured_data?: unknown | null;
  near_transit: boolean | null;
  transit_type: string | null;
  transit_station_name: string | null;
  transit_station_name_en: string | null;
  transit_station_name_cn: string | null;
  transit_station_name_ru: string | null;
  transit_distance_meters: number | null;
  google_maps_link: string | null;
  is_fully_furnished: boolean | null;
  is_bare_shell: boolean | null;
  is_pet_friendly: boolean | null;
  is_foreigner_quota: boolean | null;
  is_tax_registered: boolean | null;
  is_hot_deal: boolean | null;
  allow_airbnb: boolean | null;
  meta_data?: Record<string, unknown> | null;
  bumped_at?: string | null;
  amenities: unknown | null;
  nearby_places: unknown | null;
  nearby_transits: unknown | null;
  ai_summary_content: string | null;

  images: Array<{
    url?: string;
    image_url?: string;
    storage_path: string | null;
    is_cover: boolean | null;
    sort_order: number | null;
  }> | null;
  property_images?: Array<{
    image_url: string;
    storage_path: string | null;
    is_cover: boolean | null;
    sort_order: number | null;
  }> | null;
  property_features?: Array<{
    features: {
      id: string;
      name: string;
      name_en: string | null;
      name_cn: string | null;
      name_ru: string | null;
      icon_key: string;
    } | null;
  }> | null;
};

const PUBLIC_LIST_COLUMNS = `
  id, slug, title, title_en, title_cn, title_ru, project_id,
  property_type, price, rental_price, original_price, original_rental_price,
  verified, min_contract_months, bedrooms, meta_keywords, bathrooms,
  size_sqm, land_size_sqwah, parking_slots, floor, created_at, updated_at,
  bumped_at:meta_data->>bumped_at,
  listing_type, popular_area, popular_area_en, popular_area_cn, popular_area_ru, province, district, subdistrict,
  address_line1, address_line1_en,
  is_hot_deal,
  near_transit, transit_type, transit_station_name,
  transit_station_name_en, transit_station_name_cn, transit_station_name_ru, transit_distance_meters,
  google_maps_link, is_fully_furnished, is_bare_shell,
  is_pet_friendly, is_foreigner_quota, is_tax_registered,
  property_images (
    image_url, storage_path, is_cover, sort_order
  )
`;

const PUBLIC_DETAIL_COLUMNS = `
  id, slug, title, title_en, title_cn, title_ru, description, description_en, description_cn, description_ru, project_id,
  property_type, price, rental_price, original_price, original_rental_price,
  verified, min_contract_months, bedrooms, meta_keywords, bathrooms,
  size_sqm, land_size_sqwah, parking_slots, floor, created_at, updated_at,
  listing_type, popular_area, popular_area_en, popular_area_cn, popular_area_ru, province, district, subdistrict,
  address_line1, address_line1_en, address_line1_cn, address_line1_ru,
  nearby_transits, is_hot_deal,
  near_transit, transit_type, transit_station_name,
  transit_station_name_en, transit_station_name_cn, transit_station_name_ru, transit_distance_meters,
  google_maps_link, is_fully_furnished, is_bare_shell,
  is_pet_friendly, is_foreigner_quota, is_tax_registered,
  amenities,
  property_images (
    image_url, storage_path, is_cover, sort_order
  ),
  property_features (
    features (id, name, name_en, name_cn, name_ru, icon_key)
  )
`;

function buildLocation(row: PropertyRow) {
  const parts = [
    row.address_line1,
    row.subdistrict,
    row.district,
    row.province,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export interface GetPropertiesOptions {
  q?: string;
  ids?: string[];
  filter?: "hot_deals" | "all";
  limit?: number;
  province?: string;
  district?: string;
  area?: string;
  popular_area?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  priceType?: "SALE-RENT" | "SALE" | "RENT";
  listingType?: "SALE" | "RENT" | "SALE_AND_RENT" | "ALL";
  minSize?: number;
  maxSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  nearTrain?: boolean;
  petFriendly?: boolean;
  fullyFurnished?: boolean;
  isForeigner?: boolean;
  companyRegistered?: boolean;
  allowAirbnb?: boolean;
  luxuryVilla?: boolean;
  cbd?: boolean;
  transitStation?: string;
  includeFacets?: boolean;
  sort?: "NEWEST" | "PRICE_ASC" | "PRICE_DESC" | "AREA_ASC" | "AREA_DESC";
}

import { unstable_cache } from "next/cache";

export const getPublicProperties = cache(async (options: GetPropertiesOptions = {}) => {
    return unstable_cache(
      async () => {
        const supabase = createPublicClient();

        let query = supabase
          .from("properties")
          .select(PUBLIC_LIST_COLUMNS)
          .eq("status", "ACTIVE")
          .is("deleted_at", null);

        if (options.ids && options.ids.length > 0)
          query = query.in("id", options.ids);
        
        if (options.filter === "hot_deals" || (options.filter as string) === "hot_deal")
          query = query.eq("is_hot_deal", true);

        if (options.province && options.province !== "ALL") {
          query = query.eq("province", options.province);
        }
        const targetArea = options.area || options.popular_area;
        if (targetArea && targetArea !== "ALL") {
          query = query.or(`subdistrict.ilike.%${targetArea}%,popular_area.ilike.%${targetArea}%,popular_area_en.ilike.%${targetArea}%,popular_area_cn.ilike.%${targetArea}%,popular_area_ru.ilike.%${targetArea}%`);
        }

        if (options.propertyType && options.propertyType !== "ALL") {
          if (options.propertyType.includes(",")) {
            query = query.in("property_type", options.propertyType.split(","));
          } else {
            query = query.eq("property_type", options.propertyType);
          }
        }

        if (options.luxuryVilla) {
          query = query.or('and(property_type.in.(VILLA,POOL_VILLA),or(price.gt.0,rental_price.gt.0)),and(property_type.eq.HOUSE,price.gte.8000000)');
        }

        if (options.cbd) {
          query = query.or('amenities->>is_cbd.eq.true,popular_area.in.("สุขุมวิท","สาทร","สีลม","ทองหล่อ","พร้อมพงษ์","พระราม 9","เพลินจิต","ชิดลม - เพลินจิต","ชิดลม","อโศก","เอกมัย","วิทยุ","หลังสวน - ลุมพินี","หลังสวน","ลุมพินี","ราชดำริ","นานา","ช่องนนทรี","ศาลาแดง","สุรศักดิ์","รัชดา","รัชดาภิเษก")');
        }

        if (options.listingType && options.listingType !== "ALL") {
          if (options.listingType === "SALE")
            query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
          else if (options.listingType === "RENT")
            query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
          else if (options.listingType === "SALE_AND_RENT")
            query = query.eq("listing_type", "SALE_AND_RENT");
        }

        const effectivePriceType = options.priceType || options.listingType;
        if (options.minPrice || options.maxPrice) {
          const min = Number(options.minPrice) || 0;
          const max = Number(options.maxPrice) || 2000000000;
          if (effectivePriceType === "RENT") {
            query = query.gte("rental_price", min).lte("rental_price", max);
          } else {
            query = query.gte("price", min).lte("price", max);
          }
        }

        if (options.minSize || options.maxSize) {
          const minS = Number(options.minSize) || 0;
          const maxS = Number(options.maxSize) || 100000;
          query = query.gte("size_sqm", minS).lte("size_sqm", maxS);
        }

        if (options.nearTrain) query = query.eq("near_transit", true);
        if (options.petFriendly) query = query.eq("is_pet_friendly", true);
        if (options.fullyFurnished) query = query.eq("is_fully_furnished", true);
        if (options.isForeigner) query = query.eq("is_foreigner_quota", true);
        if (options.companyRegistered) query = query.eq("is_tax_registered", true);
        if (options.allowAirbnb) query = query.eq("amenities->>allow_airbnb" as any, "true");

        if (options.transitStation) {
          const [stationName, stationType] = options.transitStation.replace(/"/g, "").split("|");
          if (stationType) {
            const csTh = `[{"station_name":"${stationName}","type":"${stationType}"}]`;
            const csEn = `[{"station_name_en":"${stationName}","type":"${stationType}"}]`;
            const csCn = `[{"station_name_cn":"${stationName}","type":"${stationType}"}]`;
            const csRu = `[{"station_name_ru":"${stationName}","type":"${stationType}"}]`;

            query = query.or(
              `nearby_transits.cs."${csTh.replace(/"/g, '\\"')}",` +
              `nearby_transits.cs."${csEn.replace(/"/g, '\\"')}",` +
              `nearby_transits.cs."${csCn.replace(/"/g, '\\"')}",` +
              `nearby_transits.cs."${csRu.replace(/"/g, '\\"')}"`
            );
          } else {
            const csTh = `[{"station_name":"${stationName}"}]`;
            const csEn = `[{"station_name_en":"${stationName}"}]`;
            const csCn = `[{"station_name_cn":"${stationName}"}]`;
            const csRu = `[{"station_name_ru":"${stationName}"}]`;

            query = query.or(
              `nearby_transits.cs."${csTh.replace(/"/g, '\\"')}",` +
              `nearby_transits.cs."${csEn.replace(/"/g, '\\"')}",` +
              `nearby_transits.cs."${csCn.replace(/"/g, '\\"')}",` +
              `nearby_transits.cs."${csRu.replace(/"/g, '\\"')}"`
            );
          }
        }

        if (options.q) {
          const searchTerm = options.q.trim();
          const tokens = searchTerm.split(/\s+/).filter(t => t.length > 0);
          
          const fuzzyQuery = searchTerm
            .replace(/([ก-ฮ\u0E30-\u0E4Ea-zA-Z\u0400-\u04FF\u4e00-\u9fa5])(\d)/g, '$1%$2')
            .replace(/(\d)([ก-ฮ\u0E30-\u0E4Ea-zA-Z\u0400-\u04FF\u4e00-\u9fa5])/g, '$1%$2')
            .replace(/\s+/g, "%");
            
          const pctTerm = `%${fuzzyQuery}%`;

          const textConditions = [
            `title.ilike.${pctTerm}`,
            `title_en.ilike.${pctTerm}`,
            `title_cn.ilike.${pctTerm}`,
            `title_ru.ilike.${pctTerm}`,
            `description.ilike.${pctTerm}`,
            `description_en.ilike.${pctTerm}`,
            `description_cn.ilike.${pctTerm}`,
            `description_ru.ilike.${pctTerm}`,
            `ai_summary_content.ilike.${pctTerm}`,
            `popular_area.ilike.${pctTerm}`,
            `province.ilike.${pctTerm}`,
            `district.ilike.${pctTerm}`,
            `address_line1.ilike.${pctTerm}`,
            `address_line1_en.ilike.${pctTerm}`
          ];

          // Search matching project IDs from `projects` table (both Thai and English)
          try {
            const { data: matchedProjects } = await supabase
              .from("projects")
              .select("id")
              .or(`name->>th.ilike.${pctTerm},name->>en.ilike.${pctTerm},slug.ilike.${pctTerm}`)
              .limit(100);
            if (matchedProjects && matchedProjects.length > 0) {
              const matchedProjectIds = matchedProjects.map((p: any) => p.id);
              textConditions.push(`project_id.in.(${matchedProjectIds.join(",")})`);
            }
          } catch (e) {
            console.warn("Error finding matching projects for search:", e);
          }

          // [Diamond-Tier] Unified Intent Detection
          const { 
            targetCategories, targetListing, targetBeds, 
            targetBaths, targetMinSize, targetLandSize, isSearchingPool 
          } = detectSearchIntent(tokens);

          if (targetListing === "SALE") query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
          else if (targetListing === "RENT") query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
          else if (targetListing === "SALE_AND_RENT") query = query.eq("listing_type", "SALE_AND_RENT");

          if (targetCategories.length > 0) {
            if (targetCategories.includes("OFFICE_BUILDING") || targetCategories.includes("COMMERCIAL_BUILDING")) {
               query = query.in("property_type", ["OFFICE_BUILDING", "COMMERCIAL_BUILDING"]);
            } else if (targetCategories.includes("VILLA")) {
               if (isSearchingPool) query = query.eq("property_type", "POOL_VILLA");
               else query = query.in("property_type", ["VILLA", "POOL_VILLA"]);
            } else {
               query = query.in("property_type", targetCategories);
            }
          }

          if (targetBeds !== null) query = query.eq("bedrooms", targetBeds);
          if (targetBaths !== null) query = query.eq("bathrooms", targetBaths);
          if (targetMinSize !== null) query = query.gte("size_sqm", targetMinSize);
          if (targetLandSize !== null) query = query.gte("land_size_sqwah", targetLandSize);

          query = query.or(textConditions.join(","));
        }

        const itemsPerPage = Math.min(options.limit || 24, 36);

        const effectiveSort = options.sort || "NEWEST";

        if (effectiveSort === "NEWEST") {
          query = query
            .order("meta_data->>bumped_at", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false });
        } else if (effectiveSort === "PRICE_ASC") {
          const effectivePriceType = options.priceType || options.listingType;
          if (effectivePriceType === "RENT") {
            query = query.order("rental_price", { ascending: true, nullsFirst: false });
          } else {
            query = query.order("price", { ascending: true, nullsFirst: false });
          }
        } else if (effectiveSort === "PRICE_DESC") {
          const effectivePriceType = options.priceType || options.listingType;
          if (effectivePriceType === "RENT") {
            query = query.order("rental_price", { ascending: false, nullsFirst: false });
          } else {
            query = query.order("price", { ascending: false, nullsFirst: false });
          }
        } else if (effectiveSort === "AREA_ASC") {
          query = query.order("size_sqm", { ascending: true, nullsFirst: false });
        } else if (effectiveSort === "AREA_DESC") {
          query = query.order("size_sqm", { ascending: false, nullsFirst: false });
        } else {
          // Default fallbacks
          if (options.filter === "hot_deals" || (options.filter as string) === "hot_deal") {
            query = query.order("updated_at", { ascending: false, nullsFirst: false });
          } else {
            query = query
              .order("meta_data->>bumped_at", { ascending: false, nullsFirst: false })
              .order("created_at", { ascending: false });
          }
        }

        const { data: propertiesData, error } = await query.limit(itemsPerPage);
        
        if (error) {
          console.error("Error fetching properties:", error);
          // 🚨 CRITICAL: Throw the error instead of returning [] so Next.js doesn't cache the empty array for 1 year.
          // If this is an ISR revalidation, throwing will cause Next.js to keep serving the old Stale Cache instead of an empty page.
          throw new Error(`Database error fetching properties: ${error.message}`);
        }

        let facets: PropertyFacets | null = null;
        if (options.includeFacets !== false) {
          const rpcParams = {
            p_q: options.q || undefined,
            p_province: options.province || undefined,
            p_property_type: options.propertyType || undefined,
            p_listing_type: options.listingType || undefined
          };

          const cacheKey = `facets-v3-${JSON.stringify(rpcParams)}`;
          const now = Date.now();
          const cachedMemoryFacets = facetsMemoryCache.get(cacheKey);

          if (cachedMemoryFacets && now - cachedMemoryFacets.timestamp < FACETS_CACHE_TTL_MS) {
            facets = cachedMemoryFacets.data as PropertyFacets | null;
          } else {
            const getCachedFacets = unstable_cache(
              async () => {
                const { data: facetData } = await supabase.rpc("get_public_property_facets_v2", rpcParams);
                return facetData;
              },
              [cacheKey],
              {
                revalidate: 31536000, // 1 year cache
                tags: ["property-facets", "public-properties"],
              }
            );

            const facetData = await getCachedFacets();
            facets = (facetData as unknown) as PropertyFacets | null;
            facetsMemoryCache.set(cacheKey, { data: facets, timestamp: now });
          }
        }

        const facetAreas = Object.keys(facets?.availableAreas || {}).filter((a) => Boolean(a && a.trim()));
        const popularAreaNames = Array.from(
          new Set([
            ...facetAreas,
            ...(propertiesData || [])
              .map((row: any) => row.popular_area)
              .filter((area: string | null): area is string => Boolean(area && area.trim())),
          ])
        );
        const areaTranslationsMap = new Map<
          string,
          { en: string | null; cn: string | null; ru: string | null }
        >();

        if (popularAreaNames.length > 0) {
          try {
            const lookupMap = await getPopularAreasLookupMap();
            popularAreaNames.forEach((name) => {
              const matched = lookupMap[name.trim().toLowerCase()];
              if (matched) {
                areaTranslationsMap.set(name, { en: matched.en, cn: matched.cn, ru: matched.ru });
              }
            });
          } catch (err) {
            console.error("Error populating areaTranslationsMap:", err);
          }
        }

        const projectIds = Array.from(
          new Set(
            (propertiesData || [])
              .map((row: any) => row.project_id)
              .filter((id: string | null): id is string => !!id),
          ),
        );
        const projectMap = new Map<string, { name_th: string | null; name_en: string | null }>();

        if (projectIds.length > 0) {
          const { data: projectsData } = await supabase
            .from("projects")
            .select("id, name")
            .in("id", projectIds);
          (projectsData || []).forEach((p: any) => {
            if (p.id) {
              // `name` is a JSON column: { th: "...", en: "..." } or a plain string
              const nameObj = p.name;
              const nameTh = typeof nameObj === "object" && nameObj !== null ? (nameObj.th || nameObj.name_th || null) : (typeof nameObj === "string" ? nameObj : null);
              const nameEn = typeof nameObj === "object" && nameObj !== null ? (nameObj.en || nameObj.name_en || null) : null;
              projectMap.set(p.id, { name_th: nameTh, name_en: nameEn });
            }
          });
        }

        const finalProperties = (propertiesData as unknown as PropertyRow[] ?? []).map((row: PropertyRow) => {
          const trans = areaTranslationsMap.get(row.popular_area || "");
          const projectInfo = row.project_id ? projectMap.get(row.project_id) : null;
          const projectsObj = projectInfo
            ? { name_th: projectInfo.name_th, name_en: projectInfo.name_en }
            : row.projects || null;
          const finalProjectName = projectsObj?.name_th || projectsObj?.name_en || row.project_name || null;

          const { structured_data: _, property_features: __, property_images: pi, images: legacyImages, ...cardBase } = row;
          
          const sortedPi = (pi && pi.length > 0)
            ? [...pi].sort((a: any, b: any) => {
                if (a.is_cover && !b.is_cover) return -1;
                if (!a.is_cover && b.is_cover) return 1;
                return (a.sort_order ?? 0) - (b.sort_order ?? 0);
              })
            : [];

          const finalImages = (sortedPi.length > 0) 
            ? sortedPi.map((img: any) => {
                const target = img.image_url || img.storage_path || "";
                return {
                  ...img,
                  url: getPublicImageUrl(target),
                };
              }) 
            : getSafeImages(legacyImages);

          const bumpedAt = ((row as any).meta_data?.bumped_at as string) || (row as any).bumped_at || null;
          const bumpTime = bumpedAt ? new Date(bumpedAt).getTime() : 0;
          const createTime = row.created_at ? new Date(row.created_at).getTime() : 0;
          const effectiveTime = Math.max(bumpTime, createTime);

          return {
            ...cardBase,
            bumped_at: bumpedAt,
            project_name: finalProjectName,
            projects: projectsObj,
            popular_area_en: trans?.en ?? null,
            popular_area_cn: trans?.cn ?? null,
            popular_area_ru: trans?.ru ?? null,
            created_at_time: effectiveTime,
            image_url: getCoverImage(finalImages),
            images: finalImages,
            location: buildLocation(row),
            features: (row.property_features || []).map((pf: NonNullable<PropertyRow['property_features']>[number]) => pf.features).filter((f): f is NonNullable<typeof f> => !!f).slice(0, 10),
            verified: row.verified === true ? true : row.verified === false ? false : undefined,
            allow_airbnb: !!(row.amenities as any)?.allow_airbnb,
            airbnb_daily_price: (row.amenities as any)?.airbnb_daily_price ?? null,
            airbnb_monthly_price: (row.amenities as any)?.airbnb_monthly_price ?? null,
            airbnb_min_contract: (row.amenities as any)?.airbnb_min_contract ?? null,
            nearby_places: [],
            nearby_transits: getSafeNearbyTransits(row.nearby_transits),
          };
        });

        if (effectiveSort === "NEWEST") {
          finalProperties.sort((a, b) => (b.created_at_time || 0) - (a.created_at_time || 0));
        }

        return { properties: finalProperties, facets };
      },
      [`public-properties-v3-${JSON.stringify(options)}`],
      {
        revalidate: 31536000, // 1 year long-term cache (tag-invalidated)
        tags: ["properties", "public-data"],
      }
    )();
  },
);

export const getPublicPropertyBySlug = cache(async (slug: string) => {
  return unstable_cache(
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase.from("properties").select(PUBLIC_DETAIL_COLUMNS).eq("slug", slug).eq("status", "ACTIVE").single();
      if (error || !data) return null;

      const typedRow = data as unknown as PropertyRow;
      let trans = { en: null as string | null, cn: null as string | null, ru: null as string | null };
      if (typedRow.popular_area) {
        const { data: areaV3 } = await supabase
          .from("popular_areas_v3")
          .select("name")
          .eq("name->>th", typedRow.popular_area)
          .maybeSingle();

        if (areaV3?.name && typeof areaV3.name === "object") {
          const a = areaV3.name as any;
          trans = { en: a.en || null, cn: a.cn || null, ru: a.ru || null };
        } else {
          const { data: areaData } = await supabase
            .from("popular_areas")
            .select("name, name_en, name_cn, name_ru")
            .eq("name", typedRow.popular_area)
            .maybeSingle();
          if (areaData) {
            const a = areaData as { name_en: string | null; name_cn: string | null; name_ru: string | null };
            trans = { en: a.name_en, cn: a.name_cn, ru: a.name_ru };
          }
        }
      }

      const finalImages = (typedRow.property_images && typedRow.property_images.length > 0) 
        ? typedRow.property_images.map((img: any) => {
            const target = img.image_url || img.storage_path || "";
            return {
              ...img,
              url: getPublicImageUrl(target),
            };
          }) 
        : getSafeImages(typedRow.images);

      return {
        ...typedRow,
        popular_area_en: trans.en,
        popular_area_cn: trans.cn,
        popular_area_ru: trans.ru,
        image_url: getCoverImage(finalImages),
        images: finalImages,
        location: buildLocation(typedRow),
        features: (typedRow.property_features || []).map((pf: NonNullable<PropertyRow['property_features']>[number]) => pf.features).filter((f): f is NonNullable<typeof f> => !!f),
        allow_airbnb: !!(typedRow.amenities as any)?.allow_airbnb,
        airbnb_daily_price: (typedRow.amenities as any)?.airbnb_daily_price ?? null,
        airbnb_monthly_price: (typedRow.amenities as any)?.airbnb_monthly_price ?? null,
        airbnb_min_contract: (typedRow.amenities as any)?.airbnb_min_contract ?? null,
        nearby_places: [],
        nearby_transits: getSafeNearbyTransits(typedRow.nearby_transits),
      };
    },
    ["public-property-by-slug", slug],
    { revalidate: 31536000, tags: ["properties", "public-data"] }
  )();
});

/**
 * Get all active property slugs for sitemap generation (Cached 1 year)
 */
export const getAllPropertySlugs = unstable_cache(
  async (): Promise<{ slug: string; updated_at: string; image_url?: string }[]> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("properties_core")
      .select("slug, updated_at, property_images(image_url, storage_path, is_cover, sort_order)")
      .eq("status", 1)
      .not("slug", "is", null);

    if (error || !data) return [];
    return ((data as any[]) || []).map((item: any) => {
      const coverImg =
        (item.property_images || []).find((img: any) => img.is_cover) ||
        item.property_images?.[0];
      const imgTarget = coverImg?.storage_path || coverImg?.image_url;
      const imageUrl = imgTarget ? getPublicImageUrl(imgTarget) : undefined;

      return {
        slug: item.slug,
        updated_at: item.updated_at || new Date().toISOString(),
        image_url: imageUrl,
      };
    });
  },
  ["all-property-slugs-v2"],
  { revalidate: 31536000, tags: ["properties", "property-slugs", "public-data"] }
);
