"use client";

import Link from "next/link";
import Image from "next/image";
import { BedDouble, Bath, MapPin, ArrowRight, Scale,Maximize } from "lucide-react";
import { useEffect, useState, MouseEvent } from "react";
import { toggleCompareId, readCompareIds } from "@/lib/compare-store";
import { Button } from "@/components/ui/button";

// Re-using types or defining subset
export type PropertyCardProps = {
  id: string;
  title: string;
  description?: string | null;
  property_type: string | null;
  price?: number | null;
  rental_price?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  popular_area?: string | null;
  province?: string | null;
  created_at: string;
  listing_type: "SALE" | "RENT" | "SALE_AND_RENT" | null;
  image_url?: string | null;
  location?: string | null;
  priority?: boolean;
  size_sqm?: number | null;
  land_size?: number | null;
  parking?: number | null;
  floor?: number | null;
  
};

const PRICE_FORMATTER = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  HOUSE: "บ้าน",
  CONDO: "คอนโด",
  TOWNHOME: "ทาวน์โฮม",
  LAND: "ที่ดิน",
  OFFICE_BUILDING: "ออฟฟิศ",
  COMMERCIAL_BUILDING: "อาคารพาณิชย์",
  WAREHOUSE: "โกดัง",
  OTHER: "อื่นๆ",
};

export function PropertyCard({
  property,
  priority = false,
}: {
  property: PropertyCardProps;
  priority?: boolean;
}) {
  const [isInCompare, setIsInCompare] = useState(false);

  // Sync with compare store
  useEffect(() => {
    const check = () => {
      const ids = readCompareIds();
      setIsInCompare(ids.includes(property.id));
    };
    check();
    window.addEventListener("compare-updated", check);
    return () => window.removeEventListener("compare-updated", check);
  }, [property.id]);

  const handleCompareClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompareId(property.id);
  };

  const badge = getListingBadge(property.listing_type);
  const areaProvince = [property.popular_area, property.province]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="group relative isolate rounded-3xl bg-white overflow-hidden shadow-sm transform-gpu will-change-transform transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:-translate-y-1 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 before:content-[''] before:absolute before:inset-0 before:rounded-3xl before:ring-1 before:ring-inset before:ring-slate-100 before:pointer-events-none before:z-10">
      <Link
        href={`/properties/${property.id}`}
        className="block focus:outline-none"
        aria-label={`ดูรายละเอียดทรัพย์: ${property.title}`}
      >
        {/* Image Section */}
        <div className="relative h-52 overflow-hidden rounded-t-3xl bg-slate-200">
          {property.image_url ? (
            <Image
              src={property.image_url}
              alt={property.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transform-gpu [will-change:transform] group-hover:scale-105 transition-transform duration-500"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 flex items-center justify-center text-sm text-slate-400">
              ไม่มีรูปภาพ
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 rounded-t-3xl bg-gradient-to-t from-black/35 via-transparent to-transparent" />

          {/* Compare Button */}
          <button
            onClick={handleCompareClick}
            className={`pointer-events-auto absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1 transition-all ${
              isInCompare
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-white/90 text-slate-700 hover:bg-white"
            }`}
            title={
              isInCompare ? "ยกเลิกการเปรียบเทียบ" : "เพิ่มเพื่อเปรียบเทียบ"
            }
          >
            <Scale className="h-3.5 w-3.5" />
            {isInCompare ? "เปรียบเทียบอยู่" : "เปรียบเทียบ"}
          </button>

          {badge && (
            <div
              className={`pointer-events-none absolute top-3 right-3 ${badge.className} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md`}
            >
              {badge.label}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <div className="text-sm text-blue-600 font-semibold">
              {getTypeLabel(property.property_type)}
            </div>

            <h3 className="text-xl font-bold text-slate-900 line-clamp-2">
              {property.title}
            </h3>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              {getSafeText(areaProvince, "ไม่ระบุทำเล")}
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
            {getSafeText(property.description, "ยังไม่มีรายละเอียด")}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200">
              <BedDouble className="h-4 w-4 text-blue-600" />
              {property.bedrooms || "-"} นอน
            </div>
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200">
              <Bath className="h-4 w-4 text-blue-600" />
              {property.bathrooms || "-"} น้ำ
            </div>
            <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200">
              <Maximize className="h-4 w-4 text-blue-600" />
              {property.size_sqm || "-"} ตร.ม.
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-100 bg-white/60 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs text-slate-500">ราคา</div>
              <div className="text-lg font-bold text-blue-600 truncate ">
                {getDisplayPrice(property)}
              </div>
            </div>
            
          </div>
        </div>
      </Link>
    </div>
  );
}

// Helpers
function getDisplayPrice(property: PropertyCardProps) {
  const salePrice = property.price ?? undefined;
  const rentPrice = property.rental_price ?? undefined;

  let value: number | undefined;
  let isRent = false;

  if (property.listing_type === "SALE") {
    value = salePrice;
  } else if (property.listing_type === "RENT") {
    value = rentPrice;
    isRent = true;
  } else {
    value = salePrice ?? rentPrice;
    isRent = !salePrice && !!rentPrice;
  }

  if (!value) return "สอบถามราคา";

  const formatted = PRICE_FORMATTER.format(value);
  return isRent ? `${formatted}/เดือน` : formatted;
}

function getSafeText(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function getTypeLabel(propertyType: string | null) {
  if (!propertyType) return "อื่นๆ";
  return PROPERTY_TYPE_LABELS[propertyType] ?? "อื่นๆ";
}

function getListingBadge(listingType: string | null) {
  if (listingType === "SALE")
    return { label: "ขาย", className: "bg-emerald-600" };
  if (listingType === "RENT")
    return { label: "เช่า", className: "bg-indigo-600" };
  if (listingType === "SALE_AND_RENT")
    return { label: "ขาย/เช่า", className: "bg-slate-900" };
  return null;
}
