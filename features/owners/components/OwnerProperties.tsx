"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Tag,
  MapPin,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@/features/properties/labels";
import { getProvinceName, getDistrictName } from "@/lib/utils/provinces";
import { getLocaleValue } from "@/lib/utils/locale-utils";

interface OwnerPropertiesProps {
  properties: any[];
  ownerId: string;
}

const ITEMS_PER_PAGE = 5;

export function OwnerProperties({ properties, ownerId }: OwnerPropertiesProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE);
  const { language } = useLanguage();
  const isEn = language === "en";

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentProperties = properties.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(isEn ? "en-US" : "th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0,
    }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            {isEn ? "Active" : "พร้อมขาย/เช่า"}
          </Badge>
        );
      case "SOLD":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            {isEn ? "Sold" : "ขายแล้ว"}
          </Badge>
        );
      case "RENTED":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
            {isEn ? "Rented" : "ให้เช่าแล้ว"}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{isEn ? "Properties" : "รายการทรัพย์"}</h2>
            <p className="text-sm text-slate-500">
              {isEn ? `Total ${properties.length} listings` : `ทั้งหมด ${properties.length} รายการ`}
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="gap-2 cursor-pointer">
          <Link href={`/protected/properties/new?owner_id=${ownerId}`}>
            <Plus className="h-4 w-4" />
            {isEn ? "Add Property" : "เพิ่มทรัพย์"}
          </Link>
        </Button>
      </div>

      <div className="flex-1">
        {properties.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {currentProperties.map((prop) => {
              const typeLabel =
                (PROPERTY_TYPE_LABELS as any)[prop.property_type]?.[language] ||
                (PROPERTY_TYPE_LABELS as any)[prop.property_type]?.en ||
                prop.property_type;


              return (
                <div
                  key={prop.id}
                  onClick={() => {
                    setNavigatingId(prop.id);
                    router.push(`/protected/properties/${prop.id}`);
                  }}
                  className="block p-4 hover:bg-slate-50 transition-colors group cursor-pointer relative"
                >
                  {navigatingId === prop.id && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-200">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Property Cover Image */}
                      <div className="h-16 w-24 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative">
                        {prop.main_image_url ? (
                          <img
                            src={prop.main_image_url}
                            alt={prop.title || "Property cover"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                            <Building2 className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {isEn
                              ? (prop.title_en || getLocaleValue(prop, "title", "en") || prop.title || "Untitled Listing")
                              : (prop.title || getLocaleValue(prop, "title", "th") || prop.title_en || "ไม่ระบุชื่อโครงการ")}
                          </h3>
                          {getStatusBadge(prop.status)}
                        </div>

                        {prop.project_name ? (
                          <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 mb-1.5 line-clamp-1">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                            <span className="truncate">{prop.project_name}</span>
                          </div>
                        ) : null}

                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {prop.listing_type === "SALE"
                              ? (isEn ? "Sale" : "ขาย")
                              : prop.listing_type === "RENT"
                                ? (isEn ? "Rent" : "เช่า")
                                : (isEn ? "Sale / Rent" : "ขาย / เช่า")}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{typeLabel}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span className="line-clamp-1">
                            {[
                              getDistrictName(getLocaleValue(prop, "popular_area", language) || prop.popular_area || "", isEn ? "en" : "th"),
                              getDistrictName(getLocaleValue(prop, "district", language) || prop.district || "", isEn ? "en" : "th"),
                              getProvinceName(getLocaleValue(prop, "province", language) || prop.province || "", isEn ? "en" : "th"),
                            ]
                              .filter(Boolean)
                              .join(", ") || (isEn ? "Location unassigned" : "ไม่ระบุที่ตั้ง")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {(prop.listing_type === "SALE" ||
                        prop.listing_type === "SALE_RENT") &&
                        prop.price && (
                          <div className="flex items-center justify-end gap-1 text-emerald-600 font-semibold">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>{formatCurrency(prop.price)}</span>
                          </div>
                        )}
                      {(prop.listing_type === "RENT" ||
                        prop.listing_type === "SALE_RENT") &&
                        prop.rental_price && (
                          <div className="flex items-center justify-end gap-1 text-blue-600 font-semibold mt-1">
                            <TrendingDown className="h-3.5 w-3.5" />
                            <span>{formatCurrency(prop.rental_price)}</span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon="building2"
            title={isEn ? "No property listings yet" : "ยังไม่มีรายการทรัพย์"}
            description={isEn ? "Click add property to create your first listing" : "คลิกปุ่มเพิ่มทรัพย์เพื่อสร้างรายการใหม่"}
            actionLabel={isEn ? "Add First Property" : "เพิ่มทรัพย์แรก"}
            actionHref={`/protected/properties/new?owner_id=${ownerId}`}
            actionIcon="plus"
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 px-2 lg:px-4 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">{isEn ? "Previous" : "ก่อนหน้า"}</span>
          </Button>
          <span className="text-sm text-slate-600">
            {isEn ? `Page ${currentPage} of ${totalPages}` : `หน้า ${currentPage} จาก ${totalPages}`}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-8 px-2 lg:px-4 cursor-pointer"
          >
            <span className="hidden sm:inline">{isEn ? "Next" : "ถัดไป"}</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
