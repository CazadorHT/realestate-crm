"use client";

import Link from "next/link";
import { ArrowLeft, BadgeHelp, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  KeySellingPoints,
  KeySellingPoint,
} from "@/components/public/KeySellingPoints";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { cn } from "@/lib/utils";

const PROPERTY_TYPE_TH: Record<string, string> = {
  HOUSE: "บ้าน",
  CONDO: "คอนโด",
  TOWNHOME: "ทาวน์โฮม",
  LAND: "ที่ดิน",
  COMMERCIAL_BUILDING: "อาคารพาณิชย์",
  OFFICE_BUILDING: "อาคารสำนักงาน/ออฟฟิศ",
  WAREHOUSE: "โกดัง/โรงงาน",
  OTHER: "อื่นๆ",
};

interface PropertyHeaderProps {
  property: {
    id: string;
    title: string;
    listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
    price: number | null;
    original_price: number | null;
    rental_price: number | null;
    original_rental_price: number | null;
    min_contract_months: number | null;
    slug?: string | null;
    property_type?: string | null;
    province?: string | null;
    district?: string | null;
    popular_area?: string | null;
  };
  locationParts: string;
  keySellingPoints: KeySellingPoint[];
  className?: string;
  hideBreadcrumbs?: boolean;
}

export function PropertyHeader({
  property,
  locationParts,
  keySellingPoints,
  className,
  hideBreadcrumbs = false,
}: PropertyHeaderProps) {
  const formatPrice = (val: number | null) =>
    val
      ? new Intl.NumberFormat("th-TH", {
          style: "currency",
          currency: "THB",
          maximumFractionDigits: 0,
        }).format(val)
      : "-";

  const renderPriceBlock = (
    price: number | null,
    originalPrice: number | null,
    label: string,
    isRent: boolean,
  ) => {
    const displayPrice = price ?? originalPrice;

    if (
      displayPrice === null ||
      displayPrice === undefined ||
      displayPrice === 0
    ) {
      return (
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-sm text-slate-500 font-medium">{label}</span>
          )}
          <span className="text-xl md:text-2xl font-bold text-blue-600">
            {isRent ? "สอบถามค่าเช่า" : "สอบถามราคา"}
          </span>
        </div>
      );
    }

    const hasDiscount =
      price !== null && originalPrice !== null && originalPrice > price;

    if (hasDiscount) {
      const discountPercent = Math.round(
        ((originalPrice! - price!) / originalPrice!) * 100,
      );

      return (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(originalPrice)}
            </span>
            <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md">
              -{discountPercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            {label && (
              <span className="text-sm text-slate-500 font-medium">
                {label}
              </span>
            )}
            <span className="text-xl md:text-2xl font-bold text-rose-600">
              {formatPrice(price)}
              {isRent && (
                <span className="text-sm font-normal text-slate-500">
                  /เดือน
                </span>
              )}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        {label && (
          <span className="text-sm text-slate-500 font-medium">{label}</span>
        )}
        <span className="text-xl md:text-2xl font-bold text-slate-900">
          {formatPrice(displayPrice)}
          {isRent && (
            <span className="text-sm font-normal text-slate-500">/เดือน</span>
          )}
        </span>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "pt-20 md:pt-24 px-5 md:px-6 lg:px-8 bg-white relative",
        className,
      )}
    >
      <div className="max-w-screen-2xl px-4 sm:px-6 lg:px-8  mx-auto">
        <div className="flex flex-col gap-3 md:gap-4">
          {!hideBreadcrumbs && (
            <div className="mb-2">
              <AppBreadcrumbs
                items={[
                  { label: "หน้าแรก", href: "/" },
                  { label: "โครงการและทรัพย์สิน", href: "/properties" },
                  ...(property.property_type
                    ? [
                        {
                          label:
                            PROPERTY_TYPE_TH[property.property_type] ||
                            property.property_type,
                          href: `/properties?property_type=${property.property_type}`,
                        },
                      ]
                    : []),
                  ...(property.province
                    ? [
                        {
                          label: property.province,
                          href: `/properties?province=${property.province}`,
                        },
                      ]
                    : []),
                  // District omitted for now as we don't have direct district filter,
                  // and province filter + popular area is the main flow.
                  ...(property.popular_area
                    ? [
                        {
                          label: property.popular_area,
                          href: `/properties?popular_area=${property.popular_area}`,
                        },
                      ]
                    : []),
                  {
                    label: property.title,
                    className:
                      "max-w-[150px] sm:max-w-[250px] md:max-w-[400px] truncate block",
                  },
                ]}
              />
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3 grow min-w-0 max-w-[900px] ">
              <div className="flex items-center gap-3">
                <Badge
                  className={`rounded-full px-8 py-2 text-md font-medium  ${
                    property.listing_type === "SALE"
                      ? "bg-emerald-600"
                      : "bg-linear-to-r from-sky-500 to-blue-600"
                  }`}
                >
                  {property.listing_type === "SALE" ? "ขาย" : "เช่า"}
                </Badge>
              </div>

              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 leading-tight line-clamp-2">
                {property.title}
              </h2>

              <div className="flex items-center text-slate-600 gap-2 font-normal text-sm">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="line-clamp-1">
                  {locationParts || "ไม่ระบุทำเล"}
                </span>
              </div>

              <KeySellingPoints
                points={keySellingPoints}
                listingType={property.listing_type || "SALE"}
              />
            </div>

            <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 md:p-6">
              <div className="flex flex-col md:items-end gap-2">
                {(() => {
                  if (property.listing_type === "SALE_AND_RENT") {
                    return (
                      <>
                        {renderPriceBlock(
                          property.price,
                          property.original_price,
                          "ราคาขาย",
                          false,
                        )}
                        {renderPriceBlock(
                          property.rental_price,
                          property.original_rental_price,
                          "ค่าเช่า",
                          true,
                        )}
                      </>
                    );
                  }

                  if (property.listing_type === "RENT") {
                    return renderPriceBlock(
                      property.rental_price,
                      property.original_rental_price,
                      "ค่าเช่า",
                      true,
                    );
                  }

                  return renderPriceBlock(
                    property.price,
                    property.original_price,
                    "ราคาขาย",
                    false,
                  );
                })()}

                {(property.listing_type === "RENT" ||
                  property.listing_type === "SALE_AND_RENT") &&
                  property.min_contract_months && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                      <CalendarDays className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-slate-600">
                        อายุสัญญาขั้นต่ำ{" "}
                        <strong className="text-slate-900">
                          {property.min_contract_months} เดือน
                          {property.min_contract_months >= 12 &&
                            property.min_contract_months % 12 === 0 && (
                              <span className="text-slate-500 font-normal">
                                {" "}
                                หรือ {property.min_contract_months / 12} ปี
                              </span>
                            )}
                        </strong>
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
