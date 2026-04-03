"use client";

import { useState, useEffect, useMemo } from "react";
import { DealWithProperty, DealStats, DealStatus, DealType } from "../types";

export function useDealsTable(
  initialData: DealWithProperty[] = [],
  initialCount: number = 0,
  initialPage: number = 1,
  pageSize: number = 20,
  initialTimeRange: string = "all",
) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState(initialData);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<
    string | undefined
  >(undefined);
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(
    undefined,
  );
  const [timeRange, setTimeRange] = useState(initialTimeRange);
  const [dealType, setDealType] = useState<DealType | undefined>(undefined);
  const [dealStatus, setDealStatus] = useState<DealStatus | undefined>(undefined);
  const [propertyType, setPropertyType] = useState<string | undefined>(undefined);
  const [listingType, setListingType] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState(0);
  const [stats, setStats] = useState<DealStats | null>(null);
  const [orderBy, setOrderBy] = useState<string>("created_at");
  const [orderDirection, setOrderDirection] = useState<boolean>(false);

  // Sync state with props
  useEffect(() => {
    setData(initialData);
    setCount(initialCount);
    setTimeRange(initialTimeRange);
    setPage(initialPage);
  }, [initialData, initialCount, initialTimeRange, initialPage]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch data
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (debouncedQ) params.set("q", debouncedQ);
        if (selectedPropertyId !== undefined)
          params.set("property_id", selectedPropertyId);
        if (selectedLeadId !== undefined) params.set("lead_id", selectedLeadId);
        if (timeRange && timeRange !== "all") params.set("timeRange", timeRange);
        if (dealType) params.set("deal_type", dealType);
        if (dealStatus) params.set("status", dealStatus);
        if (propertyType) params.set("property_type", propertyType);
        if (listingType) params.set("listing_type", listingType);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        params.set("order", orderBy);
        params.set("ascending", String(orderDirection));

        const res = await fetch(`/api/deals?${params.toString()}`);
        if (!mounted) return;
        if (res.ok) {
          const payload = await res.json();
          setData(payload.data ?? []);
          setCount(payload.count ?? 0);
          if (payload.stats) setStats(payload.stats);
        } else {
          const errPayload = await res.json().catch(() => ({}));
          console.error("/api/deals fetch error:", res.status, errPayload);
          setError(errPayload.error || `Failed to fetch deals (${res.status})`);
          setData([]);
          setCount(0);
        }
      } catch (err) {
        if (!mounted) return;
        console.error("/api/deals network error:", err);
        setError("Network error occurred. Please check your connection.");
        setData([]);
        setCount(0);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [
    debouncedQ,
    page,
    pageSize,
    reloadKey,
    selectedPropertyId,
    selectedLeadId,
    timeRange,
    dealType,
    dealStatus,
    propertyType,
    listingType,
    orderBy,
    orderDirection,
  ]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const hasActiveFilters = useMemo(
    () => !!(selectedPropertyId || selectedLeadId || debouncedQ || dealType || dealStatus || propertyType || listingType),
    [selectedPropertyId, selectedLeadId, debouncedQ, dealType, dealStatus, propertyType, listingType],
  );

  const refresh = () => {
    setPage(1);
    setReloadKey((k) => k + 1);
  };

  return {
    q,
    setQ,
    debouncedQ,
    page,
    setPage,
    data,
    count,
    loading,
    error,
    selectedPropertyId,
    setSelectedPropertyId,
    selectedLeadId,
    setSelectedLeadId,
    timeRange,
    setTimeRange,
    dealType,
    setDealType,
    dealStatus,
    setDealStatus,
    propertyType,
    setPropertyType,
    listingType,
    setListingType,
    totalPages,
    hasActiveFilters,
    refresh,
    stats,
    orderBy,
    setOrderBy,
    orderDirection,
    setOrderDirection,
  };
}
