"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown, Building2, Search, X, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";

import { searchPropertiesAction } from "@/features/leads/actions";

export type PropertyPickItem = {
  id: string;
  title: string;
  price: number | null;
  original_price: number | null;
  rental_price: number | null;
  original_rental_price: number | null;
  listing_type: string | null;
  cover_image_url: string | null;
  province: string | null;
  district: string | null;
  popular_area: string | null;
};

type Props = {
  value: string | null;
  onChange: (value: string | null, picked?: PropertyPickItem | null) => void;
  placeholder?: string;
  className?: string;
  initialProperty?: {
    id: string;
    title: string;
    cover_image_url?: string | null;
    [key: string]: any;
  } | null;
};

function ListingTypeBadge({ type }: { type: string | null }) {
  const config = {
    RENT: { label: "เช่า", className: "bg-blue-600 text-white" },
    SALE: { label: "ขาย", className: "bg-emerald-600 text-white" },
    SALE_RENT: { label: "ขาย/เช่า", className: "bg-amber-500 text-white" },
    SALE_AND_RENT: { label: "ขาย/เช่า", className: "bg-amber-500 text-white" },
  } as const;

  const matched = type ? (config as any)[type] : null;
  if (!matched) return null;

  return (
    <span className={cn(
      "text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide shadow-sm",
      matched.className
    )}>
      {matched.label}
    </span>
  );
}

function PriceDisplay({ item }: { item: PropertyPickItem }) {
  const isSaleRent = item.listing_type === "SALE_RENT" || item.listing_type === "SALE_AND_RENT";
  const isRent = item.listing_type === "RENT";
  const isSale = item.listing_type === "SALE";

  const rentalPrice = item.rental_price ?? item.original_rental_price;
  const salePrice = item.price ?? item.original_price;

  if (isSaleRent) {
    return (
      <div className="flex flex-col gap-1">
        {salePrice ? (
          <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 w-fit">
            <span className="text-[11px] font-semibold">฿{salePrice.toLocaleString()}</span>
          </div>
        ) : null}
        {rentalPrice ? (
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100 w-fit">
            <span className="text-[11px] font-semibold">
              ฿{rentalPrice.toLocaleString()}
              <span className="font-normal text-[9px] opacity-70 ml-0.5">/ด.</span>
            </span>
          </div>
        ) : null}
      </div>
    );
  }
  if (isRent && rentalPrice) {
    return (
      <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
        <span className="text-sm font-semibold">
          ฿{rentalPrice.toLocaleString()}
          <span className="text-[10px] font-normal opacity-70 ml-0.5">/ด.</span>
        </span>
      </div>
    );
  }
  if (isSale && salePrice) {
    return (
      <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100 shadow-sm">
        <span className="text-sm font-black">
          ฿{salePrice.toLocaleString()}
        </span>
      </div>
    );
  }
  return <span className="text-xs text-slate-300 italic px-1">ไม่ระบุราคา</span>;
}

export function PropertyCombobox({
  value,
  onChange,
  placeholder = "เลือกทรัพย์...",
  className,
  initialProperty,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<PropertyPickItem[]>([]);
  const [q, setQ] = useState("");

  const selected = useMemo(() => {
    if (initialProperty && initialProperty.id === value) return initialProperty;
    return items.find((x) => x.id === value) ?? null;
  }, [items, value, initialProperty]);

  // Debounced search when query changes
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await searchPropertiesAction({ q });
        if (res.success) setItems(res.data || []);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [open, q, startTransition]);

  // Load fresh list when dialog opens
  useEffect(() => {
    if (!open) return;
    setQ("");
    startTransition(async () => {
      const res = await searchPropertiesAction({ q: "" });
      if (res.success) setItems(res.data || []);
    });
  }, [open, startTransition]);

  const handleSelect = (item: PropertyPickItem) => {
    onChange(item.id, item);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  // --- Trigger Button ---
  const trigger = (
    <button
      type="button"
      className={cn(
        "w-full  flex items-center gap-3 text-left rounded-xl border px-3 py-2.5 transition-all duration-200 shadow-sm group",
        "hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-md",
        selected
          ? "border-blue-200 bg-blue-50/30 "
          : "border-slate-200 bg-white",
        className,
      )}
    >
      {/* Thumbnail */}
      <div className={cn(
        "shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center transition-all",
        selected ? "h-10 w-10 sm:h-12 sm:w-12" : "h-9 w-9"
      )}>
        {selected?.cover_image_url ? (
          <img
            src={selected.cover_image_url}
            alt={selected.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <Building2 className="h-4 w-4 text-slate-300" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 pr-2 overflow-hidden">
        {selected ? (
          <>
            <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-tight wrap-break-words ">
              {selected.title}
            </p>
            <div className="flex items-center gap-1.5 mt-1 min-w-0">
              <div className="shrink-0">
                <ListingTypeBadge type={selected.listing_type} />
              </div>
              {(selected.popular_area || selected.district) && (
                <span className="text-[10px] sm:text-xs text-slate-400 truncate flex-1 min-w-0 flex items-center gap-0.5 opacity-80">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{selected.popular_area || selected.district}</span>
                </span>
              )}
            </div>
          </>
        ) : (
          <span className="text-slate-400 text-sm font-normal">{placeholder}</span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 shrink-0">
        {selected ? (
          <span
            role="button"
            onClick={handleClear}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <ChevronsUpDown className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </button>
  );

  // --- Dialog Content ---
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="เลือกทรัพย์"
      description="ค้นหาและเลือกทรัพย์ที่ต้องการสร้างดีล"
      className="sm:max-w-[860px]"
      trigger={trigger}
    >
      <div className="flex flex-col h-[60vh]">
        {/* Search bar */}
        <div className="px-4 pb-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาชื่อทรัพย์, ย่าน, อำเภอ..."
              className="pl-9 pr-4 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 text-sm"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card Grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isPending ? (
            /* Loading Skeleton */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden"
                >
                  <div className="h-32 bg-slate-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <p className="font-bold text-slate-500">ไม่พบทรัพย์</p>
                <p className="text-xs text-slate-400 mt-1">ลองค้นหาด้วยคำอื่น</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              {items.map((item) => {
                const isSelected = value === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "text-left rounded-2xl border overflow-hidden transition-all duration-200 group relative",
                      "hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
                      isSelected
                        ? "border-blue-400 ring-2 ring-blue-400/20 shadow-md shadow-blue-100"
                        : "border-slate-200 hover:border-blue-300",
                    )}
                  >
                    {/* Cover Image */}
                    <div className="relative h-44 sm:h-55 bg-slate-100 overflow-hidden">
                      {item.cover_image_url ? (
                        <img
                          src={item.cover_image_url}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-slate-300" />
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

                      {/* Badges on image */}
                      <div className="absolute top-2.5 left-2.5">
                        <ListingTypeBadge type={item.listing_type} />
                      </div>

                      {/* Selected check */}
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                        </div>
                      )}

                      {/* Price on image bottom */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <PriceDisplay item={item} />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className={cn(
                      "px-3 py-2.5 transition-colors",
                      isSelected ? "bg-blue-50/50" : "bg-white"
                    )}>
                      <p className={cn(
                        "font-bold text-sm leading-snug line-clamp-2 transition-colors",
                        isSelected ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700"
                      )}>
                        {item.title}
                      </p>
                      {(item.popular_area || item.district || item.province) && (
                        <p className="flex items-center gap-1 text-xs text-slate-400 mt-1.5 font-medium">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {item.popular_area || item.district || item.province}
                          </span>
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
