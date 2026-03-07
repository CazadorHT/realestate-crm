"use client";

import { useEffect } from "react";
import { captureUtmParams } from "@/lib/analytics-utils";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Capture UTMs on mount and when URL changes
    captureUtmParams();
  }, [pathname, searchParams]);

  return null;
}
