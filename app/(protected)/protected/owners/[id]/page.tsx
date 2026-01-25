import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getOwnerById } from "@/features/owners/queries";
import { Edit, Phone, MessageCircle, Facebook, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getOwnerProperties(ownerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  return data || [];
}

export default async function OwnerPage({ params }: PageProps) {
  const { id } = await params;
  const owner = await getOwnerById(id);
  const properties = await getOwnerProperties(id);

  if (!owner) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8 text-primary" />
          {owner.full_name}
        </h1>
        <Button asChild>
          <Link href={`/protected/owners/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            แก้ไขข้อมูล
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              ข้อมูลการติดต่อ
            </h3>

            <div className="space-y-3">
              {owner.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      เบอร์โทรศัพท์
                    </p>
                    <a
                      href={`tel:${owner.phone}`}
                      className="font-medium hover:underline"
                    >
                      {owner.phone}
                    </a>
                  </div>
                </div>
              )}

              {owner.line_id && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-[#06C755]/10 flex items-center justify-center text-[#06C755]">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Line ID</p>
                    <p className="font-medium">{owner.line_id}</p>
                  </div>
                </div>
              )}

              {owner.facebook_url && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
                    <Facebook className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Facebook</p>
                    <a
                      href={owner.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline truncate max-w-[200px] block"
                    >
                      ดูโปรไฟล์
                    </a>
                  </div>
                </div>
              )}

              {!owner.phone && !owner.line_id && !owner.facebook_url && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  ไม่มีข้อมูลการติดต่อ
                </div>
              )}

              {owner.other_contact && (
                <div className="pt-2 border-t mt-2">
                  <p className="text-muted-foreground text-xs mb-1">
                    ช่องทางอื่น ๆ
                  </p>
                  <p className="text-sm bg-muted/50 p-2 rounded-md">
                    {owner.other_contact}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl border p-4 text-center">
            <p className="text-3xl font-bold text-primary">
              {properties.length}
            </p>
            <p className="text-muted-foreground text-sm">ทรัพย์ในระบบ</p>
          </div>
        </div>

        {/* Properties List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              รายการทรัพย์ ({properties.length})
            </h3>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/protected/properties/new?owner_id=${owner.id}`}>
                + เพิ่มทรัพย์
              </Link>
            </Button>
          </div>

          {properties.length > 0 ? (
            <div className="grid gap-4">
              {properties.map((prop) => (
                <Link
                  key={prop.id}
                  href={`/protected/properties/${prop.id}`}
                  className="group block bg-card border rounded-lg p-4 hover:shadow-md transition-all hover:border-primary/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium group-hover:text-primary transition-colors mb-1 truncate max-w-[500px]">
                        {prop.title || "ไม่ระบุชื่อโครงการ"}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {prop.listing_type === "SALE"
                          ? "ขาย"
                          : prop.listing_type === "RENT"
                            ? "เช่า"
                            : "ขาย / เช่า"}{" "}
                        • {prop.property_type}
                      </p>
                      <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                        {prop.popular_area && (
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-medium">
                            📍 {prop.popular_area}
                          </span>
                        )}
                        {prop.address_line1 && (
                          <span>| บ้านเลขที่ {prop.address_line1}</span>
                        )}
                        {prop.subdistrict && <span>ต.{prop.subdistrict}</span>}
                        {prop.district && <span>อ.{prop.district}</span>}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {/* Price Display */}
                      <div className="flex flex-col items-end">
                        {/* Sale Price Section */}
                        {(prop.listing_type === "SALE" ||
                          prop.listing_type === "SALE_AND_RENT" ||
                          (prop.listing_type as any) === "SALE_RENT") &&
                          ((prop.price || 0) > 0 ||
                            (prop.original_price || 0) > 0) && (
                            <div className="flex flex-col items-end">
                              {prop.original_price &&
                                (prop.price || 0) > 0 &&
                                prop.original_price > prop.price! && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    {new Intl.NumberFormat("th-TH", {
                                      style: "currency",
                                      currency: "THB",
                                      maximumFractionDigits: 0,
                                    }).format(prop.original_price)}
                                  </span>
                                )}
                              <p className="font-bold text-primary">
                                {new Intl.NumberFormat("th-TH", {
                                  style: "currency",
                                  currency: "THB",
                                  maximumFractionDigits: 0,
                                }).format(
                                  (prop.price || 0) > 0
                                    ? prop.price!
                                    : prop.original_price || 0,
                                )}
                              </p>
                            </div>
                          )}

                        {/* Rental Price Section */}
                        {(prop.listing_type === "RENT" ||
                          prop.listing_type === "SALE_AND_RENT" ||
                          (prop.listing_type as any) === "SALE_RENT") &&
                          ((prop.rental_price || 0) > 0 ||
                            (prop.original_rental_price || 0) > 0) && (
                            <div className="flex flex-col items-end mt-1">
                              {prop.original_rental_price &&
                                (prop.rental_price || 0) > 0 &&
                                prop.original_rental_price >
                                  prop.rental_price! && (
                                  <span className="text-xs text-muted-foreground line-through">
                                    {new Intl.NumberFormat("th-TH", {
                                      style: "currency",
                                      currency: "THB",
                                      maximumFractionDigits: 0,
                                    }).format(prop.original_rental_price)}
                                  </span>
                                )}
                              <p className="font-bold text-primary text-sm">
                                {new Intl.NumberFormat("th-TH", {
                                  style: "currency",
                                  currency: "THB",
                                  maximumFractionDigits: 0,
                                }).format(
                                  (prop.rental_price || 0) > 0
                                    ? prop.rental_price!
                                    : prop.original_rental_price || 0,
                                )}
                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                  /เดือน
                                </span>
                              </p>
                            </div>
                          )}
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          prop.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg border-dashed bg-muted/10">
              <p className="text-muted-foreground">ไม่มีรายการทรัพย์</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
