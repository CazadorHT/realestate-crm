"use client";

import { useEffect, useRef } from "react";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";

export function GTMScrollTracker() {
  const trackedDepths = useRef<Set<number>>(new Set());

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
              url: window.location.href
            });
          } catch (e) {}
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
