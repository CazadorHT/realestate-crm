import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MoreHorizontal,
  MapPin,
  Calendar,
  Building,
  ImageIcon,
  Eye,
  Edit3,
} from "lucide-react";
import type { Database } from "@/lib/database.types";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { PropertyRowActions } from "@/components/properties/PropertyRowActions";
import { DuplicatePropertyButton } from "@/components/properties/DuplicatePropertyButton";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

type PropertyWithRelations = PropertyRow & {
  property_images?:
    | {
        image_url: string;
        is_cover: boolean | null;
      }[]
    | null;
};

export function RecentPropertiesTable({
  properties,
}: {
  properties: PropertyWithRelations[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            ทรัพย์มาใหม่ (Recent Listings)
          </h3>
          <p className="text-sm text-slate-500">
            รายการทรัพย์ล่าสุดที่ถูกเพิ่มเข้ามาในระบบ
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/protected/properties">ดูทั้งหมด</Link>
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4 w-[40%]">รายละเอียดทรัพย์</th>
                <th className="px-6 py-4">ประเภท/สถานะ</th>
                <th className="px-6 py-4">ราคา</th>
                <th className="px-6 py-4">วันที่ลงประกาศ</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
              {properties.map((property) => (
                <tr
                  key={property.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                >
                  <td className="px-6 py-4 ">
                    <div className="flex items-start gap-4">
                      {/* Image Thumbnail */}
                      <div className="relative h-[60px] w-[80px] shrink-0 overflow-hidden rounded-lg bg-slate-100 group/image cursor-zoom-in">
                        {(() => {
                          // 1. Try to get cover image from relation
                          if (
                            property.property_images &&
                            property.property_images.length > 0
                          ) {
                            const cover =
                              property.property_images.find(
                                (img) => img.is_cover,
                              ) || property.property_images[0];
                            if (cover?.image_url) {
                              return (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <div className="w-full h-full overflow-hidden">
                                      <img
                                        src={cover.image_url}
                                        alt={property.title || "Property Image"}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                                      />
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
                                    <VisuallyHidden>
                                      <DialogTitle>
                                        {property.title || "Property Image"}
                                      </DialogTitle>
                                    </VisuallyHidden>
                                    <img
                                      src={cover.image_url}
                                      alt={property.title || "Property Image"}
                                      className="max-h-[80vh] w-auto rounded-lg object-contain shadow-2xl"
                                    />
                                  </DialogContent>
                                </Dialog>
                              );
                            }
                          }

                          // 2. Fallback: Extract image URL from property.images (JSON type)
                          const legacyImages = property.images as
                            | string[]
                            | { url?: string; image_url?: string }[]
                            | null;

                          const imageUrl =
                            Array.isArray(legacyImages) &&
                            legacyImages.length > 0
                              ? typeof legacyImages[0] === "string"
                                ? legacyImages[0]
                                : legacyImages[0]?.url ||
                                  legacyImages[0]?.image_url
                              : null;

                          return imageUrl ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="w-full h-full overflow-hidden">
                                  <img
                                    src={imageUrl}
                                    alt={property.title || "Property Image"}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                                  />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
                                <VisuallyHidden>
                                  <DialogTitle>
                                    {property.title || "Property Image"}
                                  </DialogTitle>
                                </VisuallyHidden>
                                <img
                                  src={imageUrl}
                                  alt={property.title || "Property Image"}
                                  className="max-h-[80vh] w-auto rounded-lg object-contain shadow-2xl"
                                />
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100">
                              <ImageIcon className="h-5 w-5 text-slate-300" />
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/protected/properties/${property.id}`}
                          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors line-clamp-1 max-w-xs"
                        >
                          {property.title || "ไม่ระบุชื่อ"}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {property.district && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {property.district}
                                {property.province
                                  ? `, ${property.province}`
                                  : ""}
                              </span>
                            </div>
                          )}
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span>Code: {property.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        {property.property_type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`
                          ${
                            property.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : property.status === "SOLD" ||
                                  property.status === "RENTED"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-50 text-slate-600 border-slate-200"
                          }
                        `}
                      >
                        {property.status}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const isSale =
                          property.listing_type === "SALE" ||
                          (property.listing_type as string) === "SALE_RENT" ||
                          property.listing_type === "SALE_AND_RENT";
                        const isRent =
                          property.listing_type === "RENT" ||
                          (property.listing_type as string) === "SALE_RENT" ||
                          property.listing_type === "SALE_AND_RENT";

                        const salePrice = property.price;
                        const originalSalePrice = property.original_price;
                        const hasSaleDiscount =
                          originalSalePrice &&
                          salePrice &&
                          originalSalePrice > salePrice;

                        const rentPrice = property.rental_price;
                        const originalRentPrice =
                          property.original_rental_price;
                        const hasRentDiscount =
                          originalRentPrice &&
                          rentPrice &&
                          originalRentPrice > rentPrice;

                        if (
                          !salePrice &&
                          !rentPrice &&
                          !originalSalePrice &&
                          !originalRentPrice
                        ) {
                          return (
                            <span className="text-sm text-slate-300">-</span>
                          );
                        }

                        return (
                          <>
                            {/* Sale Price */}
                            {isSale && (
                              <div className="flex flex-col">
                                {hasSaleDiscount ? (
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span className="text-xs text-slate-400 line-through decoration-slate-300">
                                      ฿
                                      {originalSalePrice?.toLocaleString(
                                        "th-TH",
                                        {
                                          maximumFractionDigits: 0,
                                        },
                                      )}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1 rounded border border-red-100">
                                        ลดขาย
                                      </span>
                                      <span className="font-bold text-sm text-red-600">
                                        ฿
                                        {salePrice?.toLocaleString("th-TH", {
                                          maximumFractionDigits: 0,
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col">
                                    {isRent && (
                                      <span className="text-[10px] text-slate-400 font-medium mb-0.5">
                                        ราคาขาย
                                      </span>
                                    )}
                                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                                      ฿
                                      {(
                                        salePrice || originalSalePrice
                                      )?.toLocaleString("th-TH", {
                                        maximumFractionDigits: 0,
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Rent Price */}
                            {isRent && (
                              <div className="flex flex-col">
                                {hasRentDiscount ? (
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span className="text-xs text-slate-400 line-through decoration-slate-300">
                                      ฿
                                      {originalRentPrice?.toLocaleString(
                                        "th-TH",
                                        {
                                          maximumFractionDigits: 0,
                                        },
                                      )}
                                      /ด
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-1 rounded border border-orange-100">
                                        ลดเช่า
                                      </span>
                                      <span className="font-bold text-sm text-orange-600">
                                        ฿
                                        {rentPrice?.toLocaleString("th-TH", {
                                          maximumFractionDigits: 0,
                                        })}
                                        /ด
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col mt-1">
                                    <span className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                                      เช่า: ฿
                                      {(
                                        rentPrice || originalRentPrice
                                      )?.toLocaleString("th-TH", {
                                        maximumFractionDigits: 0,
                                      })}
                                      /ด
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(property.created_at), "d MMM yyyy", {
                        locale: th,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer hover:text-blue-700 hover:bg-blue-50"
                        title="ดู"
                        aria-label="ดู"
                      >
                        <Link href={`/protected/properties/${property.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer hover:text-amber-700 hover:bg-amber-50"
                        title="แก้ไข"
                        aria-label="แก้ไข"
                      >
                        <Link
                          href={`/protected/properties/${property.id}/edit`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Link>
                      </Button>

                      <DuplicatePropertyButton
                        id={property.id}
                        className="cursor-pointer hover:text-purple-600 hover:bg-purple-50"
                      />

                      <PropertyRowActions id={property.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-slate-500 bg-slate-50/50"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Building className="h-8 w-8 text-slate-300" />
                      <p>ไม่พบข้อมูลทรัพย์ล่าสุด</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
