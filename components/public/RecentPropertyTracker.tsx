"use client";

import { useEffect } from "react";
import { addRecentProperty } from "@/lib/recent-properties";
import { incrementPropertyView } from "@/features/properties/actions";
import { updateAIScore, trackPropertyPreference } from "@/lib/analytics-utils";

const BOT_REGEX =
  /bot|spider|crawl|slurp|lighthouse|google|bing|yandex|duckduckbot|baiduspider|skypeuripreview|facebookexternalhit|twitterbot|linkedinbot|embedly|quora|pinterest|slackbot|redditbot|applebot|whatsapp|telegrambot/i;

export function RecentPropertyTracker({
  property,
}: {
  property: {
    id: string;
    title: string;
    title_en?: string | null;
    title_cn?: string | null;
    title_ru?: string | null;
    image_url?: string | null;
    province?: string | null;
    popular_area?: string | null;
    popular_area_en?: string | null;
    popular_area_cn?: string | null;
    popular_area_ru?: string | null;
    price?: number | null;
    original_price?: number | null;
    rental_price?: number | null;
    original_rental_price?: number | null;
    price_per_sqm?: number | null;
    rent_price_per_sqm?: number | null;
    size_sqm?: number | null;
    price_text?: string | null;
    property_type?: string | null;
    listing_type?: string | null;
    slug?: string | null;
    features?: {
      id: string;
      name: string;
      name_en?: string | null;
      name_cn?: string | null;
      name_ru?: string | null;
      icon_key: string;
    }[];
  };
}) {
  useEffect(() => {
    addRecentProperty(property);

    // Client-side guard: Never trigger Server Action POST requests for search crawlers/bots
    if (typeof navigator !== "undefined" && BOT_REGEX.test(navigator.userAgent)) {
      return;
    }

    // Session deduplication: Only count view once per session per property to avoid duplicate POSTs
    const sessionKey = `viewed_${property.id}`;
    if (typeof sessionStorage !== "undefined" && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "1");
      incrementPropertyView(property.id);
    }

    updateAIScore(5);

    // Track preference for AI matching
    if (property.property_type) {
      trackPropertyPreference(property.property_type);
    }
  }, [property]);

  return null;
}
