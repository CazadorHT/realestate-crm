"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { PropertyTableData } from "../types";
import { getPublicImageUrl } from "@/features/properties/image-utils";

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
  allBranches?: string;
  page?: string;
}): Promise<{
  tableData: PropertyTableData[];
  count: number;
  filterMetadata: any[];
}> {
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
    sortBy = "created_at",
    sortOrder = "desc",
    nearTransit,
    petFriendly,
    fullyFurnished,
    allBranches,
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
    .select(
      "id, title, description, status, property_type, listing_type, price, rental_price, original_price, original_rental_price, updated_at, created_at, bedrooms, bathrooms, province, district, popular_area, view_count, address_line1, images, total_units, sold_units, posted_to_facebook_at, posted_to_instagram_at, posted_to_line_at, posted_to_tiktok_at, assigned_to, tenant_id, tenants(name), requires_ai_review",
      {
        count: "exact",
      },
    )
    .is("deleted_at", null);

  if (isMultiTenant) {
    if (allBranches === "true" || tenantId === "ALL" || !tenantId) {
      // ALL Branches: include all
    } else {
      // Specific branch
      query = query.eq("tenant_id", tenantId);
    }
  }

  // Search
  if (q && q.trim()) {
    const isHexFragment = /^[0-9a-fA-F-]{4,}$/.test(q);
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

  // Filters
  if (status && status !== "ALL") {
    query = query.eq("status", status as any);
  }
  if (type && type !== "ALL") {
    query = query.eq("property_type", type as any);
  }
  if (listing && listing !== "ALL") {
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

  query = query.order(sortField, { ascending }).range(from, to);

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

      (async () => {
        const config = await getSystemConfig();
        const isMultiTenant = config.multi_tenant_enabled;

        let q = supabase
          .from("properties")
          .select(
            "status, property_type, province, popular_area, listing_type, price, rental_price, original_price, original_rental_price, bedrooms, bathrooms, near_transit, is_pet_friendly, is_fully_furnished",
          )
          .is("deleted_at", null);

        if (isMultiTenant) {
          if (allBranches === "true" || tenantId === "ALL" || !tenantId) {
            // All
          } else {
            q = q.eq("tenant_id", tenantId);
          }
        }
        // Single-tenant mode: show everything (permissive)
        return q;
      })(),
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
  closedLeadsResult.data?.forEach((d) => {
    const deal = d as unknown as {
      property_id: string;
      lead: { full_name: string } | null;
    };
    const pid = deal?.property_id;
    const name = deal?.lead?.full_name;
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

    let rawImageUrl: string | null = bestImageMap.get(p.id) || null;
    const legacyImages = (p as unknown as { images?: string[] | { url?: string; image_url?: string }[] }).images;
    if (!rawImageUrl && legacyImages) {
      if (Array.isArray(legacyImages) && legacyImages.length > 0) {
        const first = legacyImages[0];
        const extracted = typeof first === "string" ? first : first?.url || first?.image_url;
        if (extracted) rawImageUrl = extracted;
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
      requires_ai_review: (p as any).requires_ai_review ?? false,
      leads_count: leadsCountMap.get(p.id) || 0,
      updated_at: p.updated_at,
      created_at: p.created_at,
      popular_area: p.popular_area,
      closed_lead_name: closedLeadNameMap.get(p.id) || null,
      original_price: p.original_price,
      original_rental_price: p.original_rental_price,
      is_new: isNew,
      view_count: p.view_count || 0,
      total_units: (p as any).total_units || undefined,
      sold_units: (p as any).sold_units || undefined,
      posted_to_facebook_at: (p as any).posted_to_facebook_at ?? null,
      posted_to_instagram_at: (p as any).posted_to_instagram_at ?? null,
      posted_to_line_at: (p as any).posted_to_line_at ?? null,
      posted_to_tiktok_at: (p as any).posted_to_tiktok_at ?? null,
      agent_name: null,
      tenant_id: p.tenant_id,
      tenant_name: (p as any).tenants?.name || null,
    };
  });

  return {
    tableData,
    count: count || 0,
    filterMetadata: filterMetadataResult.data || [],
  };
}
