import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit, MapPin } from "lucide-react";
import { PropertyStatusBadge } from "@/components/properties/PropertyStatusBadge";
import { PropertyTypeBadge } from "@/components/properties/PropertyTypeBadge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/properties/ImageLightbox"; // เปลี่ยน path ตามที่วางไฟล์จริง

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
      )
    `
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

  // 2. Fetch creator profile and images
  const [creatorResult, imagesResult] = await Promise.all([
    property.created_by
      ? supabase
          .from("profiles")
          .select("full_name")
          .eq("id", property.created_by)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("property_images")
      .select("image_url, is_cover, sort_order")
      .eq("property_id", id)
      .order("sort_order"),
  ]);

  const creatorName = creatorResult.data?.full_name || property.created_by;

  const images =
    (imagesResult.data as {
      image_url: string;
      is_cover: boolean;
      sort_order: number;
    }[]) ?? [];

  const sortedImages = images.sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  const imagesForLightbox = sortedImages.map((img) => ({
    image_url: img.image_url,
    is_cover: img.is_cover,
  }));

  const coverImage =
    imagesForLightbox.find((i) => i.is_cover)?.image_url ||
    imagesForLightbox[0]?.image_url ||
    null;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* HEADER ACTIONS */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="pl-0 gap-2">
          <Link href="/protected/properties">
            <ArrowLeft className="h-4 w-4" />
            ย้อนกลับ
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/protected/properties/${property.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            แก้ไขข้อมูล
          </Link>
        </Button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        {/* HERO SECTION */}
        <div className="relative h-64 md:h-80 bg-muted flex items-center justify-center border-b">
          {coverImage ? (
            <img
              src={coverImage}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-black/10 flex items-center justify-center">
                📷
              </div>
              <span>ไม่มีรูปภาพ</span>
            </div>
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <PropertyStatusBadge status={property.status || "DRAFT"} />
            <PropertyTypeBadge type={property.property_type || "OTHER"} />
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {/* TITLE & PRICE */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {property.title}
              </h1>
              <div className="flex items-center text-muted-foreground gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {[
                    property.address_line1,
                    property.subdistrict,
                    property.district,
                    property.province,
                    property.postal_code,
                  ]
                    .filter(Boolean)
                    .join(", ") || "ไม่มีข้อมูลที่อยู่"}
                </span>
              </div>
            </div>
            <div className="text-right">
              {property.price && (
                <div className="text-2xl font-bold text-primary">
                  ฿{property.price.toLocaleString()}
                  {property.listing_type === "SALE_AND_RENT" && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (ขาย)
                    </span>
                  )}
                </div>
              )}
              {property.rental_price && (
                <div
                  className={`font-bold text-primary ${
                    property.price ? "text-lg" : "text-2xl"
                  }`}
                >
                  ฿{property.rental_price.toLocaleString()}/ด
                  {property.listing_type === "SALE_AND_RENT" && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (เช่า)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* KEY SPECS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-muted/30 p-4 rounded-lg">
            <div>
              <span className="text-sm text-muted-foreground">ห้องนอน</span>
              <p className="font-semibold text-lg">
                {property.bedrooms || "-"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ห้อง
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">ห้องน้ำ</span>
              <p className="font-semibold text-lg">
                {property.bathrooms || "-"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ห้อง
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                พื้นที่ใช้สอย
              </span>
              <p className="font-semibold text-lg">
                {property.size_sqm ? property.size_sqm.toLocaleString() : "-"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ตร.ม.
                </span>
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">ขนาดที่ดิน</span>
              <p className="font-semibold text-lg">
                {property.land_size_sqwah
                  ? property.land_size_sqwah.toLocaleString()
                  : "-"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ตร.ว.
                </span>
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              รายละเอียดเพิ่มเติม
            </h3>
            <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {property.description || "ไม่มีรายละเอียด"}
            </p>
          </div>

          {/* IMAGE GALLERY */}
          {images.length > 0 && (
            <ImageLightbox
              images={imagesForLightbox}
              propertyTitle={property.title ?? ""}
            />
          )}

          {/* ADDITIONAL INFO (Location & Meta) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">
                ตำแหน่งที่ตั้ง
              </h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3">
                  <span className="text-muted-foreground">ที่อยู่:</span>
                  <span className="col-span-2 font-medium">
                    {property.address_line1 || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-muted-foreground">แขวง/ตำบล:</span>
                  <span className="col-span-2 font-medium">
                    {property.subdistrict || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-muted-foreground">เขต/อำเภอ:</span>
                  <span className="col-span-2 font-medium">
                    {property.district || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-muted-foreground">จังหวัด:</span>
                  <span className="col-span-2 font-medium">
                    {property.province || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-muted-foreground">ตำแหน่ง:</span>
                  <span className="col-span-2 font-medium">
                    {property.google_maps_link ? (
                      <a
                        href={property.google_maps_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <MapPin className="h-3 w-3" />
                        ดูบน Google Maps
                      </a>
                    ) : (
                      "-"
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Contact - CRM Only */}
            {property.owner && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                  ข้อมูลเจ้าของทรัพย์
                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                    🔒 CRM เท่านั้น
                  </span>
                </h3>
                <div className="space-y-2 text-sm bg-orange-50/50 p-4 rounded-lg border border-orange-200">
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">ชื่อ:</span>
                    <span className="col-span-2 font-medium">
                      {property.owner.full_name}
                    </span>
                  </div>
                  {property.owner.phone && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">เบอร์โทร:</span>
                      <span className="col-span-2 font-medium">
                        <a
                          href={`tel:${property.owner.phone}`}
                          className="hover:underline text-blue-600"
                        >
                          {property.owner.phone}
                        </a>
                      </span>
                    </div>
                  )}
                  {property.owner.line_id && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">LINE:</span>
                      <span className="col-span-2 font-medium">
                        {property.owner.line_id}
                      </span>
                    </div>
                  )}
                  {property.owner.facebook_url && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">Facebook:</span>
                      <span className="col-span-2">
                        <a
                          href={property.owner.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs break-all"
                        >
                          ดูโปรไฟล์
                        </a>
                      </span>
                    </div>
                  )}
                  {property.owner.other_contact && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">
                        ช่องทางอื่นๆ:
                      </span>
                      <span className="col-span-2 text-xs">
                        {property.owner.other_contact}
                      </span>
                    </div>
                  )}
                  {property.property_source && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">แหล่งที่มา:</span>
                      <span className="col-span-2 text-xs">
                        {property.property_source}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Agent Contact - Public */}
            {property.agent && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                  ข้อมูล Agent
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    🌐 แสดงบนเว็บ
                  </span>
                </h3>
                <div className="space-y-2 text-sm bg-green-50/50 p-4 rounded-lg border border-green-200">
                  <div className="grid grid-cols-3">
                    <span className="text-muted-foreground">Agent:</span>
                    <span className="col-span-2 font-medium">
                      {property.agent.full_name || "-"}
                    </span>
                  </div>
                  {property.agent.phone && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">โทร:</span>
                      <span className="col-span-2 font-medium">
                        <a
                          href={`tel:${property.agent.phone}`}
                          className="hover:underline text-blue-600"
                        >
                          {property.agent.phone}
                        </a>
                      </span>
                    </div>
                  )}
                  {property.agent.email && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="col-span-2">
                        <a
                          href={`mailto:${property.agent.email}`}
                          className="text-blue-600 hover:underline text-xs break-all"
                        >
                          {property.agent.email}
                        </a>
                      </span>
                    </div>
                  )}
                  {property.agent.line_id && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">LINE:</span>
                      <span className="col-span-2 font-medium">
                        {property.agent.line_id}
                      </span>
                    </div>
                  )}
                  {property.agent.facebook_url && (
                    <div className="grid grid-cols-3">
                      <span className="text-muted-foreground">Facebook:</span>
                      <span className="col-span-2">
                        <a
                          href={property.agent.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs break-all"
                        >
                          ดูโปรไฟล์
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meta Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">
                ข้อมูลการจัดการ
              </h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3">
                  <span className="text-muted-foreground">ผู้ลงทรัพย์:</span>
                  <span className="col-span-2 font-medium">{creatorName}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-muted-foreground">วันที่สร้าง:</span>
                  <span className="col-span-2 text-muted-foreground">
                    {new Date(property.created_at).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-muted-foreground">อัปเดตล่าสุด:</span>
                  <span className="col-span-2 text-muted-foreground">
                    {new Date(property.updated_at).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
