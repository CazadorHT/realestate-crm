"use server";
import { requireAuthContext } from "@/lib/authz";

export interface ProjectSuggestion {
  id: string;
  address_line1: string;
  address_line1_en?: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code?: string;
  transit_station_code?: string;
  transit_distance_meters?: number;
  google_maps_link?: string;
  latitude?: number;
  longitude?: number;
}

export async function getProjectSuggestions(search: string): Promise<ProjectSuggestion[]> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    // Query official projects table
    let query = supabase
      .from("projects")
      .select(`
        id,
        name,
        slug,
        province,
        district,
        subdistrict,
        latitude,
        longitude,
        nearest_station_code,
        nearest_station_distance
      `)
      .eq("is_active", true);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (search) {
      // Search by Thai name, English name, or slug
      query = query.or(
        `name->>th.ilike.%${search}%,` +
        `name->>en.ilike.%${search}%,` +
        `slug.ilike.%${search}%`
      );
    }

    const { data, error } = await query.order("sort_order").limit(10);

    if (error) {
      console.error("[getProjectSuggestions] DB error:", error);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => {
      const nameObj = item.name || {};
      const mapsLink = item.latitude && item.longitude 
        ? `https://www.google.com/maps/place/${item.latitude},${item.longitude}` 
        : "";

      return {
        id: item.id,
        address_line1: nameObj.th || nameObj.en || item.slug,
        address_line1_en: nameObj.en || nameObj.th || item.slug,
        subdistrict: item.subdistrict || "",
        district: item.district || "",
        province: item.province || "",
        postal_code: "", // projects table does not have postal code directly, can be filled manually or matched
        transit_station_code: item.nearest_station_code || "",
        transit_distance_meters: item.nearest_station_distance || 0,
        google_maps_link: mapsLink,
        latitude: item.latitude || undefined,
        longitude: item.longitude || undefined,
      };
    });
  } catch (error) {
    console.error("[getProjectSuggestions] Exception:", error);
    return [];
  }
}
