"use server";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PublicPropertyNearStation } from "./stations";

// ============================================================
// Types
// ============================================================

export interface PublicProject {
  id: string;
  name: { th: string; en: string };
  slug: string;
  developer: string | null;
  propertyType: number;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  latitude: number | null;
  longitude: number | null;
  yearCompleted: number | null;
  totalUnits: number | null;
  description: { th?: string; en?: string; cn?: string; ru?: string } | null;
  imageUrl: string | null;
  galleryUrls: string[];
  facilities: string[];
  nearestStationCode: string | null;
  nearestStationDistance: number | null;
  seoTitle: { th?: string; en?: string; cn?: string; ru?: string } | null;
  seoDescription: { th?: string; en?: string; cn?: string; ru?: string } | null;
  propertyCount: number;
  priceMin: number | null;
  priceMax: number | null;
  rentalMin: number | null;
  rentalMax: number | null;
  popularArea?: string | null;
  popularAreaEn?: string | null;
  popularAreaCn?: string | null;
  popularAreaRu?: string | null;
  sortOrder: number;
}

// ============================================================
// Actions
// ============================================================

/**
 * Get all active projects with property counts and price stats
 */
export async function getPublicProjects(): Promise<PublicProject[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      // Fetch all active projects
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error || !projects) {
        console.error("Error fetching projects:", error?.message);
        return [];
      }

      // Fetch properties grouped by project_id to compute stats in memory (highly efficient)
      const { data: activeProps } = await supabase
        .from("properties")
        .select("id, project_id, price, rental_price, status, main_image, listing_type, popular_area, popular_area_en, popular_area_cn, popular_area_ru")
        .eq("status", "ACTIVE")
        .is("deleted_at", null);

      const props = activeProps || [];
      const projectPropsMap = new Map<string, any[]>();
      for (const p of props) {
        if (p.project_id) {
          if (!projectPropsMap.has(p.project_id)) {
            projectPropsMap.set(p.project_id, []);
          }
          projectPropsMap.get(p.project_id)!.push(p);
        }
      }

      return projects.map((p: any) => {
        const associatedProps = projectPropsMap.get(p.id) || [];
        const saleProps = associatedProps.filter((prop: any) => prop.listing_type === "SALE" || prop.listing_type === "SALE_AND_RENT");
        const rentProps = associatedProps.filter((prop: any) => prop.listing_type === "RENT" || prop.listing_type === "SALE_AND_RENT");

        const prices = saleProps.map((prop: any) => prop.price).filter((price: any) => price != null);
        const rentals = rentProps.map((prop: any) => prop.rental_price).filter((price: any) => price != null);
        
        // Find the most common popular_area for this project
        const popularAreaCounts = new Map<string, { count: number, en: string | null, cn: string | null, ru: string | null }>();
        for (const prop of associatedProps) {
          if (prop.popular_area) {
            const area = prop.popular_area.trim();
            const current = popularAreaCounts.get(area) || { count: 0, en: prop.popular_area_en, cn: prop.popular_area_cn, ru: prop.popular_area_ru };
            current.count += 1;
            popularAreaCounts.set(area, current);
          }
        }
        
        let bestArea: string | null = null;
        let bestAreaEn: string | null = null;
        let bestAreaCn: string | null = null;
        let bestAreaRu: string | null = null;
        let maxCount = 0;
        
        popularAreaCounts.forEach((val, key) => {
          if (val.count > maxCount) {
            maxCount = val.count;
            bestArea = key;
            bestAreaEn = val.en;
            bestAreaCn = val.cn;
            bestAreaRu = val.ru;
          }
        });

        const coverImage = p.image_url || associatedProps.find((prop: any) => prop.main_image)?.main_image || null;

        return {
          id: p.id,
          name: p.name || { th: "", en: "" },
          slug: p.slug,
          developer: p.developer,
          propertyType: p.property_type,
          province: p.province,
          district: p.district,
          subdistrict: p.subdistrict,
          latitude: p.latitude,
          longitude: p.longitude,
          yearCompleted: p.year_completed,
          totalUnits: p.total_units,
          description: p.description,
          imageUrl: coverImage,
          galleryUrls: p.gallery_urls || [],
          facilities: p.facilities || [],
          nearestStationCode: p.nearest_station_code,
          nearestStationDistance: p.nearest_station_distance,
          seoTitle: p.seo_title,
          seoDescription: p.seo_description,
          propertyCount: associatedProps.length,
          priceMin: prices.length > 0 ? Math.min(...prices) : null,
          priceMax: prices.length > 0 ? Math.max(...prices) : null,
          rentalMin: rentals.length > 0 ? Math.min(...rentals) : null,
          rentalMax: rentals.length > 0 ? Math.max(...rentals) : null,
          popularArea: bestArea,
          popularAreaEn: bestAreaEn,
          popularAreaCn: bestAreaCn,
          popularAreaRu: bestAreaRu,
          sortOrder: p.sort_order ?? 0,
        };
      }).filter((p: any) => p.propertyCount > 0);
    },
    ["public-projects-list-v1"],
    { revalidate: 3600, tags: ["projects", "properties", "public-data"] }
  )();
}

export async function getProjectBySlug(slug: string): Promise<PublicProject | null> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      const { data: p, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !p) {
        if (error) console.error("Error fetching project by slug:", error.message);
        return null;
      }

      // Fetch properties belonging to this project
      const { data: activeProps } = await supabase
        .from("properties")
        .select("id, price, rental_price, status, main_image, listing_type")
        .eq("project_id", p.id)
        .eq("status", "ACTIVE")
        .is("deleted_at", null);

      const props = activeProps || [];
      const saleProps = props.filter((prop: any) => prop.listing_type === "SALE" || prop.listing_type === "SALE_AND_RENT");
      const rentProps = props.filter((prop: any) => prop.listing_type === "RENT" || prop.listing_type === "SALE_AND_RENT");

      const prices = saleProps.map((prop: any) => prop.price).filter((price: any) => price != null);
      const rentals = rentProps.map((prop: any) => prop.rental_price).filter((price: any) => price != null);

      const coverImage = p.image_url || props.find((prop: any) => prop.main_image)?.main_image || null;

      return {
        id: p.id,
        name: p.name || { th: "", en: "" },
        slug: p.slug,
        developer: p.developer,
        propertyType: p.property_type,
        province: p.province,
        district: p.district,
        subdistrict: p.subdistrict,
        latitude: p.latitude,
        longitude: p.longitude,
        yearCompleted: p.year_completed,
        totalUnits: p.total_units,
        description: p.description,
        imageUrl: coverImage,
        galleryUrls: p.gallery_urls || [],
        facilities: p.facilities || [],
        nearestStationCode: p.nearest_station_code,
        nearestStationDistance: p.nearest_station_distance,
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
        propertyCount: props.length,
        priceMin: prices.length > 0 ? Math.min(...prices) : null,
        priceMax: prices.length > 0 ? Math.max(...prices) : null,
        rentalMin: rentals.length > 0 ? Math.min(...rentals) : null,
        rentalMax: rentals.length > 0 ? Math.max(...rentals) : null,
        sortOrder: p.sort_order ?? 0,
      };
    },
    ["public-project-by-slug", slug],
    { revalidate: 3600, tags: ["projects", "public-data"] }
  )();
}

/**
 * Get properties inside a specific project
 */
export async function getPropertiesInProject(
  projectId: string,
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

      let query = supabase
        .from("properties")
        .select(
          "id, slug, title, title_en, title_cn, title_ru, description, description_en, description_cn, description_ru, images, main_image, price, rental_price, original_price, original_rental_price, price_per_sqm, rent_price_per_sqm, land_size_sqwah, bedrooms, bathrooms, size_sqm, property_type, listing_type, status, district, province, popular_area, popular_area_en, popular_area_cn, popular_area_ru, near_transit, transit_station_name, transit_station_name_en, transit_station_name_cn, transit_station_name_ru, transit_type, transit_distance_meters, nearby_transits, is_hot_deal, is_featured, currency, is_fully_furnished, is_pet_friendly, verified, created_at, updated_at, min_contract_months",
          { count: "exact" }
        )
        .eq("project_id", projectId)
        .eq("status", "ACTIVE")
        .is("deleted_at", null);

      if (filters?.listing_type && filters.listing_type !== "ALL") {
        query = query.eq("listing_type", filters.listing_type);
      }
      if (filters?.property_type && filters.property_type !== "ALL") {
        query = query.eq("property_type", filters.property_type);
      }

      query = query
        .order("is_featured", { ascending: false })
        .order("is_hot_deal", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching properties in project:", error.message);
        return { properties: [], total: 0 };
      }

      return {
        properties: (data || []).map((p: any) => ({
          ...p,
          image_url: p.main_image,
        })) as unknown as PublicPropertyNearStation[],
        total: count || 0,
      };
    },
    ["public-properties-in-project", projectId, JSON.stringify(filters || {})],
    { revalidate: 3600, tags: ["properties", "public-data"] }
  )();
}

/**
 * Get all active project slugs for generateStaticParams()
 */
export async function getAllProjectSlugs(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("slug")
    .eq("is_active", true);

  if (error || !data) {
    console.error("Error fetching project slugs:", error?.message);
    return [];
  }

  return data.map((p: { slug: string }) => p.slug);
}

/**
 * Fetch projects near/related to this project (e.g. in the same district/province)
 */
export async function getRelatedProjects(
  projectId: string,
  district: string | null,
  province: string | null,
  limit = 4
): Promise<PublicProject[]> {
  const allProjects = await getPublicProjects();
  
  // 1. Filter out the current project
  let pool = allProjects.filter(p => p.id !== projectId);
  
  // 2. Try to find projects in the same district
  let related = pool.filter(p => p.district === district);
  
  // 3. If not enough, fill with other projects in the same province
  if (related.length < limit && province) {
    const extraInProvince = pool.filter(p => p.district !== district && p.province === province);
    related = [...related, ...extraInProvince];
  }
  
  // 4. If still not enough, fill with any other active projects
  if (related.length < limit) {
    const ids = new Set(related.map(r => r.id));
    const extra = pool.filter(p => !ids.has(p.id));
    related = [...related, ...extra];
  }
  
  return related.slice(0, limit);
}
