"use client";

import * as React from "react";
import { Flag, Search, Check, ChevronDown, X, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  getProvinceName,
  sortAndPartitionProvinces,
  type ProvinceWithCount,
} from "@/lib/utils/provinces";
import { getProvincePropertyCountsAction } from "@/features/properties/actions/fetch-master-data";
import { useThaiAddress } from "@/hooks/useThaiAddress";

interface Step1ProvinceSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  isMobileOrTablet?: boolean;
  disabled?: boolean;
}

export function Step1ProvinceSelector({
  value,
  onChange,
  isMobileOrTablet = false,
  disabled = false,
}: Step1ProvinceSelectorProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const { provinces, loading: addressLoading } = useThaiAddress();
  const [propertyCounts, setPropertyCounts] = React.useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = React.useState(true);

  // Search & Dialog/Popover state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [desktopOpen, setDesktopOpen] = React.useState(false);

  // Fetch province property counts on mount
  React.useEffect(() => {
    let isMounted = true;
    async function loadCounts() {
      try {
        setCountsLoading(true);
        const counts = await getProvincePropertyCountsAction();
        if (isMounted && counts) {
          setPropertyCounts(counts);
        }
      } catch (err) {
        console.error("Error loading province property counts:", err);
      } finally {
        if (isMounted) setCountsLoading(false);
      }
    }
    loadCounts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute sorted and partitioned provinces
  const { withProperties, withoutProperties } = React.useMemo(() => {
    return sortAndPartitionProvinces(
      provinces,
      propertyCounts,
      searchQuery,
      isEn ? "en" : "th"
    );
  }, [provinces, propertyCounts, searchQuery, isEn]);

  const selectedCount = value ? propertyCounts[value] || 0 : 0;
  const currentDisplayName = value ? getProvinceName(value, isEn ? "en" : "th") : "";

  const handleSelect = (provinceNameTh: string) => {
    onChange(provinceNameTh);
    setMobileOpen(false);
    setDesktopOpen(false);
    setSearchQuery("");
  };

  const totalResults = withProperties.length + withoutProperties.length;

  // Render province option button
  const renderOption = (p: ProvinceWithCount, isPopularGroup: boolean) => {
    const isSelected = value === p.name_th;
    const displayName = getProvinceName(p.name_th, isEn ? "en" : "th");

    return (
      <button
        key={p.id}
        type="button"
        onClick={() => handleSelect(p.name_th)}
        className={cn(
          "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all active:scale-[0.99] border text-left group cursor-pointer",
          isSelected
            ? "bg-blue-50/80 border-blue-200 text-blue-700 font-semibold shadow-xs"
            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-700"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              isSelected
                ? "bg-blue-600 text-white"
                : isPopularGroup
                ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                : "bg-slate-100 text-slate-400 group-hover:bg-slate-200/80 group-hover:text-slate-600"
            )}
          >
            {isPopularGroup ? (
              <Building2 className="h-3.5 w-3.5" />
            ) : (
              <MapPin className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{displayName}</span>
            {isEn && p.name_th !== displayName && (
              <span className="text-[11px] text-slate-400 truncate">{p.name_th}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {p.count > 0 && (
            <span
              className={cn(
                "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border transition-colors",
                isSelected
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-blue-50/80 text-blue-700 border-blue-100 group-hover:bg-blue-100"
              )}
            >
              {p.count} {isEn ? "listings" : "ทรัพย์"}
            </span>
          )}
          {isSelected && (
            <div className="bg-blue-600 rounded-full p-0.5 text-white">
              <Check className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </button>
    );
  };

  // Content inside both Popover & ResponsiveDialog
  const renderListContent = (isMobileView: boolean) => (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Search Input Header */}
      <div className="p-3 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 shrink-0 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? "Type to search province..." : "พิมพ์ค้นหาชื่อจังหวัด..."}
            className="pl-10 pr-9 py-2 h-10 rounded-xl border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus-visible:ring-blue-500 text-sm"
            autoFocus={!isMobileView}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list */}
      <div
        className={cn(
          "overflow-y-auto p-2 space-y-1 divide-y divide-slate-100/60 scrollbar-thin",
          isMobileView ? "max-h-[60vh]" : "max-h-[380px]"
        )}
      >
        {totalResults === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-slate-300 opacity-60" />
            <p className="text-sm font-medium">
              {isEn ? "No provinces found" : "ไม่พบจังหวัดที่ค้นหา"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isEn ? `No match for "${searchQuery}"` : `ไม่พบข้อมูลที่ตรงกับ "${searchQuery}"`}
            </p>
          </div>
        ) : (
          <>
            {/* 1. Group with properties (sorted count descending) */}
            {withProperties.length > 0 && (
              <div className="pb-2 space-y-1">
                <div className="px-3 pt-2 pb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider whitespace-nowrap shrink-0">
                    <Building2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>{isEn ? "Provinces with Listings" : "จังหวัดที่มีทรัพย์ในระบบ"}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50/90 px-2.5 py-0.5 rounded-full border border-blue-100 shrink-0 whitespace-nowrap">
                    {isEn
                      ? `${withProperties.length} (Max → Min)`
                      : `${withProperties.length} จังหวัด (มาก → น้อย)`}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {withProperties.map((p) => renderOption(p, true))}
                </div>
              </div>
            )}

            {/* 2. Group without properties (sorted ก-ฮ / A-Z) separated by divider */}
            {withoutProperties.length > 0 && (
              <div className={cn("space-y-1", withProperties.length > 0 && "pt-2")}>
                <div className="px-3 py-1.5 flex items-center justify-between gap-2 bg-slate-50/70 rounded-lg my-1 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600 whitespace-nowrap shrink-0">
                    {isEn ? "Other Provinces (A-Z)" : "จังหวัดอื่นๆ (เรียงตาม ก-ฮ)"}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
                    {withoutProperties.length} {isEn ? "provinces" : "จังหวัด"}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {withoutProperties.map((p) => renderOption(p, false))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Trigger Button
  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn(
        "group rounded-2xl bg-white font-medium px-4 py-7 relative w-full border-slate-200 justify-between h-14 flex items-center gap-3 hover:border-slate-300 hover:bg-slate-50/50 transition-all focus:ring-2 focus:ring-blue-500",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Flag className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
        <span
          className={cn(
            "font-medium transition-colors truncate text-sm sm:text-base",
            value ? "text-slate-800 group-hover:text-slate-900 font-semibold" : "text-slate-400 group-hover:text-slate-500"
          )}
        >
          {currentDisplayName || (isEn ? "Select Province" : "เลือกจังหวัด")}
        </span>
        {value && selectedCount > 0 && (
          <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {selectedCount} {isEn ? "listings" : "ทรัพย์"}
          </span>
        )}
      </div>
      <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0" />
    </Button>
  );

  if (isMobileOrTablet) {
    return (
      <ResponsiveDialog
        open={mobileOpen}
        onOpenChange={(open) => {
          setMobileOpen(open);
          if (!open) setSearchQuery("");
        }}
        title={isEn ? "Select Province" : "เลือกจังหวัด"}
        trigger={triggerButton}
      >
        {renderListContent(true)}
      </ResponsiveDialog>
    );
  }

  return (
    <Popover
      open={desktopOpen}
      onOpenChange={(open) => {
        setDesktopOpen(open);
        if (!open) setSearchQuery("");
      }}
    >
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-0 overflow-hidden min-w-[360px] max-w-[440px]"
        style={{ width: "max(var(--radix-popover-trigger-width, 360px), 360px)" }}
        align="start"
        sideOffset={6}
      >
        {renderListContent(false)}
      </PopoverContent>
    </Popover>
  );
}
