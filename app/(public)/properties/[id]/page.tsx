import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecentPropertyTracker } from "@/components/public/RecentPropertyTracker";
import { PublicNav } from "@/components/public/PublicNav";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { AgentSidebar } from "@/components/public/AgentSidebar";
import { MapPin, ArrowLeft, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function PublicPropertyDetailPage(props: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(props.params);

  // Relax UUID check: if it's not a UUID, assume it's a slug or slug-UUID combination
  // const UUID_RE = ... (already defined above) but let's just attempt fetch.

  const supabase = createAdminClient();

  // Try to find by ID (primary) or Slug (secondary)
  let query = supabase.from("properties").select(
    `
        *,
        property_images (
          id,
          image_url,
          is_cover,
          sort_order
        ),
        assigned_agent:profiles!properties_assigned_to_profile_fkey (
           full_name,
           phone,
           avatar_url
        )
      `
  );

  if (UUID_RE.test(id)) {
    query = query.eq("id", id);
  } else {
    // Determine if we should split slug (case: some-title-UUID) or just direct slug match
    // Ideally, we just check 'slug' column
    query = query.eq("slug", id);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) notFound();

  const images = (data.property_images as any[]) || [];
  const agent = (data.assigned_agent as any) || {};

  const locationParts = [
    data.popular_area,
    data.subdistrict,
    data.district,
    data.province,
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

  return (
    <main className="min-h-screen bg-white pb-20 font-sans">
      {/* 1. Header & Breadcrumb */}
      <div className="pt-24  bg-white sticky top-0 z-30 opacity-95 backdrop-blur-sm shadow-sm md:shadow-none md:static">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-4">
            {/* Back Link */}
            <Link
              href="/properties"
              className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              ย้อนกลับไปหน้ารวมทรัพย์
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`rounded-full px-5 py-1 text-sm font-medium ${
                      data.listing_type === "SALE"
                        ? "bg-emerald-600"
                        : "bg-blue-600"
                    }`}
                  >
                    {data.listing_type === "SALE" ? "ขาย" : "เช่า"}
                  </Badge>
                  <span className="text-slate-400 text-xs">
                    #{data.id.slice(0, 8)}
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                  {data.title}
                </h1>
                <div className="flex items-center text-slate-500 gap-1.5 font-light text-sm">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {locationParts || "ไม่ระบุทำเล"}
                </div>
              </div>

              <div className="flex flex-col md:items-end">
                <div className="text-2xl md:text-3xl font-extrabold text-blue-700 flex flex-col items-end">
                  {/* Discount Logic Display */}
                  {(() => {
                    const isRent = data.listing_type === "RENT";
                    const currentPrice = isRent
                      ? data.rental_price ?? 0
                      : data.price ?? 0;
                    const originalPrice = data.original_price ?? 0;
                    const hasDiscount = originalPrice > currentPrice;

                    if (hasDiscount) {
                      return (
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-slate-400 line-through decoration-slate-400/70 font-normal">
                            {formatPrice(originalPrice)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">
                              ลด{" "}
                              {Math.round(
                                ((originalPrice - currentPrice) /
                                  originalPrice) *
                                  100
                              )}
                              %
                            </span>
                            <span className="text-red-600">
                              {formatPrice(currentPrice)}
                              {isRent && (
                                <span className="text-lg text-slate-500 font-normal ml-1">
                                  /เดือน
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="flex items-baseline">
                          {data.listing_type === "RENT"
                            ? data.rental_price
                              ? formatPrice(data.rental_price)
                              : "สอบถามราคา"
                            : data.price
                            ? formatPrice(data.price)
                            : "สอบถามราคา"}
                          {(data.listing_type === "RENT" ||
                            data.listing_type === "SALE_AND_RENT") &&
                            data.listing_type === "RENT" &&
                            data.rental_price && (
                              <span className="text-base font-normal text-slate-500 ml-1">
                                /เดือน
                              </span>
                            )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              {data.rental_price && data.listing_type === "SALE_AND_RENT" && (
                <div className="text-lg text-slate-500 font-medium">
                  เช่า {formatPrice(data.rental_price)}/เดือน
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6 md:mt-8">
        {/* 2. Gallery (Mosaic) */}
        <section className="mb-10">
          <PropertyGallery images={images} title={data.title} />
        </section>

        <RecentPropertyTracker
          property={{
            id: data.id,
            title: data.title,
            image_url: images.find((i: any) => i.is_cover)?.image_url || null,
            province: data.province,
            popular_area: data.popular_area,
            price_text: (() => {
              // SALE_AND_RENT - Show both prices
              if (data.listing_type === "SALE_AND_RENT") {
                const parts = [];

                // Sale price
                const hasSaleDiscount =
                  data.original_price &&
                  data.price &&
                  data.original_price > data.price;
                if (hasSaleDiscount) {
                  const discountPercent = Math.round(
                    ((data.original_price! - data.price!) /
                      data.original_price!) *
                      100
                  );
                  parts.push(
                    `฿${data.original_price!.toLocaleString()} (-${discountPercent}%)`
                  );
                } else if (data.price) {
                  parts.push(formatPrice(data.price));
                } else if (data.original_price) {
                  parts.push(formatPrice(data.original_price));
                }

                // Rental price
                const hasRentDiscount =
                  data.original_rental_price &&
                  data.rental_price &&
                  data.original_rental_price > data.rental_price;
                if (hasRentDiscount) {
                  const discountPercent = Math.round(
                    ((data.original_rental_price! - data.rental_price!) /
                      data.original_rental_price!) *
                      100
                  );
                  parts.push(
                    `฿${data.original_rental_price!.toLocaleString()}/ด (-${discountPercent}%)`
                  );
                } else if (data.rental_price) {
                  parts.push(`${formatPrice(data.rental_price)}/ด`);
                } else if (data.original_rental_price) {
                  parts.push(`${formatPrice(data.original_rental_price)}/ด`);
                }

                return parts.filter(Boolean).join(" | ");
              }

              // Sale price logic
              if (data.listing_type === "SALE") {
                const hasDiscount =
                  data.original_price &&
                  data.price &&
                  data.original_price > data.price;
                if (hasDiscount) {
                  const discountPercent = Math.round(
                    ((data.original_price! - data.price!) /
                      data.original_price!) *
                      100
                  );
                  return `฿${data.original_price!.toLocaleString()} (-${discountPercent}%)`;
                } else if (data.price) {
                  return formatPrice(data.price);
                } else if (data.original_price) {
                  return formatPrice(data.original_price);
                }
              }

              // Rent price logic
              if (data.listing_type === "RENT") {
                const hasDiscount =
                  data.original_rental_price &&
                  data.rental_price &&
                  data.original_rental_price > data.rental_price;
                if (hasDiscount) {
                  const discountPercent = Math.round(
                    ((data.original_rental_price! - data.rental_price!) /
                      data.original_rental_price!) *
                      100
                  );
                  return `฿${data.original_rental_price!.toLocaleString()}/ด (-${discountPercent}%)`;
                } else if (data.rental_price) {
                  return `${formatPrice(data.rental_price)}/ด`;
                } else if (data.original_rental_price) {
                  return `${formatPrice(data.original_rental_price)}/ด`;
                }
              }
              return "";
            })(),
            property_type: data.property_type,
            listing_type: data.listing_type,
            slug: data.slug,
          }}
        />

        {/* 3. Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[2fr_1fr] gap-10 lg:gap-16">
          {/* Left Content */}
          <div className="space-y-10">
            {/* Specs Grid */}
            <section>
              <PropertySpecs
                bedrooms={data.bedrooms}
                bathrooms={data.bathrooms}
                parking={data.parking_slots}
                sizeSqm={data.size_sqm}
                landSize={data.land_size_sqwah}
                floor={data.floor}
                type={data.property_type}
              />
            </section>
            <section>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
                {data.title}
              </h1>
              <div className="flex items-center text-slate-500 gap-1.5 font-light text-sm mt-3">
                <MapPin className="w-4 h-4 text-blue-500" />
                {locationParts || "ไม่ระบุทำเล"}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge
                  className={`rounded-full px-5 py-1 text-sm font-medium ${
                    data.listing_type === "SALE"
                      ? "bg-emerald-600"
                      : "bg-blue-600"
                  }`}
                >
                  {data.listing_type === "SALE" ? "ขาย" : "เช่า"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-3 py-1 text-xs font-medium border-b border-slate-100 pb-4">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-gray-400 text-xs">
                  สร้างเมื่อ : {formatDate(data.created_at)}
                </span>
              </div>
            </section>
            {/* Description */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                รายละเอียดทรัพย์
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-8 whitespace-pre-wrap text-md max-h-[400px] overflow-y-scroll">
                {data.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Facilities / Highlights (Mock or Real Field) */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                สิ่งอำนวยความสะดวก
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
                {/* This would ideally come from a tags array or boolean fields we might have added later */}
                {/* For now, we mimic some common ones or check if they exist in schema in future */}
                {[
                  "สระว่ายน้ำ",
                  "ฟิตเนส",
                  "ระบบรักษาความปลอดภัย 24 ชม.",
                  "CCTV",
                  "สวนหย่อม",
                  "ที่จอดรถ",
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-slate-600"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Map */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                แผนที่ & ทำเลที่ตั้ง
              </h2>
              <div className="bg-slate-50 rounded-3xl p-8 flex flex-col items-center justify-center text-slate-400 border border-slate-100 relative overflow-hidden space-y-4">
                {data.google_maps_link ? (
                  <>
                    <div className="bg-white p-4 rounded-full shadow-sm inline-block">
                      <MapPin className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-slate-600 font-medium max-w-md text-center">
                      ดูตำแหน่งที่ตั้งทรัพย์สินนี้บน Google Maps
                    </p>
                    <a
                      href={data.google_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      เปิดดูใน Google Maps
                    </a>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="bg-white p-4 rounded-full shadow-sm inline-block">
                      <MapPin className="h-8 w-8 text-slate-300" />
                    </div>
                    <p>ไม่พบข้อมูลพิกัดแผนที่</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar (Sticky) */}
          <aside className="relative">
            <AgentSidebar
              agentName={agent?.full_name}
              agentImage={agent?.avatar_url}
              agentPhone={agent?.phone}
              isVerified={true}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);

  // if (!id || !UUID_RE.test(id)) return { title: "ไม่พบทรัพย์" }; // Relaxed for slug

  const supabase = createAdminClient();
  let query = supabase.from("properties").select("title, description");

  if (UUID_RE.test(id)) {
    query = query.eq("id", id);
  } else {
    query = query.eq("slug", id);
  }

  const { data } = await query.maybeSingle();

  if (!data) return { title: "ไม่พบทรัพย์" };

  return {
    title: `${data.title} | Real Estate CRM`,
    description: data.description?.slice(0, 160) || "รายละเอียดทรัพย์",
  };
}
