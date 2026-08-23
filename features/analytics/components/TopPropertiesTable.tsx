"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Eye, ArrowUpRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { listingTypeLabel } from "@/features/properties/labels";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { PropertyAnalytics } from "@/features/dashboard/queries";
import { useLanguage } from "@/lib/i18n/language-context";

interface TopPropertiesTableProps {
  topProperties: PropertyAnalytics[];
  topPropertiesCount: number;
  page: number;
  pageSize: number;
}

export function TopPropertiesTable({
  topProperties,
  topPropertiesCount,
  page,
  pageSize,
}: TopPropertiesTableProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentSort = searchParams.get("sortBy") || "views_desc";

  const handleSort = () => {
    const params = new URLSearchParams(searchParams);
    const nextSort = currentSort === "views_desc" ? "views_asc" : "views_desc";
    params.set("sortBy", nextSort);
    // Reset to page 1 when sorting to avoid pagination mismatch
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}#table`, { scroll: false });
  };

  return (
    <Card id="table" className="border-none shadow-soft overflow-hidden flex flex-col bg-white">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">
              {isEn ? "Top Viewed Properties" : "อันดับทรัพย์ที่มีการเข้าชมสูงสุด"}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm text-slate-500">
              {isEn ? "Performance analytics by property listing" : "วิเคราะห์ผลตอบรับรายทรัพย์สิน (Performance by Property)"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSort}
            className="flex items-center gap-2 self-start sm:self-auto h-9 bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-all rounded-lg shadow-sm"
          >
            <span className="text-xs font-bold">
              {isEn 
                ? `Sort by views: ${currentSort === "views_desc" ? "High ➔ Low" : "Low ➔ High"}`
                : `เรียงตามวิว: ${currentSort === "views_desc" ? "มาก ➔ น้อย" : "น้อย ➔ มาก"}`}
            </span>
            {currentSort === "views_desc" ? (
              <ArrowDown className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5 text-blue-500" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          {/* Mobile View (Card List) */}
          <div className="xl:hidden divide-y divide-slate-100">
            {topProperties.map((prop: PropertyAnalytics) => {
              const coverImage = prop.property_images?.find((img) => img.is_cover)?.image_url || prop.property_images?.[0]?.image_url;
              
              return (
                <div key={prop.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col gap-3">
                  <div className="flex gap-4">
                    <div className="relative h-16 w-20 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-sm">
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={prop.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Building2 className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <Link 
                            href={`/protected/properties/${prop.id}`}
                            className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors"
                          >
                            {prop.title}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
                            ID: {prop.id.slice(0, 8)}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap border",
                            prop.listing_type === "SALE"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : prop.listing_type === "RENT"
                                ? "bg-green-50 text-green-600 border-green-100"
                                : "bg-amber-50 text-amber-600 border-amber-100",
                          )}
                        >
                          {listingTypeLabel(prop.listing_type, isEn ? "en" : "th")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-sm font-bold text-slate-900">
                            {prop.view_count.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Views</span>
                        </div>
                        <Link
                          href={`/protected/properties/${prop.id}`}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-all"
                        >
                          {isEn ? "Manage" : "จัดการ"} <ArrowUpRight className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {topProperties.length === 0 && (
              <div className="px-6 py-10 text-center text-slate-400 text-sm italic">
                {isEn ? "— No page views recorded in the system yet —" : "— ยังไม่มีข้อมูลการเข้าชมในระบบขณะนี้ —"}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <table className="hidden xl:table w-full text-sm text-left">
            <thead className="text-[10px] md:text-xs text-slate-500 uppercase bg-slate-50/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-4 md:px-6 py-3 md:py-4 font-bold whitespace-nowrap">
                  {isEn ? "Image" : "รูปภาพ"}
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 font-bold whitespace-nowrap">
                  {isEn ? "Property" : "ทรัพย์สิน"}
                </th>
                <th className="hidden md:table-cell px-6 py-4 font-bold">
                  {isEn ? "Type" : "ประเภท"}
                </th>
                <th 
                  onClick={handleSort}
                  className="px-4 md:px-6 py-3 md:py-4 font-bold text-right cursor-pointer select-none hover:text-blue-600 transition-colors group/th"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{isEn ? "Views" : "จำนวนวิว"}</span>
                    {currentSort === "views_desc" ? (
                      <ArrowDown className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : currentSort === "views_asc" ? (
                      <ArrowUp className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 text-slate-300 opacity-0 group-hover/th:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                </th>
                <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-right">
                  {isEn ? "Action" : "จัดการ"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProperties.map((prop: PropertyAnalytics) => {
                const coverImage = prop.property_images?.find((img) => img.is_cover)?.image_url || prop.property_images?.[0]?.image_url;

                return (
                  <tr
                    key={prop.id}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-sm transition-transform group-hover:scale-105">
                        {coverImage ? (
                          <Image
                            src={coverImage}
                            alt={prop.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Building2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex flex-col min-w-[150px] max-w-[250px]">
                        <span className="font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {prop.title}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                          {prop.id.slice(0, 8)}
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border",
                          prop.listing_type === "SALE"
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : prop.listing_type === "RENT"
                              ? "bg-green-50 text-green-600 border-green-100"
                              : "bg-amber-50 text-amber-600 border-amber-100",
                        )}
                      >
                        {listingTypeLabel(prop.listing_type, isEn ? "en" : "th")}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="font-bold text-slate-900 text-base">
                          {prop.view_count.toLocaleString()}
                        </span>
                        <div className="h-5 w-px bg-slate-100 mx-1 hidden md:block" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase hidden md:inline">Views</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                      <Link
                        href={`/protected/properties/${prop.id}`}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs md:text-sm whitespace-nowrap bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1"
                      >
                        {isEn ? "Edit" : "แก้ไข"} <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {topProperties.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-400 italic"
                  >
                    {isEn ? "— No page views recorded in the system yet —" : "— ยังไม่มีข้อมูลการเข้าชมในระบบขณะนี้ —"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Standardized Pagination Controls */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <PaginationControls
            totalCount={topPropertiesCount}
            pageSize={pageSize}
            currentPage={page}
          />
        </div>
      </CardContent>
    </Card>
  );
}

