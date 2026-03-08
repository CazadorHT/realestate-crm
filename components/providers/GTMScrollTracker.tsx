"use client";

import { useEffect, useRef, useState } from "react";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

export function GTMScrollTracker() {
  const trackedDepths = useRef<Set<number>>(new Set());
  const [propertyContext, setPropertyContext] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const handleContext = (e: any) => {
      if (e.detail) {
        setPropertyContext(e.detail);
        // Reset tracking when property changes
        trackedDepths.current.clear();
      }
    };

    window.addEventListener("property-context-ready", handleContext);
    return () => window.removeEventListener("property-context-ready", handleContext);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      const scrollPercent = Math.round(((scrollTop + clientHeight) / scrollHeight) * 100);

      // We only care about 80% marks as requested
      const checkpoints = [80];
      
      checkpoints.forEach(checkpoint => {
        if (scrollPercent >= checkpoint && !trackedDepths.current.has(checkpoint)) {
          trackedDepths.current.add(checkpoint);
          try {
            pushToDataLayer(GTM_EVENTS.SCROLL_DEPTH, {
              percent: checkpoint,
              url: window.location.href,
              item_id: propertyContext?.id,
              item_name: propertyContext?.title,
            });
          } catch (e) {}
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [propertyContext]);

  return null;
}
