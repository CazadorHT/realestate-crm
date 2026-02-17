"use client";

import { useState, useEffect, useMemo } from "react";
import { DealWithProperty } from "../types";

export function useDealsTable(
  initialData: DealWithProperty[] = [],
  initialCount: number = 0,
  initialPage: number = 1,
  pageSize: number = 20,
) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState(initialData);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<
    string | undefined
  >(undefined);
  const [selectedLeadId, setSelectedLeadId] = useState<string | undefined>(
    undefined,
  );
  const [reloadKey, setReloadKey] = useState(0);

  // Sync state with props
  useEffect(() => {
    setData(initialData);
    setCount(initialCount);
  }, [initialData, initialCount]);

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
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (selectedPropertyId !== undefined)
        params.set("property_id", selectedPropertyId);
      if (selectedLeadId !== undefined) params.set("lead_id", selectedLeadId);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (!mounted) return;
      if (res.ok) {
        const payload = await res.json();
        setData(payload.data ?? []);
        setCount(payload.count ?? 0);
      } else {
        console.error("/api/deals fetch error:", res.status);
        setData([]);
        setCount(0);
      }
      setLoading(false);
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
  ]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const hasActiveFilters = useMemo(
    () => !!(selectedPropertyId || selectedLeadId || debouncedQ),
    [selectedPropertyId, selectedLeadId, debouncedQ],
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
    selectedPropertyId,
    setSelectedPropertyId,
    selectedLeadId,
    setSelectedLeadId,
    totalPages,
    hasActiveFilters,
    refresh,
  };
}
