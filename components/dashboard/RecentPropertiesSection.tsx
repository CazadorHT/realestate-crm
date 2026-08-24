import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PropertyWithRelations, RecentPropertiesTable } from "@/components/dashboard/RecentPropertiesTable";
import { ListSkeleton } from "./skeletons/ListSkeleton";
import { PropertyStatus, PropertyType, ListingType } from "@/features/properties/types";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { getSystemConfig } from "@/lib/actions/system-config";
import { getCurrentProfile } from "@/lib/supabase/getCurrentProfile";
import { getProvinceName, getDistrictName } from "@/lib/utils/provinces";

interface PropertyImage {
  url?: string;
  image_url?: string;
  storage_path?: string | null;
  is_cover?: boolean | null;
}

export async function RecentPropertiesSection({ 
  tenantId,
  userId
}: { 
  tenantId?: string | null;
  userId?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select(`
      id, 
      title, 
      title_en,
      price, 
      original_price,
      rental_price,
      original_rental_price,
      status, 
      property_type, 
      listing_type, 
      created_at, 
      updated_at,
      tenant_id,
      popular_area,
      popular_area_en,
      district,
      province,
      size_sqm,
      land_size_sqwah,
      bedrooms,
      bathrooms,
      view_count,
      posted_to_facebook_at,
      posted_to_instagram_at,
      posted_to_line_at,
      posted_to_tiktok_at,
      requires_ai_review,
      project_id,
      images,
      property_images(
        id,
        image_url,
        storage_path,
        is_cover,
        sort_order
      ),
      description,
      tenants(name)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const profile = await getCurrentProfile();
  const isAgent = profile?.role === "AGENT";

  if (tenantId && tenantId !== "ALL") {
    query = query.eq("tenant_id", tenantId);
  }

  const targetUserId = isAgent ? profile?.id : (userId && userId !== "ALL" ? userId : undefined);
  if (targetUserId) {
    query = query.or(`assigned_to.eq.${targetUserId},created_by.eq.${targetUserId}`);
  }

  const { data: propertiesResult, error: propertiesError } = await query;
  if (propertiesError) {
    console.error("Error fetching recent properties:", propertiesError);
  }

  // Define type for our joined query result
  type RawProperty = {
    id: string;
    title: string;
    title_en?: string | null;
    price: number | null;
    original_price: number | null;
    rental_price: number | null;
    original_rental_price: number | null;
    status: PropertyStatus;
    property_type: PropertyType;
    listing_type: ListingType;
    created_at: string;
    updated_at: string;
    tenant_id: string | null;
    popular_area: string | null;
    popular_area_en?: string | null;
    district: string | null;
    province: string | null;
    size_sqm: number | null;
    land_size_sqwah: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    view_count: number | null;
    posted_to_facebook_at: string | null;
    posted_to_instagram_at: string | null;
    posted_to_line_at: string | null;
    posted_to_tiktok_at: string | null;
    requires_ai_review: boolean | null;
    project_id?: string | null;
    images: PropertyImage[] | null;
    property_images: PropertyImage[] | null;
    description: string | null;
    tenants: { name: string } | null;
  };

  const rawProperties = (propertiesResult as unknown as RawProperty[]) ?? [];

  // Fetch deals/leads count for these specific properties
  const propertyIds = rawProperties.map(p => p.id);
  const leadsCountMap = new Map<string, number>();

  if (propertyIds.length > 0) {
    const { data: dealsData } = await supabase
      .from("crm_deals_v3")
      .select("property_id")
      .in("property_id", propertyIds);

    (dealsData as { property_id: string | null }[] | null)?.forEach(deal => {
      if (deal.property_id) {
        leadsCountMap.set(deal.property_id, (leadsCountMap.get(deal.property_id) || 0) + 1);
      }
    });
  }

  // Fetch projects in batch
  const projectIds = Array.from(new Set(rawProperties.map(p => p.project_id).filter((id): id is string => Boolean(id))));
  const projectMap = new Map<string, { th: string | null; en: string | null }>();

  if (projectIds.length > 0) {
    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);

    (projectsData || []).forEach((proj: any) => {
      const name = proj.name;
      const th = typeof name === "object" && name !== null ? (name.th || name.name_th || null) : (typeof name === "string" ? name : null);
      const en = typeof name === "object" && name !== null ? (name.en || name.name_en || null) : (typeof name === "string" ? name : null);
      projectMap.set(proj.id, { th, en });
    });
  }

  const now = new Date().getTime();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  
  // Check if any of the fetched properties are within 7 days
  const hasRecentProperties = rawProperties.some(
    p => now - new Date(p.created_at).getTime() < SEVEN_DAYS_MS
  );

  const config = await getSystemConfig();
  const showBranch = config?.multi_tenant_enabled ?? false;

  const properties: PropertyWithRelations[] = rawProperties.map((p, index) => {
    const isWithinSevenDays = now - new Date(p.created_at).getTime() < SEVEN_DAYS_MS;
    
    // Mark as NEW if it's within 7 days OR if it's the absolute latest one and none are within 7 days
    const isNew = isWithinSevenDays || (!hasRecentProperties && index === 0);
    
    const propertyImages = p.property_images || [];
    const firstImage = propertyImages.find((img) => img.is_cover) || propertyImages[0] || (Array.isArray(p.images) ? p.images[0] : null);
    const rawImageUrl = firstImage?.image_url || firstImage?.url || firstImage?.storage_path || (typeof firstImage === 'string' ? firstImage : null);
    const imageUrl = rawImageUrl ? (rawImageUrl.startsWith("http") ? rawImageUrl : getPublicImageUrl(rawImageUrl)) : null;

    const proj = p.project_id ? projectMap.get(p.project_id) : null;
    const finalProjectName = proj?.th || proj?.en || null;
    const finalProjectNameEn = proj?.en || proj?.th || null;

    return {
      id: p.id,
      title: p.title,
      title_en: p.title_en || null,
      description: p.description,
      image_url: imageUrl,
      project_name: finalProjectName,
      project_name_en: finalProjectNameEn,
      property_type: p.property_type,
      listing_type: p.listing_type,
      price: p.price,
      rental_price: p.rental_price,
      original_price: p.original_price,
      original_rental_price: p.original_rental_price,
      status: p.status,
      requires_ai_review: p.requires_ai_review ?? false,
      leads_count: leadsCountMap.get(p.id) || 0,
      view_count: p.view_count || 0,
      updated_at: p.updated_at,
      created_at: p.created_at,
      popular_area: p.popular_area,
      popular_area_en: p.popular_area_en || (p.popular_area ? getDistrictName(p.popular_area, "en") : null),
      district: p.district,
      district_en: p.district ? getDistrictName(p.district, "en") : null,
      province: p.province,
      province_en: p.province ? getProvinceName(p.province, "en") : null,
      size_sqm: p.size_sqm,
      land_size_sqwah: p.land_size_sqwah,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      closed_lead_name: null,
      is_new: isNew,
      tenant_id: p.tenant_id,
      tenant_name: showBranch ? (p.tenants?.name || null) : null,
      posted_to_facebook_at: p.posted_to_facebook_at,
      posted_to_instagram_at: p.posted_to_instagram_at,
      posted_to_line_at: p.posted_to_line_at,
      posted_to_tiktok_at: p.posted_to_tiktok_at,
      images: p.images,
    };
  }) as PropertyWithRelations[];

  const isAdminOrManager = profile?.role === "ADMIN" || profile?.role === "MANAGER";

  return (
    <RecentPropertiesTable
      properties={properties}
      showBranch={showBranch}
      isAdminOrManager={isAdminOrManager}
    />
  );
}

export function RecentPropertiesSectionSuspense({ 
  tenantId,
  userId
}: { 
  tenantId?: string | null;
  userId?: string;
}) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <RecentPropertiesSection tenantId={tenantId} userId={userId} />
    </Suspense>
  );
}
