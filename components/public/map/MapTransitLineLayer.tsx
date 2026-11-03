"use client";

import React, { memo, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Source, Layer, Marker } from "react-map-gl/maplibre";
import { FaPersonWalking, FaCarSide } from "react-icons/fa6";
import type { MapTransitStation } from "@/lib/services/map-pins";
import type { MapLocationGroup } from "./useMapClusters";
import {
  computeTransitTravelInfo,
  getTransitLogo,
  getTransitTypeLabel,
} from "./map-price-utils";

interface MapTransitLineLayerProps {
  activeGroup: MapLocationGroup | null;
  stations: MapTransitStation[];
  language: string;
  overrideStation?: MapTransitStation | null;
}

// Global in-memory cache for street routing walking/driving geometries across pins
const streetRouteCache = new Map<string, [number, number][]>();

function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export const MapTransitLineLayer = memo(function MapTransitLineLayer({
  activeGroup,
  stations,
  language,
  overrideStation,
}: MapTransitLineLayerProps) {
  const transitTarget = useMemo(() => {
    if (!activeGroup || (stations.length === 0 && !overrideStation)) return null;

    const leadUnit = activeGroup.units[0];
    const stationName = overrideStation
      ? (overrideStation.label?.th || overrideStation.slug).toLowerCase()
      : leadUnit?.transit_station_name?.trim().toLowerCase();
    const stationNameEn = overrideStation
      ? (overrideStation.label?.en || "").toLowerCase()
      : leadUnit?.transit_station_name_en?.trim().toLowerCase();

    // 1. Look up user-entered transit data in nearby_transits (exact time & distance)
    let nearbyItemDist: number | null = null;
    let nearbyItemTime: string | null = null;

    if (Array.isArray(leadUnit?.nearby_transits)) {
      for (const t of leadUnit.nearby_transits as any[]) {
        if (!t) continue;
        const sName = (t.station_name || "").trim().toLowerCase();
        const sNameEn = (t.station_name_en || "").trim().toLowerCase();
        if (
          (stationName && (sName.includes(stationName) || stationName.includes(sName))) ||
          (stationNameEn && (sNameEn.includes(stationNameEn) || stationNameEn.includes(sNameEn)))
        ) {
          if (t.distance_meters != null && t.distance_meters > 0) {
            nearbyItemDist = Number(t.distance_meters);
          }
          if (t.time && typeof t.time === "string" && t.time.trim()) {
            nearbyItemTime = t.time.trim();
          }
          break;
        }
      }
    }

    const explicitDist =
      nearbyItemDist != null
        ? nearbyItemDist
        : leadUnit?.transit_distance_meters && leadUnit.transit_distance_meters > 0
          ? leadUnit.transit_distance_meters
          : null;

    const explicitTime = nearbyItemTime;

    let matchedStation: MapTransitStation | null = overrideStation || null;

    if (!matchedStation && (stationName || stationNameEn)) {
      matchedStation =
        stations.find((s) => {
          const thName = s.label.th.toLowerCase();
          const enName = s.label.en.toLowerCase();
          const slug = s.slug.toLowerCase();
          const code = s.code.toLowerCase();

          return (
            (stationName &&
              (thName === stationName ||
                enName === stationName ||
                slug.includes(stationName) ||
                code === stationName ||
                stationName.includes(thName) ||
                stationName.includes(slug))) ||
            (stationNameEn &&
              (enName === stationNameEn ||
                thName === stationNameEn ||
                slug.includes(stationNameEn) ||
                stationNameEn.includes(enName)))
          );
        }) || null;
    }

    // Fallback: Geographically closest station within reasonable range
    if (!matchedStation) {
      let minD = Infinity;
      for (const s of stations) {
        if (!Number.isFinite(s.latitude) || !Number.isFinite(s.longitude)) continue;
        const d = Math.hypot(
          s.longitude - activeGroup.longitude,
          s.latitude - activeGroup.latitude
        );
        if (d < minD) {
          minD = d;
          matchedStation = s;
        }
      }
    }

    if (!matchedStation) return null;
    if (!Number.isFinite(matchedStation.latitude) || !Number.isFinite(matchedStation.longitude)) {
      return null;
    }

    // Real GPS geographic distance on the map between property pin and station coordinate
    const geoDistanceMeters = haversineDistanceMeters(
      activeGroup.latitude,
      activeGroup.longitude,
      matchedStation.latitude,
      matchedStation.longitude
    );

    // Business distance (prefers user-entered explicit distance, falls back to GPS distance)
    const distanceMeters =
      explicitDist && explicitDist > 0 ? explicitDist : geoDistanceMeters;

    // If farther than 8km, it's not a transit-oriented urban property
    if (distanceMeters > 8000 && geoDistanceMeters > 8000) return null;

    // isGeoCoLocated: GPS coords are practically the same (< 80m)
    const isGeoCoLocated = geoDistanceMeters < 80;

    const travel = computeTransitTravelInfo({
      distanceMeters,
      explicitTime,
      language,
    });

    const isWalk = travel.isWalk;
    const distLabel = travel.distLabel;
    const displayMins = travel.timeLabel;

    const stationLabel =
      language === "th"
        ? matchedStation.label.th
        : matchedStation.label.en || matchedStation.label.th;

    // Human-readable friendly transit line label (e.g. MRT สายสีเหลือง, MRT สายสีม่วง, BTS)
    const transitTypeLabel = getTransitTypeLabel(matchedStation.transitType, language);

    // Determine directional anchor for the station badge to push it away from incoming route
    const dLat = matchedStation.latitude - activeGroup.latitude;
    const dLng = matchedStation.longitude - activeGroup.longitude;
    let stationAnchor: "top" | "bottom" | "left" | "right" | "center" = "center";
    let stationOffset: [number, number] = [0, 0];

    if (isGeoCoLocated) {
      stationAnchor = "top";
      stationOffset = [0, 8];
    } else if (Math.abs(dLat) > Math.abs(dLng)) {
      if (dLat > 0) {
        // Station is North -> anchor bottom pushes badge North
        stationAnchor = "bottom";
        stationOffset = [0, -6];
      } else {
        // Station is South -> anchor top pushes badge South
        stationAnchor = "top";
        stationOffset = [0, 6];
      }
    } else {
      if (dLng > 0) {
        // Station is East -> anchor left pushes badge East
        stationAnchor = "left";
        stationOffset = [6, 0];
      } else {
        // Station is West -> anchor right pushes badge West
        stationAnchor = "right";
        stationOffset = [-6, 0];
      }
    }

    return {
      station: matchedStation,
      distanceMeters,
      geoDistanceMeters,
      isGeoCoLocated,
      isWalk,
      displayMins,
      distLabel,
      stationLabel,
      transitTypeLabel,
      stationAnchor,
      stationOffset,
    };
  }, [activeGroup, stations, language, overrideStation]);

  // Dynamic Turn-by-Turn Street Routing via internal Next.js API (/api/public/transit-route)
  const [streetCoordinates, setStreetCoordinates] = useState<[number, number][] | null>(null);

  const routeCacheKey = useMemo(() => {
    if (!transitTarget || !activeGroup || transitTarget.isGeoCoLocated) return null;
    const mode = transitTarget.isWalk ? "walk" : "drive";
    return `${mode}:${activeGroup.longitude.toFixed(5)},${activeGroup.latitude.toFixed(5)}->${transitTarget.station.longitude.toFixed(5)},${transitTarget.station.latitude.toFixed(5)}`;
  }, [activeGroup, transitTarget]);

  useEffect(() => {
    if (!routeCacheKey || !transitTarget || !activeGroup || transitTarget.isGeoCoLocated) {
      setStreetCoordinates(null);
      return;
    }

    if (streetRouteCache.has(routeCacheKey)) {
      setStreetCoordinates(streetRouteCache.get(routeCacheKey)!);
      return;
    }

    const controller = new AbortController();
    const mode = transitTarget.isWalk ? "walk" : "drive";
    const start = `${activeGroup.longitude},${activeGroup.latitude}`;
    const end = `${transitTarget.station.longitude},${transitTarget.station.latitude}`;
    const url = `/api/public/transit-route?start=${start}&end=${end}&mode=${mode}`;

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Transit route calculation failed");
        return res.json();
      })
      .then((data) => {
        const coords = data?.coordinates as [number, number][] | undefined;
        if (Array.isArray(coords) && coords.length > 1) {
          streetRouteCache.set(routeCacheKey, coords);
          setStreetCoordinates(coords);
        } else {
          const direct = [
            [activeGroup.longitude, activeGroup.latitude],
            [transitTarget.station.longitude, transitTarget.station.latitude],
          ] as [number, number][];
          streetRouteCache.set(routeCacheKey, direct);
          setStreetCoordinates(direct);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          const direct = [
            [activeGroup.longitude, activeGroup.latitude],
            [transitTarget.station.longitude, transitTarget.station.latitude],
          ] as [number, number][];
          setStreetCoordinates(direct);
        }
      });

    return () => {
      controller.abort();
    };
  }, [routeCacheKey, transitTarget, activeGroup]);

  if (!transitTarget || !activeGroup) return null;

  const {
    station,
    isGeoCoLocated,
    isWalk,
    displayMins,
    distLabel,
    stationLabel,
    transitTypeLabel,
    stationAnchor,
    stationOffset,
  } = transitTarget;

  const lineColor = station.lineColor || "#2563EB";
  const isLongName = `${transitTypeLabel} ${stationLabel}`.trim().length >= 16;

  // Coordinates following the street network (with immediate straight-line fallback while loading)
  const activeCoordinates: [number, number][] =
    !isGeoCoLocated && streetCoordinates && streetCoordinates.length > 1
      ? streetCoordinates
      : [
          [activeGroup.longitude, activeGroup.latitude],
          [station.longitude, station.latitude],
        ];

  const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: isGeoCoLocated ? [] : activeCoordinates,
    },
  };

  return (
    <>
      {/* 1. Vector Map GeoJSON Line Following Actual Road / Street Network */}
      {!isGeoCoLocated && activeCoordinates.length > 0 && (
        <Source id="transit-guide-source" type="geojson" data={geojson}>
          {/* Halo / Casing for High Contrast over Map Tile Streets */}
          <Layer
            id="transit-guide-casing"
            type="line"
            paint={{
              "line-color": "#ffffff",
              "line-width": 6,
              "line-opacity": 0.9,
            }}
            layout={{
              "line-join": "round",
              "line-cap": "round",
            }}
          />
          {/* Main Dashed Transit Line along streets */}
          <Layer
            id="transit-guide-line"
            type="line"
            paint={{
              "line-color": lineColor,
              "line-width": 3.5,
              "line-dasharray": [2, 2],
              "line-opacity": 0.95,
            }}
            layout={{
              "line-join": "round",
              "line-cap": "round",
            }}
          />
        </Source>
      )}

      {/* 2. Primary Station Name Badge at Destination Station (อยู่ที่ปลายทางสถานีเสมอ) */}
      <Marker
        longitude={isGeoCoLocated ? activeGroup.longitude : station.longitude}
        latitude={isGeoCoLocated ? activeGroup.latitude : station.latitude}
        anchor={stationAnchor}
        offset={stationOffset}
        style={{ zIndex: 30, pointerEvents: "none" }}
      >
        <div className="pointer-events-none flex items-center select-none animate-in fade-in zoom-in-95 duration-150">
          {isLongName ? (
            /* Multi-line badge for long station names (e.g. Airport Rail Link รามคำแหง) */
            <div
              className="flex flex-col items-start gap-1 px-3 py-1.5 rounded-2xl bg-white text-slate-900 shadow-xl border-2 whitespace-nowrap"
              style={{ borderColor: lineColor }}
            >
              <div className="flex items-center gap-1.5">
                <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                  <Image
                    src={getTransitLogo(station.transitType)}
                    alt={station.transitType}
                    width={16}
                    height={16}
                    className="object-contain w-4 h-4"
                  />
                </div>
                <span className="text-slate-900 font-extrabold tracking-tight text-xs">
                  {transitTypeLabel} {stationLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pl-5.5 text-slate-600 font-bold text-[11px]">
                {isWalk ? (
                  <FaPersonWalking className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <FaCarSide className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
                <span>
                  {distLabel}
                  {displayMins ? ` (${displayMins})` : ""}
                </span>
              </div>
            </div>
          ) : (
            /* Single-row pill badge for compact station names (e.g. BTS พญาไท) */
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-900 text-xs font-extrabold shadow-xl border-2 whitespace-nowrap"
              style={{ borderColor: lineColor }}
            >
              <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                <Image
                  src={getTransitLogo(station.transitType)}
                  alt={station.transitType}
                  width={16}
                  height={16}
                  className="object-contain w-4 h-4"
                />
              </div>
              <span className="text-slate-900 font-extrabold tracking-tight">
                {transitTypeLabel} {stationLabel}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500 font-semibold text-[11px] shrink-0">
                <span className="text-slate-300">•</span>
                {isWalk ? (
                  <FaPersonWalking className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <FaCarSide className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
                <span>
                  {distLabel}
                  {displayMins ? ` (${displayMins})` : ""}
                </span>
              </span>
            </div>
          )}
        </div>
      </Marker>
    </>
  );
});