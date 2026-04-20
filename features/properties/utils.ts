import { getCoverImage as getHardenedCoverImage } from "@/lib/property-hardened-utils";

/**
 * Extracts the cover image URL from a property.
 * Legacy wrapper for the hardened utility.
 */
export function getCoverImage(property: any): string | null {
  if (!property) return null;
  
  // Try from joined property_images table (Legacy structure support)
  if (property.property_images?.length) {
    const cover = property.property_images.find((img: any) => img.is_cover) || property.property_images[0];
    return cover?.image_url || null;
  }

  // Fallback to hardened JSONB logic
  return getHardenedCoverImage(property.images);
}

/**
 * Sorts property images based on their sort_order.
 */
export function sortPropertyImages<T extends { sort_order?: number }>(
  images: T[]
): T[] {
  return [...images].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

/**
 * Formats nearby places into categories for UI rendering.
 */
export function groupNearbyPlaces<T extends { category: string }>(
  places: T[]
): Record<string, T[]> {
  return places.reduce((acc, place) => {
    const cat = place.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(place);
    return acc;
  }, {} as Record<string, T[]>);
}
