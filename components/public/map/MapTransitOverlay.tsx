"use client";

import React, { memo, useMemo } from "react";
import { Marker } from "react-map-gl/maplibre";
import { TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapTransitStation } from "@/lib/services/map-pins";
import type { MapBoundsTuple } from "./useMapClusters";

interface MapTransitOverlayProps {
  stations: MapTransitStation[];
  showTransit: boolean;
  zoom: number;
  bounds: MapBoundsTuple | null;
  language: string;
  activeStationSlugOrName?: string | null;
  onStationClick?: (station: MapTransitStation) => void;
}

function getLocalizedStationLabel(
  station: MapTransitStation,
  language: string
): string {
  if (language === "en") return station.label.en || station.label.th;
  if (language === "cn") return station.label.cn || station.label.en || station.label.th;
  if (language === "ru") return station.label.ru || station.label.en || station.label.th;
  return station.label.th || station.label.en;
}

export const MapTransitOverlay = memo(function MapTransitOverlay({
  stations,
  showTransit,
  zoom,
  bounds,
  language,
  activeStationSlugOrName,
  onStationClick,
}: MapTransitOverlayProps) {
  const visibleStations = useMemo(() => {
    if (!showTransit || stations.length === 0) return [];
    // Hide transit dots when zoomed out to whole-country view (< 10.2) to keep map clean
    if (zoom < 10.2) return [];

    if (!bounds) return stations.slice(0, 120);
    const [west, south, east, north] = bounds;
    const pad = 0.015;

    return stations.filter(
      (s) =>
        s.longitude >= west - pad &&
        s.longitude <= east + pad &&
        s.latitude >= south - pad &&
        s.latitude <= north + pad
    );
  }, [stations, showTransit, zoom, bounds]);

  if (!showTransit || visibleStations.length === 0) return null;

  const showFullLabel = zoom >= 13;
  const normalizedActive = (activeStationSlugOrName || "").trim().toLowerCase();

  return (
    <>
      {visibleStations.map((station) => {
        const label = getLocalizedStationLabel(station, language);
        const isHighlighted =
          !!normalizedActive &&
          (station.slug.toLowerCase() === normalizedActive ||
            station.code.toLowerCase() === normalizedActive ||
            station.label.th.toLowerCase().includes(normalizedActive) ||
            station.label.en.toLowerCase().includes(normalizedActive));

        return (
          <Marker
            key={station.code}
            longitude={station.longitude}
            latitude={station.latitude}
            anchor="center"
            style={{ zIndex: isHighlighted ? 18 : 10 }}
          >
            {showFullLabel || isHighlighted ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStationClick?.(station);
                }}
                title={`${station.transitType} • ${label}`}
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border shadow-xs transition-transform duration-150 hover:scale-105 cursor-pointer select-none whitespace-nowrap",
                  isHighlighted
                    ? "bg-slate-900 text-white border-white ring-2 ring-blue-500/50 text-[11px] font-bold"
                    : "bg-white/92 backdrop-blur-xs text-slate-700 border-slate-200/90 text-[10px] font-semibold hover:bg-white"
                )}
              >
                <span
                  className="w-3.5 h-3.5 rounded-xs flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: station.lineColor }}
                >
                  <TrainFront className="w-2.5 h-2.5" />
                </span>
                <span className="max-w-[115px] truncate">{label}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStationClick?.(station);
                }}
                title={`${station.transitType} • ${label}`}
                aria-label={label}
                className="w-3 h-3 rounded-full border-[1.5px] border-white shadow-xs transition-transform hover:scale-150 cursor-pointer"
                style={{ backgroundColor: station.lineColor }}
              />
            )}
          </Marker>
        );
      })}
    </>
  );
});

interface TransitToggleButtonProps {
  showTransit: boolean;
  onToggle: () => void;
  language: string;
  className?: string;
}

export function TransitToggleButton({
  showTransit,
  onToggle,
  language,
  className = "",
}: TransitToggleButtonProps) {
  const label =
    language === "th"
      ? "สถานี BTS/MRT"
      : language === "cn"
        ? "地铁/轻轨站"
        : language === "ru"
          ? "Метро BTS/MRT"
          : "BTS / MRT";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={showTransit}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md border transition-all cursor-pointer select-none",
        showTransit
          ? "bg-white text-slate-800 border-emerald-500/50 ring-2 ring-emerald-500/15 hover:bg-emerald-50"
          : "bg-white text-slate-500 border-slate-200 hover:bg-white hover:text-slate-700",
        className
      )}
    >
      <span
        className={cn(
          "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
          showTransit
            ? "bg-emerald-500 text-white"
            : "bg-slate-200 text-slate-500"
        )}
      >
        <TrainFront className="w-2.5 h-2.5" />
      </span>
      <span>{label}</span>
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          showTransit ? "bg-emerald-500" : "bg-slate-300"
        )}
      />
    </button>
  );
}
