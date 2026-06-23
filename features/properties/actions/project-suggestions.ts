"use server";
import { requireAuthContext } from "@/lib/authz";

export interface ProjectSuggestion {
  address_line1: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
  transit_station_name: string;
  transit_distance_meters: number;
  google_maps_link: string;
}

export async function getProjectSuggestions(search: string): Promise<ProjectSuggestion[]> {
  try {
    const { supabase, tenantId } = await requireAuthContext();

    let query = supabase
      .from("properties")
      .select(`
        address_line1,
        subdistrict,
        district,
        province,
        postal_code,
        transit_station_name,
        transit_distance_meters,
        google_maps_link
      `)
      .not("address_line1", "is", null)
      .neq("address_line1", "");

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (search) {
      query = query.ilike("address_line1", `%${search}%`);
    }

    const { data, error } = await query.limit(100);

    if (error) {
      console.error("[getProjectSuggestions] DB error:", error);
      return [];
    }

    if (!data) return [];

    const seen = new Set<string>();
    const uniqueProjects: ProjectSuggestion[] = [];

    for (const item of data) {
      if (!item.address_line1) continue;
      const normalized = item.address_line1.trim().toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        uniqueProjects.push({
          address_line1: item.address_line1.trim(),
          subdistrict: item.subdistrict || "",
          district: item.district || "",
          province: item.province || "",
          postal_code: item.postal_code || "",
          transit_station_name: item.transit_station_name || "",
          transit_distance_meters: item.transit_distance_meters || 0,
          google_maps_link: item.google_maps_link || "",
        });
      }
    }

    return uniqueProjects.slice(0, 10);
  } catch (error) {
    console.error("[getProjectSuggestions] Exception:", error);
    return [];
  }
}
