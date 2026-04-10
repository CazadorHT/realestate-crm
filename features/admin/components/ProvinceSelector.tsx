"use client";

import { useState, useMemo } from "react";
import { useThaiAddress } from "@/hooks/useThaiAddress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { MapPin, Search, Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 🇹🇭 ProvinceSelector:
 * A premium searchable province selector using ResponsiveDialog.
 * Desktop: Searchable Modal
 * Mobile: Searchable Drawer
 */

export function ProvinceSelector({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const { provinces, loading } = useThaiAddress();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredProvinces = useMemo(() => {
    return provinces.filter((p) =>
      p.name_th.toLowerCase().includes(search.toLowerCase()),
    );
  }, [provinces, search]);

  const handleSelect = (provinceName: string) => {
    onChange(provinceName);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={loading}
        className={cn(
          "w-full justify-between h-11 bg-slate-50 border-slate-200 hover:bg-white hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl px-4 text-left font-medium",
          !value && "text-slate-400",
          className,
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <MapPin
            className={cn(
              "h-4 w-4",
              value ? "text-indigo-600" : "text-slate-300",
            )}
          />
          {loading ? (
            <span className="flex items-center gap-2 opacity-50">
              <Loader2 className="h-3 w-3 animate-spin" />
              กำลังโหลดข้อมูล...
            </span>
          ) : (
            <span className="text-slate-600">{value || "เลือกจังหวัด"}</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </Button>

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="เลือกจังหวัด"
        className="md:max-w-md! "
      >
        <div className="flex  flex-col h-full bg-white">
          <div className="p-4 border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-sm z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="ค้นหาจังหวัด..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white  focus:ring-2 focus:ring-indigo-500/10 transition-all rounded-xl"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 overflow-y-auto max-h-[30vh] p-2 space-y-1 scrollbar-thin">
            {filteredProvinces.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <p className="text-sm">ไม่พบข้อมูลจังหวัดที่ค้นหา</p>
              </div>
            ) : (
              filteredProvinces.map((p) => {
                const isSelected = value === p.name_th;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.name_th)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold transition-all group",
                      isSelected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors ",
                          isSelected
                            ? "bg-indigo-100"
                            : "bg-slate-100 group-hover:bg-white border border-transparent shadow-sm",
                        )}
                      >
                        <MapPin
                          className={cn(
                            "h-4 w-4",
                            isSelected ? "text-indigo-600" : "text-slate-400",
                          )}
                        />
                      </div>
                      <span className="line-clamp-1">{p.name_th}</span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-indigo-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </ResponsiveDialog>
    </>
  );
}
