import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { getOwnerById } from "@/features/owners/queries";
import {
  Edit,
  Phone,
  MessageCircle,
  Facebook,
  User,
  ArrowLeft,
  Building2,
  Plus,
  MapPin,
  Tag,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { FaFacebook, FaLine } from "react-icons/fa";

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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            พร้อมขาย/เช่า
          </Badge>
        );
      case "SOLD":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            ขายแล้ว
          </Badge>
        );
      case "RENTED":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            ให้เช่าแล้ว
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Premium Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-slate-800 to-slate-900 px-6 py-8">
          {/* Breadcrumb */}
          <Breadcrumb
            variant="on-dark"
            backHref="/protected/owners"
            backLabel="เจ้าของทรัพย์"
            items={[
              { label: "เจ้าของทรัพย์", href: "/protected/owners" },
              { label: owner.full_name || "รายละเอียด" },
            ]}
            className="mb-6"
          />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {owner.full_name?.charAt(0).toUpperCase() || "O"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {owner.full_name}
                </h1>
                <p className="text-slate-300 text-sm mt-1">
                  เจ้าของทรัพย์ • {properties.length} ทรัพย์ในระบบ
                </p>
              </div>
            </div>
            <Button asChild variant="secondary" className="gap-2 shadow-lg">
              <Link href={`/protected/owners/${id}/edit`}>
                <Edit className="h-4 w-4" />
                แก้ไขข้อมูล
              </Link>
            </Button>
          </div>
        </div>

        {/* Contact Info Strip */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-6">
          {owner.phone && (
            <a
              href={`tel:${owner.phone}`}
              className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors group"
            >
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
              </div>
              <span className="font-medium">{owner.phone}</span>
            </a>
          )}

          {owner.line_id && (
            <div className="flex items-center gap-2 text-sm">
              <div className="p-2 rounded-full bg-[#06C755]/10 text-[#06C755]">
                <FaLine className="h-5 w-5" />
              </div>
              <span className="font-medium">{owner.line_id}</span>
            </div>
          )}

          {owner.facebook_url && (
            <a
              href={owner.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-blue-600 transition-colors group"
            >
              <div className="p-2 rounded-full bg-[#1877F2]/10 text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white transition-colors">
                <FaFacebook className="h-5 w-5" />
              </div>
              <span className="font-medium">Facebook</span>
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          )}

          {owner.other_contact && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-slate-400">อื่นๆ:</span>
              <span>{owner.other_contact}</span>
            </div>
          )}

          {!owner.phone && !owner.line_id && !owner.facebook_url && (
            <p className="text-sm text-slate-400">ไม่มีข้อมูลการติดต่อ</p>
          )}
        </div>
      </div>

      {/* Properties Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">รายการทรัพย์</h2>
              <p className="text-sm text-slate-500">
                ทั้งหมด {properties.length} รายการ
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="gap-2">
            <Link href={`/protected/properties/new?owner_id=${owner.id}`}>
              <Plus className="h-4 w-4" />
              เพิ่มทรัพย์
            </Link>
          </Button>
        </div>

        {properties.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {properties.map((prop) => (
              <Link
                key={prop.id}
                href={`/protected/properties/${prop.id}`}
                className="block p-4 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {prop.title || "ไม่ระบุชื่อโครงการ"}
                      </h3>
                      {getStatusBadge(prop.status)}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {prop.listing_type === "SALE"
                          ? "ขาย"
                          : prop.listing_type === "RENT"
                            ? "เช่า"
                            : "ขาย / เช่า"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>{prop.property_type}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="line-clamp-1">
                        {[
                          prop.popular_area,
                          prop.subdistrict,
                          prop.district,
                          prop.province,
                        ]
                          .filter(Boolean)
                          .join(", ") || "ไม่ระบุที่ตั้ง"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {/* Sale Price */}
                    {(prop.listing_type === "SALE" ||
                      prop.listing_type === "SALE_AND_RENT" ||
                      (prop.listing_type as any) === "SALE_RENT") &&
                      (prop.price || prop.original_price) && (
                        <div>
                          {prop.original_price &&
                            prop.price &&
                            prop.original_price > prop.price && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatCurrency(prop.original_price)}
                              </span>
                            )}
                          <p className="font-bold text-blue-600">
                            {formatCurrency(
                              prop.price || prop.original_price || 0,
                            )}
                          </p>
                        </div>
                      )}

                    {/* Rental Price */}
                    {(prop.listing_type === "RENT" ||
                      prop.listing_type === "SALE_AND_RENT" ||
                      (prop.listing_type as any) === "SALE_RENT") &&
                      (prop.rental_price || prop.original_rental_price) && (
                        <div className="mt-1">
                          {prop.original_rental_price &&
                            prop.rental_price &&
                            prop.original_rental_price > prop.rental_price && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatCurrency(prop.original_rental_price)}
                              </span>
                            )}
                          <p className="font-semibold text-emerald-600 text-sm">
                            {formatCurrency(
                              prop.rental_price ||
                                prop.original_rental_price ||
                                0,
                            )}
                            <span className="text-xs font-normal text-slate-400 ml-1">
                              /เดือน
                            </span>
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1">ยังไม่มีทรัพย์</h3>
            <p className="text-sm text-slate-500 mb-4">
              เจ้าของนี้ยังไม่มีทรัพย์ในระบบ
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={`/protected/properties/new?owner_id=${owner.id}`}>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มทรัพย์แรก
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
