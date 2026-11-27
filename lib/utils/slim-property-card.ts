/**
 * Trims heavy non-card fields from property records before serializing them into
 * RSC Client Component payloads (e.g., SameProjectPropertiesClient, SimilarPropertiesClient).
 * Keeps 100% of fields rendered by PropertyCard (4 languages, pricing, specs, badges,
 * nearest transit, and up to 5 slideable photos) while removing large unused blobs.
 */
export function slimPropertyForCard<T extends Record<string, any>>(p: T): T {
  if (!p || typeof p !== "object") return p;
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
    ...rest
  } = p;

  return {
    ...rest,
    images: Array.isArray(p.images) ? p.images.slice(0, 5) : p.images,
    nearby_transits: Array.isArray(p.nearby_transits)
      ? p.nearby_transits.slice(0, 1)
      : p.nearby_transits,
  } as unknown as T;
}
