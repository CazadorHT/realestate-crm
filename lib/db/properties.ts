import { createClient } from "@/lib/supabase/server";
import { Property } from "@/lib/types/property";
import { mapDbError } from "@/lib/db-error";
/**
 * Fetch all properties from the database.
 * Returns an empty array if an error occurs (and logs the error).
 */
export async function getAllProperties(): Promise<Property[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("id, title, slug, property_type, listing_type, price, original_price, rental_price, original_rental_price, status, created_at, updated_at, tenant_id")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      throw new Error(mapDbError(error));
    }

    return (data as unknown as Property[]) || [];
  } catch (err) {
    console.error("Unexpected error in getAllProperties:", err);
    return [];
  }
}

import { requireAuthContext, assertStaff } from "@/lib/authz";

/**
 * Fetch all deleted properties from the database (Trash).
 * Returns an empty array if an error occurs (and logs the error).
 */
export async function getDeletedProperties(
  page: number = 1,
  pageSize: number = 10,
): Promise<{ data: Property[]; count: number }> {
  const { supabase, role, tenantId, user } = await requireAuthContext();
  assertStaff(role);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from("properties")
      .select("id, title, slug, property_type, listing_type, price, original_price, rental_price, original_rental_price, status, deleted_at, tenant_id, created_by, creator:profiles!created_by(full_name)", { count: "exact" })
      .not("deleted_at", "is", null);

    if (role === "AGENT") {
      query = query.or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);
    } else if (role === "MANAGER" || role === "OWNER" || role === "owner") {
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }
    }

    const {
      data,
      error,
      count: totalCount,
    } = await query
      .order("deleted_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching deleted properties:", error);
      throw new Error(mapDbError(error));
    }

    const properties = data || [];
    if (properties.length === 0) return { data: [], count: totalCount || 0 };

    const propertyIds = properties.map((p: any) => p.id);

    // Fetch only cover images (or first image if no cover) similar to PropertiesPage
    const { data: images, error: imgError } = await supabase
      .from("property_images")
      .select("property_id, image_url")
      .in("property_id", propertyIds)
      .eq("is_cover", true);

    if (imgError) {
      console.error("Error fetching trash images:", imgError);
    }

    // Create a map for O(1) lookup
    const coverMap = new Map<string, string>();
    images?.forEach((img) => {
      if (img.property_id && img.image_url) {
        coverMap.set(img.property_id, img.image_url);
      }
    });

    const propertiesWithImages = properties.map((p: any) => {
      // Logic: Use cover image if available, else empty array (component handles fallback)
      // Note: PropertiesPage actually fetches ALL images if no cover is found, but let's start with cover
      // to match the main table's primary visual.
      const coverUrl = coverMap.get(p.id);
      const pImages = coverUrl ? [coverUrl] : [];
      
      const creatorName = Array.isArray(p.creator)
        ? (p.creator[0] as any)?.full_name || null
        : (p.creator as any)?.full_name || null;

      return { 
        ...p, 
        images: pImages,
        creator_name: creatorName
      };
    });

    return { data: propertiesWithImages as unknown as Property[], count: totalCount || 0 };
  } catch (err) {
    console.error("Unexpected error in getDeletedProperties:", err);
    return { data: [], count: 0 };
  }
}
