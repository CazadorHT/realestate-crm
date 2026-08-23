"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ListingType } from "@/features/properties/types";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertyPriceProps {
  listingType: ListingType;
  price: number | null;
  originalPrice?: number | null;
  rentalPrice: number | null;
  originalRentalPrice?: number | null;
  className?: string;
  variant?: "table" | "card";
}

export function PropertyPrice({
  listingType,
  price,
  originalPrice,
  rentalPrice,
  originalRentalPrice,
  className,
  variant = "card",
}: PropertyPriceProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const isSale = listingType === "SALE" || listingType === "SALE_AND_RENT";
  const isRent = listingType === "RENT" || listingType === "SALE_AND_RENT";

  const hasSaleDiscount = originalPrice && price && originalPrice > price;
  const hasRentDiscount =
    originalRentalPrice && rentalPrice && originalRentalPrice > rentalPrice;

  if (!price && !rentalPrice && !originalPrice && !originalRentalPrice) {
    return (
      <span className={cn("text-sm text-slate-300", className)}>
        {isEn ? "Contact for price" : "ติดต่อสอบถาม"}
      </span>
    );
  }

  const isDesktop = variant === "table";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Sale Price */}
      {isSale && (
        <div className="flex flex-col items-start leading-tight">
          {hasSaleDiscount && (
            <span className="text-[10px] text-slate-400 line-through decoration-slate-300">
              ฿{originalPrice?.toLocaleString()}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-bold text-red-600",
                isDesktop ? "text-sm" : "text-base font-black",
              )}
            >
              ฿{price?.toLocaleString() || originalPrice?.toLocaleString()}
            </span>
            {hasSaleDiscount && (
              <Badge className="h-4 text-[9px] bg-red-100 text-red-600 border-none px-1 font-bold pointer-events-none">
                {isEn ? "Sale Disc" : "ลดขาย"}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Rent Price */}
      {isRent && (
        <div className="flex flex-col items-start leading-tight">
          {hasRentDiscount && (
            <span className="text-[10px] text-slate-400 line-through decoration-slate-300">
              ฿{originalRentalPrice?.toLocaleString()}{isEn ? "/mo" : "/ด"}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-bold text-blue-600",
                isDesktop ? "text-xs font-semibold" : "text-sm",
              )}
            >
              {isSale ? (isEn ? "Rent: " : "เช่า: ") : ""}฿
              {rentalPrice?.toLocaleString() ||
                originalRentalPrice?.toLocaleString()}
              {isEn ? "/mo" : "/ด"}
            </span>
            {hasRentDiscount && (
              <Badge className="h-4 text-[9px] bg-orange-100 text-orange-600 border-none px-1 font-bold pointer-events-none">
                {isEn ? "Rent Disc" : "ลดเช่า"}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

