"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type LeadItem = { id: string; full_name: string; email?: string | null; phone?: string | null };

type Props = {
  value: string | null;
  onChange: (value: string | null, picked?: LeadItem | null) => void;
  placeholder?: string;
};

export function LeadCombobox({ value, onChange, placeholder = "เลือกลีด (พิมพ์เพื่อค้นหา)" }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<LeadItem[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;

  const selected = useMemo(() => items.find((x) => x.id === value) ?? null, [items, value]);

  async function fetchPage(nextPage = 1, currentQ = q) {
    try {
      const params = new URLSearchParams();
      if (currentQ) params.set("q", currentQ);
      params.set("page", String(nextPage));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch leads");
      }

      const payload = await res.json();
      const pageItems: LeadItem[] = (payload.data ?? []).map((x: any) => ({
        id: x.id,
        full_name: x.full_name,
        email: x.email ?? null,
        phone: x.phone ?? null,
      }));

      if (nextPage === 1) {
        setItems(pageItems);
      } else {
        setItems((p) => [...p, ...pageItems]);
      }

      setHasMore((payload.data ?? []).length === pageSize && (items.length + pageItems.length) < (payload.count ?? 0));
      setPage(nextPage);
    } catch (err) {
      try {
        const { toast } = await import("sonner");
        toast.error("ไม่สามารถโหลดลีดได้");
      } catch (e) {
        // ignore
      }
    }
  }

  // load when opened (first page) and always refresh so user can "see all" after selecting
  useEffect(() => {
    if (!open) return;
    setQ("");
    startTransition(() => fetchPage(1, ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startTransition]);

  // debounce search q (load page 1)
  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(() => fetchPage(1, q));
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const target = e.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 30;
    if (nearBottom && !isPending && hasMore) {
      startTransition(() => fetchPage(page + 1, q));
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2 w-full">
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <span className="truncate">{selected?.full_name ?? placeholder}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>

        {value ? (
          <Button size="sm" variant="ghost" onClick={() => onChange(null, null)} title="ล้างลีด">
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <PopoverContent className="w-[420px] p-0 bg-white" align="start">
        <Command>
          <CommandInput placeholder="ค้นหาลีด (ชื่อ, โทร หรืออีเมล)..." value={q} onValueChange={setQ} />
          <CommandList onScroll={onScroll}>
            <CommandEmpty>{isPending ? "กำลังค้นหา..." : "ไม่พบลีด"}</CommandEmpty>

            {/* ตัวเลือก: แสดงทั้งหมด */}
            <CommandItem
              value="__all__"
              onSelect={() => {
                // selecting 'all' clears the lead filter
                onChange(undefined as any, null);
                setOpen(false);
              }}
            >
              <Check className={`mr-2 h-4 w-4 ${value === undefined ? "opacity-100" : "opacity-0"}`} />
              (ทั้งหมด) แสดงลีดทั้งหมด
            </CommandItem>

            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.full_name} ${item.id}`}
                onSelect={() => {
                  onChange(item.id, item);
                  setOpen(false);
                }}
              >
                <Check className={`mr-2 h-4 w-4 ${value === item.id ? "opacity-100" : "opacity-0"}`} />
                <div className="flex flex-col">
                  <span className="truncate">{item.full_name}</span>
                  <span className="text-xs text-muted-foreground truncate">{item.email ?? item.phone ?? ""}</span>
                </div>
              </CommandItem>
            ))}

            {hasMore && (
              <div className="p-2 text-center text-sm text-muted-foreground">เลื่อนเพื่อโหลดเพิ่มเติม...</div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
