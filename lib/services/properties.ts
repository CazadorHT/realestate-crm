import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";
import { getPublicImageUrl } from "@/features/properties/image-utils";

export type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
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
  popular_area: string | null;
  original_price: number | null;
  original_rental_price: number | null;
  verified: boolean | null;
  min_contract_months: number | null;
  meta_keywords: string[] | null;
  near_transit: boolean | null;
  transit_type: string | null;
  transit_station_name: string | null;
  transit_distance_meters: number | null;
  google_maps_link: string | null;

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

export interface GetPropertiesOptions {
  ids?: string[];
  filter?: "hot_deals" | "all";
  limit?: number;
  province?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  listingType?: "SALE" | "RENT"; // Abstract intent: Buy or Rent
  q?: string; // General keyword search
  bedrooms?: number;
  bathrooms?: number;
  minSize?: number;
  maxSize?: number;
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
      description,
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
          icon_key
        )
      ),
      near_transit,
      transit_type,
      transit_station_name,
      transit_distance_meters,
      google_maps_link
    `,
    )
    .eq("status", "ACTIVE");

  // Filter by IDs
  if (options.ids && options.ids.length > 0) {
    query = query.in("id", options.ids);
  } else if (options.filter === "hot_deals") {
    // Hot Deals logic
    query = query
      .or("original_price.not.is.null,original_rental_price.not.is.null")
      .order("updated_at", { ascending: false })
      .limit(options.limit || 30);
  } else {
    // Default sort
    query = query
      .order("created_at", { ascending: false })
      .limit(options.limit || 60);
  }

  // Filter by Location
  if (options.district || options.province) {
    const loc = (options.district || options.province || "").trim();
    if (loc) {
      query = query.or(
        `district.ilike.%${loc}%,province.ilike.%${loc}%,popular_area.ilike.%${loc}%,subdistrict.ilike.%${loc}%`,
      );
    }
  }

  // Filter by Property Type
  if (options.propertyType) {
    query = query.ilike("property_type", `%${options.propertyType}%`);
  }

  // Filter by Price
  if (options.minPrice) {
    // If listingType is RENT, check rental_price. Else check price.
    // Or check both if ambiguous?
    // Chatbot usually implies intent.
    if (options.listingType === "RENT") {
      query = query.gte("rental_price", options.minPrice);
    } else {
      // Default to Sale Price if unspecified or explicitly SALE
      query = query.gte("price", options.minPrice);
    }
  }

  if (options.maxPrice) {
    if (options.listingType === "RENT") {
      query = query.lte("rental_price", options.maxPrice);
    } else {
      query = query.lte("price", options.maxPrice);
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

  // Transform Data
  let items = (data ?? []).map((row) => {
    const typedRow = row as unknown as PropertyRow; // Cast because supabase types might be loose or strict
    return {
      id: typedRow.id,
      slug: typedRow.slug,
      title: typedRow.title,
      description: typedRow.description,
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
      province: typedRow.province,
      district: typedRow.district,
      subdistrict: typedRow.subdistrict,
      address_line1: typedRow.address_line1,
      image_url: pickCoverImage(typedRow.property_images),
      location: buildLocation(typedRow),
      features: (typedRow.property_features || [])
        .map((pf) => pf.features)
        .filter((f): f is NonNullable<typeof f> => f !== null),
      near_transit: typedRow.near_transit,
      transit_type: typedRow.transit_type,
      transit_station_name: typedRow.transit_station_name,
      transit_distance_meters: typedRow.transit_distance_meters,
      google_maps_link: typedRow.google_maps_link,
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
