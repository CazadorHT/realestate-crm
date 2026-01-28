"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

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
  placeholder = "เลือกดีล (พิมพ์เพื่อค้นหา)",
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
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative flex items-center w-full group">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-between h-auto py-2.5 px-3 text-left border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 shadow-sm",
              value && "pr-10 border-blue-200 bg-blue-50/20",
            )}
          >
            <div className="flex flex-col items-start truncate overflow-hidden">
              {selected ? (
                <>
                  <span className="font-bold text-slate-900 truncate w-full">
                    {selected.property_title}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate w-full">
                    ลูกค้า: {selected.lead_name}
                  </span>
                </>
              ) : (
                <span className="text-slate-400 font-medium">
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
        className="w-[420px] p-0 bg-white shadow-xl border"
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
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    value === item.id ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="flex flex-col">
                  <span className="font-medium truncate">
                    {item.property_title}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    ลูกค้า: {item.lead_name} |{" "}
                    {item.deal_type === "RENT" ? "เช่า" : "ขาย"}
                  </span>
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
