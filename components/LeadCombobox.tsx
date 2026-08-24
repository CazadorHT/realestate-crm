"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronsUpDown,
  User,
  Search,
  X,
  Phone,
  Mail,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

import { searchLeadsAction } from "@/features/leads/actions";

export type LeadPickItem = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
};

type Props = {
  value: string | null;
  onChangeAction: (value: string | null, picked?: LeadPickItem | null) => void;
  placeholder?: string;
  className?: string;
  initialLead?: LeadPickItem | null;
  tenantId?: string | null;
  required?: boolean;
  name?: string;
};

export function LeadCombobox({
  value,
  onChangeAction,
  placeholder,
  className,
  initialLead,
  tenantId,
  required,
  name,
}: Props) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const defaultPlaceholder = placeholder || (isEn ? "Select customer (lead)..." : "เลือกลูกค้า...");

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [items, setItems] = useState<LeadPickItem[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const selected = useMemo(() => {
    if (initialLead && initialLead.id === value) return initialLead;
    return items.find((x) => x.id === value) ?? null;
  }, [items, value, initialLead]);

  // Debounced search when query changes
  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      setIsLoading(true);
      setPage(1);
      try {
        const res = await searchLeadsAction({
          q,
          page: 1,
          pageSize: 30,
          tenantId: tenantId ?? undefined,
        });
        if (res.success && res.data) {
          const fetchedItems = Array.isArray(res.data) ? res.data : res.data.items || [];
          setItems(fetchedItems);
          setHasMore(Boolean((res.data as any).hasMore));
          setTotalCount((res.data as any).total ?? fetchedItems.length);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [open, q, tenantId]);

  // Load fresh list when dialog opens
  useEffect(() => {
    if (!open) return;
    setQ("");
    setPage(1);
    const loadInitial = async () => {
      setIsLoading(true);
      try {
        const res = await searchLeadsAction({ 
          q: "", 
          page: 1,
          pageSize: 30,
          tenantId: tenantId ?? undefined 
        });
        if (res.success && res.data) {
          const fetchedItems = Array.isArray(res.data) ? res.data : res.data.items || [];
          setItems(fetchedItems);
          setHasMore(Boolean((res.data as any).hasMore));
          setTotalCount((res.data as any).total ?? fetchedItems.length);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadInitial();
  }, [open, tenantId]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const res = await searchLeadsAction({
        q,
        page: nextPage,
        pageSize: 30,
        tenantId: tenantId ?? undefined,
      });
      if (res.success && res.data) {
        const nextItems = Array.isArray(res.data) ? res.data : res.data.items || [];
        setItems((prev) => [...prev, ...nextItems]);
        setPage(nextPage);
        setHasMore(Boolean((res.data as any).hasMore));
        setTotalCount((res.data as any).total ?? (items.length + nextItems.length));
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSelect = (item: LeadPickItem) => {
    onChangeAction(item.id, item);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeAction(null, null);
  };

  // --- Trigger Button ---
  const trigger = (
    <div className="relative w-full">
      <button
        type="button"
        className={cn(
          "w-full flex items-center gap-2.5 text-left rounded-xl border px-3 h-11 transition-all duration-200 shadow-xs group cursor-pointer",
          "hover:border-blue-400 hover:bg-blue-50/20",
          selected
            ? "border-blue-200 bg-blue-50/30"
            : "border-slate-200 bg-white",
          className,
        )}
      >
        {/* Icon/Avatar */}
        <div
          className={cn(
            "shrink-0 rounded-lg h-7 w-7 bg-slate-100 border border-slate-200 flex items-center justify-center transition-all",
            selected && "bg-blue-100/80 border-blue-200",
          )}
        >
          <User className={cn("h-3.5 w-3.5 text-slate-400", selected && "text-blue-600")} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-1">
          {selected ? (
            <p className="font-bold text-slate-900 text-xs truncate leading-normal">
              {selected.full_name}
            </p>
          ) : (
            <span className="text-slate-400 text-xs font-normal truncate block">
              {defaultPlaceholder}
            </span>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          {selected && !required ? (
            <span
              role="button"
              onClick={handleClear}
              className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </span>
          ) : null}
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </button>
      {/* Hidden input for form data */}
      <input type="hidden" name={name} value={value ?? ""} required={required} />
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={isEn ? "Select Lead" : "เลือกหาลูกค้า (Lead)"}
      description={isEn ? "Search by customer name or phone number" : "พิมพ์ชื่อหรือเบอร์โทรศัพท์เพื่อค้นหา"}
      className="sm:max-w-[500px]"
      trigger={trigger}
      isLoading={isLoading}
      minHeight="400px"
    >
      <div className="flex flex-col h-full">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-100/80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={isEn ? "Customer name or phone number..." : "ชื่อลูกค้า หรือ เบอร์โทรศัพท์..."}
              className="pl-9 pr-9 h-11 rounded-xl border-slate-200 focus-visible:ring-blue-500/20"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-[350px] max-h-[500px]">
          {items.length === 0 && !isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <User className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{isEn ? "No leads found" : "ไม่พบรายชื่อที่ต้องการ"}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => {
                const isSelected = value === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer",
                      isSelected
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                        : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      isSelected ? "bg-blue-100" : "bg-slate-100"
                    )}>
                      <User className={cn("h-5 w-5", isSelected ? "text-blue-600" : "text-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.full_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {item.phone && (
                          <span className="text-[10px] opacity-70 flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" /> {item.phone}
                          </span>
                        )}
                        {item.email && (
                          <span className="text-[10px] opacity-70 flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5" /> {item.email}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* Load More Section */}
              {hasMore && (
                <div className="pt-3 pb-2 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="w-full h-10 rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
                  >
                    {isLoadingMore
                      ? (isEn ? "Loading more..." : "กำลังโหลดเพิ่มเติม...")
                      : (isEn ? `Load More Leads (${items.length}/${totalCount})` : `โหลดข้อมูลเพิ่มเติม (${items.length}/${totalCount})`)}
                  </Button>
                </div>
              )}

              {/* End of results indicator */}
              {!hasMore && items.length > 0 && (
                <p className="text-center text-[11px] text-slate-400 py-2">
                  {isEn ? `Showing all ${items.length} leads` : `แสดงครบทั้งหมด ${items.length} รายการ`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </ResponsiveDialog>
  );
}

