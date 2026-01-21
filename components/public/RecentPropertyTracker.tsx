"use client";

import { useEffect } from "react";
import { addRecentProperty } from "@/lib/recent-properties";
import { incrementPropertyView } from "@/features/properties/actions";

export function RecentPropertyTracker({
  property,
}: {
  property: {
    id: string;
    title: string;
    image_url?: string | null;
    province?: string | null;
    popular_area?: string | null;
    price_text?: string | null;
    property_type?: string | null;
    listing_type?: string | null;
    slug?: string | null;
    features?: { id: string; name: string; icon_key: string }[];
  };
}) {
  useEffect(() => {
    addRecentProperty(property);
    // Fire and forget view increment
    incrementPropertyView(property.id);
  }, [property]);

  return null;
}
