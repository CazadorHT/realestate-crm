"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronsUpDown,
  Building2,
  Search,
  X,
  MapPin,
  Home,
  Tag,
  Key,
  Repeat,
  Map,
  Store,
  Briefcase,
  Box,
  CircleEllipsis,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

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
  status: string | null;
  property_type: string | null;
};

type Props = {
  value: string | null;
  onChangeAction: (value: string | null, picked?: PropertyPickItem | null) => void;
  placeholder?: string;
  className?: string;
  initialProperty?: {
    id: string;
    title: string;
    cover_image_url?: string | null;
    listing_type?: string | null;
    popular_area?: string | null;
    district?: string | null;
  } | null;
  tenantId?: string | null;
  name?: string;
  required?: boolean;
};

export interface PropertyStats {
  listing_type?: Record<string, number>;
  property_type?: Record<string, number>;
  status?: Record<string, number>;
  total?: number;
}

function ListingTypeBadge({ type }: { type: string | null | undefined }) {
  const config = {
    RENT: { label: "เช่า", className: "bg-blue-600 text-white" },
    SALE: { label: "ขาย", className: "bg-emerald-600 text-white" },
    SALE_RENT: { label: "ขาย/เช่า", className: "bg-amber-500 text-white" },
    SALE_AND_RENT: { label: "ขาย/เช่า", className: "bg-amber-500 text-white" },
  } as const;

  const matched = type ? (config as any)[type] : null;
  if (!matched) return null;

  return (
    <span
      className={cn(
        "text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide shadow-sm",
        matched.className,
      )}
    >
      {matched.label}
    </span>
  );
}

function PriceDisplay({ item }: { item: PropertyPickItem }) {
  const isSaleRent =
    item.listing_type === "SALE_RENT" || item.listing_type === "SALE_AND_RENT";
  const isRent = item.listing_type === "RENT";
  const isSale = item.listing_type === "SALE";

  const rentalPrice = item.rental_price ?? item.original_rental_price;
  const salePrice = item.price ?? item.original_price;

  if (isSaleRent) {
    return (
      <div className="flex flex-col gap-1">
        {salePrice ? (
          <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 w-fit">
            <span className="text-[11px] font-semibold">
              ฿{salePrice.toLocaleString()}
            </span>
          </div>
        ) : null}
        {rentalPrice ? (
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100 w-fit">
            <span className="text-[11px] font-semibold">
              ฿{rentalPrice.toLocaleString()}
              <span className="font-normal text-[9px] opacity-70 ml-0.5">
                /ด.
              </span>
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
        <span className="text-sm font-semibold">
          ฿{salePrice.toLocaleString()}
        </span>
      </div>
    );
  }
  return (
    <span className="text-xs text-slate-300 italic px-1">ไม่ระบุราคา</span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const config: Record<
    string,
    { label: string; dot: string; bg: string; text: string }
  > = {
    ACTIVE: {
      label: "ว่าง",
      dot: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    RESERVED: {
      label: "จองแล้ว",
      dot: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    UNDER_OFFER: {
      label: "ติดมัดจำ",
      dot: "bg-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-700",
    },
    SOLD: {
      label: "ขายแล้ว",
      dot: "bg-slate-400",
      bg: "bg-slate-100",
      text: "text-slate-600",
    },
    RENTED: {
      label: "เช่าแล้ว",
      dot: "bg-slate-400",
      bg: "bg-slate-100",
      text: "text-slate-600",
    },
    DRAFT: {
      label: "ฉบับร่าง",
      dot: "bg-slate-300",
      bg: "bg-slate-100",
      text: "text-slate-500",
    },
    ARCHIVED: {
      label: "เก็บถาวร",
      dot: "bg-rose-400",
      bg: "bg-rose-50",
      text: "text-rose-700",
    },
  };

  const matched = config[status] || {
    label: status,
    dot: "bg-slate-400",
    bg: "bg-slate-50",
    text: "text-slate-600",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-semibold text-[10px] tracking-wide",
        matched.bg,
        matched.text,
        "border-current/10",
      )}
    >
      <div className={cn("h-1.5 w-1.5 rounded-full shadow-sm", matched.dot)} />
      {matched.label}
    </div>
  );
}

export function PropertyCombobox({
  value,
  onChangeAction,
  placeholder = "เลือกทรัพย์...",
  className,
  initialProperty,
  tenantId,
  name,
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<PropertyPickItem[]>([]);
  const [counts, setCounts] = useState<PropertyStats | null>(null);
  const [q, setQ] = useState("");
  const [listingType, setListingType] = useState<string | null>(null);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [status, setStatus] = useState<string[] | null>(null);

  const selected = useMemo(() => {
    if (initialProperty && initialProperty.id === value) return initialProperty;
    return items.find((x) => x.id === value) ?? null;
  }, [items, value, initialProperty]);

  // Debounced search when query changes
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchPropertiesAction({
          q,
          listing_type: listingType || undefined,
          property_type: propertyType || undefined,
          status: status || undefined,
          tenantId: tenantId ?? undefined,
        });
        if (res.success) {
          setItems(res.data.properties || []);
          setCounts(res.data.counts || null);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [open, q, listingType, propertyType, status]);

  // Load fresh list when dialog opens
  useEffect(() => {
    if (!open) return;
    setQ("");
    setListingType(null);
    setPropertyType(null);
    setStatus(null);
    const loadInitial = async () => {
      setIsLoading(true);
      try {
        const res = await searchPropertiesAction({
          q: "",
          listing_type: undefined,
          property_type: undefined,
          status: undefined,
        });
        if (res.success) {
          setItems(res.data.properties || []);
          setCounts(res.data.counts || null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, [open]);

  const handleSelect = (item: PropertyPickItem) => {
    onChangeAction(item.id, item);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeAction(null, null);
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
      <div
        className={cn(
          "shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center transition-all",
          selected ? "h-10 w-10 sm:h-12 sm:w-12" : "h-9 w-9",
        )}
      >
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
                  <span className="truncate">
                    {(selected.popular_area || selected.district) ?? ""}
                  </span>
                </span>
              )}
            </div>
          </>
        ) : (
          <span className="text-slate-400 text-sm font-normal">
            {placeholder}
          </span>
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
      <input
        type="hidden"
        name={name}
        value={value ?? ""}
        required={required}
      />
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
      isLoading={isLoading}
      minHeight="500px"
    >
      <div className="flex flex-col ">
        {/* Sticky Search bar */}
        <div className="sticky -top-3 z-30 bg-white px-4 pt-3 pb-3 border-b border-slate-100/80 shadow-sm sm:shadow-none">
          <div className="flex flex-col gap-3">
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

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar  py-1">
              {/* Listing Type Filter */}
              <FilterSelector
                label="ประเภทประกาศ"
                description="เลือกรูปแบบการประกาศขายหรือเช่า"
                value={listingType}
                counts={counts?.listing_type}
                options={[
                  { id: null, label: "ประกาศทั้งหมด", icon: Search },
                  {
                    id: "SALE",
                    label: "ขาย",
                    ids: ["SALE", "SALE_RENT", "SALE_AND_RENT"],
                    color: "bg-blue-500",
                    icon: Tag,
                  },
                  {
                    id: "RENT",
                    label: "เช่า",
                    ids: ["RENT", "SALE_RENT", "SALE_AND_RENT"],
                    color: "bg-emerald-500",
                    icon: Key,
                  },
                  {
                    id: "SALE_AND_RENT",
                    label: "ขาย/เช่า",
                    ids: ["SALE_RENT", "SALE_AND_RENT"],
                    color: "bg-indigo-500",
                    icon: Repeat,
                  },
                ]}
                onSelect={setListingType}
              />

              {/* Property Type Filter */}
              <FilterSelector
                label="ประเภททรัพย์"
                description="ระบุประเภทอสังหาริมทรัพย์ที่ต้องการ"
                value={propertyType}
                counts={counts?.property_type}
                options={[
                  { id: null, label: "ทรัพย์ทุกประเภท", icon: Building2 },
                  { id: "CONDO", label: "คอนโด", icon: Building2 },
                  { id: "HOUSE", label: "บ้านเดี่ยว", icon: Home },
                  { id: "TOWNHOME", label: "ทาวน์โฮม", icon: Home },
                  { id: "VILLA", label: "วิลล่า", icon: Home },
                  { id: "POOL_VILLA", label: "พูลวิลล่า", icon: Home },
                  { id: "LAND", label: "ที่ดิน", icon: Map },
                  {
                    id: "COMMERCIAL_BUILDING",
                    label: "อาคารพาณิชย์",
                    icon: Store,
                  },
                  { id: "OFFICE_BUILDING", label: "ออฟฟิศ", icon: Briefcase },
                  { id: "WAREHOUSE", label: "โกดัง", icon: Box },
                  { id: "OTHER", label: "อื่นๆ", icon: CircleEllipsis },
                ]}
                onSelect={setPropertyType}
              />

              {/* Status Filter */}
              <FilterSelector
                label="สถานะทรัพย์"
                description="กรองรายการตามสถานะความพร้อม"
                value={status}
                counts={counts?.status}
                options={[
                  { id: null, label: "สถานะทั้งหมด", icon: Search },
                  {
                    id: ["ACTIVE"],
                    label: "ว่าง",
                    color: "bg-emerald-500",
                    ids: ["ACTIVE"],
                    icon: CheckCircle2,
                  },
                  {
                    id: ["RESERVED", "UNDER_OFFER"],
                    label: "จอง/มัดจำ",
                    color: "bg-amber-500",
                    ids: ["RESERVED", "UNDER_OFFER"],
                    icon: Clock,
                  },
                  {
                    id: ["SOLD", "RENTED"],
                    label: "ปิดแล้ว",
                    color: "bg-slate-400",
                    ids: ["SOLD", "RENTED"],
                    icon: XCircle,
                  },
                ]}
                onSelect={setStatus}
                renderLabel={(val) => {
                  if (!val) return "สถานะทั้งหมด";
                  if (JSON.stringify(val) === JSON.stringify(["ACTIVE"]))
                    return "สถานะ: ว่าง";
                  if (
                    JSON.stringify(val) ===
                    JSON.stringify(["RESERVED", "UNDER_OFFER"])
                  )
                    return "สถานะ: จองแล้ว";
                  return "สถานะ: ปิดแล้ว";
                }}
              />
            </div>
          </div>
        </div>

        {/* Card Grid */}
        <div className="px-4 pb-4 mt-4 min-h-[500px]">
          {items.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <p className="font-bold text-slate-500">ไม่พบทรัพย์</p>
                <p className="text-xs text-slate-400 mt-1">
                  ลองค้นหาด้วยคำอื่น
                </p>
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
                          <Check
                            className="h-3.5 w-3.5 text-white"
                            strokeWidth={3}
                          />
                        </div>
                      )}

                      {/* Price on image bottom */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <PriceDisplay item={item} />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div
                      className={cn(
                        "px-3 py-2.5 transition-colors",
                        isSelected ? "bg-blue-50/50" : "bg-white",
                      )}
                    >
                      <p
                        className={cn(
                          "font-bold text-sm leading-snug line-clamp-2 transition-colors",
                          isSelected
                            ? "text-blue-700"
                            : "text-slate-900 group-hover:text-blue-700",
                        )}
                      >
                        {item.title}
                      </p>
                      {(item.popular_area ||
                        item.district ||
                        item.province) && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1.5 font-medium">
                          <span className="shrink-0 flex items-center">
                            <MapPin className="h-3 w-3" />
                          </span>
                          {item.status && (
                            <div className="shrink-0">
                              <StatusBadge status={item.status} />
                            </div>
                          )}
                          <span className="truncate">
                            {item.popular_area ||
                              item.district ||
                              item.province}
                          </span>
                        </div>
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

/**
 * 🛰️ FilterSelector:
 * Specialized button that opens a ResponsiveDialog for filter selection.
 */
function FilterSelector<T>({
  label,
  description,
  value,
  options,
  onSelect,
  renderLabel,
  counts,
  className,
}: {
  label: string;
  description?: string;
  value: T;
  options: {
    id: T;
    label: string;
    color?: string;
    ids?: string[];
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  onSelect: (val: T) => void;
  renderLabel?: (val: T) => string;
  counts?: Record<string, number>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const currentLabel = useMemo(() => {
    if (renderLabel) return renderLabel(value);
    if (value === null || value === undefined) return label;
    return options.find((o) => o.id === value)?.label || label;
  }, [value, options, label, renderLabel]);

  const isActive = value !== null && value !== undefined;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={label}
      description={description}
      className="lg:max-w-[400px]!"
      trigger={
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 rounded-xl px-4 text-[11px] font-bold transition-all border-slate-200 shadow-xs gap-2 shrink-0",
            isActive
              ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100 hover:bg-blue-700 hover:text-white"
              : "bg-white text-slate-600 hover:bg-slate-200 hover:text-slate-700",
            className,
          )}
        >
          <span>{currentLabel}</span>
          <ChevronsUpDown
            className={cn("h-3 w-3 opacity-50", isActive && "opacity-100")}
          />
        </Button>
      }
    >
      <div className="flex flex-col gap-2 p-6 overflow-y-auto max-h-[60vh] ">
        {options.map((opt) => {
          const selected = JSON.stringify(opt.id) === JSON.stringify(value);
          // Calculate sum of counts for the ids list, or use the id itself
          const effectiveIds = opt.ids || (opt.id ? [String(opt.id)] : []);
          let count: number | undefined = undefined;
          if (counts) {
            if (opt.id === null) {
              // "All" option: show total sum of all items in this category
              count = Object.values(counts).reduce(
                (a: number, b: number) => a + b,
                0,
              );
            } else {
              count = (effectiveIds as string[]).reduce(
                (sum: number, id: string) => sum + (counts[id] || 0),
                0,
              );
            }
          }

          const hasData = count === undefined || count > 0 || opt.id === null;

          return (
            <button
              key={String(opt.id)}
              type="button"
              disabled={!hasData}
              onClick={() => {
                onSelect(opt.id);
                setOpen(false);
              }}
              className={cn(
                "w-full flex h-14 items-center justify-between px-4 py-2 rounded-2xl transition-all active:scale-[0.98] border shrink-0",
                selected
                  ? "bg-blue-50 border-blue-100 shadow-sm text-blue-700"
                  : "hover:bg-slate-50 border-transparent text-slate-700",
                !hasData && "opacity-50 grayscale cursor-not-allowed",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    selected ? "bg-blue-600/10" : "bg-slate-100",
                  )}
                >
                  {opt.icon ? (
                    <opt.icon
                      className={cn(
                        "h-5 w-5",
                        selected ? "text-blue-600" : "text-slate-400",
                      )}
                    />
                  ) : (
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        opt.color ||
                          (selected ? "bg-blue-600" : "bg-slate-300"),
                      )}
                    />
                  )}
                </div>

                <div className="flex flex-col items-start leading-none">
                  <span className="text-sm font-bold">{opt.label}</span>
                  {count !== undefined && (
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest mt-1",
                        selected ? "text-blue-500" : "text-emerald-400",
                      )}
                    >
                      {count} รายการ
                    </span>
                  )}
                </div>
              </div>
              {selected && (
                <div className="bg-blue-600 rounded-full p-1">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </ResponsiveDialog>
  );
}
