"use client";

import { useEffect, useRef } from "react";
import { incrementServiceViewAction } from "@/features/services/actions";

interface ServiceViewCounterProps {
  id: string;
  userId?: string;
}

/**
 * ServiceViewCounter: Silent Tracking Component (11/10 Standard)
 * - Automatically increments view count via RPC with Anti-Spam protection.
 * - Silent component (no UI).
 */
export function ServiceViewCounter({ id, userId }: ServiceViewCounterProps) {
  const hasIncremented = useRef(false);

  useEffect(() => {
    // Only increment once per component mount (standard for page views)
    if (hasIncremented.current) return;
    hasIncremented.current = true;

    const trackView = async () => {
      try {
        // Increment view count with 15-minute anti-spam threshold handled by DB RPC
        await incrementServiceViewAction(id, userId);
      } catch (error) {
        // Fail silently to ensure UX is never interrupted for analytics
        console.warn("View tracking deferred:", error);
      }
    };

    trackView();
  }, [id, userId]);

  return null; // Silent 11/10 tracking
}
