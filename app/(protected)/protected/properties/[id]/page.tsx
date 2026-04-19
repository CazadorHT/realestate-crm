import { PropertyAdminHeader } from "./_components/PropertyAdminHeader";
import { PropertyCRMDetails } from "./_components/PropertyCRMDetails";
import { PropertyAdminSidebar } from "./_components/PropertyAdminSidebar";
import type { PropertyRow, PropertyImage } from "@/features/properties/types";
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

interface PropertyWithDetails extends PropertyRow {
  owner: {
    id: string;
    full_name: string;
    phone: string | null;
    line_id: string | null;
    facebook_url: string | null;
    other_contact: string | null;
  } | null;
  agent: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    line_id: string | null;
    facebook_url: string | null;
    other_contact: string | null;
    avatar_url: string | null;
  } | null;
  property_images: PropertyImage[];
  property_features: {
    features: {
      id: string;
      name: string;
      icon_key: string | null;
      category: string | null;
    } | null;
  }[];
}

interface RelatedDeal {
  id: string;
  deal_type: string;
  commission_amount: number | null;
  commission_percent: number | null;
  created_by: string | null;
  status: string;
  lead: {
    id: string;
    full_name: string;
  } | null;
}

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { tenantId } = await requireAuthContext();

  // 1. Fetch Property with owner and agent info
  const { data: propertyData, error } = await supabase
    .from("properties")
    .select(
      `
      *,
      owner:owners!owner_id (
        id,
        full_name,
        phone,
        line_id,
        facebook_url,
        other_contact
      ),
      agent:profiles!assigned_to (
        id,
        full_name,
        phone,
        email,
        line_id,
        facebook_url,
        other_contact,
        avatar_url
      ),
      property_images (
        id,
        image_url,
        is_cover,
        sort_order
      ),
      property_features (
        features (
          id,
          name,
          icon_key,
          category
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  const property = propertyData as unknown as PropertyWithDetails | null;

  if (error || !property) {
    return (
      <div className="p-8 text-center text-red-500">
        ไม่พบข้อมูลทรัพย์ หรือเกิดข้อผิดพลาดในการโหลดข้อมูล
      </div>
    );
  }

  // Process Images (from join)
  const images = (property.property_images || []).sort(
    (a: PropertyImage, b: PropertyImage) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  // Create similar structure for Lightbox if needed, or PropertyGallery
  // PropertyGallery expects strict types, we might need a little casting

  // Process Features
  const rawFeatures = property.property_features || [];
  const features = rawFeatures
    .map((pf: { features: any }) => pf.features)
    .filter((f: any): f is NonNullable<typeof f> => !!f);

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

  // Fetch related closed deal (if property sold/rented)
  let relatedDeal: RelatedDeal | null = null;
  let relatedContract: any = null;
  if (isClosed) {
    const { data: dealData } = await supabase
      .from("deals")
      .select(
        "id, deal_type, commission_amount, commission_percent, created_by, status, lead:leads(id, full_name)",
      )
      .eq("property_id", id)
      .eq("status", "CLOSED_WIN")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    relatedDeal = (dealData as unknown as RelatedDeal) ?? null;

    if (relatedDeal) {
      const { data: contractData } = await supabase
        .from("rental_contracts")
        .select("*")
        .eq("deal_id", relatedDeal.id)
        .single();
      relatedContract = contractData ?? null;
    }
  }

  const commissionLabel = relatedDeal
    ? relatedDeal.commission_amount != null
      ? `฿${Number(relatedDeal.commission_amount).toLocaleString()}`
      : relatedDeal.commission_percent != null
        ? `${Number(relatedDeal.commission_percent).toLocaleString()}%`
        : "-"
    : "-";

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
      <PropertyAdminHeader property={property} images={images} />
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
            property={property as PropertyWithDetails}
            className="pt-4 lg:pt-6"
            hideBreadcrumbs={true}
            language="th"
          />

          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 mt-4 lg:mt-8">
            {/* 3. Gallery */}
            <section className="mb-6 lg:mb-10">
              <PropertyGallery
                images={images}
                title={property.title ?? ""}
                isHot={false}
                verified={!!property.verified}
                petFriendly={!!property.meta_keywords?.includes("Pet Friendly")}
                language="th"
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
                  sizeSqm={property.size_sqm}
                  landSize={property.land_size_sqwah}
                  floor={property.floor}
                  type={property.property_type}
                  language="th"
                />

                {/* Badges ticker */}
                <PropertyBadgesSection
                  property={property as PropertyRow}
                  language="th"
                />

                {/* Description */}
                <PropertyDescription property={property} language="th" />

                {/* Nearby */}
                <NearbyPlaces
                  location={property.popular_area || undefined}
                  data={[
                    ...((property.nearby_places as {
                      category: string;
                      name: string;
                      distance?: string;
                    }[]) || []),
                    ...(property.near_transit && property.transit_station_name
                      ? [
                          {
                            category: "Transport",
                            name: `${property.transit_type || "BTS/MRT"} ${
                              property.transit_station_name
                            }`,
                            distance: property.transit_distance_meters
                              ? (
                                  property.transit_distance_meters / 1000
                                ).toString()
                              : undefined,
                          },
                        ]
                      : []),
                    ...((property.nearby_transits as any[]) || []).map((t) => ({
                      category: "Transport",
                      name: `${t.type} ${t.station_name}`,
                      distance: t.distance_meters
                        ? (t.distance_meters / 1000).toString()
                        : undefined,
                    })),
                  ]}
                  language="th"
                />

                <hr className="border-slate-100" />

                {/* Amenities */}
                <PropertyAmenities features={features} language="th" />

                <hr className="border-slate-100" />

                {/* Map */}
                <PropertyMapSection
                  googleMapsLink={property.google_maps_link}
                  language="th"
                />

                {/* Deal & Contracts (CRM only) */}
                <PropertyCRMDetails
                  property={property}
                  relatedDeal={relatedDeal}
                  relatedContract={relatedContract}
                  commissionLabel={commissionLabel}
                  tenantId={tenantId}
                />
              </div>

              {/* Right Column (Sidebar) */}
              <PropertyAdminSidebar property={property} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
