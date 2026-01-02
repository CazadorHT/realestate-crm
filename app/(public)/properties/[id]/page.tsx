import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

function pickCoverImage(images: any[] | null | undefined) {
  if (!images?.length) return null;
  const cover = images.find((img) => img.is_cover);
  if (cover?.image_url) return cover.image_url;
  const sorted = [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return sorted[0]?.image_url ?? null;
}
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function PublicPropertyDetailPage(props: {
  params: { id: string } | Promise<{ id: string }>;
}) {
    // ✅ รองรับทั้ง params แบบ object และแบบ Promise
  const { id } = await Promise.resolve(props.params);

  // ✅ กันเคส id ไม่ใช่ uuid (เช่น undefined/สตริงอื่น) ไม่ให้ไปยิง DB
  if (!id || !UUID_RE.test(id)) notFound();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("properties")
    .select(
      `
        id,
        title,
        description,
        property_type,
        price,
        rental_price,
        bedrooms,
        bathrooms,
        created_at,
        listing_type,
        popular_area,
        province,
        district,
        subdistrict,
        address_line1,
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
  const locationParts = [data.popular_area, data.province].filter(Boolean).join(" • ");

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/properties" className="text-sm text-blue-600 hover:underline">
          ← กลับไปหน้ารวมทรัพย์
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl overflow-hidden border border-slate-100 bg-white">
          <div className="relative aspect-[4/3] bg-slate-100">
            {cover ? (
              <Image
                src={cover}
                alt={data.title ?? "Property"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                ไม่มีรูปภาพ
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900">{data.title}</h1>

          <div className="text-slate-600">
            {locationParts || "ไม่ระบุทำเล"}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-2">
            <div className="text-sm text-slate-500">รายละเอียด</div>
            <div className="text-slate-700 leading-relaxed">
              {data.description || "ยังไม่มีรายละเอียด"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500">ห้องนอน</div>
                <div className="font-semibold text-slate-900">{data.bedrooms ?? "-"}</div>
              </div>
              <div>
                <div className="text-slate-500">ห้องน้ำ</div>
                <div className="font-semibold text-slate-900">{data.bathrooms ?? "-"}</div>
              </div>
            </div>
          </div>

         
        </div>
      </div>
    </main>
  );
}
// generateMetadata() รายทรัพย์ (title/description/og)