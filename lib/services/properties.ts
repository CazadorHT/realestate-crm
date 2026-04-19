import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";
import { getPublicImageUrl } from "@/features/properties/image-utils";

export type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  title_cn: string | null;
  description: string | null;
  description_en: string | null;
  description_cn: string | null;
  property_type: string | null;
  price: number | null;
  rental_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  parking_slots: number | null;
  floor: number | null;
  created_at: string;
  updated_at: string;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  address_line1: string | null;
  address_line1_en: string | null;
  address_line1_cn: string | null;
  popular_area: string | null;
  popular_area_en?: string | null;
  popular_area_cn?: string | null;
  original_price: number | null;
  original_rental_price: number | null;
  verified: boolean | null;
  min_contract_months: number | null;
  meta_keywords: string[] | null;
  near_transit: boolean | null;
  transit_type: string | null;
  transit_station_name: string | null;
  transit_station_name_en: string | null;
  transit_station_name_cn: string | null;
  transit_distance_meters: number | null;
  google_maps_link: string | null;
  is_fully_furnished: boolean | null;
  is_bare_shell: boolean | null;
  is_pet_friendly: boolean | null;
  is_foreigner_quota: boolean | null;
  is_tax_registered: boolean | null;
  nearby_places: any | null;
  nearby_transits: any | null;

  property_images?: Array<{
    image_url: string;
    storage_path: string | null;
    is_cover: boolean | null;
    sort_order: number | null;
  }> | null;
  property_features?: Array<{
    features: {
      id: string;
      name: string;
      name_en: string | null;
      name_cn: string | null;
      icon_key: string;
    } | null;
  }> | null;
};

function buildLocation(row: PropertyRow) {
  const parts = [
    row.address_line1,
    row.subdistrict,
    row.district,
    row.province,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

function pickCoverImage(
  images: PropertyRow["property_images"] | undefined | null,
) {
  if (!images || images.length === 0) return null;

  const cover = images.find((img) => img.is_cover) || images[0];
  if (!cover) return null;

  if (cover.image_url && cover.image_url.startsWith("http")) {
    return cover.image_url;
  }

  if (cover.storage_path) {
    return getPublicImageUrl(cover.storage_path);
  }

  return cover.image_url ?? null;
}

function processAllImages(
  images: PropertyRow["property_images"] | undefined | null,
) {
  if (!images || images.length === 0) return [];

  // Sort by sort_order if available
  const sorted = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return sorted
    .map((img) => {
      if (img.image_url && img.image_url.startsWith("http")) {
        return img.image_url;
      }
      if (img.storage_path) {
        return getPublicImageUrl(img.storage_path);
      }
      return img.image_url ?? null;
    })
    .filter(Boolean) as string[];
}

export interface GetPropertiesOptions {
  q?: string;
  ids?: string[];
  filter?: "hot_deals" | "all";
  limit?: number;
  province?: string;
  district?: string;
  area?: string;
  popular_area?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  priceType?: "SALE-RENT" | "SALE" | "RENT";
  listingType?: "SALE" | "RENT" | "SALE_AND_RENT" | "ALL";
  minSize?: number;
  maxSize?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export async function getPublicProperties(options: GetPropertiesOptions = {}) {
  const supabase = createAdminClient();

  let query = supabase
    .from("properties")
    .select(
      `
      id,
      slug,
      title,
      title_en,
      title_cn,
      description,
      description_en,
      description_cn,
      property_type,
      price,
      rental_price,
      original_price,
      original_rental_price,
      verified,
      min_contract_months,
      bedrooms,
      meta_keywords,
      bathrooms,
      size_sqm,
      parking_slots,
      floor,
      created_at,
      updated_at,
      listing_type,
      popular_area,
      province,
      district,
      subdistrict,
      address_line1,
      address_line1_en,
      address_line1_cn,
      nearby_places,
      nearby_transits,
      property_images (
        image_url,
        storage_path,
        is_cover,
        sort_order
      ),
      property_features (
        features (
          id,
          name,
          name_en,
          name_cn,
          icon_key
        )
      ),
      near_transit,
      transit_type,
      transit_station_name,
      transit_station_name_en,
      transit_station_name_cn,
      transit_distance_meters,
      google_maps_link,
      is_fully_furnished,
      is_bare_shell,
      is_pet_friendly,
      is_foreigner_quota,
      is_tax_registered
    `,
    )
    .eq("status", "ACTIVE");

  // Filter by IDs (Additive)
  if (options.ids && options.ids.length > 0) {
    query = query.in("id", options.ids);
  }

  // Hot Deals logic (Additive)
  if (options.filter === "hot_deals") {
    query = query.or("original_price.not.is.null,original_rental_price.not.is.null");
  }

  // Sorting and Limit
  if (options.filter === "hot_deals") {
    query = query.order("updated_at", { ascending: false }).limit(options.limit || 30);
  } else {
    query = query.order("created_at", { ascending: false }).limit(options.limit || 60);
  }

  // Filter by Location Type
  if (options.province) {
    query = query.ilike("province", `%${options.province}%`);
  }
  if (options.district) {
    query = query.ilike("district", `%${options.district}%`);
  }
  if (options.area || options.popular_area) {
    const area = options.area || options.popular_area;
    query = query.or(`subdistrict.ilike.%${area}%,popular_area.ilike.%${area}%`);
  }

  // Filter by Property Type
  if (options.propertyType && options.propertyType !== "all") {
    query = query.eq("property_type", options.propertyType as any);
  }

  // Filter by Price
  const effectivePriceType = options.priceType || options.listingType;

  if (options.minPrice || options.maxPrice) {
    const min = options.minPrice || 0;
    const max = options.maxPrice || 2147483647; // Default max for INT

    if (effectivePriceType === "RENT") {
      query = query.or(
        `and(rental_price.gte.${min},rental_price.lte.${max}),and(original_rental_price.gte.${min},original_rental_price.lte.${max})`,
      );
    } else {
      query = query.or(
        `and(price.gte.${min},price.lte.${max}),and(original_price.gte.${min},original_price.lte.${max})`,
      );
    }
  }

  // Filter by Listing Type (Intent)
  if (options.listingType) {
    if (options.listingType === "SALE") {
      query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
    } else if (options.listingType === "RENT") {
      query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
    }
  }

  // Filter by Specs
  if (options.bedrooms) {
    query = query.gte("bedrooms", options.bedrooms);
  }
  if (options.bathrooms) {
    query = query.gte("bathrooms", options.bathrooms);
  }
  if (options.minSize) {
    query = query.gte("size_sqm", options.minSize);
  }
  if (options.maxSize) {
    query = query.lte("size_sqm", options.maxSize);
  }

  // General Keyword Search
  if (options.q) {
    const searchTerm = `%${options.q}%`;
    // We search in title and description using ilike
    // For meta_keywords (array), we use 'cs' (contains)
    query = query.or(
      `title.ilike.${searchTerm},description.ilike.${searchTerm},meta_keywords.cs.{${options.q}}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching properties:", error);
    return [];
  }

  // Fetch Popular Area Translations
  const popularAreaNames = Array.from(
    new Set(
      data
        .map((row) => row.popular_area)
        .filter((area): area is string => !!area),
    ),
  );

  const areaTranslationsMap = new Map<
    string,
    { en: string | null; cn: string | null }
  >();

  if (popularAreaNames.length > 0) {
    const { data: areaData } = await supabase
      .from("popular_areas")
      .select("name, name_en, name_cn")
      .in("name", popularAreaNames);

    (areaData || []).forEach((a) => {
      areaTranslationsMap.set(a.name, { en: a.name_en, cn: a.name_cn });
    });
  }

  // Transform Data
  let items = (data ?? []).map((row: any) => {
    const typedRow = row as unknown as PropertyRow; // Cast because supabase types might be loose or strict
    const trans = areaTranslationsMap.get(typedRow.popular_area || "");

    return {
      id: typedRow.id,
      slug: typedRow.slug,
      title: typedRow.title,
      title_en: typedRow.title_en,
      title_cn: typedRow.title_cn,
      description: typedRow.description,
      description_en: typedRow.description_en,
      description_cn: typedRow.description_cn,
      property_type: typedRow.property_type,
      price: typedRow.price,
      rental_price: typedRow.rental_price,
      original_price: typedRow.original_price,
      original_rental_price: typedRow.original_rental_price,
      verified: typedRow.verified,
      min_contract_months: typedRow.min_contract_months,
      meta_keywords: typedRow.meta_keywords,
      bedrooms: typedRow.bedrooms,
      bathrooms: typedRow.bathrooms,
      size_sqm: typedRow.size_sqm,
      parking_slots: typedRow.parking_slots,
      floor: typedRow.floor,
      created_at: typedRow.created_at,
      updated_at: typedRow.updated_at,
      listing_type: typedRow.listing_type,
      popular_area: typedRow.popular_area,
      popular_area_en: trans?.en ?? null,
      popular_area_cn: trans?.cn ?? null,
      province: typedRow.province,
      district: typedRow.district,
      subdistrict: typedRow.subdistrict,
      address_line1: typedRow.address_line1,
      address_line1_en: typedRow.address_line1_en,
      address_line1_cn: typedRow.address_line1_cn,
      image_url: pickCoverImage(typedRow.property_images),
      images: processAllImages(typedRow.property_images),
      location: buildLocation(typedRow),
      features: (typedRow.property_features || [])
        .map((pf) => pf.features)
        .filter((f): f is NonNullable<typeof f> => f !== null),
      near_transit: typedRow.near_transit,
      transit_type: typedRow.transit_type,
      transit_station_name: typedRow.transit_station_name,
      transit_station_name_en: typedRow.transit_station_name_en,
      transit_station_name_cn: typedRow.transit_station_name_cn,
      transit_distance_meters: typedRow.transit_distance_meters,
      google_maps_link: typedRow.google_maps_link,
      is_fully_furnished: typedRow.is_fully_furnished,
      is_bare_shell: typedRow.is_bare_shell,
      is_pet_friendly: typedRow.is_pet_friendly,
      is_foreigner_quota: typedRow.is_foreigner_quota,
      is_tax_registered: typedRow.is_tax_registered,
      nearby_places: typedRow.nearby_places,
      nearby_transits: typedRow.nearby_transits,
    };
  });
  // Hot Deals Post-Filter
  if (options.filter === "hot_deals") {
    items = items.filter((item) => {
      const isSaleDrop =
        (item.listing_type === "SALE" ||
          item.listing_type === "SALE_AND_RENT") &&
        item.original_price &&
        item.price &&
        item.price < item.original_price;

      const isRentDrop =
        (item.listing_type === "RENT" ||
          item.listing_type === "SALE_AND_RENT") &&
        item.original_rental_price &&
        item.rental_price &&
        item.rental_price < item.original_rental_price;

      return isSaleDrop || isRentDrop;
    });
  }

  return items;
}

export async function getPublicPropertyBySlug(slug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      id,
      slug,
      title,
      title_en,
      title_cn,
      description,
      description_en,
      description_cn,
      property_type,
      price,
      rental_price,
      original_price,
      original_rental_price,
      verified,
      min_contract_months,
      bedrooms,
      meta_keywords,
      bathrooms,
      size_sqm,
      parking_slots,
      floor,
      created_at,
      updated_at,
      listing_type,
      popular_area,
      province,
      district,
      subdistrict,
      address_line1,
      address_line1_en,
      address_line1_cn,
      nearby_places,
      nearby_transits,
      property_images (
        image_url,
        storage_path,
        is_cover,
        sort_order
      ),
      property_features (
        features (
          id,
          name,
          name_en,
          name_cn,
          icon_key
        )
      ),
      near_transit,
      transit_type,
      transit_station_name,
      transit_station_name_en,
      transit_station_name_cn,
      transit_distance_meters,
      google_maps_link,
      is_fully_furnished,
      is_bare_shell,
      is_pet_friendly,
      is_foreigner_quota,
      is_tax_registered
    `,
    )
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .single();

  if (error || !data) return null;

  const typedRow = data as unknown as PropertyRow;

  // Fetch Popular Area Translations
  let trans = { en: null as string | null, cn: null as string | null };
  if (typedRow.popular_area) {
    const { data: areaData } = await supabase
      .from("popular_areas")
      .select("name, name_en, name_cn")
      .eq("name", typedRow.popular_area)
      .single();

    if (areaData) {
      trans = { en: areaData.name_en, cn: areaData.name_cn };
    }
  }

  return {
    id: typedRow.id,
    slug: typedRow.slug,
    title: typedRow.title,
    title_en: typedRow.title_en,
    title_cn: typedRow.title_cn,
    description: typedRow.description,
    description_en: typedRow.description_en,
    description_cn: typedRow.description_cn,
    property_type: typedRow.property_type,
    price: typedRow.price,
    rental_price: typedRow.rental_price,
    original_price: typedRow.original_price,
    original_rental_price: typedRow.original_rental_price,
    verified: typedRow.verified,
    min_contract_months: typedRow.min_contract_months,
    meta_keywords: typedRow.meta_keywords,
    bedrooms: typedRow.bedrooms,
    bathrooms: typedRow.bathrooms,
    size_sqm: typedRow.size_sqm,
    parking_slots: typedRow.parking_slots,
    floor: typedRow.floor,
    created_at: typedRow.created_at,
    updated_at: typedRow.updated_at,
    listing_type: typedRow.listing_type,
    popular_area: typedRow.popular_area,
    popular_area_en: trans.en,
    popular_area_cn: trans.cn,
    province: typedRow.province,
    district: typedRow.district,
    subdistrict: typedRow.subdistrict,
    address_line1: typedRow.address_line1,
    address_line1_en: typedRow.address_line1_en,
    address_line1_cn: typedRow.address_line1_cn,
    image_url: pickCoverImage(typedRow.property_images),
    images: processAllImages(typedRow.property_images),
    location: buildLocation(typedRow),
    features: (typedRow.property_features || [])
      .map((pf) => pf.features)
      .filter((f): f is NonNullable<typeof f> => f !== null),
    near_transit: typedRow.near_transit,
    transit_type: typedRow.transit_type,
    transit_station_name: typedRow.transit_station_name,
    transit_station_name_en: typedRow.transit_station_name_en,
    transit_station_name_cn: typedRow.transit_station_name_cn,
    transit_distance_meters: typedRow.transit_distance_meters,
    google_maps_link: typedRow.google_maps_link,
    is_fully_furnished: typedRow.is_fully_furnished,
    is_bare_shell: typedRow.is_bare_shell,
    is_pet_friendly: typedRow.is_pet_friendly,
    is_foreigner_quota: typedRow.is_foreigner_quota,
    is_tax_registered: typedRow.is_tax_registered,
    nearby_places: typedRow.nearby_places,
    nearby_transits: typedRow.nearby_transits,
  };
}
