import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecentPropertyTracker } from "@/components/public/RecentPropertyTracker";
import { Button } from "@/components/ui/button";
import { PublicNav } from "@/components/public/PublicNav";

function pickCoverImage(images: any[] | null | undefined) {
  if (!images?.length) return null;
  const cover = images.find((img) => img.is_cover);
  if (cover?.image_url) return cover.image_url;
  const sorted = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  return sorted[0]?.image_url ?? null;
}
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function PublicPropertyDetailPage(props: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(props.params);

  if (!id || !UUID_RE.test(id)) notFound();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
        *,
        property_images (
          image_url,
          is_cover,
          sort_order
        )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const cover = pickCoverImage((data as any).property_images);
  const locationParts = [
    data.address_line1,
    data.subdistrict,
    data.district,
    data.province,
    data.postcode,
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
    <main className="min-h-screen bg-slate-50 pt-20 pb-20">
      <PublicNav />
      <div className="max-w-screen-2xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/properties" className="hover:text-blue-600">
            รายการทรัพย์
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate max-w-[200px]">
            {data.title}
          </span>
        </div>

        <RecentPropertyTracker
          property={{
            id: data.id,
            title: data.title,
            image_url: cover,
            province: data.province,
            popular_area: data.popular_area,
            price_text: data.price ? formatPrice(data.price) : "",
          }}
        />

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Left Column: Images & Details */}
          <div className="space-y-8">
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-video bg-slate-100">
                {cover ? (
                  <Image
                    src={cover}
                    alt={data.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    ไม่มีรูปภาพ
                  </div>
                )}
              </div>
            </div>

            {/* Description Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                รายละเอียดทรัพย์
              </h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                {data.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </div>
            </div>

            {/* Features / Amenities Grid if applicable */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                ข้อมูลเพิ่มเติม
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  { label: "รหัสทรัพย์", value: data.property_code },
                  { label: "ประเภท", value: data.property_type },
                  { label: "โครงการ", value: data.project_name },
                  { label: "จำนวนชั้น", value: data.number_of_stories },
                  { label: "ทิศหน้าทรัพย์", value: data.direction_facing },
                  { label: "เฟอร์นิเจอร์", value: data.furniture_included },
                  { label: "กรรมสิทธิ์", value: data.ownership_type },
                  { label: "ค่าส่วนกลาง", value: data.common_fee },
                  {
                    label: "ขนาดที่ดิน",
                    value: data.land_area
                      ? `${data.land_area} ตร.วา`
                      : undefined,
                  },
                  {
                    label: "พื้นที่ใช้สอย",
                    value: data.usable_area
                      ? `${data.usable_area} ตร.ม.`
                      : undefined,
                  },
                ].map((item) =>
                  item.value ? (
                    <div
                      key={item.label}
                      className="flex justify-between border-b border-slate-100 pb-2"
                    >
                      <dt className="text-slate-500">{item.label}</dt>
                      <dd className="font-semibold text-slate-900">
                        {item.value}
                      </dd>
                    </div>
                  ) : null
                )}
              </dl>
            </div>
          </div>

          {/* Right Column: Sticky Summary & Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100/50">
                <div className="space-y-4">
                  <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                    {data.listing_type === "SALE" ? "ขาย" : "เช่า"}
                  </span>

                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                    {data.title}
                  </h1>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-blue-700">
                      {data.price ? formatPrice(data.price) : "สอบถามราคา"}
                    </span>
                    {data.previous_price && (
                      <span className="text-sm text-slate-400 line-through">
                        {formatPrice(data.previous_price)}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-slate-500 flex items-start gap-2">
                    <span className="mt-1">📍</span>
                    {locationParts || "ไม่ระบุทำเล"}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-100">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">
                        {data.bedrooms ?? "-"}
                      </div>
                      <div className="text-xs text-slate-500">ห้องนอน</div>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <div className="text-2xl font-bold text-slate-900">
                        {data.bathrooms ?? "-"}
                      </div>
                      <div className="text-xs text-slate-500">ห้องน้ำ</div>
                    </div>
                    <div className="text-center border-l border-slate-100">
                      <div className="text-2xl font-bold text-slate-900">
                        {data.parking_spaces ?? "-"}
                      </div>
                      <div className="text-xs text-slate-500">จอดรถ</div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      size="lg"
                      className="w-full text-lg h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200"
                    >
                      ติดต่อสอบถาม
                    </Button>
                  </div>
                </div>
              </div>

              {/* Map Placeholder or additional agent info could go here */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
// generateMetadata() รายทรัพย์ (title/description/og)
