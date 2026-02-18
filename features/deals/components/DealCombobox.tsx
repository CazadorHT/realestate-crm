"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown, X, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type DealItem = {
  id: string;
  property_title: string;
  lead_name: string;
  deal_type: string;
  price?: number | null;
  original_price?: number | null;
  rental_price?: number | null;
  original_rental_price?: number | null;
  duration_months?: number | null;
  cover_image_url?: string | null;
  location?: string | null;
};

type Props = {
  value: string | null;
  onChange: (value: string | null, picked?: DealItem | null) => void;
  placeholder?: string;
  status?: string;
};

export function DealCombobox({
  value,
  onChange,
  placeholder = "คลิกเพื่อเลือกดีลที่ปิดการขาย/เช่าแล้ว",
  status,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<DealItem[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;

  const selected = useMemo(
    () => items.find((x) => x.id === value) ?? null,
    [items, value],
  );

  async function fetchPage(nextPage = 1, currentQ = q) {
    try {
      const params = new URLSearchParams();
      if (currentQ) params.set("q", currentQ);
      if (status) params.set("status", status);
      params.set("page", String(nextPage));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch deals");
      }

      const payload = await res.json();
      const pageItems: DealItem[] = (payload.data ?? []).map((x: any) => ({
        id: x.id,
        property_title: x.property?.title ?? "ไม่ระบุทรัพย์",
        lead_name: x.lead?.full_name ?? "ไม่ระบุลูกค้า",
        deal_type: x.deal_type,
        price: x.property?.price,
        original_price: x.property?.original_price,
        rental_price: x.property?.rental_price,
        original_rental_price: x.property?.original_rental_price,
        duration_months: x.duration_months,
        cover_image_url:
          x.property?.images?.find((img: any) => img.is_cover)?.image_url ||
          x.property?.images?.[0]?.image_url,
        location:
          x.property?.popular_area || x.property?.province || "ไม่ระบุทำเล",
      }));

      if (nextPage === 1) {
        setItems(pageItems);
      } else {
        setItems((p) => [...p, ...pageItems]);
      }

      setHasMore(
        (payload.data ?? []).length === pageSize &&
          items.length + pageItems.length < (payload.count ?? 0),
      );
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (!open) return;
    setQ("");
    startTransition(() => fetchPage(1, ""));
  }, [open, status]);

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(() => fetchPage(1, q));
    }, 250);
    return () => clearTimeout(handle);
  }, [q, status]);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const target = e.currentTarget;
    const nearBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 30;
    if (nearBottom && !isPending && hasMore) {
      startTransition(() => fetchPage(page + 1, q));
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <div className="relative flex items-center w-full group">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between h-auto py-2 px-3 text-left border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 shadow-sm",
              value && "pr-10 border-blue-200 bg-blue-50/20",
            )}
          >
            <div className="flex items-center gap-3 truncate overflow-hidden ">
              {selected ? (
                <>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100 border border-slate-200 shadow-inner">
                    {selected.cover_image_url ? (
                      <img
                        src={selected.cover_image_url}
                        alt={selected.property_title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <Building2 className="h-5 w-5 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="font-bold text-slate-900 block line-clamp-2 text-wrap leading-tight">
                      {selected.property_title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate w-full">
                      <span>{selected.location}</span>
                      <span className="opacity-30">•</span>
                      <span>ลูกค้า: {selected.lead_name}</span>
                      <span className="opacity-30">•</span>
                      <span
                        className={cn(
                          "uppercase font-bold",
                          selected.deal_type === "RENT"
                            ? "text-blue-600"
                            : "text-emerald-600",
                        )}
                      >
                        {selected.deal_type === "RENT" ? "เช่า" : "ขาย"} ฿
                        {(
                          selected.rental_price ??
                          selected.price ??
                          0
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-slate-400 font-normal">
                  {placeholder}
                </span>
              )}
            </div>
            {!value && (
              <ChevronsUpDown className="h-4 w-4 opacity-40 shrink-0 ml-2 text-slate-500" />
            )}
          </Button>
        </PopoverTrigger>

        {value && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-7 w-7 rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null, null);
            }}
            title="ล้างการเลือก"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <PopoverContent
        className="w-[calc(100vw-1.5rem)] sm:w-[700px]  p-0 bg-white shadow-xl border border-slate-200"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder="ค้นหาดีล (ชื่อทรัพย์, ชื่อลูกค้า)..."
            value={q}
            onValueChange={setQ}
          />
          <CommandList onScroll={onScroll}>
            <CommandEmpty>
              {isPending ? "กำลังค้นหา..." : "ไม่พบดีล"}
            </CommandEmpty>

            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.property_title} ${item.lead_name} ${item.id}`}
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
                <div className="flex items-start gap-3 flex-1 min-w-0 mr-2">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 shadow-sm">
                    {item.cover_image_url ? (
                      <img
                        src={item.cover_image_url}
                        alt={item.property_title}
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
                      {item.property_title}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500">
                      <span className="text-xs font-medium truncate max-w-[150px]">
                        ย่าน : {item.location}
                      </span>
                      <span className="opacity-30">•</span>
                      <span className="text-xs font-medium truncate max-w-[150px]">
                        ลูกค้า: {item.lead_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 ml-auto">
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.deal_type === "RENT" ? "เช่า" : "ขาย"}:
                      </span>
                      {((item.deal_type === "RENT"
                        ? item.original_rental_price
                        : item.original_price) ?? 0) >
                        ((item.deal_type === "RENT"
                          ? item.rental_price
                          : item.price) ?? 0) && (
                        <span className="text-[9px] text-slate-400 line-through">
                          ฿
                          {(
                            (item.deal_type === "RENT"
                              ? item.original_rental_price
                              : item.original_price) ?? 0
                          ).toLocaleString()}
                        </span>
                      )}
                      <span
                        className={cn(
                          "font-bold text-xs whitespace-nowrap",
                          item.deal_type === "RENT"
                            ? "text-blue-600"
                            : "text-emerald-600",
                        )}
                      >
                        ฿
                        {(
                          (item.deal_type === "RENT"
                            ? item.rental_price
                            : item.price) ?? 0
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CommandItem>
            ))}

            {hasMore && (
              <div className="p-2 text-center text-sm text-muted-foreground">
                เลื่อนเพื่อโหลดเพิ่มเติม...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
