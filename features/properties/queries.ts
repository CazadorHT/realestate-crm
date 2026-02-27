/**
 * ✅ ฝั่ง Public pages (เช่น (public)/property/[slug]/page.tsx)
 * import { getPublicPropertyWithImagesBySlug } from "@/features/properties/queries";
    const data = await getPublicPropertyWithImagesBySlug(slug);
    if (!data) notFound(); 

    ✅ฝั่ง Protected pages (เช่น /protected/properties/[id]/page.tsx)
    import { getProtectedPropertyWithImagesById } from "@/features/properties/queries";
    const data = await getProtectedPropertyWithImagesById(id);
*/

import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import type { PropertyTableData } from "./types";
import { getPublicImageUrl } from "@/features/properties/image-utils";

export type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyImageRow =
  Database["public"]["Tables"]["property_images"]["Row"];

export type PropertyWithImages = PropertyRow & {
  property_images: PropertyImageRow[];
};

// ✅ Public: ไม่คืน storage_path (ลดความเสี่ยงข้อมูลภายในรั่ว)
export type PublicPropertyImage = Pick<
  PropertyImageRow,
  "id" | "property_id" | "image_url" | "is_cover" | "sort_order" | "created_at"
>;
export type PublicPropertyWithImages = PropertyRow & {
  property_images: PublicPropertyImage[];
};

/**
 * ✅ PUBLIC: ใช้ในหน้า public เท่านั้น
 * - filter status = PUBLISHED
 * - query ด้วย slug
 * - ไม่ require auth
 */
export async function getPublicPropertyWithImagesBySlug(
  slug: string,
): Promise<PublicPropertyWithImages | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
        id,
        property_id,
        image_url,
        is_cover,
        sort_order,
        created_at
      )
    `,
    )
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.property_images) {
    data.property_images.sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
  }

  return data as unknown as PublicPropertyWithImages;
}
/**
 * ✅ PROTECTED: ใช้ใน CRM เท่านั้น
 * - require auth
 * - authenticated user (Agent/Admin)
 * - query ด้วย id
 */
export async function getProtectedPropertyWithImagesById(
  id: string,
): Promise<PropertyWithImages> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      property_images (
        id,
        property_id,
        image_url,
        storage_path,
        is_cover,
        sort_order,
        created_at
      )
    `,
    )
    .eq("id", id)
    .eq("tenant_id", tenantId!)
    .single();

  if (error || !data) throw error;

  // ✅ Authorization check (authenticated)

  if (data.property_images) {
    data.property_images.sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );
  }

  return data as unknown as PropertyWithImages;
}

/**
 * Return minimal properties for select inputs in protected CRM
 */
export async function getPropertiesForSelect() {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("properties")
    .select(
      `id, title, price, original_price, rental_price, original_rental_price, commission_sale_percentage, commission_rent_months, popular_area, province, property_images(image_url, is_cover)`,
    )
    .eq("tenant_id", tenantId!)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Map to include cover_image
  return (data ?? []).map((p) => ({
    ...p,
    cover_image:
      p.property_images?.find((img: any) => img.is_cover)?.image_url ||
      p.property_images?.[0]?.image_url ||
      null,
  }));
}

export type PropertyStats = {
  total: number;
  available: number;
  soldOrRented: number;
  totalValue: number;
  totalSaleCommission: number;
  totalRentCommission: number;
  totalRealizedCommission: number;
  byType: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
};

export async function getPropertiesDashboardStatsQuery(): Promise<PropertyStats> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, status, price, rental_price, original_price, original_rental_price, property_type, listing_type, commission_sale_percentage, commission_rent_months",
    )
    .eq("tenant_id", tenantId!)
    .is("deleted_at", null);

  if (error || !data) {
    return {
      total: 0,
      available: 0,
      soldOrRented: 0,
      totalValue: 0,
      totalSaleCommission: 0,
      totalRentCommission: 0,
      totalRealizedCommission: 0,
      byType: [],
      byStatus: [],
    };
  }

  const total = data.length;
  // Change "AVAILABLE/FOR_SALE/FOR_RENT" to actual enum "ACTIVE"
  const active = data.filter((p) => p.status === "ACTIVE").length;
  const soldOrRented = data.filter((p) =>
    ["SOLD", "RENTED"].includes(p.status),
  ).length;

  // Sum price of ACTIVE properties (fallback to original_price if price is missing)
  const totalValue = data
    .filter((p) => p.status === "ACTIVE")
    .reduce((sum, p) => sum + (p.price || p.original_price || 0), 0);

  // Calculate Commissions separately
  let totalSaleCommission = 0;
  let totalRentCommission = 0;
  let totalRealizedCommission = 0;

  data.forEach((p) => {
    // Determine effective prices (use original if current is missing)
    const salePrice = (p.price || 0) > 0 ? p.price : p.original_price || 0;
    const rentPrice =
      (p.rental_price || 0) > 0 ? p.rental_price : p.original_rental_price || 0;

    // 1. Sale/Rent Potential Calculation (Only for ACTIVE)
    if (p.status === "ACTIVE") {
      // Sale Potential
      if (
        (p.listing_type === "SALE" || p.listing_type === "SALE_AND_RENT") &&
        salePrice &&
        salePrice > 0
      ) {
        totalSaleCommission +=
          (salePrice * (p.commission_sale_percentage || 3)) / 100;
      }

      // Rent Potential
      if (
        (p.listing_type === "RENT" || p.listing_type === "SALE_AND_RENT") &&
        rentPrice &&
        rentPrice > 0
      ) {
        totalRentCommission += rentPrice * (p.commission_rent_months || 1);
      }
    }

    // 2. Realized Commission Calculation (SOLD or RENTED)
    if (p.status === "SOLD") {
      // For sold items, prefer price, fallback to original
      const finalPrice = (p.price || 0) > 0 ? p.price : p.original_price || 0;
      if (finalPrice && finalPrice > 0) {
        totalRealizedCommission +=
          (finalPrice * (p.commission_sale_percentage || 3)) / 100;
      }
    } else if (p.status === "RENTED") {
      // For rented items, prefer rental_price
      const finalRentPrice =
        (p.rental_price || 0) > 0
          ? p.rental_price
          : p.original_rental_price || 0;
      if (finalRentPrice && finalRentPrice > 0) {
        totalRealizedCommission +=
          finalRentPrice * (p.commission_rent_months || 1);
      }
    }
  });

  // Group by Type
  const typeMap = new Map<string, number>();
  data.forEach((p) => {
    const t = p.property_type || "Unknown";
    typeMap.set(t, (typeMap.get(t) || 0) + 1);
  });
  const byType = Array.from(typeMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  // Group by Status
  const statusMap = new Map<string, number>();
  data.forEach((p) => {
    const s = p.status || "Unknown";
    statusMap.set(s, (statusMap.get(s) || 0) + 1);
  });
  const byStatus = Array.from(statusMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  return {
    total,
    available: active, // Send 'active' as 'available' to match frontend prop or rename in type?
    // I will keep the key 'available' in PropertyStats to minimize refactor,
    // but logically it represents ACTIVE.
    soldOrRented,
    totalValue,
    totalSaleCommission,
    totalRentCommission,
    totalRealizedCommission,
    byType,
    byStatus,
  };
}

export async function getPropertiesTableData(params: {
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
  sortBy?: string;
  sortOrder?: string;
  nearTransit?: string;
  petFriendly?: string;
  fullyFurnished?: string;
  page?: string;
}): Promise<{
  tableData: PropertyTableData[];
  count: number;
  filterMetadata: any[];
}> {
  const { supabase, role, tenantId } = await requireAuthContext();
  assertStaff(role);

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
    sortBy = "created_at",
    sortOrder = "desc",
    nearTransit,
    petFriendly,
    fullyFurnished,
    page,
  } = params;

  // Pagination Config
  const PAGE_SIZE = 10;
  const currentPage = Number(page) || 1;
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // 1. Build Query
  let query = supabase
    .from("properties")
    .select("*", { count: "exact" }) // Get count for pagination
    .eq("tenant_id", tenantId!)
    .is("deleted_at", null)
    .range(from, to);

  // Search
  if (q) {
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%,address_line1.ilike.%${q}%`,
    );
  }

  // Filters
  if (status) {
    query = query.eq("status", status as any);
  }
  if (type) {
    query = query.eq("property_type", type as any);
  }
  if (listing) {
    if (listing === "SALE") {
      query = query.in("listing_type", ["SALE", "SALE_AND_RENT"]);
    } else if (listing === "RENT") {
      query = query.in("listing_type", ["RENT", "SALE_AND_RENT"]);
    } else {
      query = query.eq("listing_type", listing as any);
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

  // Price Range with fallback
  const priceField = listing === "RENT" ? "rental_price" : "price";
  const fallbackField =
    listing === "RENT" ? "original_rental_price" : "original_price";

  if (
    (minPrice && minPrice.trim() !== "") ||
    (maxPrice && maxPrice.trim() !== "")
  ) {
    const min = minPrice && minPrice.trim() !== "" ? Number(minPrice) : 0;
    const maxStr = maxPrice && maxPrice.trim() !== "" ? maxPrice : null;

    if (maxStr !== null) {
      const max = Number(maxStr);
      query = query.or(
        `and(${priceField}.gte.${min},${priceField}.lte.${max}),and(${priceField}.is.null,${fallbackField}.gte.${min},${fallbackField}.lte.${max})`,
      );
    } else {
      query = query.or(
        `${priceField}.gte.${min},and(${priceField}.is.null,${fallbackField}.gte.${min})`,
      );
    }
  }

  // Sorting
  const validSortFields = [
    "created_at",
    "updated_at",
    "title",
    "price",
    "rental_price",
    "bedrooms",
    "status",
    "property_type",
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
  const ascending = sortOrder === "asc";

  query = query.order(sortField, { ascending });

  const { data: properties, error, count } = await query;

  if (error || !properties) {
    return { tableData: [], count: 0, filterMetadata: [] };
  }

  const propertyIds = properties.map((p) => p.id);
  const CLOSED_DEAL_STATUSES = ["SIGNED", "CLOSED_WIN"] as const;
  const soldOrRentedIds = properties
    .filter((p) => p.status === "SOLD" || p.status === "RENTED")
    .map((p) => p.id);

  const [imagesResult, leadsResult, closedLeadsResult, filterMetadataResult] =
    await Promise.all([
      supabase
        .from("property_images")
        .select("property_id, image_url, storage_path, is_cover")
        .in("property_id", propertyIds)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true }),

      supabase
        .from("leads")
        .select("property_id")
        .in("property_id", propertyIds),

      soldOrRentedIds.length > 0
        ? supabase
            .from("deals")
            .select(
              `
          property_id,
          deal_type,
          status,
          updated_at,
          lead:leads(full_name)
        `,
            )
            .in("property_id", soldOrRentedIds)
            .in("status", [...CLOSED_DEAL_STATUSES])
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [] }),

      supabase
        .from("properties")
        .select(
          "status, property_type, province, popular_area, listing_type, price, rental_price, original_price, original_rental_price, bedrooms, bathrooms, near_transit, is_pet_friendly, is_fully_furnished",
        )
        .eq("tenant_id", tenantId!)
        .is("deleted_at", null),
    ]);

  const bestImageMap = new Map<string, string>();
  imagesResult.data?.forEach((img) => {
    if (!bestImageMap.has(img.property_id)) {
      const bestUrl = img.image_url || img.storage_path;
      if (bestUrl) bestImageMap.set(img.property_id, bestUrl);
    }
  });

  const leadsCountMap = new Map<string, number>();
  leadsResult.data?.forEach((lead) => {
    if (lead.property_id) {
      leadsCountMap.set(
        lead.property_id,
        (leadsCountMap.get(lead.property_id) || 0) + 1,
      );
    }
  });

  const closedLeadNameMap = new Map<string, string>();
  closedLeadsResult.data?.forEach((d: any) => {
    const pid = d?.property_id;
    const name = d?.lead?.full_name;
    if (pid && !closedLeadNameMap.has(pid) && name) {
      closedLeadNameMap.set(pid, name);
    }
  });

  const tableData: PropertyTableData[] = properties.map((p) => {
    const isNew =
      new Date().getTime() - new Date(p.created_at).getTime() <
      7 * 24 * 60 * 60 * 1000;
    const locationHint =
      [p.district, p.province].filter(Boolean).join(", ") ||
      p.address_line1 ||
      "";

    let rawImageUrl = bestImageMap.get(p.id) || null;
    if (!rawImageUrl && p.images) {
      const legacyImages = p.images as any;
      if (Array.isArray(legacyImages) && legacyImages.length > 0) {
        rawImageUrl =
          typeof legacyImages[0] === "string"
            ? legacyImages[0]
            : legacyImages[0]?.url || legacyImages[0]?.image_url;
      }
    }

    const imageUrl = rawImageUrl ? getPublicImageUrl(rawImageUrl) : null;

    return {
      id: p.id,
      title: p.title,
      description: locationHint || p.description,
      image_url: imageUrl,
      property_type: p.property_type as any,
      listing_type: p.listing_type as any,
      price: p.price,
      rental_price: p.rental_price,
      status: p.status as any,
      leads_count: leadsCountMap.get(p.id) || 0,
      updated_at: p.updated_at,
      created_at: p.created_at,
      popular_area: p.popular_area,
      closed_lead_name: closedLeadNameMap.get(p.id) || null,
      original_price: p.original_price,
      original_rental_price: p.original_rental_price,
      is_new: isNew,
      view_count: p.view_count || 0,
      total_units: p.total_units || undefined,
      sold_units: p.sold_units || undefined,
      posted_to_facebook_at: p.posted_to_facebook_at ?? null,
      posted_to_instagram_at: p.posted_to_instagram_at ?? null,
      posted_to_line_at: p.posted_to_line_at ?? null,
      posted_to_tiktok_at: p.posted_to_tiktok_at ?? null,
    };
  });

  return {
    tableData,
    count: count || 0,
    filterMetadata: filterMetadataResult.data || [],
  };
}
