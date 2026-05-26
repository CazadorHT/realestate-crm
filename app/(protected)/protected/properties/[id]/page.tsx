import { PropertyAdminHeader } from "./_components/PropertyAdminHeader";
import { PropertyCRMDetails } from "./_components/PropertyCRMDetails";
import { PropertyAdminSidebar } from "./_components/PropertyAdminSidebar";
import { getOwnerById } from "@/features/owners/queries";
import type { ListingType, PropertyType, PropertyStatus } from "@/features/properties/types";
import type { 
  PropertyWithDetails, 
  PropertyAmenitiesV3, 
  PropertyAddressV3, 
  PropertyMetaDataV3, 
  PropertyPricingV3, 
  PropertyTransitV3
} from "@/features/properties/types/v3";
import { NearbyPlaces } from "@/components/public/NearbyPlaces";
import { PropertyAmenities } from "@/components/public/property-detail/PropertyAmenities";
import { PropertyBadgesSection } from "@/components/public/property-detail/PropertyBadgesSection";
import { PropertyDescription } from "@/components/public/property-detail/PropertyDescription";
import { PropertyHeader } from "@/components/public/property-detail/PropertyHeader";
import { PropertyMapSection } from "@/components/public/property-detail/PropertyMapSection";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { requireAuthContext } from "@/lib/authz";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BsStars } from "react-icons/bs";
import { Suspense } from "react";
import { PropertyRelatedDealsSection } from "./_components/PropertyRelatedDealsSection";
import { PropertyCRMDetailsSkeleton } from "@/components/skeletons/PropertyDetailSkeleton";
import { PropertyDetailTour } from "@/features/properties/_components/PropertyDetailTour";
import type { Database } from "@/lib/database.types.generated";

// --- Robust Mapping Constants ---
const STATUS_MAP: PropertyStatus[] = ["DRAFT", "ACTIVE", "UNDER_OFFER", "RESERVED", "SOLD", "RENTED", "ARCHIVED"];
const LISTING_TYPE_MAP: ListingType[] = ["SALE", "RENT", "SALE_AND_RENT"];
const PROPERTY_TYPE_MAP: PropertyType[] = ["OTHER", "CONDO", "HOUSE", "TOWNHOME", "LAND", "COMMERCIAL_BUILDING", "WAREHOUSE", "OFFICE_BUILDING", "VILLA", "POOL_VILLA"];

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const lang = "th"; // Centralized language
  const { id } = await params;
  const supabase = await createClient();

  // [PERFORMANCE] Parallel Fetching: Break the Waterfall
  const [authContext, rawResponse] = await Promise.all([
    requireAuthContext(),
    supabase
      .from("properties_core")
      .select(
        `
        id, status, listing_type, property_type, sale_price, rent_price, currency, bedrooms, bathrooms, floor_area, land_area, location, owner_id, assigned_to, created_at, updated_at,
        is_hot_deal, verified,
        tenant:tenants_v3 (id, name, slug),
        branch:branches_v3 (id, name),
        details:properties_details (
          title, description, amenities, address_info, transit_info, meta_data
        ),
        ai:properties_ai (
          ai_metadata, last_embedded_at
        ),
        agents:property_agents (
          identity:identities_v3 (
            id, display_name, phone, email, avatar_url, line_id, is_active,
            profile:profiles (
              wechat_user_id,
              whatsapp_user_id
            )
          )
        ),
        property_images (
          id, url, image_url:url, is_cover, sort_order, media_type, ai_scan_status, ai_scan_result, storage_path, created_at, property_id
        ),
        property_features (
          features (
            id, name, icon_key, category
          )
        )
      `,
      )
      .eq("id", id)
      .single(),
  ]);

  const { tenantId } = authContext;
  const { data: rawData, error } = rawResponse;

  if (error || !rawData) {
    console.error("PropertyDetailsPage query error:", error);
    return (
      <div className="p-8 text-center text-red-500">
        ไม่พบข้อมูลทรัพย์ หรือเกิดข้อผิดพลาดในการโหลดข้อมูล: {error?.message || "rawData is null"}
      </div>
    );
  }

  // V3 Native Data Processing: Strict Type Casting
  const details = (Array.isArray(rawData.details) ? rawData.details[0] : rawData.details) as any;
  const titleObj = (details?.title || {}) as Record<string, string>;
  const descObj = (details?.description || {}) as Record<string, string>;
  const amenities = (details?.amenities || {}) as PropertyAmenitiesV3;
  const addressInfo = (details?.address_info || {}) as PropertyAddressV3;
  const transitRaw = (details?.transit_info as any)?.transits || (Array.isArray(details?.transit_info) ? details.transit_info : []);
  const transitList = Array.isArray(transitRaw) ? transitRaw : [];
  const transitInfo = (transitList as PropertyTransitV3[]).map(t => ({
    ...t,
    distance_meters: t.distance_meters === null ? undefined : t.distance_meters
  })) as PropertyTransitV3[];
  const metaData = (details?.meta_data || {}) as PropertyMetaDataV3;
  
  const mainAgentIdentity = rawData.agents?.[0]?.identity as any;
  const ownerIdFromMeta = metaData?.owner_id;
  const popularAreaIdFromAddress = addressInfo?.popular_area_id;

  const ownerId = rawData.owner_id || ownerIdFromMeta;

  // Fetch Owner & Popular Area separately
  const [ownerData, popularAreaResponse] = await Promise.all([
    ownerId ? getOwnerById(ownerId) : Promise.resolve(null),
    popularAreaIdFromAddress
      ? supabase
          .from("popular_areas_v3")
          .select("id, name")
          .eq("id", popularAreaIdFromAddress)
          .single()
      : Promise.resolve({ data: null }),
  ]);
  const popularAreaV3 = popularAreaResponse.data;

  const pricingDetails = (details?.pricing_details || {}) as PropertyPricingV3;

  const property: PropertyWithDetails = {
    ...rawData,
    id: rawData.id,
    slug: null, // V3 Core uses ID for admin; SEO slugs live in cms_content_v3
    verified: !!rawData.verified,
    is_featured: !!(metaData as any).is_featured,
    is_hot_deal: !!rawData.is_hot_deal,
    property_source: (metaData as any).property_source || null,
    
    // Branch & Tenant info
    branch_name: (rawData.branch as { name?: { th?: string } | string } | null)?.name?.toString() || null,
    tenant_name: rawData.tenant?.name || null,

    // Map V3 names to Legacy UI names
    price: rawData.sale_price,
    rental_price: rawData.rent_price,
    original_price: pricingDetails?.original_price || null,
    original_rental_price: pricingDetails?.original_rental_price || null,
    min_contract_months: pricingDetails?.min_contract_months || null,
    rent_price_per_sqm: pricingDetails?.rent_price_per_sqm || null,
    price_per_sqm: pricingDetails?.price_per_sqm || null,
    size_sqm: rawData.floor_area,
    land_size_sqwah: rawData.land_area,
    status: STATUS_MAP[rawData.status || 0] || "DRAFT",
    listing_type: LISTING_TYPE_MAP[rawData.listing_type || 0] || "SALE",
    property_type: PROPERTY_TYPE_MAP[rawData.property_type || 0] || "OTHER",

    // Unroll details (Strict Mapping & Localization Extraction)
    title: titleObj?.th || titleObj?.en || "-",
    description: descObj?.th || descObj?.en || null,
    province: typeof addressInfo?.province === "object" ? (addressInfo?.province as any)?.th || (addressInfo?.province as any)?.en : addressInfo?.province || null,
    district: typeof addressInfo?.district === "object" ? (addressInfo?.district as any)?.th || (addressInfo?.district as any)?.en : addressInfo?.district || null,
    subdistrict: typeof addressInfo?.subdistrict === "object" ? (addressInfo?.subdistrict as any)?.th || (addressInfo?.subdistrict as any)?.en : addressInfo?.subdistrict || null,
    address_line1: addressInfo?.address_line1 || null,
    address_line1_en: addressInfo?.address_line1_en || null,
    postal_code: addressInfo?.postal_code || null,
    google_maps_link: addressInfo?.google_maps_link || null,

    // Amenities from typed interface
    floor: amenities.floor || null,
    parking_slots: amenities.parking_slots || null,
    office_capacity: amenities.office_capacity || null,
    maid_rooms: amenities.maid_rooms || null,
    halls: amenities.halls || null,
    dining_rooms: amenities.dining_rooms || null,
    is_pet_friendly: !!amenities.is_pet_friendly,
    is_corner_unit: !!amenities.is_corner_unit,
    is_renovated: !!amenities.is_renovated,
    is_fully_furnished: !!amenities.is_fully_furnished,
    is_bare_shell: !!amenities.is_bare_shell,
    has_city_view: !!amenities.has_city_view,
    has_pool_view: !!amenities.has_pool_view,
    has_garden_view: !!amenities.has_garden_view,
    has_private_pool: !!amenities.has_private_pool,
    has_river_view: !!amenities.has_river_view,
    has_unblocked_view: !!amenities.has_unblocked_view,
    is_selling_with_tenant: !!amenities.is_selling_with_tenant,
    is_tax_registered: !!amenities.is_tax_registered,
    is_foreigner_quota: !!amenities.is_foreigner_quota,
    allow_smoking: !!amenities.allow_smoking,
    is_high_ceiling: !!amenities.is_high_ceiling,
    is_column_free: !!amenities.is_column_free,
    is_exclusive: !!amenities.is_exclusive,
    is_grade_a: !!amenities.is_grade_a,
    is_grade_b: !!amenities.is_grade_b,
    is_grade_c: !!amenities.is_grade_c,
    has_raised_floor: !!amenities.has_raised_floor,
    is_central_air: !!amenities.is_central_air,
    is_split_air: !!amenities.is_split_air,
    has_247_access: !!amenities.has_247_access,
    has_fiber_optic: !!amenities.has_fiber_optic,
    has_multi_parking: !!amenities.has_multi_parking,
    facing_east: !!amenities.facing_east,
    facing_north: !!amenities.facing_north,
    facing_south: !!amenities.facing_south,
    facing_west: !!amenities.facing_west,

    // AI Data Mapping
    ai_summary_content: (rawData.ai as { ai_metadata?: { summary?: string } } | null)?.ai_metadata?.summary || metaData?.ai_summary_content || null,
    requires_ai_review: !!((rawData.ai as { ai_metadata?: { requires_review?: boolean } } | null)?.ai_metadata?.requires_review || (metaData as any)?.requires_ai_review),
    meta_keywords: metaData?.meta_keywords || [],

    // Smart Location
    popular_area: (popularAreaV3?.name as { th?: string; en?: string } | null)?.th || (popularAreaV3?.name as { th?: string; en?: string } | null)?.en || addressInfo?.popular_area || null,

    // Agent mapping (Strict)
    agent: mainAgentIdentity
      ? {
          id: mainAgentIdentity.id,
          full_name: mainAgentIdentity.display_name,
          phone: mainAgentIdentity.phone,
          email: mainAgentIdentity.email,
          line_id: mainAgentIdentity.line_id,
          avatar_url: mainAgentIdentity.avatar_url,
          wechat_user_id: (Array.isArray(mainAgentIdentity.profile) ? mainAgentIdentity.profile[0] : mainAgentIdentity.profile)?.wechat_user_id || null,
          whatsapp_user_id: (Array.isArray(mainAgentIdentity.profile) ? mainAgentIdentity.profile[0] : mainAgentIdentity.profile)?.whatsapp_user_id || null,
          facebook_url: null,
          other_contact: null,
          is_active: !!mainAgentIdentity.is_active,
        }
      : null,

    owner: ownerData ? {
      id: ownerData.id,
      full_name: ownerData.full_name,
      phone: ownerData.phone ?? null,
      line_id: ownerData.line_id ?? null,
      facebook_url: ownerData.facebook_url ?? null,
      other_contact: ownerData.other_contact ?? null,
      is_active: true,
    } : null,
    
    // Transit & Nearby
    near_transit: !!(transitInfo.length > 0 || metaData?.meta_keywords?.some(k => k.toLowerCase().includes("transit"))),
    transit_station_name: transitInfo[0]?.station_name || null,
    transit_type: transitInfo[0]?.type || null,
    transit_distance_meters: transitInfo[0]?.distance_meters || null,
    nearby_places: addressInfo?.nearby_places || [],
    nearby_transits: transitInfo,
  };

  // Process Images: PropertyGallery handles sorting internally (Cover first + SortOrder)
  const images = property.property_images || [];

  // Create similar structure for Lightbox if needed, or PropertyGallery
  // PropertyGallery expects strict types, we might need a little casting

  // Process Features
  const features = (property.property_features || [])
    .map((pf) => pf.features)
    .filter((f): f is NonNullable<typeof f> => !!f)
    .map(f => ({
      ...f,
      icon_key: f.icon_key || "check", // Provide fallback for component requirement
    }));

  // Helper for Location
  const locationParts = [
    property.popular_area,
    property.subdistrict,
    property.district,
    property.province,
  ]
    .filter(Boolean)
    .join(", ");

  const formatPrice = (val: number | null) =>
    val
      ? new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: "THB",
          maximumFractionDigits: 0,
        }).format(val)
      : "-";

  const isClosed = property.status === "SOLD" || property.status === "RENTED";

  const keySellingPoints = [
    property.is_pet_friendly && { name: "เลี้ยงสัตว์ได้", icon: "dog" },
    property.is_corner_unit && { name: "ห้องมุม", icon: "layout" },
    property.is_renovated && { name: "รีโนเวทใหม่", icon: "sparkles" },
    property.is_fully_furnished && { name: "ตกแต่งครบ", icon: "armchair" },
    (property.floor || 0) > 15 && {
      name: `วิวสวยชั้นสูง (ชั้น ${property.floor})`,
      icon: "building-2",
    },
    property.has_city_view && { name: "วิวเมือง", icon: "building-2" },
    property.has_pool_view && { name: "วิวสระว่ายน้ำ", icon: "waves" },
    property.has_garden_view && { name: "วิวสวน", icon: "trees" },
    property.is_selling_with_tenant && {
      name: "ขายพร้อมผู้เช่า",
      icon: "users",
    },
    property.is_tax_registered && {
      name: "จดทะเบียนบริษัทได้",
      icon: "file-check",
    },
    property.is_foreigner_quota && { name: "โควต้าต่างชาติ", icon: "globe" },
    property.near_transit &&
      property.transit_station_name && {
        name: `ใกล้ ${property.transit_station_name}`,
        icon: "map-pin",
      },
  ]
    .filter((f): f is { name: string; icon: string } => !!f)
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-32 font-sans ">
      <PropertyDetailTour />
      <PropertyAdminHeader property={property} images={images} language={lang} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden pb-8 sm:pb-12 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8">
            <Badge
              variant="outline"
              className="bg-blue-50 px-3 py-2 sm:px-4 sm:py-3 text-blue-700 border-blue-200 font-bold uppercase tracking-widest rounded-full text-sm sm:text-xl shadow-sm flex items-center gap-1.5 w-fit"
            >
              <BsStars className="h-5 w-5 sm:h-8 sm:w-8 text-sky-500" /> Preview
              Mode
            </Badge>
          </div>
          {/* 2. Public Header Component */}
          <PropertyHeader
            property={property}
            className="pt-4 lg:pt-6"
            hideBreadcrumbs={true}
            language={lang}
          />

          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 mt-4 lg:mt-8">
            {/* 3. Gallery */}
            <section className="mb-6 lg:mb-10">
            <PropertyGallery
                images={images}
                title={property.title ?? "-"}
                isHot={property.is_hot_deal}
                verified={!!property.verified}
                petFriendly={property.is_pet_friendly}
                language={lang}
              />
            </section>

            {/* 4. Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
              {/* Left Column */}
              <div className="space-y-10">
                {/* Specs */}
                <PropertySpecs
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  parking={property.parking_slots}
                  office_capacity={property.office_capacity}
                  sizeSqm={property.size_sqm}
                  landSize={property.land_size_sqwah}
                  floor={property.floor}
                  type={property.property_type}
                  language={lang}
                  maid_rooms={property.maid_rooms}
                  halls={property.halls}
                  dining_rooms={property.dining_rooms}
                />

                {/* Badges ticker */}
                <PropertyBadgesSection property={property} language={lang} />

                {/* Description */}
                <PropertyDescription property={property} language={lang} />

                {/* Nearby */}
                <NearbyPlaces
                  location={property.popular_area || undefined}
                  
                  propertyId={property.id}
                  propertyTitle={property.title}
                  data={property.nearby_places || []}
                  transits={property.nearby_transits || []}
                  language={lang}
                />

                <hr className="border-slate-100" />

                {/* Amenities */}
                <PropertyAmenities features={features} language={lang} />

                <hr className="border-slate-100" />

                {/* Map */}
                <PropertyMapSection
                  googleMapsLink={property.google_maps_link}
                  language={lang}
                />

                {/* Deal & Contracts (CRM only) - Streamed via Suspense */}
                <Suspense fallback={<PropertyCRMDetailsSkeleton />}>
                  <div id="tour-property-related-deals">
                    <PropertyRelatedDealsSection
                      propertyId={id}
                      isClosed={isClosed}
                      property={property}
                      tenantId={tenantId}
                    />
                  </div>
                </Suspense>
              </div>

              {/* Right Column (Sidebar) */}
              <PropertyAdminSidebar property={property} language={lang} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
