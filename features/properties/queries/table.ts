import { createClient } from "@/lib/supabase/server";
import { requireAuthContext, assertStaff } from "@/lib/authz";
import { getSystemConfig } from "@/lib/actions/system-config";
import { PropertyTableData, PropertyStatus, PropertyType, ListingType } from "../types";
import { getPublicImageUrl } from "@/features/properties/image-utils";

interface TableQueryResult {
  id: string;
  title: string;
  description: string | null;
  status: PropertyStatus;
  property_type: PropertyType;
  listing_type: ListingType;
  price: number | null;
  rental_price: number | null;
  original_price: number | null;
  original_rental_price: number | null;
  updated_at: string;
  created_at: string;
  bedrooms: number | null;
  bathrooms: number | null;
  office_capacity: number | null;
  province: string | null;
  district: string | null;
  popular_area: string | null;
  view_count: number | null;
  address_line1: string | null;
  images: any; // Legacy JSONB field
  total_units: number | null;
  sold_units: number | null;
  posted_to_facebook_at: string | null;
  posted_to_instagram_at: string | null;
  posted_to_line_at: string | null;
  posted_to_tiktok_at: string | null;
  assigned_to: string | null;
  agent: { full_name: string } | null;
  tenant_id: string | null;
  tenants: { name: string } | null;
  requires_ai_review: boolean | null;
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
  allBranches?: string;
  needsAiReview?: string;
  page?: string;
}): Promise<{
  tableData: PropertyTableData[];
  count: number;
  filterMetadata: Partial<TableQueryResult>[];
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
      `
      id, title, description, status, property_type, listing_type, 
      price, rental_price, original_price, original_rental_price, 
      updated_at, created_at, bedrooms, bathrooms, office_capacity, province, district, 
      popular_area, view_count, address_line1, images, total_units, 
      sold_units, posted_to_facebook_at, posted_to_instagram_at, 
      posted_to_line_at, posted_to_tiktok_at, assigned_to, 
      agent:profiles!properties_assigned_to_profile_fkey(full_name),
      tenant_id, tenants(name), requires_ai_review
      `,
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

  // [SMART SEARCH HARDENING] - Token-based Logic Grouping
  if (q && q.trim()) {
    const searchTerm = q.trim();
    const tokens = searchTerm.split(/\s+/).filter(t => t.length > 0);
    const fuzzyQuery = searchTerm
      .replace(/([ก-ฮa-zA-Z])(\d)/g, '$1%$2')
      .replace(/(\d)([ก-ฮa-zA-Z])/g, '$1%$2')
      .replace(/\s+/g, "%");
    const isHexFragment = /^[0-9a-fA-F-]{4,}$/.test(searchTerm);

    // [AGENT LOOKUP] - Pre-fetch matching agent IDs for precise filtering
    const { data: matchingAgents } = await supabase
      .from("profiles")
      .select("id")
      .ilike("full_name", `%${fuzzyQuery}%`);
    const agentIds = matchingAgents?.map(a => a.id) || [];
    
    // 1. Text Search Conditions (Base OR)
    const textConditions = [
      `title.ilike.%${fuzzyQuery}%`,
      `description.ilike.%${fuzzyQuery}%`,
      `address_line1.ilike.%${fuzzyQuery}%`,
      `province.ilike.%${fuzzyQuery}%`,
      `district.ilike.%${fuzzyQuery}%`,
      `popular_area.ilike.%${fuzzyQuery}%`,
    ];
    if (isHexFragment) textConditions.unshift(`id.ilike.%${searchTerm}%`);
    if (agentIds.length > 0) {
      textConditions.push(`assigned_to.in.(${agentIds.map(id => `"${id}"`).join(",")})`);
    }

    // 2. Intelligent Mapping Conditions
    const smartFilters: string[] = [];
    
    // Map Listing Types
    const isSale = tokens.some(t => t.includes("ขาย"));
    const isRent = tokens.some(t => t.includes("เช่า"));
    if (isSale) smartFilters.push(`listing_type.in.("SALE","SALE_AND_RENT")`);
    if (isRent) smartFilters.push(`listing_type.in.("RENT","SALE_AND_RENT")`);

    // Map Statuses
    if (tokens.some(t => t.includes("ว่าง") || t.includes("ใช้งาน"))) smartFilters.push(`status.eq.ACTIVE`);
    if (tokens.some(t => t.includes("ขายแล้ว"))) smartFilters.push(`status.eq.SOLD`);
    if (tokens.some(t => t.includes("เช่าแล้ว"))) smartFilters.push(`status.eq.RENTED`);
    if (tokens.some(t => t.includes("จองแล้ว"))) smartFilters.push(`status.eq.RESERVED`);
    if (tokens.some(t => t.includes("ติดจอง") || t.includes("ข้อเสนอ"))) smartFilters.push(`status.eq.UNDER_OFFER`);
    if (tokens.some(t => t.includes("ร่าง"))) smartFilters.push(`status.eq.DRAFT`);
    if (tokens.some(t => t.includes("เก็บถาวร"))) smartFilters.push(`status.eq.ARCHIVED`);

    // Map Social Media (Posted)
    if (tokens.some(t => t.toLowerCase().includes("tiktok"))) smartFilters.push(`posted_to_tiktok_at.not.is.null`);
    if (tokens.some(t => t.toLowerCase().includes("facebook") || t.toLowerCase() === "fb")) smartFilters.push(`posted_to_facebook_at.not.is.null`);
    if (tokens.some(t => t.toLowerCase().includes("instagram") || t.toLowerCase() === "ig")) smartFilters.push(`posted_to_instagram_at.not.is.null`);
    if (tokens.some(t => t.toLowerCase().includes("line"))) smartFilters.push(`posted_to_line_at.not.is.null`);

    // Map Property Types
    if (tokens.some(t => t.includes("คอนโด"))) smartFilters.push(`property_type.eq.CONDO`);
    if (tokens.some(t => t.includes("บ้าน") || t.includes("เดี่ยว"))) smartFilters.push(`property_type.eq.HOUSE`);
    if (tokens.some(t => t.includes("ทาวน์"))) smartFilters.push(`property_type.eq.TOWNHOME`);
    if (tokens.some(t => t.includes("พูลวิลล่า"))) smartFilters.push(`property_type.eq.POOL_VILLA`);
    else if (tokens.some(t => t.includes("วิลล่า"))) smartFilters.push(`property_type.eq.VILLA`);
    
    if (tokens.some(t => t.includes("ที่ดิน"))) smartFilters.push(`property_type.eq.LAND`);
    if (tokens.some(t => t.includes("พาณิชย์") || t.includes("ตึกแถว") || t.includes("shophouse"))) smartFilters.push(`property_type.eq.COMMERCIAL_BUILDING`);
    if (tokens.some(t => t.includes("ออฟฟิศ") || t.includes("สำนักงาน") || t.includes("office"))) smartFilters.push(`property_type.eq.OFFICE_BUILDING`);
    if (tokens.some(t => t.includes("โกดัง") || t.includes("โรงงาน") || t.includes("warehouse"))) smartFilters.push(`property_type.eq.WAREHOUSE`);
    if (tokens.some(t => t.includes("อื่นๆ") || t.includes("other"))) smartFilters.push(`property_type.eq.OTHER`);

    // Map Agent Name (Profiles Join)
    // Note: Cross-table OR filters are not supported in basic PostgREST syntax
    // We will keep the join for display but remove it from the global OR search for now
    // to prevent query failure.

    // Map Room Counts
    tokens.forEach(t => {
      const numMatch = t.match(/(\d+)/);
      if (numMatch) {
        const num = numMatch[1];
        if (t.includes("นอน") || t.includes("bed")) smartFilters.push(`bedrooms.eq.${num}`);
        if (t.includes("น้ำ") || t.includes("bath")) smartFilters.push(`bathrooms.eq.${num}`);
      }
    });

    // 3. Final Assembly: (Text Search) OR (Smart Filters AND Group)
    if (smartFilters.length > 0) {
      const smartGroup = `and(${smartFilters.join(",")})`;
      query = query.or(`${textConditions.join(",")},${smartGroup}`);
    } else {
      query = query.or(textConditions.join(","));
    }
  }

  // Filters
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
  if (params.needsAiReview === "true") {
    query = query.eq("requires_ai_review", true);
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

  const { data: propertiesRaw, error, count } = await query;
  const properties = propertiesRaw as unknown as TableQueryResult[];

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
        // [PERFORMANCE HARDENING] Fetch ONLY columns needed for Filter Counts
        // This restores the UI logic while keeping the payload as small as possible.
        let q = supabase
          .from("properties")
          .select("status, property_type, listing_type, price, rental_price, original_price, original_rental_price, bedrooms, bathrooms, province, popular_area, near_transit, is_fully_furnished, requires_ai_review")
          .is("deleted_at", null);

        if (isMultiTenant) {
          if (allBranches === "true" || tenantId === "ALL" || !tenantId) {
            // All
          } else {
            q = q.eq("tenant_id", tenantId);
          }
        }
        return q;
      })(),
    ]);

  const bestImageMap = new Map<string, string>();
  imagesResult.data?.forEach((img) => {
    if (!img.property_id) return;
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
      property_type: p.property_type,
      listing_type: p.listing_type,
      price: p.price,
      rental_price: p.rental_price,
      status: p.status,
      requires_ai_review: p.requires_ai_review ?? false,
      leads_count: leadsCountMap.get(p.id) || 0,
      updated_at: p.updated_at,
      created_at: p.created_at,
      popular_area: p.popular_area,
      closed_lead_name: closedLeadNameMap.get(p.id) || null,
      original_price: p.original_price,
      original_rental_price: p.original_rental_price,
      office_capacity: p.office_capacity,
      is_new: isNew,
      view_count: p.view_count || 0,
      total_units: p.total_units || undefined,
      sold_units: p.sold_units || undefined,
      posted_to_facebook_at: p.posted_to_facebook_at ?? null,
      posted_to_instagram_at: p.posted_to_instagram_at ?? null,
      posted_to_line_at: p.posted_to_line_at ?? null,
      posted_to_tiktok_at: p.posted_to_tiktok_at ?? null,
      agent_name: p.agent?.full_name || null,
      tenant_id: p.tenant_id,
      tenant_name: p.tenants?.name || null,
      province: p.province,
    };
  });

  return {
    tableData,
    count: count || 0,
    filterMetadata: (filterMetadataResult.data as unknown as Partial<TableQueryResult>[]) || [],
  };
}
