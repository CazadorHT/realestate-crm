"use client";

import { useEffect } from "react";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";

interface GTMPropertyPageViewProps {
  property: {
    id: string;
    title: string;
    listing_type: string;
    property_type: string;
    price: number | null;
    original_price: number | null;
    rental_price: number | null;
    original_rental_price: number | null;
    province: string | null;
    popular_area: string | null;
  };
}

export function GTMPropertyPageView({ property }: GTMPropertyPageViewProps) {
  useEffect(() => {
    try {
      pushToDataLayer(GTM_EVENTS.VIEW_ITEM, {
        item_id: property.id,
        item_name: property.title,
        item_category: property.property_type,
        item_variant: property.listing_type,
        price: property.price,
        rental_price: property.rental_price,
        original_price: property.original_price,
        original_rental_price: property.original_rental_price,
        active_price: property.listing_type === "RENT" ? property.rental_price : property.price,
        location_id: property.province,
        popular_area: property.popular_area,
      });
      
      // Viewing a property page gives a base engagement score
      updateAIScore(5);
    } catch (e) {
      console.error("GTM View Item Error:", e);
    }
  }, [property]);

  return null;
}
