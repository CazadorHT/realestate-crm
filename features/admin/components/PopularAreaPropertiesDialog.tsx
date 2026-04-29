"use client";

import { useEffect, useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { searchPropertiesAction } from "@/features/leads/actions";
import { Building2, ExternalLink, MapPin, Tag, Key, Repeat, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface PopularAreaPropertiesDialogProps {
  area: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PropertyListItem {
  id: string;
  title: string;
  price: number | null;
  original_price: number | null;
  rental_price: number | null;
  original_rental_price: number | null;
  listing_type: string | null;
  property_type: string | null;
  cover_image_url: string | null;
  province: string | null;
  district: string | null;
  status: string | null;
}

export function PopularAreaPropertiesDialog({
  area,
  open,
  onOpenChange,
}: PopularAreaPropertiesDialogProps) {
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && area) {
      const fetchProperties = async () => {
        setIsLoading(true);
        try {
          const result = await searchPropertiesAction({
            popular_area: area.name,
          });

          if (result && "data" in result && result.data?.properties) {
            setProperties(result.data.properties as PropertyListItem[]);
          }
        } catch (error) {
          console.error("Failed to fetch properties for area:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProperties();
    } else if (!open) {
      // Small delay before clearing to avoid flash during close animation
      setTimeout(() => setProperties([]), 300);
    }
  }, [open, area]);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={area?.name ? `ทรัพย์ในทำเล: ${area.name}` : "รายการทรัพย์"}
      description="รายการอสังหาริมทรัพย์ทั้งหมดที่อยู่ในพื้นที่ยอดนิยมนี้"
      className="max-w-3xl"
    >
      <div className="py-2">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 p-3 space-y-3">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
              <Building2 className="h-10 w-10 text-slate-300" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-lg">ไม่พบข้อมูลทรัพย์</p>
              <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                ยังไม่มีการผูกทรัพย์ใดๆ เข้ากับทำเลนื้ในระบบ
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[70vh] px-4 pb-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="group relative rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col bg-white"
                >
                  {/* Image Section */}
                  <div className="relative h-44 overflow-hidden bg-slate-100">
                    {property.cover_image_url ? (
                      <Image
                        src={property.cover_image_url}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, 350px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Building2 className="h-12 w-12 text-slate-200" />
                      </div>
                    )}
                    
                    {/* Badge Overlay */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <ListingTypeBadge type={property.listing_type} />
                      <StatusBadge status={property.status} />
                    </div>

                    {/* Quick Link Button */}
                    <Link
                      href={`/protected/properties/${property.id}`}
                      target="_blank"
                      className="absolute bottom-3 right-3 h-9 w-9 bg-white shadow-lg rounded-full flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-blue-600 hover:text-white"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Content Section */}
                  <Link 
                    href={`/protected/properties/${property.id}`}
                    target="_blank"
                    className="p-4 flex flex-col flex-1"
                  >
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2 leading-relaxed h-10 group-hover:text-blue-600 transition-colors">
                      {property.title}
                    </h3>
                    
                    <div className="mt-2 flex items-center text-[11px] text-slate-500 gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {property.district || "-"}, {property.province || "-"}
                      </span>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                      <PriceDisplay
                        price={property.price}
                        originalPrice={property.original_price}
                        rentalPrice={property.rental_price}
                        originalRentalPrice={property.original_rental_price}
                        listingType={property.listing_type}
                      />
                      <div className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        ดูรายละเอียด
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}

function ListingTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;

  const config: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; class: string }> = {
    SALE: { label: "ขาย", icon: Tag, class: "bg-blue-600 text-white" },
    RENT: { label: "เช่า", icon: Key, class: "bg-emerald-600 text-white" },
    SALE_RENT: { label: "ขาย/เช่า", icon: Repeat, class: "bg-indigo-600 text-white" },
    SALE_AND_RENT: { label: "ขาย/เช่า", icon: Repeat, class: "bg-indigo-600 text-white" },
  };

  const item = config[type] || { label: type, icon: Building2, class: "bg-slate-600 text-white" };
  const Icon = item.icon;

  return (
    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm", item.class)}>
      <Icon className="h-3 w-3" />
      <span>{item.label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const config: Record<string, { label: string; class: string }> = {
    ACTIVE: { label: "ว่าง", class: "bg-emerald-500/90 text-white" },
    RESERVED: { label: "จองแล้ว", class: "bg-amber-500/90 text-white" },
    UNDER_OFFER: { label: "มัดจำ", class: "bg-amber-500/90 text-white" },
    SOLD: { label: "ขายแล้ว", class: "bg-slate-500/90 text-white" },
    RENTED: { label: "เช่าแล้ว", class: "bg-slate-500/90 text-white" },
    INACTIVE: { label: "ระงับ", class: "bg-slate-400 text-white" },
  };

  const item = config[status] || { label: status, class: "bg-slate-200 text-slate-800" };

  return (
    <Badge variant="outline" className={cn("border-transparent text-[10px] font-bold py-0 h-5 shadow-xs", item.class)}>
      {item.label}
    </Badge>
  );
}

function PriceDisplay({
  price,
  originalPrice,
  rentalPrice,
  originalRentalPrice,
  listingType,
}: {
  price: number | null;
  originalPrice: number | null;
  rentalPrice: number | null;
  originalRentalPrice: number | null;
  listingType: string | null;
}) {
  const format = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "-";
    return new Intl.NumberFormat("th-TH").format(Number(val));
  };

  const isRent = listingType === "RENT" || listingType === "SALE_RENT" || listingType === "SALE_AND_RENT";
  const isSale = listingType === "SALE" || listingType === "SALE_RENT" || listingType === "SALE_AND_RENT";

  const isValid = (v: number | null | undefined) => v !== null && v !== undefined && !isNaN(Number(v));

  const hasSalePrice = isValid(price) || isValid(originalPrice);
  const hasRentPrice = isValid(rentalPrice) || isValid(originalRentalPrice);

  return (
    <div className="flex flex-col gap-0.5">
      {isSale && hasSalePrice && (
        <div className="flex flex-col">
          {originalPrice !== null && price !== null && originalPrice > price && (
            <span className="text-[10px] text-slate-400 line-through leading-none mb-0.5">
              ฿{format(originalPrice)}
            </span>
          )}
          <span className="text-sm font-bold text-slate-900 leading-none">
            ฿{format(price ?? originalPrice)}
          </span>
        </div>
      )}
      {isRent && hasRentPrice && (
        <div className="flex flex-col">
          {originalRentalPrice !== null && rentalPrice !== null && originalRentalPrice > rentalPrice && (
            <span className="text-[10px] text-slate-400 line-through leading-none mb-0.5">
              ฿{format(originalRentalPrice)}
            </span>
          )}
          <span className="text-sm font-bold text-emerald-600 leading-none">
            ฿{format(rentalPrice ?? originalRentalPrice)}
            <span className="text-[10px] ml-0.5">/ด</span>
          </span>
        </div>
      )}
      {((isSale && !hasSalePrice) || (isRent && !hasRentPrice) || (!isSale && !isRent)) && (
        <span className="text-xs font-semibold text-slate-400 italic">
          สอบถามราคา
        </span>
      )}
    </div>
  );
}
