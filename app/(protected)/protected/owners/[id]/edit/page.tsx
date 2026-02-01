import { notFound } from "next/navigation";
import { OwnerForm } from "@/features/owners/OwnerForm";
import { getOwnerById, getOwnerProperties } from "@/features/owners/queries";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus, MapPin, Tag, User } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditOwnerPage({ params }: PageProps) {
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
    const styles: Record<string, string> = {
      ACTIVE: "bg-emerald-100 text-emerald-700",
      SOLD: "bg-red-100 text-red-700",
      RENTED: "bg-blue-100 text-blue-700",
      RESERVED: "bg-orange-100 text-orange-700",
      UNDER_OFFER: "bg-orange-100 text-orange-700",
      DRAFT: "bg-slate-100 text-slate-700",
      ARCHIVED: "bg-slate-100 text-slate-700",
    };
    return styles[status] || "bg-slate-100 text-slate-700";
  };

  const propertyTypeLabels: Record<string, string> = {
    HOUSE: "บ้านเดี่ยว",
    CONDO: "คอนโด",
    TOWNHOME: "ทาวน์โฮม",
    LAND: "ที่ดิน",
    COMMERCIAL_BUILDING: "อาคารพาณิชย์",
    OFFICE_BUILDING: "สำนักงาน",
    WAREHOUSE: "โกดัง",
    OTHER: "อื่นๆ",
  };

  return (
    <div className="p-6 space-y-6 max-w-full mx-auto">
      {/* Header */}
      <Breadcrumb
        backHref={`/protected/owners/${id}`}
        items={[
          { label: "เจ้าของทรัพย์", href: "/protected/owners" },
          {
            label: owner.full_name || "รายละเอียด",
            href: `/protected/owners/${id}`,
          },
          { label: "แก้ไขข้อมูล" },
        ]}
      />
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
          {owner.full_name?.charAt(0).toUpperCase() || "O"}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            แก้ไขข้อมูลเจ้าของทรัพย์
          </h1>
          <p className="text-sm text-slate-500">{owner.full_name}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3 bg-linear-to-r from-slate-800 to-slate-900">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-white">ข้อมูลเจ้าของ</h2>
              <p className="text-sm text-slate-300">แก้ไขข้อมูลติดต่อ</p>
            </div>
          </div>
          <div className="p-6">
            <OwnerForm mode="edit" id={owner.id} initialValues={owner} />
          </div>
        </div>

        {/* Properties Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4  bg-linear-to-r from-slate-800 to-slate-900 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-semibold text-white">รายการทรัพย์</h2>
                <p className="text-sm text-slate-300">
                  ทั้งหมด {properties.length} รายการ
                </p>
              </div>
            </div>
            <Button asChild size="sm" variant="add" className="gap-2">
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {prop.title || "ไม่ระบุชื่อโครงการ"}
                        </h3>
                        <Badge
                          className={`${getStatusBadge(prop.status)} text-[10px] px-1.5`}
                        >
                          {prop.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-slate-500 mb-1">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5" />
                          {prop.listing_type === "SALE"
                            ? "ขาย"
                            : prop.listing_type === "RENT"
                              ? "เช่า"
                              : "ขาย / เช่า"}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>
                          {propertyTypeLabels[prop.property_type] ||
                            prop.property_type}
                        </span>
                      </div>

                      {prop.popular_area && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{prop.popular_area}</span>
                        </div>
                      )}
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

                      {/* Rent Price */}
                      {(prop.listing_type === "RENT" ||
                        prop.listing_type === "SALE_AND_RENT" ||
                        (prop.listing_type as any) === "SALE_RENT") &&
                        (prop.rental_price || prop.original_rental_price) && (
                          <div className="mt-1">
                            {prop.original_rental_price &&
                              prop.rental_price &&
                              prop.original_rental_price >
                                prop.rental_price && (
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
              <h3 className="font-medium text-slate-900 mb-1">
                ยังไม่มีทรัพย์
              </h3>
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
    </div>
  );
}
