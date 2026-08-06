import { PropertyImageMetadata, NearbyItem, NearbyTransitItem, TransitType } from "@/features/properties/types";
import { Database } from "@/lib/database.types.generated";
import { getPublicImageUrl } from "@/features/properties/image-utils";

/**
 * 🛡️ Raw Object Guard for Images
 */
interface RawImage {
  id?: string;
  url?: string;
  image_url?: string;
  storage_path?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
  category?: string | null;
  alt_text?: string | null;
}

function isRawImage(obj: unknown): obj is RawImage {
  return typeof obj === "object" && obj !== null && ("url" in obj || "image_url" in obj || "id" in obj);
}

/**
 * 🛡️ Hardened Image Extractor
 */
export function getSafeImages(images: unknown): PropertyImageMetadata[] {
  let parsedImages = images;
  if (typeof images === "string" && images.trim().startsWith("[")) {
    try {
      parsedImages = JSON.parse(images);
    } catch {
      parsedImages = [];
    }
  }
  if (!parsedImages || !Array.isArray(parsedImages)) return [];

  const processed: PropertyImageMetadata[] = [];
  for (const img of parsedImages as unknown[]) {
    if (typeof img === "string") {
      const finalUrl = getPublicImageUrl(img);
      processed.push({
        id: finalUrl || Math.random().toString(),
        url: finalUrl,
        storage_path: null,
        is_cover: false,
        sort_order: 999,
        category: null,
        alt_text: null,
      });
    } else if (isRawImage(img)) {
      const rawUrl = img.url || img.image_url || "";
      const pathOrUrl = rawUrl || img.storage_path || "";
      const finalUrl = getPublicImageUrl(pathOrUrl);
      processed.push({
        id: img.id || finalUrl || Math.random().toString(),
        url: finalUrl,
        storage_path: img.storage_path || null,
        is_cover: !!img.is_cover,
        sort_order: typeof img.sort_order === "number" ? img.sort_order : 999,
        category: img.category || null,
        alt_text: img.alt_text || null,
      });
    }
  }

  // 🛡️ Deduplicate by URL to prevent showing the same image twice in the gallery
  const unique = Array.from(new Map(processed.map((img) => [img.url, img])).values());

  return unique.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

/**
 * 🛡️ Hardened Cover Image Extractor
 */
export function getCoverImage(images: unknown): string {
  const safeImages = getSafeImages(images);
  const cover = safeImages.find(img => img.is_cover) || safeImages[0];
  
  return cover?.url || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1073&auto=format&fit=crop";
}

/**
 * 🛡️ Hardened Nearby Places Extractor
 */
export function getSafeNearbyPlaces(places: unknown): NearbyItem[] {
  if (!places || !Array.isArray(places)) return [];

  return (places as unknown[])
    .filter((p): p is Record<string, unknown> => 
      typeof p === "object" && p !== null && ("name" in p || "category" in p)
    )
    .map(p => ({
      category: (p.category as string) || "General",
      name: (p.name as string) || "Unknown Place",
      distance: (p.distance as string) || undefined,
      distance_meters: typeof p.distance_meters === "number" ? p.distance_meters : undefined,
      time: (p.time as string) || undefined,
      name_en: (p.name_en as string) || undefined,
      name_cn: (p.name_cn as string) || undefined,
      name_ru: (p.name_ru as string) || undefined
    }));
}

/**
 * 🛡️ Hardened Price Logic (The Fallback King)
 */
export function getEffectivePrice(row: { 
  price?: number | null; 
  original_price?: number | null; 
  rental_price?: number | null; 
  original_rental_price?: number | null; 
}) {
  // 1. Sale Price Fallback
  const salePrice = row.price || row.original_price || 0;
  
  // 2. Rental Price Fallback
  const rentalPrice = row.rental_price || row.original_rental_price || 0;
  
  // 3. Discount Detection
  const hasSaleDiscount = (row.original_price ?? 0) > (row.price ?? 0) && (row.price ?? 0) > 0;
  const hasRentalDiscount = (row.original_rental_price ?? 0) > (row.rental_price ?? 0) && (row.rental_price ?? 0) > 0;

  // 4. Percentage Calculation
  const saleDiscountPercent = hasSaleDiscount && row.original_price
    ? Math.round(((row.original_price - (row.price ?? 0)) / row.original_price) * 100) 
    : 0;
    
  const rentalDiscountPercent = hasRentalDiscount && row.original_rental_price
    ? Math.round(((row.original_rental_price - (row.rental_price ?? 0)) / row.original_rental_price) * 100)
    : 0;

  return {
    salePrice,
    rentalPrice,
    originalPrice: row.original_price || 0,
    originalRentalPrice: row.original_rental_price || 0,
    hasSaleDiscount,
    hasRentalDiscount,
    saleDiscountPercent,
    rentalDiscountPercent
  };
}

/**
 * 🛡️ Hardened Nearby Transits Extractor
 */
export function getSafeNearbyTransits(transits: unknown): NearbyTransitItem[] {
  if (!transits || !Array.isArray(transits)) return [];

  return (transits as unknown[])
    .filter((t): t is Record<string, unknown> => 
      typeof t === "object" && t !== null && ("station_name" in t || "type" in t)
    )
    .map(t => ({
      type: (t.type as TransitType) || "OTHER",
      station_name: (t.station_name as string) || "Unknown Station",
      distance_meters: typeof t.distance_meters === "number" ? t.distance_meters : undefined,
      time: (t.time as string) || undefined,
      station_name_en: (t.station_name_en as string) || undefined,
      station_name_cn: (t.station_name_cn as string) || undefined,
      station_name_ru: (t.station_name_ru as string) || undefined,
    }));
}
