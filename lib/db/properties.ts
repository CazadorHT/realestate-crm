import { createClient } from "@/lib/supabase/server";
import { Property } from "@/lib/types/property";
/**
 * Fetch all properties from the database.
 * Returns an empty array if an error occurs (and logs the error).
 */
export async function getAllProperties(): Promise<Property[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching properties:", error);
      return [];
    }

    return (data as unknown as Property[]) || [];
  } catch (err) {
    console.error("Unexpected error in getAllProperties:", err);
    return [];
  }
}

/**
 * Fetch all deleted properties from the database (Trash).
 * Returns an empty array if an error occurs (and logs the error).
 */
export async function getDeletedProperties(): Promise<Property[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Error fetching deleted properties:", error);
      return [];
    }

    const properties = data || [];
    if (properties.length === 0) return [];

    const propertyIds = properties.map((p) => p.id);

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
    const coverMap = new Map(
      images?.map((img) => [img.property_id, img.image_url]),
    );

    const propertiesWithImages = properties.map((p) => {
      // Logic: Use cover image if available, else empty array (component handles fallback)
      // Note: PropertiesPage actually fetches ALL images if no cover is found, but let's start with cover
      // to match the main table's primary visual.
      const coverUrl = coverMap.get(p.id);
      const pImages = coverUrl ? [coverUrl] : [];
      return { ...p, images: pImages };
    });

    return propertiesWithImages as unknown as Property[];
  } catch (err) {
    console.error("Unexpected error in getDeletedProperties:", err);
    return [];
  }
}
