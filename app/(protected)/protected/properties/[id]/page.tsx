import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, MapPin, Clock, CalendarDays } from "lucide-react";
import { PropertyStatusBadge } from "@/components/properties/PropertyStatusBadge";
import { PropertyTypeBadge } from "@/components/properties/PropertyTypeBadge";
import { Separator } from "@/components/ui/separator";
import { DocumentList } from "@/features/documents/components/DocumentList";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { Badge } from "@/components/ui/badge";
import { ICON_MAP, DEFAULT_ICON } from "@/features/amenities/icons";

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

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-20 font-sans ">
      {/* 1. Header & Breadcrumb & Actions */}
      <div className="pt-6 px-5 md:px-6 lg:px-8 bg-white relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Back Link & Edit Actions */}
            <div className="flex justify-between items-center mb-2">
              <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                <Link
                  href="/protected/properties"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ทรัพย์
                </Link>
                <span className="text-muted-foreground/50">›</span>
                <span className="font-medium text-foreground truncate max-w-[200px] md:max-w-[400px]">
                  {property.title}
                </span>
              </nav>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/protected/properties/${property.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  แก้ไข
                </Link>
              </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-3 grow min-w-0 max-w-[800px]">
                {/* Badge and ID in one line */}
                <div className="flex items-center gap-3">
                  <Badge
                    className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                      property.listing_type === "SALE"
                        ? "bg-emerald-600"
                        : "bg-blue-600"
                    }`}
                  >
                    {property.listing_type === "SALE" ? "ขาย" : "เช่า"}
                  </Badge>
                  <PropertyStatusBadge
                    status={property.status || "DRAFT"}
                    className="text-sm px-3 py-1"
                  />
                  <span className="text-slate-400 text-xs font-medium">
                    #{property.id.slice(0, 8)}
                  </span>
                </div>

                {/* Title with line clamp */}
                <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 leading-tight line-clamp-2">
                  {property.title}
                </h2>

                {/* Location */}
                <div className="flex items-center text-slate-600 gap-2 font-normal text-sm">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="line-clamp-1">
                    {locationParts || "ไม่ระบุทำเล"}
                  </span>
                </div>
              </div>

              {/* Price Section */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 md:p-6 min-w-[200px] text-right">
                <div className="flex flex-col md:items-end gap-2">
                  {(() => {
                    const renderPriceBlock = (
                      price: number | null,
                      originalPrice: number | null,
                      label: string,
                      isRent: boolean,
                    ) => {
                      const displayPrice = price ?? originalPrice;

                      // Fallback for no price
                      if (
                        displayPrice === null ||
                        displayPrice === undefined ||
                        displayPrice === 0
                      ) {
                        return null;
                      }

                      const hasDiscount =
                        price !== null &&
                        originalPrice !== null &&
                        originalPrice > price;

                      if (hasDiscount) {
                        const discountPercent = Math.round(
                          ((originalPrice! - price!) / originalPrice!) * 100,
                        );

                        return (
                          <div className="flex flex-col items-end gap-1">
                            {/* Original Price */}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-400 line-through">
                                {formatPrice(originalPrice)}
                              </span>
                              <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md">
                                -{discountPercent}%
                              </span>
                            </div>

                            {/* Current Price */}
                            <div className="flex items-center gap-2">
                              {label && (
                                <span className="text-sm text-slate-500 font-medium">
                                  {label}
                                </span>
                              )}
                              <span className="text-xl md:text-2xl font-bold text-rose-600">
                                {formatPrice(price)}
                                {isRent && (
                                  <span className="text-sm font-normal text-slate-500">
                                    /เดือน
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Regular price
                      return (
                        <div className="flex items-center gap-2">
                          {label && (
                            <span className="text-sm text-slate-500 font-medium">
                              {label}
                            </span>
                          )}
                          <span className="text-xl md:text-2xl font-bold text-slate-900">
                            {formatPrice(displayPrice)}
                            {isRent && (
                              <span className="text-sm font-normal text-slate-500">
                                /เดือน
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    };

                    if (property.listing_type === "SALE_AND_RENT") {
                      return (
                        <>
                          {renderPriceBlock(
                            property.price,
                            property.original_price,
                            "ราคาขาย",
                            false,
                          )}
                          {renderPriceBlock(
                            property.rental_price,
                            property.original_rental_price,
                            "ค่าเช่า",
                            true,
                          )}
                        </>
                      );
                    }

                    if (property.listing_type === "RENT") {
                      return renderPriceBlock(
                        property.rental_price,
                        property.original_rental_price,
                        "ค่าเช่า",
                        true,
                      );
                    }

                    // SALE or Default
                    return renderPriceBlock(
                      property.price,
                      property.original_price,
                      "ราคาขาย",
                      false,
                    );
                  })()}
                </div>

                {/* Contract Duration */}
                {(property.listing_type === "RENT" ||
                  property.listing_type === "SALE_AND_RENT") &&
                  property.min_contract_months && (
                    <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-200">
                      <CalendarDays className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-slate-600">
                        สัญญาขั้นต่ำ{" "}
                        <strong className="text-slate-900">
                          {property.min_contract_months} ด.
                        </strong>
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-4 md:mt-8">
        {/* 2. Gallery */}
        <section className="mb-6 md:mb-10">
          <PropertyGallery
            images={images as any[]}
            title={property.title ?? ""}
            isHot={false}
            verified={!!property.verified}
            petFriendly={!!property.meta_keywords?.includes("Pet Friendly")}
          />
        </section>

        {/* 3. Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-10 lg:gap-16 mb-6 md:mb-10">
          {/* Left Content */}
          <div className="space-y-6 md:space-y-10">
            {/* Specs Grid */}
            <section>
              <PropertySpecs
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                parking={property.parking_slots}
                sizeSqm={property.size_sqm}
                landSize={property.land_size_sqwah}
                floor={property.floor}
                type={property.property_type}
              />
            </section>

            <section className="space-y-4">
              {/* Badges and Meta in horizontal layout */}
              <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>สร้างเมื่อ {formatDate(property.created_at)}</span>
                  <span>•</span>
                  <span>อัปเดต {formatDate(property.updated_at)}</span>
                </div>
              </div>
            </section>

            {/* Description */}
            <section>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-4 md:mb-6">
                รายละเอียดทรัพย์
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-7 md:leading-8 whitespace-pre-wrap text-sm md:text-base max-h-[200px] overflow-y-auto">
                {property.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Facilities */}
            {features.length > 0 && (
              <section>
                <h2 className="text-lg md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
                  สิ่งอำนวยความสะดวก
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-y-4 md:gap-x-8">
                  {features.map((item: any, i: number) => {
                    const Icon = ICON_MAP[item.icon_key] || DEFAULT_ICON;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 md:gap-3 text-sm md:text-base text-slate-600"
                      >
                        <div className="p-1.5 md:p-2 rounded-full bg-blue-50 text-blue-600">
                          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                        <span className="truncate">{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <hr className="border-slate-100" />

            {/* Map */}
            <section>
              <h2 className="text-lg md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
                แผนที่ & ทำเลที่ตั้ง
              </h2>
              <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-4 md:p-8 flex flex-col items-center justify-center text-slate-400 border border-slate-100 relative overflow-hidden space-y-3 md:space-y-4">
                {property.google_maps_link ? (
                  <>
                    <div className="bg-white p-3 md:p-4 rounded-full shadow-sm inline-block">
                      <MapPin className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
                    </div>
                    <a
                      href={property.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-base font-medium transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      เปิดดูใน Google Maps
                    </a>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <p>ไม่พบพิกัด Google Maps</p>
                  </div>
                )}
              </div>
            </section>

            {/* Owner Contact - CRM Only */}
            {property.owner && (
              <section className="bg-orange-50/50 border border-orange-200 rounded-xl p-6">
                <h3 className="font-semibold text-lg border-b border-orange-200 pb-2 mb-4 flex items-center justify-between text-orange-800">
                  <span>ข้อมูลเจ้าของทรัพย์</span>
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded border border-orange-200">
                    🔒 CRM Only
                  </span>
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-muted-foreground mb-1">
                      ชื่อเจ้าของ
                    </span>
                    <span className="font-semibold text-base">
                      {property.owner.full_name}
                    </span>
                  </div>
                  {property.owner.phone && (
                    <div>
                      <span className="block text-muted-foreground mb-1">
                        เบอร์โทร
                      </span>
                      <a
                        href={`tel:${property.owner.phone}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {property.owner.phone}
                      </a>
                    </div>
                  )}
                  {property.owner.line_id && (
                    <div>
                      <span className="block text-muted-foreground mb-1">
                        Line ID
                      </span>
                      <span className="font-medium">
                        {property.owner.line_id}
                      </span>
                    </div>
                  )}
                  {property.property_source && (
                    <div>
                      <span className="block text-muted-foreground mb-1">
                        แหล่งที่มาทรัพย์
                      </span>
                      <span className="font-medium">
                        {property.property_source}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Deal & Contracts (CRM only, after SOLD/RENTED) */}
            {isClosed && relatedDeal && (
              <section className="space-y-4 rounded-xl border p-6 bg-slate-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    CRM Deal
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      Closed
                    </Badge>
                  </h3>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/protected/deals/${relatedDeal.id}`}>
                      ไปยังหน้า Deal
                    </Link>
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-3 bg-white">
                    <div className="text-xs text-muted-foreground">
                      ค่าคอมมิชชั่น
                    </div>
                    <div className="text-lg font-bold text-emerald-600">
                      {commissionLabel}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3 bg-white">
                    <div className="text-xs text-muted-foreground">
                      ลูกค้า (Lead)
                    </div>
                    <div className="font-medium text-slate-900">
                      {relatedDeal.lead?.full_name ?? "-"}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3 bg-white">
                    <div className="text-xs text-muted-foreground">เคสโดย</div>
                    <div className="font-medium text-slate-900">
                      {property.agent?.full_name ?? "-"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 mt-4 pt-4 border-t border-slate-200">
                  <div>
                    <div className="text-sm font-medium mb-3">
                      เอกสารสัญญา (Contract)
                    </div>
                    {relatedContract?.id ? (
                      <DocumentList
                        ownerId={relatedContract.id}
                        ownerType="RENTAL_CONTRACT"
                      />
                    ) : (
                      <div className="text-center py-6 text-muted-foreground border border-dashed rounded-md">
                        ยังไม่มีสัญญา
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-3">
                      เอกสารดีล (Documents)
                    </div>
                    <DocumentList ownerId={relatedDeal.id} ownerType="DEAL" />
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
