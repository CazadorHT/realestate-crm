"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { PropertyCardProps } from "@/components/public/PropertyCard";

type ApiProperty = PropertyCardProps;

export function usePropertyData(initialProperties?: ApiProperty[]) {
  const { t } = useLanguage();
  const [properties, setProperties] = useState<ApiProperty[]>(
    initialProperties || [],
  );
  const [isLoading, setIsLoading] = useState(!initialProperties);

  useEffect(() => {
    // Skip loading if initialProperties provided
    if (initialProperties) return;

    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/public/properties", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Load failed");
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("PropertySearchPage fetch error:", err);
        pushToDataLayer(GTM_EVENTS.SYSTEM_ERROR, {
          error_message: err instanceof Error ? err.message : String(err),
          source: "PropertySearchPage",
        });
        toast.error(
          t("common.error") ||
            "Load failed: " +
              (err instanceof Error ? err.message : String(err)),
        );
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [initialProperties, t]);

  return { properties, isLoading };
}
