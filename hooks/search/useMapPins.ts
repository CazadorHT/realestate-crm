"use client";

import { useState, useEffect } from "react";
import type {
  SlimMapPin,
  MapTransitStation,
  MapPinsPayload,
} from "@/lib/services/map-pins";

// Browser-session singleton cache so switching between /properties?view=split and /map triggers 0 extra fetches
let clientPinsSingleton: MapPinsPayload | null = null;
let inflightPromise: Promise<MapPinsPayload> | null = null;

export function useMapPins(
  enabled: boolean,
  initialPayload?: MapPinsPayload | null
) {
  const hasInitialValidData = Boolean(
    initialPayload && Array.isArray(initialPayload.pins) && initialPayload.pins.length > 0
  );
  const hasSingletonValidData = Boolean(
    clientPinsSingleton && Array.isArray(clientPinsSingleton.pins) && clientPinsSingleton.pins.length > 0
  );

  const [data, setData] = useState<MapPinsPayload | null>(() => {
    if (hasInitialValidData) return initialPayload!;
    if (hasSingletonValidData) return clientPinsSingleton;
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(
    Boolean(enabled && !hasInitialValidData && !hasSingletonValidData)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasInitialValidData && !hasSingletonValidData) {
      clientPinsSingleton = initialPayload!;
    }
  }, [hasInitialValidData, hasSingletonValidData, initialPayload]);

  useEffect(() => {
    if (!enabled) return;

    if (
      clientPinsSingleton &&
      Array.isArray(clientPinsSingleton.pins) &&
      clientPinsSingleton.pins.length > 0
    ) {
      setData(clientPinsSingleton);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    if (!inflightPromise) {
      inflightPromise = fetch("/api/public/map-pins", {
        method: "GET",
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Failed to load map pins");
          const json = (await res.json()) as MapPinsPayload;
          if (Array.isArray(json.pins) && json.pins.length > 0) {
            clientPinsSingleton = json;
          }
          return json;
        })
        .finally(() => {
          inflightPromise = null;
        });
    }

    inflightPromise
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Map data load error");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    pins: (data?.pins || []) as SlimMapPin[],
    stations: (data?.stations || []) as MapTransitStation[],
    isLoading,
    error,
  };
}
