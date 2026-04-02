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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
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

type PropertyWithRelations = any;

export function RecentPropertiesTable({
  properties,
}: {
  properties: PropertyWithRelations[];
}) {
  return (
    <div className="space-y-6 mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 sm:px-0">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
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
          className="w-fit rounded-full font-semibold border-slate-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
        >
          <Link href="/protected/properties">ดูทั้งหมด →</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="px-2 py-4 font-bold text-slate-700 w-[350px]">ทรัพย์</TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-700 w-[100px] text-[11px]">ชนิด</TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-700 w-[150px] text-[11px]">ทำเล</TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-700 w-[120px] text-[11px]">ราคา</TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-700 w-[90px] text-[11px]">Leads</TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-700 w-[110px] text-[11px]">Update</TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-700 w-[120px] text-[11px]">สถานะ</TableHead>
                <TableHead className="px-2 py-4 font-bold text-slate-700 w-[100px] text-[11px]">Social</TableHead>
                <TableHead className="px-2 py-4 text-right font-bold text-slate-700 pr-6 w-[120px] text-[11px]">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow
                  key={property.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="px-2 py-4">
                    <div className="flex items-start gap-4">
                      {/* Image Thumbnail with Dialog Zoom */}
                      <div className="relative h-[65px] w-[90px] shrink-0 overflow-hidden rounded-xl bg-slate-100 group/image cursor-zoom-in">
                        {property.requires_ai_review && (
                          <div className="absolute top-1 right-1 z-20 p-1 bg-white/90 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center border border-amber-200">
                             <Sparkles className="h-3 w-3 text-amber-500" />
                          </div>
                        )}
                        {(() => {
                          const coverImg = property.property_images?.find((img: any) => img.is_cover) || property.property_images?.[0];
                          const imageUrl = coverImg?.image_url;

                          return imageUrl ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="w-full h-full overflow-hidden relative">
                                  <Image
                                    src={imageUrl}
                                    alt={property.title || "Property"}
                                    fill
                                    sizes="90px"
                                    className="object-cover transition-transform duration-500 group-hover/image:scale-110"
                                  />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 flex items-center justify-center">
                                <VisuallyHidden>
                                  <DialogTitle>
                                    {property.title || "Property Image"}
                                  </DialogTitle>
                                </VisuallyHidden>
                                <div className="relative w-full h-[80vh] flex items-center justify-center bg-transparent">
                                  <Image
                                    src={imageUrl}
                                    alt={property.title || "Property Image"}
                                    fill
                                    sizes="100vw"
                                    className="object-contain shadow-2xl rounded-2xl"
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

                      <div className="flex flex-col gap-1 min-w-0">
                        <Link
                          href={`/protected/properties/${property.id}`}
                          className="block font-semibold text-slate-900 hover:text-blue-600 transition-colors text-sm leading-snug"
                        >
                          <span className="line-clamp-2 overflow-hidden w-[310px]">
                            {property.title || "ไม่ระบุชื่อ"}
                          </span>
                        </Link>
                        <span className="text-[11px] text-slate-500 line-clamp-1 opacity-90 leading-tight">
                          {property.popular_area || property.description || "-"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-50 px-1 py-0.5 rounded border border-slate-100 shrink-0">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDistanceToNow(new Date(property.created_at), { addSuffix: true, locale: th })}
                          </span>
                          {property.tenant_name && (
                            <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 max-w-[100px] truncate shrink-0" title={property.tenant_name}>
                              <Building2 className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{property.tenant_name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <PropertyTypeBadge type={property.property_type} className="h-5 text-[10px] font-bold" />
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                        {property.listing_type === "SALE" ? "ขาย" : property.listing_type === "RENT" ? "เช่า" : "ขาย/เช่า"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="font-medium text-[11px] text-slate-700 line-clamp-1">
                        {property.popular_area || property.district || "-"}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        {property.size_sqm ? <span className="shrink-0">{property.size_sqm} m²</span> : null}
                        {property.land_size_sqwah ? <span className="shrink-0">{property.land_size_sqwah} w²</span> : null}
                      </div>
                      <div className="text-[10px] text-slate-400 flex gap-1.5">
                        {property.bedrooms ? <span>{property.bedrooms}น</span> : null}
                        {property.bathrooms ? <span>{property.bathrooms}น้ำ</span> : null}
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
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                        <Users className="h-2.5 w-2.5 text-blue-500" />
                        <span>{property.leads_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Eye className="h-2.5 w-2.5" />
                        <span>{property.view_count || 0}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <div className="text-[11px] text-slate-500 line-clamp-1 opacity-80 max-w-[80px] truncate" title={new Date(property.updated_at).toLocaleString("th-TH")}>
                      {formatDistanceToNow(new Date(property.updated_at), { addSuffix: true, locale: th })}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <PropertyStatusSelect
                      id={property.id}
                      value={property.status as PropertyStatus}
                      className="h-7 w-full max-w-[120px] text-[11px] px-2 font-bold"
                    />
                  </TableCell>
                  <TableCell className="px-2 py-4">
                    <SocialStatusBadges
                      facebookAt={property.posted_to_facebook_at}
                      instagramAt={property.posted_to_instagram_at}
                      lineAt={property.posted_to_line_at}
                      tiktokAt={property.posted_to_tiktok_at}
                    />
                  </TableCell>
                  <TableCell className="px-2 py-4 text-right pr-6">
                    <div className="flex justify-end items-center gap-0.5">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Link href={`/protected/properties/${property.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>

                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                      >
                        <Link href={`/protected/properties/${property.id}/edit`}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>
                      </Button>

                      <DuplicatePropertyButton
                        id={property.id}
                        className="h-7 w-7 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                      />

                      <PropertyRowActions 
                        id={property.id} 
                        title={property.title} 
                        className="h-7 w-7 text-slate-400 hover:bg-slate-100 rounded-lg"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile & Tablet Premium Card View */}
        <div className="lg:hidden p-3 min-[400px]:p-4 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {properties.map((property) => (
              <div
                key={property.id}
                className="relative group bg-white rounded-2xl border border-slate-200 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden flex flex-col"
              >
                {/* Actions Button Overlay */}
                <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5">
                  <div className="p-1 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm">
                    <PropertyRowActions
                      id={property.id}
                      title={property.title}
                    />
                  </div>
                </div>

                <Link
                  href={`/protected/properties/${property.id}`}
                  className="block relative aspect-16/10 overflow-hidden"
                >
                  {property.requires_ai_review && (
                    <div className="absolute top-2.5 left-2.5 z-30 p-1.5 bg-white/90 backdrop-blur-sm shadow-md rounded-full flex items-center justify-center border border-amber-200">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                  )}
                  {(() => {
                    const coverImg = property.property_images?.find((img: any) => img.is_cover) || property.property_images?.[0];
                    const imageUrl = coverImg?.image_url;

                    return imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={property.title || "Property"}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-slate-100">
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      </div>
                    );
                  })()}

                  {/* Status Badges Overlay */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <PropertyTypeBadge
                        type={property.property_type}
                        className="h-5 text-[10px] px-2 bg-white/95 backdrop-blur-sm shadow-sm border-none font-bold"
                      />
                    </div>
                    <PropertyStatusBadge
                      status={property.status}
                      className="h-5 text-[10px] px-2 font-bold shadow-md backdrop-blur-sm"
                    />
                  </div>
                </Link>

                {/* Property Details */}
                <div className="p-3 min-[400px]:p-4 space-y-3 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <Link
                      href={`/protected/properties/${property.id}`}
                      className="font-bold text-slate-900 text-sm min-[400px]:text-base leading-snug line-clamp-1 hover:text-blue-600 transition-colors"
                    >
                      {property.title || "ไม่ระบุชื่อ"}
                    </Link>
                    <div className="flex items-center gap-1 text-[10px] min-[400px]:text-xs text-slate-500 font-medium">
                      <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {property.popular_area || property.district || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="py-2 border-y border-slate-100">
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
                  <div className="flex flex-col gap-2.5 pt-0.5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] min-[400px]:text-[11px] font-bold text-slate-600">
                        <Users className="h-3 w-3 text-blue-500" />
                        {property.leads_count || 0}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] min-[400px]:text-[11px] font-bold text-slate-600">
                        <Eye className="h-3 w-3 text-slate-400" />
                        {property.view_count || 0}
                      </div>

                      <SocialStatusBadges
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
                      className="h-8 w-full text-[10px] min-[400px]:text-[11px] font-bold shadow-xs transition-shadow hover:shadow-md border-slate-200 rounded-lg bg-white"
                    />

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mt-auto">
                      <span className="text-[10px] text-slate-400 font-bold tracking-tight lowercase">
                        {formatDistanceToNow(new Date(property.updated_at), { addSuffix: true, locale: th })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {properties.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                  <div className="p-4 bg-slate-50 rounded-full">
                    <Building2 className="h-10 w-10 text-slate-300" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-900">ยังไม่มีทรัพย์ในระบบ</p>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      เริ่มสร้างทรัพย์รายการแรกของคุณวันนี้เพื่อจัดการข้อมูลทรัพย์สิน
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="mt-2 rounded-xl bg-blue-600 font-bold shadow-md h-10 px-6"
                  >
                    <Link href="/protected/properties/new">เพิ่มทรัพย์ใหม่</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
