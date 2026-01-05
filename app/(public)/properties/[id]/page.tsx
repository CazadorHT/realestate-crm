import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecentPropertyTracker } from "@/components/public/RecentPropertyTracker";
import { PublicNav } from "@/components/public/PublicNav";
import { PropertyGallery } from "@/components/public/PropertyGallery";
import { PropertySpecs } from "@/components/public/PropertySpecs";
import { AgentSidebar } from "@/components/public/AgentSidebar";
import { MapPin, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function PublicPropertyDetailPage(props: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(props.params);

  if (!id || !UUID_RE.test(id)) notFound();

  const supabase = createAdminClient();

  // Fetch with images & agent info
  const { data, error } = await supabase
    .from("properties")
    .select(
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
    )
    .eq("id", id)
    .maybeSingle();

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

  return (
    <main className="min-h-screen bg-white pb-20 font-sans">
      <PublicNav />

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
                    #{data.property_code || data.id.slice(0, 8)}
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
                <div className="text-2xl md:text-3xl font-extrabold text-blue-700">
                  {/* If RENT, show rental_price. If SALE/SALE_AND_RENT, show price (main). */}
                  {data.listing_type === "RENT"
                    ? data.rental_price
                      ? formatPrice(data.rental_price)
                      : "สอบถามราคา"
                    : data.price
                    ? formatPrice(data.price)
                    : "สอบถามราคา"}

                  {(data.listing_type === "RENT" ||
                    data.listing_type === "SALE_AND_RENT") &&
                    // Show /month if we just showed a rental price OR if we showed a sale price but want to indicate rent is separate?
                    // Actually for "RENT" only, we just showed rental_price, so append /month
                    data.listing_type === "RENT" &&
                    data.rental_price && (
                      <span className="text-base font-normal text-slate-500 ml-1">
                        /เดือน
                      </span>
                    )}
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
            price_text: data.price ? formatPrice(data.price) : "",
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

            <hr className="border-slate-100" />

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
              <div className="bg-slate-50 rounded-3xl h-[400px] flex items-center justify-center text-slate-400 border border-slate-100 relative overflow-hidden">
                {data.google_maps_link ? (
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(
                      data.title + " " + locationParts
                    )}`} // Note: Requires valid API Key
                    allowFullScreen
                    title="Property Location"
                  />
                ) : (
                  <div className="text-center space-y-2">
                    <div className="bg-white p-4 rounded-full shadow-sm inline-block">
                      <MapPin className="h-8 w-8 text-blue-300" />
                    </div>
                    <p>ไม่พบพิกัดแผนที่</p>
                  </div>
                )}

                {/* Fallback visual for demo if no link/api key */}
                {!data.google_maps_link && (
                  <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
                    <span className="text-slate-400">
                      Map unavailable (No Google Maps Link provided)
                    </span>
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

  if (!id || !UUID_RE.test(id)) return { title: "ไม่พบทรัพย์" };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("properties")
    .select("title, description")
    .eq("id", id)
    .maybeSingle();

  if (!data) return { title: "ไม่พบทรัพย์" };

  return {
    title: `${data.title} | Real Estate CRM`,
    description: data.description?.slice(0, 160) || "รายละเอียดทรัพย์",
  };
}
