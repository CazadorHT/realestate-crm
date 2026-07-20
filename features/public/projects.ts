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
 * [OPTIMIZED: ดึงข้อมูลสรุปรวบยอดผ่าน Materialized View เพื่อเซฟท่อ Egress 99.9%]
 */
export async function getPublicProjects(): Promise<PublicProject[]> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      // 1. ดึงข้อมูลตารางโครงการหลัก (ล็อกเฉพาะฟิลด์ที่ต้องใช้งานจริง)
      const { data: projects, error } = await supabase
        .from("projects")
        .select(`
          id, name, slug, developer, property_type, province, district, subdistrict, 
          latitude, longitude, year_completed, total_units, description, image_url, 
          gallery_urls, facilities, nearest_station_code, nearest_station_distance, 
          seo_title, seo_description, sort_order
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error || !projects) {
        console.error("Error fetching projects:", error?.message);
        return [];
      }

      // 2. ดึงข้อมูลสถิติมิติต่างๆ ที่รวบรวมไว้แล้วจาก Materialized View (ขนาดเหลือหลัก KB)
      const { data: statsData, error: statsError } = await supabase
        .from("mv_project_property_stats")
        .select("project_id, property_count, price_min, price_max, rental_min, rental_max, primary_popular_area");

      if (statsError) {
        console.error("Error fetching project view stats:", statsError.message);
        return [];
      }

      // ดึงรูปภาพ cover (main_image) ยูนิตแรกของแต่ละโครงการมาแสดงเป็นรูปภาพคู่ตัวการ์ดโครงการ (เพื่อความไวสูงสุดแบบ Zero Egress)
      const { data: recentProps } = await supabase
        .from("properties")
        .select("project_id, main_image, popular_area_en, popular_area_cn, popular_area_ru")
        .eq("status", "ACTIVE")
        .is("deleted_at", null)
        .not("main_image", "is", null)
        .order("created_at", { ascending: false });

      const propDataMap = new Map<string, { main_image: string; popular_area_en?: string | null; popular_area_cn?: string | null; popular_area_ru?: string | null }>();
      if (recentProps) {
        for (const p of recentProps) {
          if (p.project_id && !propDataMap.has(p.project_id)) {
            propDataMap.set(p.project_id, {
              main_image: p.main_image,
              popular_area_en: p.popular_area_en,
              popular_area_cn: p.popular_area_cn,
              popular_area_ru: p.popular_area_ru
            });
          }
        }
      }

      // แปลงข้อมูลสถิติให้อยู่ในรูป Map เพื่อความเร็ว O(1) ในการค้นหาจับคู่
      const statsMap = new Map<string, any>();
      (statsData || []).forEach((row: any) => {
        statsMap.set(row.project_id, row);
      });

      // 3. แมปโครงสร้างโปรเจกต์ส่งกลับให้หน้าบ้านใช้งาน
      return projects.map((p: any) => {
        const stat = statsMap.get(p.id);
        const propData = propDataMap.get(p.id);
        const propertyCount = stat ? Number(stat.property_count || 0) : 0;

        // ดึงภาพหน้าปกโครงการ (ใช้ภาพโครงการเป็นหลัก ถ้าไม่มี ดึงภาพอสังหาฯ ล่าสุดในโครงการนั้นมาเป็น Cover Image)
        const coverImage = p.image_url || propData?.main_image || null;

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
          propertyCount,
          priceMin: stat ? stat.price_min : null,
          priceMax: stat ? stat.price_max : null,
          rentalMin: stat ? stat.rental_min : null,
          rentalMax: stat ? stat.rental_max : null,
          popularArea: stat ? stat.primary_popular_area : null,
          popularAreaEn: propData?.popular_area_en || null,
          popularAreaCn: propData?.popular_area_cn || null,
          popularAreaRu: propData?.popular_area_ru || null,
          sortOrder: p.sort_order ?? 0,
        };
      }).filter((p: any) => p.propertyCount > 0); // กรองเอาเฉพาะโครงการที่มีอสังหาฯ พร้อมขายจริง
    },
    ["public-projects-list-v1"],
    { revalidate: 604800, tags: ["projects", "properties", "public-data"] }
  )();
}

export async function getProjectBySlug(slug: string): Promise<PublicProject | null> {
  return unstable_cache(
    async () => {
      const supabase = await createClient();

      const { data: p, error } = await supabase
        .from("projects")
        .select(`
          id, name, slug, developer, property_type, province, district, subdistrict, 
          latitude, longitude, year_completed, total_units, description, image_url, 
          gallery_urls, facilities, nearest_station_code, nearest_station_distance, 
          seo_title, seo_description, sort_order
        `)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !p) {
        if (error) console.error("Error fetching project by slug:", error.message);
        return null;
      }

      // เพิ่มความคล่องตัวในการดูข้อมูลหน้ารายละเอียดโครงการเดี่ยวๆ ผ่าน View สถิติ
      const { data: stat, error: statErr } = await supabase
        .from("mv_project_property_stats")
        .select("property_count, price_min, price_max, rental_min, rental_max, primary_popular_area")
        .eq("project_id", p.id)
        .maybeSingle();

      if (statErr) {
        console.error("Error fetching project view stats by slug:", statErr.message);
      }

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
        imageUrl: p.image_url || null,
        galleryUrls: p.gallery_urls || [],
        facilities: p.facilities || [],
        nearestStationCode: p.nearest_station_code,
        nearestStationDistance: p.nearest_station_distance,
        seoTitle: p.seo_title,
        seoDescription: p.seo_description,
        propertyCount: stat ? Number(stat.property_count || 0) : 0,
        priceMin: stat ? stat.price_min : null,
        priceMax: stat ? stat.price_max : null,
        rentalMin: stat ? stat.rental_min : null,
        rentalMax: stat ? stat.rental_max : null,
        popularArea: stat ? stat.primary_popular_area : null,
        popularAreaEn: null,
        popularAreaCn: null,
        popularAreaRu: null,
        sortOrder: p.sort_order ?? 0,
      };
    },
    ["public-project-by-slug", slug],
    { revalidate: 604800, tags: ["projects", "public-data"] }
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
    { revalidate: 604800, tags: ["properties", "public-data"] }
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
