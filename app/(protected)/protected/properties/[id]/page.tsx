import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Clock,
  CalendarDays,
  User,
  Phone,
  TrainFront,
  Eye,
} from "lucide-react";
import { FaLine } from "react-icons/fa";
import { PropertyStatusBadge } from "@/components/properties/PropertyStatusBadge";
import { PropertyTypeBadge } from "@/components/properties/PropertyTypeBadge";
import { Separator } from "@/components/ui/separator";
import { DocumentList } from "@/features/documents/components/DocumentList";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { Badge } from "@/components/ui/badge";
import { ICON_MAP, DEFAULT_ICON } from "@/features/amenities/icons";
import { NearbyPlaces } from "@/components/public/NearbyPlaces";
import { PropertySuitability } from "@/components/public/PropertySuitability";
import { PropertyHeader } from "@/components/public/property-detail/PropertyHeader";
import { PropertyBadgesSection } from "@/components/public/property-detail/PropertyBadgesSection";
import { PropertyDescription } from "@/components/public/property-detail/PropertyDescription";
import { PropertyAmenities } from "@/components/public/property-detail/PropertyAmenities";
import { PropertyMapSection } from "@/components/public/property-detail/PropertyMapSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BsStars } from "react-icons/bs";

export default async function PropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch Property with owner and agent info
  const { data: property, error } = await supabase
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

  if (error || !property) {
    return (
      <div className="p-8 text-center text-red-500">
        ไม่พบข้อมูลทรัพย์ หรือเกิดข้อผิดพลาดในการโหลดข้อมูล
      </div>
    );
  }

  // Process Images (from join)
  const images = (property.property_images || []).sort(
    (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  // Create similar structure for Lightbox if needed, or PropertyGallery
  // PropertyGallery expects strict types, we might need a little casting

  // Process Features
  const rawFeatures = property.property_features || [];
  const features = rawFeatures
    .map((pf: any) => pf.features)
    .filter((f: any) => f !== null && f !== undefined);

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear()).slice(-4);
    return `${d}/${m}/${y}`;
  };

  const isClosed = property.status === "SOLD" || property.status === "RENTED";

  // Fetch related closed deal (if property sold/rented)
  let relatedDeal: any = null;
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

    relatedDeal = dealData ?? null;

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
      {/* 1. Admin Breadcrumb & Edit Button */}
      <div className="pt-6 px-4 md:px-6 lg:px-8 max-w-screen-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Breadcrumb
            backHref={`/protected/properties`}
            items={[
              { label: "โครงการและทรัพย์สิน", href: "/protected/properties" },
              { label: property.title || "รายละเอียด" },
            ]}
          />
        </div>
        <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="lg"
          asChild
          className="rounded-full bg-white text-slate-600 hover:bg-sky-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <Link
            href={`/properties/${property.slug || property.id}`}
            target="_blank"
          >
            <Eye className="h-4 w-4 mr-2" />
            ดูหน้าเว็บไซต์
          </Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          asChild
          className="rounded-full bg-white text-slate-600 hover:bg-sky-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <Link href={`/protected/properties/${property.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            แก้ไขข้อมูล
          </Link>
        </Button>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden pb-12 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="mx-auto px-6  md:px-8 mt-4 md:mt-8">
            <Badge
              variant="outline"
              className="bg-blue-50 px-4 py-3 text-blue-700 border-blue-200 font-bold uppercase tracking-widest rounded-full text-xl shadow-sm flex items-center gap-1.5"
            >
              <BsStars className="h-8 w-8 mr-2 text-sky-500" /> Preview Mode
            </Badge>
          </div>
          {/* 2. Public Header Component */}
          <PropertyHeader
            property={property as any}
            locationParts={locationParts}
            keySellingPoints={keySellingPoints}
            className="pt-4 md:pt-6"
            hideBreadcrumbs={true}
          />

          <div className="max-w-7xl mx-auto px-6 md:px-8 mt-4 md:mt-8">
            {/* 3. Gallery */}
            <section className="mb-6 md:mb-10">
              <PropertyGallery
                images={images as any[]}
                title={property.title ?? ""}
                isHot={false}
                verified={!!property.verified}
                petFriendly={!!property.meta_keywords?.includes("Pet Friendly")}
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
                />

                {/* Badges ticker */}
                <PropertyBadgesSection property={property as any} />

                {/* Description */}
                <PropertyDescription description={property.description} />

                {/* Nearby */}
                <NearbyPlaces
                  location={property.popular_area || undefined}
                  data={[
                    ...((property.nearby_places as any[]) || []),
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
                />

                <hr className="border-slate-100" />

                {/* Amenities */}
                <PropertyAmenities features={features} />

                <hr className="border-slate-100" />

                {/* Map */}
                <PropertyMapSection
                  googleMapsLink={property.google_maps_link}
                />

                {/* Deal & Contracts (CRM only) */}
                {isClosed && relatedDeal && (
                  <section className="space-y-4 rounded-2xl border p-8 bg-slate-50/50 mt-12">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                        <PropertyStatusBadge
                          status={property.status || "DRAFT"}
                          className="text-sm px-3 py-1"
                        />
                        CRM ดีลสถานะสำเร็จ
                      </h3>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/protected/deals/${relatedDeal.id}`}>
                          ไปยังหน้า Deal
                        </Link>
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mt-4">
                      <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          ค่าคอมมิชชั่น
                        </div>
                        <div className="text-xl font-bold text-emerald-600">
                          {commissionLabel}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          ลูกค้า (Lead)
                        </div>
                        <div className="font-bold text-slate-900 text-lg">
                          {relatedDeal.lead?.full_name ?? "-"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          เคสโดย
                        </div>
                        <div className="font-bold text-slate-900 text-lg">
                          {property.agent?.full_name ?? "-"}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 mt-8 pt-8 border-t border-slate-200">
                      <div>
                        <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          เอกสารสัญญา (Contract)
                        </div>
                        {relatedContract?.id ? (
                          <DocumentList
                            ownerId={relatedContract.id}
                            ownerType="RENTAL_CONTRACT"
                          />
                        ) : (
                          <div className="text-center py-10 text-slate-400 border border-dashed rounded-xl bg-white">
                            ยังไม่มีสัญญา
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          เอกสารดีล (Documents)
                        </div>
                        <DocumentList
                          ownerId={relatedDeal.id}
                          ownerType="DEAL"
                        />
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column (Sidebar) */}
              <div className="space-y-6">
                {/* Admin Status Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      Property Status
                    </span>
                    <PropertyStatusBadge status={property.status || "DRAFT"} />
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">สร้างเมื่อ:</span>
                      <span>{formatDate(property.created_at)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">อัปเดตล่าสุด:</span>
                      <span>{formatDate(property.updated_at)}</span>
                    </div>
                  </div>
                </div>

                <PropertySuitability
                  listingType={property.listing_type || "SALE"}
                  price={property.price ?? null}
                  rentalPrice={property.rental_price ?? null}
                />

                {/* Owner Card (Protected) */}
                {property.owner && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-700">
                    <div className="px-5 py-4 bg-orange-500 flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">เจ้าของทรัพย์</h3>
                        <p className="text-xs text-orange-100/80">
                          CRM internal data
                        </p>
                      </div>
                    </div>
                    <div className="p-6 space-y-4 text-center">
                      <div className="mx-auto h-16 w-16 rounded-full bg-linear-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white">
                        {property.owner.full_name?.charAt(0).toUpperCase() ||
                          "O"}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">
                          {property.owner.full_name}
                        </h4>
                        {property.property_source && (
                          <Badge variant="secondary" className="mt-1">
                            {property.property_source}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-3 pt-2">
                        {property.owner.phone && (
                          <Button
                            variant="outline"
                            className="w-full rounded-full gap-2 border-slate-200"
                            asChild
                          >
                            <a href={`tel:${property.owner.phone}`}>
                              <Phone className="h-4 w-4 text-blue-500" />
                              {property.owner.phone}
                            </a>
                          </Button>
                        )}
                        {property.owner.line_id && (
                          <div className="flex items-center justify-center gap-2 text-slate-600 bg-slate-50 py-2 rounded-full text-sm font-medium">
                            <FaLine className="h-4 w-4 text-[#06C755]" />
                            {property.owner.line_id}
                          </div>
                        )}
                      </div>

                      <Button
                        asChild
                        variant="ghost"
                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                      >
                        <Link href={`/protected/owners/${property.owner.id}`}>
                          ดูประวัติเจ้าของ
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Agent Card */}
                {property.agent && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-1000">
                    <div className="px-5 py-4 bg-slate-800 flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-bold text-white tracking-tight">
                        ผู้รับผิดชอบ (Agent)
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-slate-100 shadow-sm">
                          <AvatarImage
                            src={property.agent.avatar_url || ""}
                            alt={property.agent.full_name || ""}
                          />
                          <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl">
                            {property.agent.full_name
                              ?.charAt(0)
                              .toUpperCase() || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-lg">
                            {property.agent.full_name}
                          </p>
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Phone className="w-3.5 h-3.5" />
                            {property.agent.phone || "ไม่ระบุเบอร์"}
                          </div>
                          {property.agent.line_id && (
                            <div className="text-xs text-slate-400 mt-1">
                              Line: {property.agent.line_id}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
