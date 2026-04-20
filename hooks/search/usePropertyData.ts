"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { PropertyCardProps } from "@/components/public/PropertyCard";

type ApiProperty = PropertyCardProps;

/**
 * 🛡️ Fortress-Ready Data Hook
 * Performs server-side searching, filtering, and pagination.
 */
export function usePropertyData(initialProperties?: ApiProperty[]) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<ApiProperty[]>(initialProperties || []);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function load() {
      // Cancel previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsLoading(true);

        // Map searchParams to API query strings
        // Note: usePropertyFilters hook already syncs state to URL,
        // so we can rely on the URL as the Single Source of Truth.
        const query = searchParams.toString();
        const url = `/api/public/properties${query ? `?${query}` : ""}`;

        const res = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to load properties");
        }

        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (err: any) {
        // Don't toast on user abortion
        if (err.name === "AbortError") return;

        console.error("usePropertyData fetch error:", err);
        pushToDataLayer(GTM_EVENTS.SYSTEM_ERROR, {
          error_message: err instanceof Error ? err.message : String(err),
          source: "usePropertyData",
        });

        toast.error(
          t("common.error") || "Error loading listings: " + (err.message || String(err))
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchParams, t]);

  return { properties, isLoading };
}
