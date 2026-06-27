"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { PropertyCardProps } from "@/components/public/PropertyCard";
import { PropertyFacets, PropertySearchResponse } from "@/features/properties/types/search";

type ApiProperty = PropertyCardProps;

/**
 * 🛡️ Fortress-Ready Data Hook
 * Performs server-side searching, filtering, and pagination.
 */
export function usePropertyData(initialProperties?: ApiProperty[], initialFacets?: PropertyFacets | null) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<ApiProperty[]>(initialProperties || []);
  const [facets, setFacets] = useState<PropertyFacets | null>(initialFacets || null);
  const [isLoading, setIsLoading] = useState(properties.length === 0);
  const [isRefetching, setIsRefetching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (isFirstLoadRef.current && initialProperties && initialProperties.length > 0) {
      isFirstLoadRef.current = false;
      return;
    }

    async function load() {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          console.warn("usePropertyData: failed to abort previous fetch", e);
        }
      }
      
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (isFirstLoadRef.current && properties.length === 0) {
          setIsLoading(true);
        } else {
          setIsRefetching(true);
        }
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
        
        // Handle New S-Tier Structure
        if (data && typeof data === 'object' && 'properties' in data) {
          const props = Array.isArray(data.properties) ? data.properties : [];
          setProperties(props);
          setFacets(data.facets || null);

          // 📊 Analytics Seal: Track results impression
          if (props.length > 0) {
            pushToDataLayer(GTM_EVENTS.VIEW_ITEM_LIST, {
              item_list_id: "public_search",
              item_list_name: "Public Search Results",
              items: props.map((p: any, index: number) => ({
                item_id: p.id,
                item_name: p.title,
                price: p.price || p.rental_price,
                item_category: p.property_type,
                index: index + 1
              }))
            });
          }
        } else {
          // Fallback for legacy calls
          const props = Array.isArray(data) ? data : [];
          setProperties(props);
        }
      } catch (err: any) {
        if (err.name === "AbortError" || err.message?.includes("aborted")) return;
        console.error("usePropertyData fetch error:", err);
        
        // 📊 Analytics Seal: Track system error
        pushToDataLayer(GTM_EVENTS.SYSTEM_ERROR, {
          error_message: err instanceof Error ? err.message : String(err),
          source: "usePropertyData",
        });

        toast.error(t("common.error") || "Error loading listings");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefetching(false);
          isFirstLoadRef.current = false;
        }
      }
    }

    load();

    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          console.warn("usePropertyData: failed to abort fetch on cleanup", e);
        }
      }
    };
  }, [searchParams, t]);

  return { properties, facets, isLoading, isRefetching };
}
