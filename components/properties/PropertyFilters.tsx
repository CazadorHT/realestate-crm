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
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isInitialMount = useRef(true);

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
        table.classList.add("opacity-50", "pointer-events-none", "transition-opacity", "duration-300");
      } else {
        table.classList.remove("opacity-50", "pointer-events-none");
        
        // [AUTO-FOCUS RESULTS] Scroll to table smoothly when search finishes
        // Only trigger if we actually had a search value or filters changed
        const hasQuery = searchParams.get('q');
        if (hasQuery && !isInitialMount.current) {
          table.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    }));
  }, [searchParams]);

  return (
    <div className="relative flex flex-col lg:flex-row items-center gap-2 w-full">
      <div className="flex items-center gap-2 w-full lg:w-auto flex-1">
        <div id="tour-property-search" className="flex-1">
          <QuickSearch
            value={filters.q}
            onChange={(q) => setFilters({ ...filters, q })}
            onSearch={applyFilters}
            isPending={isPending}
          />
        </div>

        {/* [LOADING PROGRESS BAR] - High Visibility at Table Boundary */}
        {isPending && (
          <div className="absolute top-full left-0 right-0 h-0.5 overflow-hidden rounded-full bg-indigo-50 z-10 mt-2">
            <div className="h-full w-1/3 animate-loading-bar bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
          </div>
        )}

        {/* Mobile Filter Trigger */}
        <div className="flex lg:hidden gap-2">
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
          <TrashButton />
        </div>

        {/* ✨ Sentinel Quick Filter Chip */}
        <div className="flex items-center gap-2 ml-auto lg:ml-0">
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
                  "h-9 rounded-full px-4 border-dashed transition-all duration-300",
                  filters.needsAiReview === "true"
                    ? "bg-indigo-50! border-indigo-400 text-indigo-700! shadow-sm ring-1 ring-indigo-200"
                    : "bg-white! text-slate-500! hover:border-indigo-300 hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 flex h-2 w-2 rounded-full",
                    filters.needsAiReview === "true"
                      ? "bg-indigo-600 animate-pulse"
                      : "bg-slate-300",
                  )}
                />
                ✨ ตรวจร่าง AI
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-slate-900 border-slate-800 text-white font-medium"
            >
              แสดงเฉพาะรายการที่ AI ร่างข้อมูลให้ (รอคุณตรวจสอบ)
            </TooltipContent>
          </Tooltip>
        </div>

        
      </div>

      <div className="hidden lg:flex items-center gap-2">
        <QuickSort
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split("-");
            setFilters({ ...filters, sortBy, sortOrder });

            const params = new URLSearchParams(searchParams.toString());
            params.set("sortBy", sortBy);
            params.set("sortOrder", sortOrder);
            startTransition(() => {
              router.push(`/protected/properties?${params.toString()}#table`, {
                scroll: false,
              });
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
              router.push(`/protected/properties?${params.toString()}#table`, {
                scroll: false,
              });
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
              router.push(`/protected/properties?${params.toString()}#table`, {
                scroll: false,
              });
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
              ค้นหาทุกสาขา
            </Label>
          </div>
        )}
        <TrashButton />
      </div>
    </div>
  );
}
