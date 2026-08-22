"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  ImageIcon,
  Eye,
  Edit3,
  Users,
  Clock,
  Building2,
  Sparkles,
  Loader2,
  Search,
  Home,
  User,
} from "lucide-react";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNowThai } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PropertyStatusBadge } from "@/components/properties/PropertyStatusBadge";
import { PropertyTypeBadge } from "@/components/properties/PropertyTypeBadge";
import { PropertyPrice } from "@/components/properties/PropertyPrice";
import { PropertyRowActions } from "@/components/properties/PropertyRowActions";
import { DuplicatePropertyButton } from "@/components/properties/DuplicatePropertyButton";
import { PropertyStatusSelect } from "@/components/properties/PropertyStatusDropdown";
import { SocialStatusBadges } from "@/components/properties/SocialStatusBadges";
import { PropertyStatus } from "@/features/properties/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { PropertyTableData } from "@/features/properties/types";
import { useLanguage } from "@/components/providers/LanguageProvider";

// Using PropertyTableData as the base type for consistency
export type PropertyWithRelations = PropertyTableData & {
  images?: { url?: string; image_url?: string }[] | null;
  province?: string | null;
};

export function RecentPropertiesTable({
  properties,
  showBranch = false,
  isAdminOrManager = false,
}: {
  properties: PropertyWithRelations[];
  showBranch?: boolean;
  isAdminOrManager?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { language } = useLanguage();
  const isEn = language === "en";
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const view = searchParams.get("view") || (isAdminOrManager ? "company" : "personal");

  const handleViewChange = (newView: string) => {
    if (typeof window !== "undefined" && window.location.pathname !== "/protected") {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    
    <div className="space-y-6 mt-8 bg-linear-to-br from-white via-slate-50 to-slate-100  p-4  rounded-3xl border border-slate-200/60 shadow-sm">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <Building2 size={20} className="text-white" />
            </div>
            {isEn ? "Recent Listings" : "ทรัพย์มาใหม่"}
            <span className="text-slate-400 font-semibold text-sm hidden xs:inline mt-0.5">
              ({isEn ? "Properties" : "Recent Listings"})
            </span>
          </h3>
          <p className="text-sm text-slate-500 font-medium pl-12">
            {isEn ? "Latest properties added to your CRM inventory" : "รายการทรัพย์ล่าสุดที่ถูกเพิ่มเข้ามาในระบบ"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
          {/* Segmented Control for ADMIN/MANAGER */}
          {isAdminOrManager && (
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/40">
              <button
                onClick={() => handleViewChange("company")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  view === "company"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Building2 size={13} />
                {isEn ? "All Company" : "ทั้งหมด"}
              </button>
              <button
                onClick={() => handleViewChange("personal")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  view === "personal"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <User size={13} />
                {isEn ? "My Listings" : "เฉพาะของฉัน"}
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-xl font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm h-10 px-5"
            onClick={() => {
              setNavigatingId("view-all");
              router.push("/protected/properties");
            }}
            disabled={navigatingId === "view-all"}
          >
            {navigatingId === "view-all" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-slate-500" />
            ) : null}
            {isEn ? "View All →" : "ดูทั้งหมด →"}
          </Button>
        </div>
      </div>

      {/* 2. Table Container - ปรับขอบโค้งมนและใส่สีพื้นหลังขาว */}
      <div className="rounded-3xl border border-slate-200/60 overflow-hidden bg-white shadow-sm">
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              {/* 3. ปรับ Background ของ Table Header ให้ชัดเจนขึ้น */}
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200/60">
                <TableHead className="px-4 py-4 font-bold text-slate-600 w-[350px]">
                  {isEn ? "Property" : "ทรัพย์"}
                </TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-600 w-[100px] text-xs">
                  {isEn ? "Type" : "ชนิด"}
                </TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-600 w-[150px] text-xs">
                  {isEn ? "Location" : "ทำเล"}
                </TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-600 w-[120px] text-xs">
                  {isEn ? "Price" : "ราคา"}
                </TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-600 w-[90px] text-xs">
                  {isEn ? "Views" : "การเข้าชม"}
                </TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-600 w-[110px] text-xs">
                  {isEn ? "Last Updated" : "อัปเดตล่าสุด"}
                </TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-600 w-[120px] text-xs">
                  {isEn ? "Status" : "สถานะ"}
                </TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-600 w-[100px] text-xs">
                  {isEn ? "Social" : "โซเชียล"}
                </TableHead>
                {showBranch && (
                  <TableHead className="px-2 py-4 font-bold text-slate-600 w-[100px] text-xs">
                    {isEn ? "Branch" : "สาขา"}
                  </TableHead>
                )}
                <TableHead className="px-4 py-4 text-right font-bold text-slate-600 w-[120px] text-xs">
                  {isEn ? "Actions" : "จัดการ"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow
                  key={property.id}
                  className="group hover:bg-slate-50/40 transition-colors border-b border-slate-100 last:border-0"
                >
                  <TableCell className="px-4 py-4">
                    <div className="flex items-start gap-4">
                      {/* Image Thumbnail with Dialog Zoom */}
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 group/image cursor-zoom-in border border-slate-100">
                        {property.requires_ai_review && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="absolute top-1 right-1 z-20 p-1 bg-white/95 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center border border-amber-200 cursor-help">
                                <Sparkles className="h-3 w-3 text-amber-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-amber-900 text-white border-amber-800">
                              <p className="font-bold">Requires AI Review</p>
                              <p className="text-[10px] opacity-80">รายการนี้ต้องการการตรวจสอบความถูกต้องโดย AI</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {(() => {
                          const imageUrl =
                            property.image_url ||
                            (Array.isArray(property.images) &&
                              (property.images as any[])[0]?.url) ||
                            (Array.isArray(property.images) &&
                              (property.images as any[])[0]?.image_url);

                          return imageUrl ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="w-full h-full overflow-hidden relative" aria-label={`ดูรูปภาพ ${property.title}`}>
                                  <Image
                                    src={imageUrl}
                                    alt={property.title || "Property"}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 96px"
                                    className="object-cover transition-transform duration-500 group-hover/image:scale-110"
                                  />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
                                <VisuallyHidden>
                                  <DialogTitle>
                                    {property.title || "Property Image"}
                                  </DialogTitle>
                                  <DialogDescription>
                                    การแสดงผลรูปภาพทรัพย์สินแบบขยายใหญ่
                                  </DialogDescription>
                                </VisuallyHidden>
                                <div className="relative w-full h-[80vh] flex items-center justify-center bg-transparent">
                                  <Image
                                    src={imageUrl}
                                    alt={property.title || "Property Image"}
                                    fill
                                    sizes="100vw"
                                    className="object-contain shadow-2xl rounded-3xl"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-50">
                              <ImageIcon className="h-6 w-6 text-slate-300" />
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex flex-col gap-1 min-w-0 py-0.5">
                        <div
                          onClick={() => {
                            setNavigatingId(property.id);
                            router.push(`/protected/properties/${property.id}`);
                          }}
                          className="block font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm leading-snug cursor-pointer relative"
                        >
                          {navigatingId === property.id && (
                            <div className="absolute -left-6 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            </div>
                          )}
                          <span className="line-clamp-2 overflow-hidden w-[300px]">
                            {property.title || "ไม่ระบุชื่อ"}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium line-clamp-1 opacity-90">
                          {[property.popular_area, property.province]
                            .filter(Boolean)
                            .join(" • ") ||
                            property.description ||
                            "-"}
                        </span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100 shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNowThai(property.created_at)}
                          </span>
                          {property.tenant_name && (
                            <span
                              className="text-[11px] text-indigo-700 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 max-w-[120px] shrink-0"
                              title={property.tenant_name}
                            >
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {property.tenant_name}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <PropertyTypeBadge
                        type={property.property_type}
                        className="h-6 text-[11px] font-bold px-2.5"
                      />
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {property.listing_type === "SALE"
                          ? "ขาย"
                          : property.listing_type === "RENT"
                            ? "เช่า"
                            : "ขาย/เช่า"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="font-semibold text-xs text-slate-800 line-clamp-1">
                        {[property.popular_area, property.district]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </div>
                      <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
                        {property.size_sqm ? (
                          <span className="shrink-0 bg-slate-50 px-1 rounded">
                            {property.size_sqm} m²
                          </span>
                        ) : null}
                        {property.land_size_sqwah ? (
                          <span className="shrink-0 bg-slate-50 px-1 rounded">
                            {property.land_size_sqwah} w²
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 flex gap-2">
                        {property.bedrooms ? (
                          <span className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/>{property.bedrooms}น</span>
                        ) : null}
                        {property.bathrooms ? (
                          <span className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"/>{property.bathrooms}น้ำ</span>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <PropertyPrice
                      variant="table"
                      listingType={property.listing_type}
                      price={property.price}
                      originalPrice={property.original_price}
                      rentalPrice={property.rental_price}
                      originalRentalPrice={property.original_rental_price}
                    />
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <div className="flex flex-col gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 w-fit">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-help">
                            <Users className="h-3 w-3 text-blue-500" />
                            <span>{property.leads_count || 0}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">จำนวนลีดที่สนใจทรัพย์นี้</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 cursor-help">
                            <Eye className="h-3 w-3" />
                            <span>{property.view_count || 0}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">จำนวนการเข้าชมทั้งหมด</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <div
                      className="text-xs font-medium text-slate-500 line-clamp-1 max-w-[80px] truncate"
                      title={new Date(property.updated_at).toLocaleString("th-TH")}
                    >
                      {formatDistanceToNowThai(property.updated_at)}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <PropertyStatusSelect
                      id={property.id}
                      value={property.status as PropertyStatus}
                      className="h-8 w-full max-w-[130px] text-xs px-3 font-bold bg-white shadow-sm"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <SocialStatusBadges
                      propertyId={property.id}
                      propertyTitle={property.title}
                      facebookAt={property.posted_to_facebook_at}
                      instagramAt={property.posted_to_instagram_at}
                      lineAt={property.posted_to_line_at}
                      tiktokAt={property.posted_to_tiktok_at}
                    />
                  </TableCell>
                  {showBranch && (
                    <TableCell className="px-2 py-4">
                      <span
                        className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 line-clamp-1 max-w-[100px]"
                        title={property.tenant_name || ""}
                      >
                        {property.tenant_name || "N/A"}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="px-4 py-4 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="ดูรายละเอียด"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        onClick={() => {
                          setNavigatingId(`eye-${property.id}`);
                          router.push(`/protected/properties/${property.id}`);
                        }}
                        disabled={navigatingId === `eye-${property.id}`}
                      >
                        {navigatingId === `eye-${property.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="แก้ไข"
                        className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                        onClick={() => {
                          setNavigatingId(`edit-${property.id}`);
                          router.push(
                            `/protected/properties/${property.id}/edit`,
                          );
                        }}
                        disabled={navigatingId === `edit-${property.id}`}
                      >
                        {navigatingId === `edit-${property.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                        ) : (
                          <Edit3 className="h-4 w-4" />
                        )}
                      </Button>

                      <DuplicatePropertyButton
                        id={property.id}
                        title={property.title}
                        className="h-8 w-8 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                      />

                      <PropertyRowActions
                        id={property.id}
                        slug={property.slug}
                        title={property.title}
                        status={property.status}
                        className="h-8 w-8 text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile & Tablet Premium Card View */}
        <div className="lg:hidden p-4 sm:p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="relative group bg-white rounded-3xl border border-slate-200/80 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col"
              >
                {/* Actions Button Overlay */}
                <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5">
                  <div className="p-1 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-sm">
                    <PropertyRowActions
                      id={property.id}
                      slug={property.slug}
                      title={property.title}
                      status={property.status}
                    />
                  </div>
                </div>

                <div
                  onClick={() => {
                    setNavigatingId(`m-img-${property.id}`);
                    router.push(`/protected/properties/${property.id}`);
                  }}
                  className="block relative aspect-16/10 overflow-hidden cursor-pointer bg-slate-100"
                >
                  {navigatingId === `m-img-${property.id}` && (
                    <div className="absolute inset-0 z-40 bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <div className="p-3 bg-white rounded-full shadow-lg">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      </div>
                    </div>
                  )}
                  {property.requires_ai_review && (
                    <div className="absolute top-3 left-3 z-30 p-1.5 bg-white/95 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center border border-amber-200">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                  )}
                  {(() => {
                    const imageUrl =
                      property.image_url ||
                      (Array.isArray(property.images) && (property.images as any[])[0]?.url) ||
                      (Array.isArray(property.images) &&
                        (property.images as any[])[0]?.image_url);

                    return imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={property.title || "Property"}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      </div>
                    );
                  })()}

                  {/* Status Badges Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <PropertyTypeBadge
                        type={property.property_type}
                        className="h-6 text-[11px] px-2.5 bg-white/95 backdrop-blur-md shadow-sm border-none font-bold"
                      />
                    </div>
                    <PropertyStatusBadge
                      status={property.status}
                      className="h-6 text-[11px] px-2.5 font-bold shadow-md backdrop-blur-md border-none"
                    />
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col">
                  <div className="space-y-1.5">
                    <div
                      onClick={() => {
                        setNavigatingId(`m-title-${property.id}`);
                        router.push(`/protected/properties/${property.id}`);
                      }}
                      className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer relative"
                    >
                      {property.title || "ไม่ระบุชื่อ"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 w-fit px-2 py-1 rounded-md">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {[property.popular_area, property.province]
                          .filter(Boolean)
                          .join(" • ") ||
                          property.district ||
                          "-"}
                      </span>
                    </div>
                  </div>

                  <div className="py-3 border-y border-slate-100">
                    <PropertyPrice
                      variant="card"
                      listingType={property.listing_type}
                      price={property.price}
                      originalPrice={property.original_price}
                      rentalPrice={property.rental_price}
                      originalRentalPrice={property.original_rental_price}
                    />
                  </div>

                  {/* Meta Stats & Social */}
                  <div className="flex flex-col gap-3 pt-1">
                    <div className="flex items-center gap-4 bg-slate-50/50 p-2 rounded-xl">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Users className="h-3.5 w-3.5 text-blue-500" />
                        {property.leads_count || 0}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <Eye className="h-3.5 w-3.5 text-slate-400" />
                        {property.view_count || 0}
                      </div>
                      <SocialStatusBadges
                        propertyId={property.id}
                        propertyTitle={property.title}
                        facebookAt={property.posted_to_facebook_at}
                        instagramAt={property.posted_to_instagram_at}
                        lineAt={property.posted_to_line_at}
                        tiktokAt={property.posted_to_tiktok_at}
                        className="ml-auto"
                      />
                    </div>

                    <PropertyStatusSelect
                      id={property.id}
                      value={property.status as PropertyStatus}
                      className="h-10 w-full text-xs font-bold shadow-sm transition-shadow hover:shadow-md border-slate-200 rounded-xl bg-white"
                    />

                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-auto">
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNowThai(property.updated_at)}
                      </span>
                      {showBranch && (
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 truncate max-w-[100px]">
                          {property.tenant_name || "N/A"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {properties.length === 0 && (
              <div className="col-span-full">
                <DashboardEmptyState
                  icon={Home}
                  title={isEn ? "No Properties Listed Yet" : "ยังไม่มีทรัพย์ในระบบ"}
                  description={isEn ? "Add your first property listing to begin managing your real estate portfolio." : "เริ่มสร้างทรัพย์รายการแรกของคุณวันนี้ เพื่อเริ่มต้นการจัดการข้อมูลทรัพย์สินอย่างเป็นระบบ"}
                  action={
                    <Button
                      className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-md h-11 px-8 transition-all"
                      onClick={() => {
                        setNavigatingId("new-prop");
                        router.push("/protected/properties/new");
                      }}
                      disabled={navigatingId === "new-prop"}
                    >
                      {navigatingId === "new-prop" && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      {isEn ? "Create First Property" : "เพิ่มทรัพย์รายการแรก"}
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}