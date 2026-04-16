"use client";

import { useEffect, useMemo, useState, useTransition, useRef } from "react";
import { Check, ChevronsUpDown, X, Search, User, Phone, Mail } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

type LeadItem = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
};

type Props = {
  value: string | null;
  onChange: (value: string | null, picked?: LeadItem | null) => void;
  placeholder?: string;
};

// Generate a deterministic HSL color from a name string for avatar background
function nameToColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function LeadCombobox({
  value,
  onChange,
  placeholder = "เลือกลูกค้า...",
}: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [items, setItems] = useState<LeadItem[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;
  const listRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => items.find((x) => x.id === value) ?? null,
    [items, value]
  );

  async function fetchPage(nextPage = 1, currentQ = q) {
    const isInitial = nextPage === 1;
    if (isInitial) setIsLoading(true);
    else setIsFetchingMore(true);

    try {
      const params = new URLSearchParams();
      if (currentQ) params.set("q", currentQ);
      params.set("page", String(nextPage));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leads");

      const payload = await res.json() as { data: LeadItem[]; count: number };
      const pageItems: LeadItem[] = (payload.data ?? []).map((x) => ({
        id: x.id,
        full_name: x.full_name,
        email: x.email ?? null,
        phone: x.phone ?? null,
      }));

      if (nextPage === 1) {
        setItems(pageItems);
      } else {
        setItems((prev) => [...prev, ...pageItems]);
      }

      setHasMore(
        pageItems.length === pageSize &&
          (nextPage > 1 ? items.length + pageItems.length : pageItems.length) <
            (payload.count ?? 0)
      );
      setPage(nextPage);
    } finally {
      if (isInitial) setIsLoading(false);
      else setIsFetchingMore(false);
    }
  }

  // Load on open
  useEffect(() => {
    if (!open) return;
    setQ("");
    fetchPage(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      fetchPage(1, q);
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Infinite scroll
  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && !isLoading && !isFetchingMore && hasMore) {
      fetchPage(page + 1, q);
    }
  }

  const handleSelect = (item: LeadItem) => {
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
        "w-full flex items-center gap-3 text-left rounded-xl border px-3 py-2.5 transition-all duration-200 shadow-sm group",
        "hover:border-blue-400 hover:bg-blue-50/20 hover:shadow-md",
        selected
          ? "border-blue-200 bg-blue-50/30"
          : "border-slate-200 bg-white",
      )}
    >
      {/* Avatar */}
      <div
        className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
        style={{ backgroundColor: selected ? nameToColor(selected.full_name) : "#e2e8f0" }}
      >
        {selected ? (
          getInitials(selected.full_name)
        ) : (
          <User className="h-4 w-4 text-slate-400" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <>
            <p className="font-bold text-slate-900 text-sm truncate leading-tight">
              {selected.full_name}
            </p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {selected.email || selected.phone || "ไม่มีข้อมูลติดต่อ"}
            </p>
          </>
        ) : (
          <span className="text-slate-400 text-sm">{placeholder}</span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1 shrink-0">
        {selected && (
          <span
            role="button"
            onClick={handleClear}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </button>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title="เลือกลูกค้า (ลีด)"
      description="ค้นหาลีดด้วยชื่อ เบอร์โทรศัพท์ หรืออีเมล"
      className="sm:max-w-[560px]"
      trigger={trigger}
      isLoading={isLoading}
      minHeight="440px"
    >
      <div className="flex flex-col h-full">
        {/* Search bar */}
        <div className="px-4 pb-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล..."
              className="pl-9 pr-9 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500/20 text-sm"
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
          {items.length > 0 && (
            <p className="text-[11px] text-slate-400 mt-2 px-1">
              พบ <span className="font-bold text-slate-600">{items.length}</span> รายการ
              {hasMore ? "+" : ""}
            </p>
          )}
        </div>

        <div
          ref={listRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-3 py-2 min-h-[440px]"
          style={{ maxHeight: "min(60vh, 440px)" }}
        >
          {items.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <User className="h-7 w-7 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-500 text-sm">ไม่พบลีด</p>
                <p className="text-xs text-slate-400 mt-1">ลองค้นหาด้วยคำอื่น</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              {items.map((item) => {
                const isSelected = value === item.id;
                const color = nameToColor(item.full_name);
                const initials = getInitials(item.full_name);
                const contactLine = item.email || item.phone;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full flex flex-col items-center gap-2 px-3 pt-4 pb-3 rounded-2xl text-center transition-all duration-150 group relative border",
                      "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
                      isSelected
                        ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400/20 shadow-md shadow-blue-100"
                        : "bg-white border-slate-200 hover:border-blue-200",
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm transition-transform group-hover:scale-110",
                        isSelected && "ring-2 ring-blue-400 ring-offset-2"
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="w-full min-w-0">
                      <p className={cn(
                        "font-bold text-sm truncate leading-snug transition-colors text-center",
                        isSelected ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700"
                      )}>
                        {item.full_name}
                      </p>
                      {contactLine && (
                        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                          {item.email ? (
                            <Mail className="h-2.5 w-2.5 shrink-0" />
                          ) : (
                            <Phone className="h-2.5 w-2.5 shrink-0" />
                          )}
                          <span className="truncate">{contactLine}</span>
                        </p>
                      )}
                    </div>

                    {/* Selected mark */}
                    {isSelected && (
                      <div className="shrink-0 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Load more indicator */}
              {hasMore && (
                <div className="py-6 flex items-center justify-center col-span-2 md:col-span-4">
                  {isFetchingMore ? (
                    <div className="flex flex-col items-center gap-2">
                       <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         กำลังโหลดข้อมูล...
                       </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                      เลื่อนเพื่อโหลดเพิ่มเติม
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}
