"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown, Building2, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  initialProperty?: {
    id: string;
    title: string;
    cover_image_url?: string | null;
    [key: string]: any;
  } | null;
};

const renderPriceBlock = (
  price: number | null | undefined,
  original_price: number | null | undefined,
  label: string,
  isRent: boolean,
) => {
  if (!price && !original_price) return null;
  return (
    <div className="flex items-center gap-1 justify-end">
      <span className="text-[10px] text-slate-400 font-medium">{label}:</span>
      {original_price && price && original_price > price && (
        <span className="text-[9px] text-slate-400 line-through hidden sm:inline">
          ฿{original_price.toLocaleString()}
        </span>
      )}
      <span
        className={cn(
          "font-bold text-xs whitespace-nowrap",
          isRent ? "text-blue-600" : "text-emerald-600",
        )}
      >
        ฿{(price ?? original_price)?.toLocaleString()}
      </span>
    </div>
  );
};

export function PropertyCombobox({
  value,
  onChange,
  placeholder = "เลือกทรัพย์ (พิมพ์เพื่อค้นหา)",
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

  useEffect(() => {
    if (!open) return;

    const handle = setTimeout(() => {
      startTransition(async () => {
        const res = await searchPropertiesAction({ q });
        if (res.success) setItems(res.data || []);
      });
    }, 250);

    return () => clearTimeout(handle);
  }, [open, q, startTransition]);

  // โหลด list ล่าสุดตอนเปิดครั้งแรก
  useEffect(() => {
    if (!open) return;

    // Reset search input and always load a fresh first page when opening so the user
    // can "see all" after making a selection.
    setQ("");

    startTransition(async () => {
      const res = await searchPropertiesAction({ q: "" });
      if (res.success) setItems(res.data || []);
    });
  }, [open, startTransition]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between h-auto py-2 px-3 text-left border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 shadow-sm",
            value && "pr-10 border-blue-200 bg-blue-50/20",
          )}
        >
          <div className="flex items-center gap-3 truncate overflow-hidden flex-1">
            {selected ? (
              <>
                <div className="hidden md:block h-10 w-10 shrink-0 overflow-hidden  rounded-md bg-slate-100 border border-slate-200 shadow-inner">
                  {selected.cover_image_url ? (
                    <img
                      src={selected.cover_image_url}
                      alt={selected.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-300">
                      <Building2 className="h-5 w-5 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-medium text-slate-900 block line-clamp-2 text-wrap leading-tight max-w-md">
                    {selected.title}
                  </span>
                  <div className="flex items-center gap-2 text-xs mt-1 text-slate-500 font-medium truncate w-full">
                    <span>
                      ย่าน :
                      {selected.popular_area ||
                        selected.district ||
                        "ไม่ระบุย่าน"}
                    </span>
                    <span className="opacity-30">•</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                          selected.listing_type === "RENT"
                            ? "bg-blue-100 text-blue-700"
                            : selected.listing_type === "SALE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {selected.listing_type === "RENT"
                          ? "เช่า"
                          : selected.listing_type === "SALE"
                            ? "ขาย"
                            : "ขาย/เช่า"}
                      </span>
                      <div className="flex items-center gap-2 ml-auto">
                        {(() => {
                          if (
                            selected.listing_type === "SALE_RENT" ||
                            selected.listing_type === "SALE_AND_RENT"
                          ) {
                            return (
                              <>
                                {renderPriceBlock(
                                  selected.price,
                                  selected.original_price,
                                  "ขาย",
                                  false,
                                )}
                                {renderPriceBlock(
                                  selected.rental_price,
                                  selected.original_rental_price,
                                  "เช่า",
                                  true,
                                )}
                              </>
                            );
                          }

                          if (selected.listing_type === "RENT") {
                            return renderPriceBlock(
                              selected.rental_price,
                              selected.original_rental_price,
                              "เช่า",
                              true,
                            );
                          }

                          return renderPriceBlock(
                            selected.price,
                            selected.original_price,
                            "ขาย",
                            false,
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0 ml-auto text-slate-500" />
              </>
            ) : (
              <span className="text-slate-400 font-normal">{placeholder}</span>
            )}
          </div>
          {!value && (
            <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0 ml-auto text-slate-500" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[calc(100vw-1.5rem)] sm:w-[700px] p-0 bg-white shadow-xl border border-slate-200"
        align="start"
      >
        <Command>
          <CommandInput
            className="p-2 "
            placeholder="ค้นหาชื่อทรัพย์..."
            value={q}
            onValueChange={setQ}
          />
          <CommandList>
            <CommandEmpty>
              {isPending ? "กำลังค้นหา..." : "ไม่พบทรัพย์"}
            </CommandEmpty>

            {/* ตัวเลือก: แสดงทั้งหมด */}
            <CommandItem
              value="__all__"
              onSelect={() => {
                // select 'all' -> clear filter (undefined) so caller can treat as no filter
                onChange(null, null);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4 shrink-0",
                  value === undefined || value === null
                    ? "opacity-100"
                    : "opacity-0",
                )}
              />
              (ทั้งหมด) แสดงทรัพย์ทั้งหมด
            </CommandItem>

            {/* รายการทรัพย์สิน */}
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.title} ${item.id}`}
                onSelect={() => {
                  onChange(item.id, item);
                  setOpen(false);
                }}
                className="flex items-start py-3 cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 mt-1 shrink-0",
                    value === item.id
                      ? "opacity-100 text-blue-600"
                      : "opacity-0",
                  )}
                />
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 shadow-sm">
                    {item.cover_image_url ? (
                      <img
                        src={item.cover_image_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <Building2 className="h-6 w-6 opacity-40" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    <span className="font-medium text-slate-900 block max-w-sm line-clamp-2 leading-tight">
                      {item.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500">
                      <span className="text-xs font-medium truncate max-w-[150px]">
                        ย่าน : {item.popular_area || "ไม่ระบุย่าน"}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                          item.listing_type === "RENT"
                            ? "bg-blue-100 text-blue-700"
                            : item.listing_type === "SALE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {item.listing_type === "RENT"
                          ? "เช่า"
                          : item.listing_type === "SALE"
                            ? "ขาย"
                            : "ขาย/เช่า"}
                      </span>
                      <div className="flex flex-col items-end gap-1 ml-auto">
                        {(() => {
                          if (
                            item.listing_type === "SALE_RENT" ||
                            item.listing_type === "SALE_AND_RENT"
                          ) {
                            return (
                              <>
                                {renderPriceBlock(
                                  item.price,
                                  item.original_price,
                                  "ขาย",
                                  false,
                                )}
                                {renderPriceBlock(
                                  item.rental_price,
                                  item.original_rental_price,
                                  "เช่า",
                                  true,
                                )}
                              </>
                            );
                          }

                          if (item.listing_type === "RENT") {
                            return renderPriceBlock(
                              item.rental_price,
                              item.original_rental_price,
                              "เช่า",
                              true,
                            );
                          }

                          return renderPriceBlock(
                            item.price,
                            item.original_price,
                            "ขาย",
                            false,
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
