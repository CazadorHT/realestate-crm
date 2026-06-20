"use client";

import { useEffect } from "react";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";
import { generateMetaEventId, sendMetaCAPIEvent } from "@/lib/meta-capi-utils";

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
      const eventId = generateMetaEventId("view_item", property.id);
      const priceValue =
        property.listing_type === "RENT"
          ? property.rental_price ?? 0
          : property.price ?? 0;

      pushToDataLayer(GTM_EVENTS.VIEW_ITEM, {
        event_id: eventId,
        item_id: property.id,
        item_name: property.title,
        item_category: property.property_type,
        item_variant: property.listing_type,
        price: property.price,
        rental_price: property.rental_price,
        original_price: property.original_price,
        original_rental_price: property.original_rental_price,
        active_price: priceValue,
        location_id: property.province,
        popular_area: property.popular_area,
        content_ids: [property.id],
        content_name: property.title,
        content_type: "home_listing",
        content_category: property.property_type,
        value: priceValue,
        currency: "THB",
      });

      void sendMetaCAPIEvent({
        eventName: "ViewContent",
        eventId,
        customData: {
          contentIds: [property.id],
          contentName: property.title,
          contentType: "home_listing",
          value: priceValue,
          currency: "THB",
        },
      });
      
      // Viewing a property page gives a base engagement score
      updateAIScore(5);

      // Dispatch context for other trackers (like Scroll Depth)
      window.dispatchEvent(
        new CustomEvent("property-context-ready", {
          detail: { id: property.id, title: property.title },
        }),
      );
    } catch (e) {
      console.error("GTM View Item Error:", e);
    }
  }, [property]);

  return null;
}
