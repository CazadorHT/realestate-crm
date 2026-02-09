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
    title_en?: string | null;
    title_cn?: string | null;
    image_url?: string | null;
    province?: string | null;
    popular_area?: string | null;
    popular_area_en?: string | null;
    popular_area_cn?: string | null;
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
      icon_key: string;
    }[];
  };
}) {
  useEffect(() => {
    addRecentProperty(property);
    // Fire and forget view increment
    incrementPropertyView(property.id);
  }, [property]);

  return null;
}
