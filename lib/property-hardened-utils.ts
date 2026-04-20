import { PropertyImageMetadata, NearbyItem } from "@/features/properties/types";

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
  if (!images || !Array.isArray(images)) return [];

  return (images as unknown[])
    .filter(isRawImage)
    .map((img) => ({
      id: img.id || img.url || img.image_url || Math.random().toString(),
      url: img.url || img.image_url || "",
      storage_path: img.storage_path || null,
      is_cover: !!img.is_cover,
      sort_order: typeof img.sort_order === "number" ? img.sort_order : 999,
      category: img.category || null,
      alt_text: img.alt_text || null,
    }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
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

  return (places as any[])
    .filter((p): p is any => 
      typeof p === "object" && p !== null && ("name" in p || "category" in p)
    )
    .map(p => ({
      category: p.category || "General",
      name: p.name || "Unknown Place",
      distance: p.distance || null,
      time: p.time || null,
      name_en: p.name_en || null,
      name_cn: p.name_cn || null
    }));
}

/**
 * 🛡️ Hardened Price Logic (The Fallback King)
 */
export function getEffectivePrice(row: any) {
  // 1. Sale Price Fallback
  const salePrice = row.price || row.original_price || 0;
  
  // 2. Rental Price Fallback
  const rentalPrice = row.rental_price || row.original_rental_price || 0;
  
  // 3. Discount Detection
  const hasSaleDiscount = row.original_price > row.price && row.price > 0;
  const hasRentalDiscount = row.original_rental_price > row.rental_price && row.rental_price > 0;

  // 4. Percentage Calculation
  const saleDiscountPercent = hasSaleDiscount 
    ? Math.round(((row.original_price - row.price) / row.original_price) * 100) 
    : 0;
    
  const rentalDiscountPercent = hasRentalDiscount
    ? Math.round(((row.original_rental_price - row.rental_price) / row.original_rental_price) * 100)
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
export function getSafeNearbyTransits(transits: unknown): any[] {
  if (!transits || !Array.isArray(transits)) return [];
  return transits.filter(t => typeof t === "object" && t !== null);
}
