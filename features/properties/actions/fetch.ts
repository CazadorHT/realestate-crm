"use server";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuthContext,
  assertAuthenticated,
  assertStaff,
} from "@/lib/authz";
import type {
  PropertyRow,
  PropertyWithImages,
  PropertyType,
  ListingType,
  PropertyStatus,
  PropertyTransitInfoConsolidated,
  PropertyTransitV3,
} from "../types";
import type {
  InventoryProperty,
  InventoryFilterCounts,
} from "@/app/(protected)/protected/admin/inventory/types";
import { getCoverImage } from "@/lib/property-hardened-utils";
import { getRecommendedProperties } from "../queries";
import {
  PROPERTY_STATUS_DB_VALUE,
  LISTING_TYPE_DB_VALUE,
  PROPERTY_TYPE_DB_VALUE,
  getStatusFromDb,
  getListingTypeFromDb,
  getPropertyTypeFromDb,
} from "../labels";
import { mapDbError } from "@/lib/db-error";
import type { Database } from "@/lib/database.types.generated";

/** === SHARED JSONB INTERFACES === */
interface MultiLang {
  th?: string;
  en?: string;
  cn?: string;
  ru?: string;
}
interface AddressInfo {
  th?: string;
  en?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postal_code?: string;
  maps_link?: string;
  popular_area?: string;
  popular_area_en?: string;
  popular_area_cn?: string;
  popular_area_ru?: string;
}
interface Amenities {
  is_pet_friendly?: boolean;
  is_foreigner_quota?: boolean;
  allow_airbnb?: boolean;
  airbnb_daily_price?: number;
  airbnb_monthly_price?: number;
  airbnb_min_contract?: string;
}
interface PricingDetails {
  maintenance_fee?: number;
  commission_sale?: number;
  commission_rent?: number;
  original_price?: number;
  original_rental_price?: number;
}
interface MetaData {
  agent_ids?: string[];
  created_by?: string;
  requires_ai_review?: boolean;
  co_agent?: { name?: string; phone?: string; contact_id?: string };
}

interface AggregationRow {
  property_type: string | null;
  status: string | null;
  listing_type: string | null;
  tenant_id: string | null;
}

/**
 * Get property by ID with images
 */
export async function getPropertyById(id: string): Promise<PropertyRow> {
  try {
    const { supabase, user, role, tenantId } = await requireAuthContext();
    assertStaff(role);

    const { data: core, error: coreErr } = await supabase
      .from("properties_core")
      .select(
        "id, tenant_id, branch_id, project_id, status, listing_type, property_type, sale_price, rent_price, currency, floor_area, land_area, is_exclusive, is_hot_deal, verified, created_at, updated_at, owner_id, assigned_to, bedrooms, bathrooms, price_per_sqm",
      )
      .eq("id", id)
      .single();

    if (coreErr || !core) throw coreErr || new Error("Property not found");

    // 🛡️ Elite Hardening: Verify tenant access for non-admins
    if (role !== "ADMIN") {
      const propertyTenantId = core.tenant_id;

      if (!propertyTenantId) {
        throw new Error("Property does not belong to any tenant/branch");
      }

      // If user has a specific active tenant context, ensure it matches the property's tenant
      if (tenantId && tenantId !== propertyTenantId) {
        throw new Error(
          "Forbidden: You do not have access to this tenant's property",
        );
      }

      // If user has cross-branch context (tenantId is undefined due to "ALL" cookie),
      // we must verify they are a member of the property's tenant
      if (!tenantId) {
        const { data: member, error: memberErr } = await supabase
          .from("tenant_members_v3")
          .select("role")
          .eq("tenant_id", propertyTenantId)
          .eq("identity_id", user.id)
          .maybeSingle();

        if (memberErr || !member) {
          throw new Error(
            "Forbidden: You are not a member of this property's tenant/branch",
          );
        }
      }
    }

    const { data: details, error: detailsErr } = await supabase
      .from("properties_details")
      .select(
        "property_id, title, description, address_info, amenities, pricing_details, meta_data, transit_info",
      )
      .eq("property_id", id)
      .single();

    if (detailsErr || !details)
      throw detailsErr || new Error("Details not found");

    const { data: media } = await supabase
      .from("property_media_v3")
      .select("id, property_id, url, media_type, is_cover, sort_order")
      .eq("property_id", id)
      .order("sort_order");

    const { data: features } = await supabase
      .from("property_features")
      .select("feature_id")
      .eq("property_id", id);

    const title = details.title as unknown as MultiLang;
    const description = details.description as unknown as MultiLang;
    const addr = details.address_info as unknown as AddressInfo;
    const amen = details.amenities as unknown as Amenities;
    const price = details.pricing_details as unknown as PricingDetails;
    const meta = details.meta_data as unknown as MetaData;

    const property: PropertyRow = {
      ...core,
      ...details,
      id: core.id,
      tenant_id: core.tenant_id,
      branch_id: core.branch_id, // 🛡️ Added for V3 Branching
      title: title?.th || "",
      title_en: title?.en || "",
      title_cn: title?.cn || "",
      title_ru: title?.ru || "",
      description: description?.th || "",
      description_en: description?.en || "",
      description_cn: description?.cn || "",
      description_ru: description?.ru || "",

      status: getStatusFromDb(core.status),
      listing_type: getListingTypeFromDb(core.listing_type),
      property_type: getPropertyTypeFromDb(core.property_type),

      price:
        price?.original_price && core.sale_price && Number(core.sale_price) < Number(price.original_price)
          ? core.sale_price
          : null,
      rental_price:
        price?.original_rental_price && core.rent_price && Number(core.rent_price) < Number(price.original_rental_price)
          ? core.rent_price
          : null,
      original_price: price?.original_price ?? core.sale_price ?? null,
      original_rental_price:
        price?.original_rental_price ?? core.rent_price ?? null,

      size_sqm: core.floor_area || 0,
      land_size_sqwah: core.land_area || 0,

      address_line1: addr?.th || "",
      address_line1_en: addr?.en || "",
      province: addr?.province || "",
      district: addr?.district || "",
      subdistrict: addr?.subdistrict || "",
      postal_code: addr?.postal_code || "",
      google_maps_link: addr?.maps_link || "",
      popular_area: addr?.popular_area || "",
      popular_area_en: addr?.popular_area_en || "",
      popular_area_cn: addr?.popular_area_cn || "",
      popular_area_ru: addr?.popular_area_ru || "",

      is_pet_friendly: !!amen?.is_pet_friendly,
      is_foreigner_quota: !!amen?.is_foreigner_quota,
      allow_airbnb: !!amen?.allow_airbnb,
      airbnb_daily_price: amen?.airbnb_daily_price ?? null,
      airbnb_monthly_price: amen?.airbnb_monthly_price ?? null,
      airbnb_min_contract: amen?.airbnb_min_contract ?? null,
      is_exclusive: !!core.is_exclusive,
      is_hot_deal: !!core.is_hot_deal,
      verified: !!core.verified,

      maintenance_fee: price?.maintenance_fee || 0,
      commission_sale_percentage: price?.commission_sale || 0,
      commission_rent_months: price?.commission_rent || 0,

      images: media || [],
      property_features: features || [],
      nearby_transits: Array.isArray(details.transit_info)
        ? (details.transit_info as unknown as PropertyTransitV3[])
        : (details.transit_info as unknown as PropertyTransitInfoConsolidated)
            ?.transits || [],
      nearby_places: Array.isArray(details.transit_info)
        ? []
        : (details.transit_info as unknown as PropertyTransitInfoConsolidated)
            ?.places || [],

      agent_ids: meta?.agent_ids || [],
      created_by: meta?.created_by || "",
      co_agent_name: meta?.co_agent?.name || "",
      co_agent_phone: meta?.co_agent?.phone || "",
      co_agent_contact_id: meta?.co_agent?.contact_id || "",
    } as unknown as PropertyRow;

    return property;
  } catch (error) {
    console.error("getPropertyById → error:", error);
    throw error;
  }
}

/**
 * Get property with images
 */
export async function getPropertyWithImages(
  id: string,
): Promise<PropertyWithImages> {
  const { role } = await requireAuthContext();
  assertStaff(role);

  // Verification is handled inside getPropertyById
  return getPropertyById(id) as Promise<PropertyWithImages>;
}

/**
 * Add a new popular area to the database
 */
export async function addPopularAreaAction(data: {
  name: string;
  name_en?: string;
  name_cn?: string;
  name_ru?: string;
  province?: string;
}) {
  const { supabase, role } = await requireAuthContext();

  // 🛡️ Staff Authorization: Popular Areas are GLOBAL. All staff members (Admins, Managers, Agents) can add them.
  assertStaff(role);

  const nameTh = data.name.trim();
  if (!nameTh) {
    return { success: false, message: "กรุณาระบุชื่อย่าน" };
  }

  let nameEn = data.name_en?.trim() || "";
  let nameCn = data.name_cn?.trim() || "";
  let nameRu = data.name_ru?.trim() || "";
  const province = data.province || "กรุงเทพมหานคร";

  // Auto-generate complete Popular Area Information (Description + SEO Title + SEO Description + Slug in 4 languages) via AI
  let aiData: any = null;
  try {
    const { generateAreaSeoContentAction } = await import(
      "@/features/admin/popular-areas-actions"
    );
    const aiRes = await generateAreaSeoContentAction(
      nameTh,
      nameEn || nameTh,
      province,
    );
    if (aiRes.success && aiRes.data) {
      aiData = aiRes.data;
      if (!nameEn && aiData.name?.en) nameEn = aiData.name.en;
      if (!nameCn && aiData.name?.cn) nameCn = aiData.name.cn;
      if (!nameRu && aiData.name?.ru) nameRu = aiData.name.ru;
    }
  } catch (err) {
    console.error("Auto AI generation for popular area error:", err);
  }

  let areaSlug = aiData?.slug || null;
  if (areaSlug) {
    const { data: existingArea } = await supabase
      .from("popular_areas_v3")
      .select("id")
      .eq("slug", areaSlug)
      .maybeSingle();

    if (existingArea) {
      areaSlug = `${areaSlug}-${Date.now().toString().slice(-4)}`;
    }
  }

  const { error } = await supabase.from("popular_areas_v3").insert({
    name: {
      th: nameTh,
      en: nameEn || null,
      cn: nameCn || null,
      ru: nameRu || null,
    },
    province: province,
    slug: areaSlug,
    description: aiData?.description || {},
    seo_title: aiData?.seoTitle || {},
    seo_description: aiData?.seoDescription || {},
    is_ai_generated: true,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "ย่านนี้มีอยู่แล้ว" };
    }
    console.error("addPopularAreaAction error:", error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

type PropertyViewRow = {
  id: string;
  tenant_id: string | null;
  status: PropertyStatus | null;
  property_type: PropertyType | null;
  listing_type: ListingType | null;
  price: number | null;
  original_price: number | null;
  rental_price: number | null;
  original_rental_price: number | null;
  created_at: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqm: number | null;
  land_size_sqwah: number | null;
  title: string | MultiLang | null;
  title_en?: string | null;
  pricing_details: PricingDetails | null;
  meta_data: MetaData | null;
  main_image_url?: string | null;
  tenants: { name: string } | null;
  projects?: { id?: string; name?: string | MultiLang | null; name_en?: string | null } | null;
  property_images?: { image_url: string; is_cover?: boolean | null; storage_path?: string | null }[] | null;
};

/**
 * Get global properties for administration (cross-tenant)
 * 🛡️ Elite 10/10 Hardened Version
 */
export async function getGlobalPropertiesTableDataAction(params: {
  page: number;
  q?: string;
  propertyType?: string;
  listingType?: string;
  status?: string;
  targetTenantId?: string;
}): Promise<{ tableData: InventoryProperty[]; count: number }> {
  // 🛡️ Authorization & Context
  const { supabase, role } = await requireAuthContext();
  if (role !== "ADMIN") throw new Error("Forbidden: Admin only");

  const { page, q, propertyType, listingType, status, targetTenantId } = params;

  const PAGE_SIZE = 10;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("properties") // 🛡️ Use View Bridge for easy searching and flattened columns
    .select(
      `
      id, tenant_id, status, property_type, listing_type, price, original_price, rental_price, original_rental_price, created_at, 
      bedrooms, bathrooms, size_sqm, land_size_sqwah, title, title_en, pricing_details, meta_data, main_image_url,
      tenants (
        name
      ),
      projects!properties_core_project_id_fkey (
        id,
        name
      )
    `,
      { count: "exact" },
    )
    .range(from, to)
    .order("created_at", { ascending: false });

  if (q) {
    // 🛡️ Search by title, address, district, province, and linked project name (JSONB th/en)
    query = query.or(
      `title.ilike.%${q}%,title_en.ilike.%${q}%,address_line1.ilike.%${q}%,address_line1_en.ilike.%${q}%,district.ilike.%${q}%,province.ilike.%${q}%,projects.name->>th.ilike.%${q}%,projects.name->>en.ilike.%${q}%`,
    );
  }

  if (propertyType && propertyType !== "ALL") {
    query = query.eq("property_type", propertyType);
  }

  if (listingType && listingType !== "ALL") {
    query = query.eq("listing_type", listingType);
  }

  if (status && status !== "ALL") {
    query = query.eq("status", status);
  }

  if (targetTenantId && targetTenantId !== "ALL") {
    query = query.eq("tenant_id", targetTenantId);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    if (error) {
      console.error("getGlobalPropertiesTableDataAction error:", error);
      throw new Error(mapDbError(error));
    }
    return { tableData: [], count: 0 };
  }

  // 🛡️ Cast to hardened interface
  const typedData = data as unknown as PropertyViewRow[];

  const tableData = typedData.map((p: PropertyViewRow) => {
    const pricing = p.pricing_details;
    const meta = p.meta_data;
    const coverImage = p.main_image_url || getCoverImage(p.property_images);

    // Extract Thai & English title
    let thTitle = "";
    let enTitle = "";

    if (typeof p.title === "string") {
      thTitle = p.title;
    } else if (p.title && typeof p.title === "object") {
      thTitle = p.title.th || p.title.en || "";
      enTitle = p.title.en || "";
    }

    if (p.title_en) {
      enTitle = p.title_en;
    }

    // Extract Project Name
    let projectName: string | null = null;
    let projectNameEn: string | null = null;
    if (p.projects?.name) {
      if (typeof p.projects.name === "string") {
        projectName = p.projects.name;
        projectNameEn = p.projects.name;
      } else if (typeof p.projects.name === "object") {
        projectName = (p.projects.name as any).th || (p.projects.name as any).en || null;
        projectNameEn = (p.projects.name as any).en || (p.projects.name as any).th || null;
      }
    }

    const finalTitle = thTitle || enTitle || projectName || "Untitled";

    return {
      id: p.id || "",
      title: finalTitle,
      title_en: enTitle || null,
      project_name: projectName,
      project_name_en: projectNameEn,
      status: (p.status as PropertyStatus) || "DRAFT",
      property_type: (p.property_type as PropertyType) || "OTHER",
      listing_type: (p.listing_type as ListingType) || "SALE",
      price: p.price ?? p.original_price ?? pricing?.original_price ?? null,
      rental_price: p.rental_price ?? p.original_rental_price ?? pricing?.original_rental_price ?? null,
      main_image_url: coverImage,
      created_at: p.created_at || "",
      tenant_id: p.tenant_id || "",
      tenant_name: p.tenants?.name || "Unknown",
      bedrooms: p.bedrooms || 0,
      bathrooms: p.bathrooms || 0,
      size_sqm: p.size_sqm || 0,
      land_size_sqwah: p.land_size_sqwah || 0,
      requires_ai_review: meta?.requires_ai_review ?? false,
    };
  });

  return { tableData, count: count || 0 };
}

import { unstable_cache } from "next/cache";

const fetchInventoryCountsCached = unstable_cache(
  async (client?: any) => {
    const supabase = client || (await createClient());
    
    // Fetch only necessary columns for all non-deleted properties
    const { data, error } = await supabase
      .from("properties")
      .select("property_type, status, listing_type, tenant_id");

    if (error || !data) {
      if (error) console.error("getGlobalInventoryFilterCountsAction error:", error);
      return { propertyTypes: {}, statuses: {}, listingTypes: {}, branches: {} };
    }

    const typedData = data as unknown as AggregationRow[];
    const counts: InventoryFilterCounts = {
      propertyTypes: {},
      statuses: {},
      listingTypes: {},
      branches: {},
    };

    typedData.forEach((p) => {
      if (p.property_type) {
        const key = String(p.property_type).toUpperCase();
        counts.propertyTypes[key] = (counts.propertyTypes[key] || 0) + 1;
      }
      if (p.status) {
        const key = String(p.status).toUpperCase();
        counts.statuses[key] = (counts.statuses[key] || 0) + 1;
      }
      if (p.listing_type) {
        const key = String(p.listing_type).toUpperCase();
        counts.listingTypes[key] = (counts.listingTypes[key] || 0) + 1;
      }
      if (p.tenant_id) {
        counts.branches[p.tenant_id] = (counts.branches[p.tenant_id] || 0) + 1;
      }
    });

    return counts;
  },
  ["inventory_filter_counts_cache"],
  { revalidate: 60, tags: ["inventory_counts"] }
);

export async function getGlobalInventoryFilterCountsAction(): Promise<InventoryFilterCounts> {
  const { supabase, role } = await requireAuthContext();
  if (role !== "ADMIN") throw new Error("Forbidden: Admin only");

  return fetchInventoryCountsCached(supabase);
}

/**
 * Public action for AI recommendations
 */
export async function getRecommendedPropertiesAction(category: string) {
  // Publicly accessible, no auth required
  return getRecommendedProperties(category);
}
