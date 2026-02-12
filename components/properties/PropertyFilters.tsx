"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { QuickSearch } from "./filters/QuickSearch";
import { QuickSort } from "./filters/QuickSort";
import { QuickStatus } from "./filters/QuickStatus";
import { QuickType } from "./filters/QuickType";
import { AdvancedFilters } from "./filters/AdvancedFilters";
import { TrashButton } from "./filters/TrashButton";

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
};

interface PropertyFiltersProps {
  totalCount: number;
  filterMetadata?: any[];
}

export function PropertyFilters({
  totalCount,
  filterMetadata,
}: PropertyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

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
  });

  const applyFilters = () => {
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
    router.push(url, { scroll: false });
    setOpen(false);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    router.push("/protected/properties#table", { scroll: false });
    setOpen(false);
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([k, v]) => {
      const val = String(v ?? "").trim();
      if (!val) return false;

      if (k === "sortBy" && val === DEFAULT_FILTERS.sortBy) return false;
      if (k === "sortOrder" && val === DEFAULT_FILTERS.sortOrder) return false;
      if (val === "ALL") return false;

      return true;
    });
  }, [filters]);

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
    }));
  }, [searchParams]);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-2 w-full">
      <div className="flex items-center gap-2 w-full lg:w-auto flex-1">
        <QuickSearch
          value={filters.q}
          onChange={(q) => setFilters({ ...filters, q })}
          onSearch={applyFilters}
        />

        {/* Mobile Filter Trigger */}
        <div className="flex lg:hidden gap-2">
          <AdvancedFilters
            open={open}
            setOpen={setOpen}
            filters={filters}
            setFilters={setFilters}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            totalCount={totalCount}
            filterMetadata={filterMetadata}
          />
          <TrashButton />
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
            router.push(`/protected/properties?${params.toString()}`);
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
            router.push(`/protected/properties?${params.toString()}`);
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
            router.push(`/protected/properties?${params.toString()}`);
          }}
        />

        <AdvancedFilters
          open={open}
          setOpen={setOpen}
          filters={filters}
          setFilters={setFilters}
          applyFilters={applyFilters}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          totalCount={totalCount}
          filterMetadata={filterMetadata}
        />

        <TrashButton />
      </div>
    </div>
  );
}
