"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect, useTransition, useRef } from "react";
import { QuickSearch } from "./filters/QuickSearch";
import { QuickSort } from "./filters/QuickSort";
import { QuickStatus } from "./filters/QuickStatus";
import { QuickType } from "./filters/QuickType";
import { AdvancedFilters } from "./filters/AdvancedFilters";
import { TrashButton } from "./filters/TrashButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaUser } from "react-icons/fa";
import { exportPropertiesAction } from "@/features/properties/export-action";
import { downloadBase64File, MIME_TYPES } from "@/lib/download-utils";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Filters = {
  q: string;
  status: string;
  type: string;
  listing: string;
  bedrooms: string;
  bathrooms: string;
  province: string;
  district: string;
  popular_area: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: string;
  nearTransit: string;
  petFriendly: string;
  fullyFurnished: string;
  allBranches: string;
  needsAiReview: string;
  assignedToMe: string;
};

const DEFAULT_FILTERS: Filters = {
  q: "",
  status: "ALL",
  type: "ALL",
  listing: "ALL",
  bedrooms: "",
  bathrooms: "",
  province: "",
  district: "",
  popular_area: "",
  minPrice: "",
  maxPrice: "",
  sortBy: "created_at",
  sortOrder: "desc",
  nearTransit: "",
  petFriendly: "",
  fullyFurnished: "",
  allBranches: "",
  needsAiReview: "",
  assignedToMe: "",
};

interface PropertyFiltersProps {
  totalCount: number;
  filterMetadata?: any[];
  isMultiTenant?: boolean;
}

export function PropertyFilters({
  totalCount,
  filterMetadata = [],
  isMultiTenant = false,
}: PropertyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isEn = language === "en";
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isInitialMount = useRef(true);

  const handleExportAllWithFilters = async () => {
    const processId = startProcess(isEn ? "Exporting to Excel..." : "กำลังส่งออกข้อมูล Excel", { type: "EXPORT" });
    setIsExporting(true);
    try {
      const result = await exportPropertiesAction(undefined, filters);
      if (result.success && result.data && result.filename) {
        const downloaded = downloadBase64File(
          result.data,
          result.filename,
          MIME_TYPES.EXCEL,
        );
        if (downloaded) {
          finishProcess(processId, "SUCCESS", isEn ? `Successfully exported ${result.count} listings` : `Export ทั้งหมด ${result.count} รายการสำเร็จ`);
        } else {
          finishProcess(processId, "ERROR", isEn ? "File download failed" : "ดาวน์โหลดไฟล์ไม่สำเร็จ");
        }
      } else {
        finishProcess(processId, "ERROR", result.message || (isEn ? "Export failed" : "Export ไม่สำเร็จ"));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isEn ? "An error occurred during export" : "เกิดข้อผิดพลาดในการ Export");
      finishProcess(processId, "ERROR", msg);
    } finally {
      setIsExporting(false);
    }
  };

  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get("q") || "",
    status: searchParams.get("status") || "ALL",
    type: searchParams.get("type") || "ALL",
    listing: searchParams.get("listing") || "ALL",
    bedrooms: searchParams.get("bedrooms") || "",
    bathrooms: searchParams.get("bathrooms") || "",
    province: searchParams.get("province") || "",
    district: searchParams.get("district") || "",
    popular_area: searchParams.get("popular_area") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sortBy: searchParams.get("sortBy") || "created_at",
    sortOrder: searchParams.get("sortOrder") || "desc",
    nearTransit: searchParams.get("nearTransit") || "",
    petFriendly: searchParams.get("petFriendly") || "",
    fullyFurnished: searchParams.get("fullyFurnished") || "",
    allBranches: searchParams.get("allBranches") || "",
    needsAiReview: searchParams.get("needsAiReview") || "",
    assignedToMe: searchParams.get("assignedToMe") || "",
  });

  const applyFilters = useMemo(() => {
    return () => {
      const params = new URLSearchParams();

      (Object.entries(filters) as [keyof Filters, string][]).forEach(
        ([key, value]) => {
          const v = String(value ?? "").trim();
          if (!v) return;
          if (v === "ALL") return;
          params.set(String(key), v);
        },
      );

      const qs = params.toString();
      const url = qs
        ? `/protected/properties?${qs}#table`
        : "/protected/properties#table";
      startTransition(() => {
        router.push(url, { scroll: false });
      });
      setOpen(false);
    };
  }, [filters, router]);

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    startTransition(() => {
      router.push("/protected/properties#table", { scroll: false });
    });
    setOpen(false);
  };

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([k, v]) => {
      const val = String(v ?? "").trim();
      if (!val) return false;

      if (k === "sortBy" && val === DEFAULT_FILTERS.sortBy) return false;
      if (k === "sortOrder" && val === DEFAULT_FILTERS.sortOrder) return false;
      if (k === "allBranches") return false; // Exclude allBranches as it is separate UI
      if (val === "ALL") return false;

      return true;
    }).length;
  }, [filters]);

  useEffect(() => {
    const table = document.getElementById("table");
    if (table) {
      if (isPending) {
        table.classList.add(
          "opacity-50",
          "pointer-events-none",
          "transition-opacity",
          "duration-300",
        );
      } else {
        table.classList.remove("opacity-50", "pointer-events-none");

        // [AUTO-FOCUS RESULTS] Scroll to table smoothly when search finishes
        // Only trigger if we actually had a search value or filters changed
        const hasQuery = searchParams.get("q");
        if (hasQuery && !isInitialMount.current) {
          table.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [isPending, searchParams]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      q: searchParams.get("q") || "",
      status: searchParams.get("status") || "ALL",
      type: searchParams.get("type") || "ALL",
      listing: searchParams.get("listing") || "ALL",
      bedrooms: searchParams.get("bedrooms") || "",
      bathrooms: searchParams.get("bathrooms") || "",
      province: searchParams.get("province") || "",
      district: searchParams.get("district") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      sortBy: searchParams.get("sortBy") || DEFAULT_FILTERS.sortBy,
      sortOrder: searchParams.get("sortOrder") || DEFAULT_FILTERS.sortOrder,
      nearTransit:
        searchParams.get("nearTransit") || DEFAULT_FILTERS.nearTransit,
      petFriendly:
        searchParams.get("petFriendly") || DEFAULT_FILTERS.petFriendly,
      fullyFurnished:
        searchParams.get("fullyFurnished") || DEFAULT_FILTERS.fullyFurnished,
      allBranches:
        searchParams.get("allBranches") || DEFAULT_FILTERS.allBranches,
      needsAiReview:
        searchParams.get("needsAiReview") || DEFAULT_FILTERS.needsAiReview,
      assignedToMe:
        searchParams.get("assignedToMe") || DEFAULT_FILTERS.assignedToMe,
    }));
  }, [searchParams]);

  return (
    <div className="space-y-4 w-full">
      {/* 🌟 Premium Status Tab Filter (Phase 1 Quick Win) */}
      <div className="flex flex-col xl:flex-row items-center gap-2 xl:gap-0 justify-between w-full">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl w-full max-w-fit border border-slate-200/60 shadow-inner overflow-x-auto">
          {[
            {
              id: "ALL",
              label: isEn ? "🌐 All" : "🌐 ทั้งหมด (All)",
              activeClass: "bg-white text-slate-800 shadow-sm font-bold",
            },
            {
              id: "ACTIVE",
              label: isEn ? "🟢 Active" : "🟢 ใช้งาน (Active)",
              activeClass:
                "bg-emerald-500 text-white shadow-md shadow-emerald-100 font-bold",
            },
            {
              id: "DRAFT",
              label: isEn ? "⚠️ Draft" : "⚠️ แบบร่าง (Draft)",
              activeClass:
                "bg-amber-500 text-white shadow-md shadow-amber-100 font-bold",
            },
            {
              id: "ARCHIVED",
              label: isEn ? "📦 Archived" : "📦 เก็บถาวร (Archived)",
              activeClass:
                "bg-slate-700 text-white shadow-md shadow-slate-200 font-bold",
            },
            {
              id: "SOLD",
              label: isEn ? "🤝 Sold" : "🤝 ปิดการขาย (Sold)",
              activeClass:
                "bg-blue-600 text-white shadow-md shadow-blue-100 font-bold",
            },
          ].map((tab) => {
            const isActive = filters.status === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilters({ ...filters, status: tab.id });
                  const params = new URLSearchParams(searchParams.toString());
                  if (tab.id === "ALL") params.delete("status");
                  else params.set("status", tab.id);
                  params.delete("page");
                  startTransition(() => {
                    router.push(
                      `/protected/properties?${params.toString()}#table`,
                      { scroll: false },
                    );
                  });
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 shrink-0 flex items-center gap-2 cursor-pointer",
                  isActive
                    ? tab.activeClass
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-between lg:justify-start items-center gap-2">
          {/* ✨ Sentinel Quick Filter Chip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="tour-property-ai-filter"
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextVal =
                    filters.needsAiReview === "true" ? "" : "true";
                  setFilters({ ...filters, needsAiReview: nextVal });
                  const params = new URLSearchParams(searchParams.toString());
                  if (nextVal === "true") params.set("needsAiReview", "true");
                  else params.delete("needsAiReview");
                  params.delete("page");
                  startTransition(() => {
                    router.push(
                      `/protected/properties?${params.toString()}#table`,
                      { scroll: false },
                    );
                  });
                }}
                className={cn(
                  "h-9 rounded-full px-4 border-dashed transition-all duration-300 cursor-pointer",
                  filters.needsAiReview === "true"
                    ? "bg-indigo-50 border-indigo-400 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                    : "bg-white text-slate-500 hover:border-indigo-300 hover:bg-slate-50 hover:text-indigo-600",
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 flex h-2 w-2 rounded-full transition-colors",
                    filters.needsAiReview === "true"
                      ? "bg-indigo-600 animate-pulse"
                      : "bg-slate-300",
                  )}
                />
                {isEn ? "✨ AI Review Drafts" : "✨ ตรวจร่าง AI"}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-900 border-slate-800 text-white font-medium"
            >
              {isEn ? "Show only listings auto-drafted by AI awaiting your review" : "แสดงเฉพาะรายการที่ AI ร่างข้อมูลให้ (รอคุณตรวจสอบ)"}
            </TooltipContent>
          </Tooltip>

          {/* 👤 Own Properties Chip */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                id="tour-property-my-filter"
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextVal = filters.assignedToMe === "true" ? "" : "true";
                  setFilters({ ...filters, assignedToMe: nextVal });
                  const params = new URLSearchParams(searchParams.toString());
                  if (nextVal === "true") params.set("assignedToMe", "true");
                  else params.delete("assignedToMe");
                  params.delete("page");
                  startTransition(() => {
                    router.push(
                      `/protected/properties?${params.toString()}#table`,
                      { scroll: false },
                    );
                  });
                }}
                className={cn(
                  "h-9 rounded-full px-4 border-dashed transition-all duration-300 cursor-pointer",
                  filters.assignedToMe === "true"
                    ? "bg-blue-50/50 border-blue-400 text-blue-700 shadow-sm ring-1 ring-blue-200"
                    : "bg-white text-slate-500 hover:border-blue-300 hover:bg-slate-50 hover:text-blue-600",
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 flex h-2 w-2 rounded-full transition-colors",
                    filters.assignedToMe === "true"
                      ? "bg-blue-600 animate-pulse"
                      : "bg-slate-300",
                  )}
                />
                <FaUser className="w-3 h-3 mr-1.5" /> {isEn ? "My Listings" : "ทรัพย์ของฉัน"}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-900 border-slate-800 text-white font-medium"
            >
              {isEn ? "Show only properties assigned to you" : "แสดงเฉพาะรายการทรัพย์สินที่คุณได้รับมอบหมาย"}
            </TooltipContent>
          </Tooltip>

          {/* 📥 Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAllWithFilters}
            disabled={isExporting}
            className="h-9 px-4 text-xs font-bold border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-all rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {isEn ? "Export Filtered Listings (Excel)" : "Export รายการที่เลือกตามฟิลเตอร์ (Excel/CSV)"}
          </Button>
        </div>
      </div>

      <div className="relative flex flex-col sm:flex-row items-stretch lg:items-center gap-3 w-full">
        {/* 1. ช่องค้นหา: กว้างเต็มพื้นที่บนมือถือ, ยืดตามพื้นที่เหลือบน Desktop */}
        <div id="tour-property-search" className="w-full lg:flex-1">
          <QuickSearch
            value={filters.q}
            onChange={(q) => setFilters({ ...filters, q })}
            onSearch={applyFilters}
            isPending={isPending}
          />
        </div>

        {/* [LOADING PROGRESS BAR] */}
        {isPending && (
          <div className="absolute top-full left-0 right-0 h-0.5 overflow-hidden rounded-full bg-indigo-50 z-10 mt-2">
            <div className="h-full w-1/3 animate-loading-bar bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
          </div>
        )}

        {/* 2. คอนเทนเนอร์รวมปุ่ม Action และ Filter */}
        {/* บนมือถือใช้ flex-col เพื่อแยกชั้นปุ่มหลักกับชิป, บน Desktop ใช้ flex-row ให้อยู่บรรทัดเดียวกัน */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* 2.1 กลุ่มปุ่มหลัก (ตัวกรอง & ล้างค่า) - แสดงเฉพาะบน Mobile/Tablet */}
          <div className="flex lg:hidden items-center gap-2 w-full sm:w-auto">
            {/* ให้ปุ่มตัวกรองขยายเต็มพื้นที่ (flex-1) คู่กับปุ่มถังขยะ จะทำให้ UI ดูแน่นและเป็นระเบียบขึ้น */}
            <div className="flex-1 sm:flex-initial">
              <AdvancedFilters
                open={open}
                setOpen={setOpen}
                filters={filters}
                setFilters={setFilters}
                applyFilters={applyFilters}
                clearFilters={clearFilters}
                activeFilterCount={activeFilterCount}
                totalCount={totalCount}
                filterMetadata={filterMetadata}
              />
            </div>
            <div className="shrink-0">
              <TrashButton />
            </div>
          </div>
        </div>

        {/* 3. กลุ่มตัวกรองบน Desktop - แสดงต่อท้ายช่องค้นหา */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <QuickSort
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split("-");
              setFilters({ ...filters, sortBy, sortOrder });

              const params = new URLSearchParams(searchParams.toString());
              params.set("sortBy", sortBy);
              params.set("sortOrder", sortOrder);
              startTransition(() => {
                router.push(
                  `/protected/properties?${params.toString()}#table`,
                  {
                    scroll: false,
                  },
                );
              });
            }}
          />

          <QuickStatus
            value={filters.status}
            onValueChange={(status) => {
              setFilters({ ...filters, status });
              const params = new URLSearchParams(searchParams.toString());
              if (status === "ALL") params.delete("status");
              else params.set("status", status);
              params.delete("page");
              startTransition(() => {
                router.push(
                  `/protected/properties?${params.toString()}#table`,
                  {
                    scroll: false,
                  },
                );
              });
            }}
          />

          <QuickType
            value={filters.type}
            onValueChange={(type) => {
              setFilters({ ...filters, type });
              const params = new URLSearchParams(searchParams.toString());
              if (type === "ALL") params.delete("type");
              else params.set("type", type);
              params.delete("page");
              startTransition(() => {
                router.push(
                  `/protected/properties?${params.toString()}#table`,
                  {
                    scroll: false,
                  },
                );
              });
            }}
          />

          <AdvancedFilters
            id="tour-property-advanced-filters"
            open={open}
            setOpen={setOpen}
            filters={filters}
            setFilters={setFilters}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
            activeFilterCount={activeFilterCount}
            totalCount={totalCount}
            filterMetadata={filterMetadata}
          />
          {isMultiTenant && (
            <div
              id="tour-property-all-branches"
              className={cn(
                "flex items-center gap-2 px-3 h-9 py-1.5 bg-blue-50/50 border border-blue-200 rounded-lg transition-all duration-200 shadow-xs select-none",
                isPending
                  ? "opacity-70 pointer-events-none"
                  : "hover:bg-blue-50 cursor-pointer",
              )}
            >
              {isPending && (
                <Loader2 className="h-3.5 w-3.5 text-blue-700 animate-spin" />
              )}
              <Switch
                id="all-branches-switch"
                checked={filters.allBranches === "true"}
                disabled={isPending}
                onCheckedChange={(checked) => {
                  const nextVal = checked ? "true" : "";
                  setFilters({ ...filters, allBranches: nextVal });

                  const params = new URLSearchParams(searchParams.toString());
                  if (nextVal === "true") params.set("allBranches", "true");
                  else params.delete("allBranches");
                  params.delete("page");

                  startTransition(() => {
                    router.push(
                      `/protected/properties?${params.toString()}#table`,
                      {
                        scroll: false,
                      },
                    );
                  });
                }}
              />
              <Label
                htmlFor="all-branches-switch"
                className="text-xs font-semibold text-blue-700 cursor-pointer"
              >
                {isEn ? "Search All Branches" : "ค้นหาทุกสาขา"}
              </Label>
            </div>
          )}
          <TrashButton />
        </div>
      </div>
    </div>
  );
}
