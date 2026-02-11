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
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
} from "@/features/properties/labels";

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
    <div className="space-y-6 mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 sm:px-0">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
            ทรัพย์มาใหม่
            <span className="text-slate-400 font-medium text-sm hidden xs:inline">
              (Recent Listings)
            </span>
          </h3>
          <p className="text-sm text-slate-500 font-medium pb-2 sm:pb-0">
            รายการทรัพย์ล่าสุดที่ถูกเพิ่มเข้ามาในระบบ
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="w-fit rounded-full font-bold border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
        >
          <Link href="/protected/properties">ดูทั้งหมด →</Link>
        </Button>
      </div>

      <Card className="shadow-lg border-none bg-transparent overflow-visible">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
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
                        {PROPERTY_TYPE_LABELS[
                          property.property_type as keyof typeof PROPERTY_TYPE_LABELS
                        ] || property.property_type}
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
                        {PROPERTY_STATUS_LABELS[
                          property.status as keyof typeof PROPERTY_STATUS_LABELS
                        ] || property.status}
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

        {/* Mobile & Tablet Grid View */}
        <div className="lg:hidden grid grid-cols-2 gap-4 sm:gap-6 ">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="group relative flex flex-col overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white dark:bg-slate-900 rounded-lg sm:rounded-xl"
            >
              {/* Image Section (Vertical Stack) */}
              <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
                {(() => {
                  const coverImg =
                    property.property_images?.find((img) => img.is_cover) ||
                    property.property_images?.[0];
                  const imageUrl = coverImg?.image_url;

                  return imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={property.title || "Property"}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50 dark:bg-slate-800">
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    </div>
                  );
                })()}

                {/* Floating Badges on Image */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5">
                  <Badge className="text-[9px] px-2 py-0.5 h-5 font-bold bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-blue-600 border-none shadow-sm uppercase tracking-tight">
                    {PROPERTY_TYPE_LABELS[
                      property.property_type as keyof typeof PROPERTY_TYPE_LABELS
                    ] || property.property_type}
                  </Badge>
                  <Badge
                    className={`text-[9px] px-2 py-0.5 h-5 font-bold border-0 shadow-sm ${
                      property.status === "ACTIVE"
                        ? "bg-emerald-500 text-white"
                        : property.status === "SOLD" ||
                            property.status === "RENTED"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-500 text-white"
                    }`}
                  >
                    {property.status === "ACTIVE"
                      ? "ใช้งาน"
                      : PROPERTY_STATUS_LABELS[
                          property.status as keyof typeof PROPERTY_STATUS_LABELS
                        ] || property.status}
                  </Badge>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col">
                <div className="space-y-1.5 mb-3">
                  <Link
                    href={`/protected/properties/${property.id}`}
                    className="font-black text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors line-clamp-1 text-sm sm:text-base leading-tight"
                  >
                    {property.title || "ไม่ระบุชื่อ"}
                  </Link>

                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 font-semibold truncate opacity-80">
                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {property.district}, {property.province}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800 flex items-start justify-between gap-1">
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="space-y-1">
                      {(() => {
                        const listingType = String(
                          property.listing_type,
                        ).toUpperCase();
                        const isSale =
                          listingType === "SALE" ||
                          listingType === "SALE_RENT" ||
                          listingType === "SALE_AND_RENT";
                        const isRent =
                          listingType === "RENT" ||
                          listingType === "SALE_RENT" ||
                          listingType === "SALE_AND_RENT";

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
                            <p className="text-[11px] sm:text-[13px] font-bold text-slate-400">
                              ติดต่อสอบถาม
                            </p>
                          );
                        }

                        return (
                          <div className="flex flex-col gap-1">
                            {isSale && (
                              <div className="flex flex-col">
                                {hasSaleDiscount ? (
                                  <div className="flex flex-col items-start">
                                    <span className="text-[9px] text-slate-400 line-through decoration-slate-300 leading-none">
                                      ฿
                                      {originalSalePrice?.toLocaleString(
                                        "th-TH",
                                      )}
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[8px] text-red-500 font-bold bg-red-50 px-1 rounded border border-red-100">
                                        ลดขาย
                                      </span>
                                      <span className="font-black text-[12px] sm:text-[14px] text-red-600 leading-tight">
                                        ฿{salePrice?.toLocaleString("th-TH")}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-black text-[12px] sm:text-[14px] text-slate-900 dark:text-white leading-tight wrap-break-word">
                                    ฿
                                    {(
                                      salePrice || originalSalePrice
                                    )?.toLocaleString("th-TH")}
                                  </span>
                                )}
                              </div>
                            )}

                            {isRent && (
                              <div className="flex flex-col">
                                {hasRentDiscount ? (
                                  <div className="flex flex-col items-start">
                                    <span className="text-[9px] text-slate-400 line-through decoration-slate-300 leading-none">
                                      ฿
                                      {originalRentPrice?.toLocaleString(
                                        "th-TH",
                                      )}
                                      /ด
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[8px] text-orange-500 font-bold bg-orange-50 px-1 rounded border border-orange-100">
                                        ลดเช่า
                                      </span>
                                      <span className="font-bold text-[10px] sm:text-[12px] text-orange-600 leading-tight">
                                        ฿{rentPrice?.toLocaleString("th-TH")}/ด
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-bold text-[10px] sm:text-[12px] text-orange-600 dark:text-orange-400 leading-tight wrap-break-word">
                                    เช่า: ฿
                                    {(
                                      rentPrice || originalRentPrice
                                    )?.toLocaleString("th-TH")}
                                    /ด
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold tracking-tight lowercase mt-1">
                      {format(new Date(property.created_at), "d MMM yy", {
                        locale: th,
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Link href={`/protected/properties/${property.id}`}>
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                    <PropertyRowActions id={property.id} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {properties.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200">
              <Building className="h-10 w-10 mx-auto mb-3 text-slate-300 opacity-50" />
              <p className="text-sm font-medium">ไม่พบข้อมูลทรัพย์ล่าสุด</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
