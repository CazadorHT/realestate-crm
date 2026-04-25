"use client";

import { useEffect, useRef } from "react";
import { GTM_EVENTS, pushToDataLayer } from "@/lib/gtm";

interface SectionTrackingOptions {
  sectionId: string;
  category?: string;
  threshold?: number; // Minimum seconds to count as interested
}

/**
 * Hook to track how long a user spends looking at a specific section.
 * Useful for analyzing user interest and adapting UI dynamically.
 */
export function useSectionTracking({
  sectionId,
  category,
  threshold = 2,
}: SectionTrackingOptions) {
  const startTimeRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting) {
        // User entered the section
        startTimeRef.current = Date.now();
      } else {
        // User left the section
        if (startTimeRef.current) {
          const endTime = Date.now();
          const durationSeconds = Math.round((endTime - startTimeRef.current) / 1000);

          if (durationSeconds >= threshold) {
            // 1. Push to DataLayer for GTM/GA4
            pushToDataLayer(GTM_EVENTS.SECTION_DWELL_TIME, {
              section_id: sectionId,
              category: category || sectionId,
              duration_seconds: durationSeconds,
            });

            // 2. Save to Local Interest Store for Dynamic UI
            if (category) {
              updateLocalInterest(category, durationSeconds);
            }
          }
          startTimeRef.current = null;
        }
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.5, // Section must be at least 50% visible
    });

    const el = document.getElementById(sectionId);
    if (el) {
      sectionRef.current = el;
      observerRef.current.observe(el);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [sectionId, category, threshold]);
}

/**
 * Helper to update local user interest scores
 */
function updateLocalInterest(category: string, duration: number) {
  if (typeof window === "undefined") return;

  try {
    const STORAGE_KEY = "user_category_interest";
    const raw = localStorage.getItem(STORAGE_KEY);
    const scores: Record<string, number> = raw ? JSON.parse(raw) : {};

    // Interest score is a combination of visits and duration
    // Each second adds 1 point, plus a base 5 points for "entering"
    scores[category] = (scores[category] || 0) + duration + 5;

    // Keep only top 5 interests to save space
    const sortedKeys = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    const topInterests = sortedKeys.slice(0, 5).reduce((acc, key) => {
      acc[key] = scores[key];
      return acc;
    }, {} as Record<string, number>);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(topInterests));
    
    // Trigger custom event so other components can react
    window.dispatchEvent(new CustomEvent("interest-updated", { detail: { category, scores: topInterests } }));
  } catch (e) {
    console.error("Failed to update local interest:", e);
  }
}

/**
 * Helper to get the top interested category
 */
export function getTopInterest(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user_category_interest");
    if (!raw) return null;
    const scores: Record<string, number> = JSON.parse(raw);
    const sorted = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
    return sorted[0] || null;
  } catch {
    return null;
  }
}
