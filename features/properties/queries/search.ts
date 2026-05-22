import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { PropertyStatus, PropertyType, ListingType, PropertyImageMetadata } from "../types";

/**
 * Return minimal properties for select inputs in protected CRM
 */
export async function getPropertiesForSelect() {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  let query = supabase
    .from("properties")
    .select(
      `id, title, price, original_price, rental_price, original_rental_price, listing_type, commission_sale_percentage, commission_rent_months, popular_area, province, images`,
    )
    .is("deleted_at", null);

  if (isMultiTenant && tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw error;

  // Map to include cover_image
  return (data ?? []).map((p) => {
    const imagesRaw = (p.images as unknown) ?? null;
    const images: PropertyImageMetadata[] = Array.isArray(imagesRaw) ? (imagesRaw as PropertyImageMetadata[]) : [];
    const coverUrl = images.find((img) => img.is_cover)?.url || images[0]?.url || null;
    return {
      ...p,
      id: p.id!,
      title: p.title ?? "Untitled",
      cover_image: coverUrl,
      image_url: coverUrl,
    };
  });
}

/**
 * Fetch all property IDs matching filters (for global selection)
 */
export async function getAllPropertyIdsQuery(params: {
  q?: string;
  status?: string;
  type?: string;
  listing?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  bathrooms?: string;
  province?: string;
  district?: string;
  popular_area?: string;
  nearTransit?: string;
  petFriendly?: string;
  fullyFurnished?: string;
  allBranches?: string;
}) {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const config = await getSystemConfig();
  const isMultiTenant = config.multi_tenant_enabled;

  const {
    q,
    status,
    type,
    listing,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    province,
    district,
    popular_area,
    nearTransit,
    petFriendly,
    fullyFurnished,
    allBranches,
  } = params;

  let query = supabase
    .from("properties")
    .select("id")
    .is("deleted_at", null);

  if (isMultiTenant) {
    if (allBranches === "true" || tenantId === "ALL" || !tenantId) {
      // All
    } else {
      query = query.eq("tenant_id", tenantId);
    }
  }

  if (q) {
    const isHexFragment = /^[0-9a-fA-F-]+$/.test(q);
    const conditions = [
      `title.ilike.%${q}%`,
      `description.ilike.%${q}%`,
      `address_line1.ilike.%${q}%`,
    ];
    if (isHexFragment) {
      conditions.unshift(`id.ilike.%${q}%`);
    }
    query = query.or(conditions.join(","));
  }

  if (status && status !== "ALL") {
    query = query.eq("status", status as PropertyStatus);
  }
  if (type && type !== "ALL") {
    query = query.eq("property_type", type as PropertyType);
  }
  if (listing && listing !== "ALL") {
    if (listing === "SALE") {
      query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
    } else if (listing === "RENT") {
      query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
    } else {
      query = query.eq("listing_type", listing as ListingType);
    }
  }
  if (bedrooms) {
    query = query.eq("bedrooms", Number(bedrooms));
  }
  if (bathrooms) {
    query = query.eq("bathrooms", Number(bathrooms));
  }
  if (province) {
    query = query.ilike("province", `%${province}%`);
  }
  if (district) {
    query = query.ilike("district", `%${district}%`);
  }
  if (popular_area) {
    query = query.ilike("popular_area", `%${popular_area}%`);
  }
  if (nearTransit === "true") {
    query = query.eq("near_transit", true);
  }
  if (petFriendly === "true") {
    query = query.eq("is_pet_friendly", true);
  }
  if (fullyFurnished === "true") {
    query = query.eq("is_fully_furnished", true);
  }

  const priceField = listing === "RENT" ? "rental_price" : "price";
  const fallbackField = listing === "RENT" ? "original_rental_price" : "original_price";

  if ((minPrice && minPrice.trim() !== "") || (maxPrice && maxPrice.trim() !== "")) {
    const min = (minPrice && minPrice.trim() !== "") ? Number(minPrice) : 0;
    const maxStr = (maxPrice && maxPrice.trim() !== "") ? maxPrice : null;

    if (maxStr !== null) {
      const max = Number(maxStr);
      query = query.or(`and(${priceField}.gte.${min},${priceField}.lte.${max}),and(${priceField}.is.null,${fallbackField}.gte.${min},${fallbackField}.lte.${max})`);
    } else {
      query = query.or(`${priceField}.gte.${min},and(${priceField}.is.null,${fallbackField}.gte.${min})`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((p) => p.id);
}
