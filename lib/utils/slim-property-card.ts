type RawImageObject = {
  url?: string | null;
  image_url?: string | null;
  storage_path?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
};

type RawImageEntry = string | RawImageObject | null | undefined;

export type SlimmedProperty<T> = T extends Record<string, unknown>
  ? T & { total_images?: number }
  : T;

/**
 * Trims heavy non-card fields from property records before serializing them into
 * RSC Client Component payloads or paginated card API responses.
 * Keeps 100% of fields rendered by PropertyCard (4 languages, pricing, specs, badges,
 * features, nearest transit, and up to 15 slideable photo URLs) while removing large
 * unused/duplicate blobs and flattening image objects into plain URL strings.
 */
export function slimPropertyForCard<T>(p: T): SlimmedProperty<T> {
  if (!p || typeof p !== "object") return p as SlimmedProperty<T>;

  const record = p as Record<string, unknown>;
  const {
    description: _d,
    description_en: _de,
    description_cn: _dc,
    description_ru: _dr,
    meta_keywords: _mk,
    meta_data: _md,
    google_maps_link: _gm,
    address_line1: _a1,
    address_line1_en: _a1e,
    property_images: _pi,
    nearby_places: _np,
    transit_info: _ti,
    amenities: _am,
    ...rest
  } = record;

  const rawImages = record.images;
  const allValidImages = Array.isArray(rawImages)
    ? [...(rawImages as RawImageEntry[])]
        .filter((img): img is string | RawImageObject => img !== null && img !== undefined)
        .sort((a, b) => {
          if (typeof a === "object" && typeof b === "object") {
            if (a.is_cover && !b.is_cover) return -1;
            if (!a.is_cover && b.is_cover) return 1;
            return (a.sort_order ?? 0) - (b.sort_order ?? 0);
          }
          return 0;
        })
        .map((img) => {
          if (typeof img === "string") return img;
          return img.url || img.image_url || img.storage_path || "";
        })
        .filter((url) => typeof url === "string" && url.trim() !== "")
    : null;

  const slimImages = allValidImages ? allValidImages.slice(0, 15) : rawImages;
  const existingTotal = record.total_images;
  const validExistingTotal =
    typeof existingTotal === "number" && Number.isFinite(existingTotal)
      ? existingTotal
      : undefined;

  const totalImages = allValidImages
    ? validExistingTotal !== undefined
      ? Math.max(validExistingTotal, allValidImages.length)
      : allValidImages.length
    : validExistingTotal;

  const rawTransits = record.nearby_transits;

  return {
    ...rest,
    images: slimImages,
    ...(totalImages !== undefined ? { total_images: totalImages } : {}),
    nearby_transits: Array.isArray(rawTransits)
      ? rawTransits.slice(0, 1)
      : rawTransits,
  } as unknown as SlimmedProperty<T>;
}
