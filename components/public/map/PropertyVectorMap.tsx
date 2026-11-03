"use client";

import React, {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Map, {
  GeolocateControl,
  Marker,
  NavigationControl,
  Source,
  Layer,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, Check, Compass, Loader2, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { MapTransitStation, SlimMapPin } from "@/lib/services/map-pins";
import {
  useMapClusters,
  type MapBoundsTuple,
  type MapLocationGroup,
} from "./useMapClusters";
import { PricePillMarker } from "./PricePillMarker";
import { MapSlideablePropertyCard } from "./MapSlideablePropertyCard";
import { MapTransitOverlay, TransitToggleButton } from "./MapTransitOverlay";
import { MapTransitLineLayer } from "./MapTransitLineLayer";
import {
  createGeoJSONCircle,
  getTransitLogo,
  getTransitTypeLabel,
  haversineDistanceMeters,
} from "./map-price-utils";

// Explicitly bind MapLibre v6 Web Worker to our self-hosted public worker script
// (Prevents Next.js / Turbopack chunk URL 404 on dynamic `import.meta.url`)
if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.js");
}

const MAP_STYLE_PRIMARY = "https://tiles.openfreemap.org/styles/bright";
const MAP_STYLE_FALLBACK =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

// Default center: Sukhumvit / Central Bangkok where primary inventory & BTS/MRT converge
const DEFAULT_BANGKOK_VIEW = {
  longitude: 100.5602,
  latitude: 13.7425,
  zoom: 11.6,
};

function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Dynamically localizes OpenMapTiles / OpenFreeMap / Carto vector basemap symbol labels
 * (`name:th`, `name:en`, `name:zh`, `name:ru`) in-memory with zero extra API requests.
 */
function applyMapBasemapLanguage(
  mapInstance: maplibregl.Map | undefined | null,
  language: string
): void {
  if (!mapInstance) return;
  try {
    const style = mapInstance.getStyle();
    if (!style?.layers) return;

    const labelExpr: maplibregl.ExpressionSpecification =
      language === "en"
        ? [
            "coalesce",
            ["get", "name:en"],
            ["get", "name_en"],
            ["get", "name:latin"],
            ["get", "name"],
          ]
        : language === "cn"
          ? [
              "coalesce",
              ["get", "name:zh"],
              ["get", "name:zh-Hans"],
              ["get", "name_zh"],
              ["get", "name:en"],
              ["get", "name:latin"],
              ["get", "name"],
            ]
          : language === "ru"
            ? [
                "coalesce",
                ["get", "name:ru"],
                ["get", "name_ru"],
                ["get", "name:en"],
                ["get", "name:latin"],
                ["get", "name"],
              ]
            : [
                "coalesce",
                ["get", "name:th"],
                ["get", "name_th"],
                ["get", "name"],
                ["get", "name:en"],
                ["get", "name:latin"],
              ];

    for (const layer of style.layers) {
      if (layer.type !== "symbol") continue;
      const existingField = layer.layout?.["text-field"];
      if (!existingField) continue;
      const serialized = JSON.stringify(existingField);
      // Only localize place/road/POI name layers; preserve highway route shields ({ref}) & icons
      if (!serialized.includes("name")) continue;
      mapInstance.setLayoutProperty(layer.id, "text-field", labelExpr);
    }
  } catch {
    // Style may still be mid-transition; safe to ignore until onLoad / style update completes
  }
}

type SmartPlacement = "top" | "bottom" | "right" | "left";

interface SmartPopupLayout {
  left: number;
  top: number;
  maxHeight: number;
  placement: SmartPlacement;
  arrowOffset: number;
}

/**
 * International Floating-UI style autoPlacement + viewport shift/clamp:
 * Automatically chooses Top, Bottom, Right, or Left of the clicked Price Pill
 * and strictly clamps within the visible map viewport so 0px of the card is ever cut off.
 */
function computeSmartPopupLayout(params: {
  pinX: number;
  pinY: number;
  cw: number;
  ch: number;
  cardW: number;
  cardH: number;
}): SmartPopupLayout {
  const { pinX, pinY, cw, ch, cardW, cardH } = params;

  const PAD_X = 14;
  const PAD_TOP = 56; // Clears top floating filter/transit controls bar
  const PAD_BOTTOM = 16;
  const PILL_H = 38;
  const PILL_HALF_W = 54;
  const GAP = 12;

  const maxHeight = Math.max(240, ch - PAD_TOP - PAD_BOTTOM);
  const effectiveCardH = Math.min(cardH, maxHeight);
  const pinCenterY = pinY - PILL_H / 2;

  const rawTop = pinY - PILL_H - GAP - effectiveCardH;
  const fitsTop =
    rawTop >= PAD_TOP && rawTop + effectiveCardH <= ch - PAD_BOTTOM;

  const rawBottomTop = pinY + GAP;
  const fitsBottom =
    rawBottomTop >= PAD_TOP && rawBottomTop + effectiveCardH <= ch - PAD_BOTTOM;

  const rawRightLeft = pinX + PILL_HALF_W + GAP;
  const fitsRight = rawRightLeft + cardW <= cw - PAD_X;

  const rawLeftLeft = pinX - PILL_HALF_W - GAP - cardW;
  const fitsLeft = rawLeftLeft >= PAD_X;

  let placement: SmartPlacement;
  let idealLeft: number;
  let idealTop: number;

  if (fitsTop) {
    placement = "top";
    idealLeft = pinX - cardW / 2;
    idealTop = rawTop;
  } else if (fitsBottom) {
    placement = "bottom";
    idealLeft = pinX - cardW / 2;
    idealTop = rawBottomTop;
  } else if (pinX < cw / 2) {
    if (fitsRight || cw - pinX >= pinX) {
      placement = "right";
      idealLeft = rawRightLeft;
      idealTop = pinCenterY - effectiveCardH / 2;
    } else {
      placement = "left";
      idealLeft = rawLeftLeft;
      idealTop = pinCenterY - effectiveCardH / 2;
    }
  } else {
    if (fitsLeft || pinX >= cw - pinX) {
      placement = "left";
      idealLeft = rawLeftLeft;
      idealTop = pinCenterY - effectiveCardH / 2;
    } else {
      placement = "right";
      idealLeft = rawRightLeft;
      idealTop = pinCenterY - effectiveCardH / 2;
    }
  }

  const left = Math.round(
    Math.max(PAD_X, Math.min(idealLeft, Math.max(PAD_X, cw - cardW - PAD_X)))
  );
  const top = Math.round(
    Math.max(
      PAD_TOP,
      Math.min(idealTop, Math.max(PAD_TOP, ch - effectiveCardH - PAD_BOTTOM))
    )
  );

  const arrowOffset =
    placement === "top" || placement === "bottom"
      ? Math.round(Math.max(24, Math.min(cardW - 24, pinX - left)))
      : Math.round(
          Math.max(28, Math.min(effectiveCardH - 28, pinCenterY - top))
        );

  return {
    left,
    top,
    maxHeight,
    placement,
    arrowOffset,
  };
}

class MapErrorBoundary extends Component<
  {
    fallback: React.ReactNode;
    children: React.ReactNode;
  },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export interface PropertyVectorMapProps {
  /** Filtered pins matching current search criteria */
  filteredPins: SlimMapPin[];
  /** Transit stations master list */
  stations: MapTransitStation[];
  /** Loading state of map pins fetch */
  isLoading?: boolean;
  /** Current listingType filter ("SALE", "RENT", "ALL", "") */
  activeListingFilter?: string;
  /** Currently selected transit station slug/name in filter */
  activeStationFilter?: string;
  /** Signature string that triggers auto-fitBounds when location/province/station filters change */
  locationFilterSignature?: string;
  /** Property ID currently hovered in external card grid (2-way sync) */
  hoveredPropertyId?: string | null;
  /** Callback when user hovers a pin on the map */
  onHoverPropertyId?: (id: string | null) => void;
  /** Externally controlled selected property ID (optional, e.g. mobile carousel sync) */
  focusedPropertyId?: string | null;
  /** Callback when a group or unit is selected on the map */
  onSelectGroup?: (group: MapLocationGroup | null) => void;
  /** Whether "Search as map moves" toggle is shown */
  enableSearchAsMove?: boolean;
  /** Controlled state for "Search as map moves" */
  searchAsMove?: boolean;
  /** Toggle handler for "Search as map moves" */
  onSearchAsMoveChange?: (enabled: boolean) => void;
  /** Emits pins inside current map bounds whenever viewport settles or filters change */
  onBoundsPinsChange?: (pinsInBounds: SlimMapPin[]) => void;
  /** Optional callback to return to grid view if WebGL is unsupported */
  onFallbackToList?: () => void;
  /** Additional container classes */
  className?: string;
  /** Hide built-in mobile popup when parent renders its own bottom carousel (optional) */
  suppressMobilePopup?: boolean;
  /** Active transit station radius radar filter */
  stationRadar?: { station: MapTransitStation; radiusKm: number } | null;
  /** Callback when user clicks station or changes radius */
  onStationRadarChange?: (
    radar: { station: MapTransitStation; radiusKm: number } | null
  ) => void;
}

export function PropertyVectorMap({
  filteredPins,
  stations,
  isLoading = false,
  activeListingFilter = "",
  activeStationFilter = "",
  locationFilterSignature = "",
  hoveredPropertyId = null,
  onHoverPropertyId,
  focusedPropertyId = null,
  onSelectGroup,
  enableSearchAsMove = false,
  searchAsMove = false,
  onSearchAsMoveChange,
  onBoundsPinsChange,
  onFallbackToList,
  className = "",
  suppressMobilePopup = false,
  stationRadar = null,
  onStationRadarChange,
}: PropertyVectorMapProps) {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const popupElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const [webglSupported] = useState<boolean>(() => checkWebGLSupport());
  const [mapStyle, setMapStyle] = useState<string>(MAP_STYLE_PRIMARY);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  // Transit Stations layer ON by default per user requirement
  const [showTransit, setShowTransit] = useState<boolean>(true);

  const [zoom, setZoom] = useState<number>(DEFAULT_BANGKOK_VIEW.zoom);
  const [bounds, setBounds] = useState<MapBoundsTuple | null>(null);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({ width: 960, height: 600 });
  const [popupSize, setPopupSize] = useState<{ width: number; height: number }>(
    { width: 328, height: 376 }
  );
  const [pinScreenPos, setPinScreenPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedInitialUnitId, setSelectedInitialUnitId] = useState<
    string | null
  >(null);
  const [internalHoverGroupId, setInternalHoverGroupId] = useState<
    string | null
  >(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMarkerMouseEnter = useCallback(
    (g: MapLocationGroup) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setInternalHoverGroupId(g.groupId);
      onHoverPropertyId?.(g.units[0]?.id || null);
    },
    [onHoverPropertyId]
  );

  const handleMarkerMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setInternalHoverGroupId(null);
      onHoverPropertyId?.(null);
      hoverTimeoutRef.current = null;
    }, 120);
  }, [onHoverPropertyId]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const { groups, visibleItems, pinsInBounds } = useMapClusters({
    filteredPins,
    activeListingFilter,
    language,
    bounds,
    zoom,
  });

  // Sync current bounds pins upward for Split-View / Explorer list sync
  useEffect(() => {
    onBoundsPinsChange?.(pinsInBounds);
  }, [pinsInBounds, onBoundsPinsChange]);

  // Active selected group lookup (auto-clears if filtered out)
  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return groups.find((g) => g.groupId === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  const selectedGroupRef = useRef<MapLocationGroup | null>(null);
  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
    if (!selectedGroup) {
      setPinScreenPos(null);
      return;
    }
    const map = mapRef.current?.getMap();
    if (map) {
      const pt = map.project([selectedGroup.longitude, selectedGroup.latitude]);
      setPinScreenPos({ x: pt.x, y: pt.y });
    }
  }, [selectedGroup]);

  // Measure rendered popup card dimensions so height clamping is pixel-accurate across unit slides
  useEffect(() => {
    const el = popupElRef.current;
    if (!el || !selectedGroup || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) {
        setPopupSize((prev) =>
          Math.abs(prev.width - w) > 1 || Math.abs(prev.height - h) > 1
            ? { width: w, height: h }
            : prev
        );
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedGroup]);

  // External card hover -> find matching groupId
  const externalHoveredGroupId = useMemo(() => {
    if (!hoveredPropertyId) return null;
    const found = groups.find((g) => g.unitIds.has(hoveredPropertyId));
    return found ? found.groupId : null;
  }, [groups, hoveredPropertyId]);

  // Active group to draw direct route line to nearest transit station (on Hover only, avoiding collision with open popup card)
  const activeGuideGroup = useMemo(() => {
    if (internalHoverGroupId) {
      return groups.find((g) => g.groupId === internalHoverGroupId) || null;
    }
    if (externalHoveredGroupId) {
      return groups.find((g) => g.groupId === externalHoveredGroupId) || null;
    }
    if (focusedPropertyId) {
      return groups.find((g) => g.unitIds.has(focusedPropertyId)) || null;
    }
    return null;
  }, [internalHoverGroupId, externalHoveredGroupId, focusedPropertyId, groups]);

  // GeoJSON circle polygon for the active station radius radar
  const radarCircleGeoJSON = useMemo(() => {
    if (!stationRadar) return null;
    return createGeoJSONCircle(
      [stationRadar.station.longitude, stationRadar.station.latitude],
      stationRadar.radiusKm
    );
  }, [stationRadar]);

  const { radarProjectsCount, radarUnitsCount } = useMemo(() => {
    if (!stationRadar) return { radarProjectsCount: 0, radarUnitsCount: 0 };
    const s = stationRadar.station;
    const rM = stationRadar.radiusKm * 1000;

    let projCount = 0;
    let unitCount = 0;

    for (const g of groups) {
      const dist = haversineDistanceMeters(
        s.latitude,
        s.longitude,
        g.latitude,
        g.longitude
      );
      if (dist <= rM) {
        projCount += 1;
        unitCount += g.units.length;
      }
    }

    return { radarProjectsCount: projCount, radarUnitsCount: unitCount };
  }, [stationRadar, groups]);

  const radarCountText = useMemo(() => {
    if (radarProjectsCount === 0) {
      return language === "th"
        ? "ไม่พบโครงการในรัศมี"
        : language === "cn"
          ? "范围内暂无房源"
          : language === "ru"
            ? "Нет объектов в радиусе"
            : "No properties in radius";
    }

    if (language === "th") {
      return radarUnitsCount > radarProjectsCount
        ? `พบ ${radarProjectsCount} โครงการ (${radarUnitsCount} ห้อง)`
        : `พบ ${radarProjectsCount} โครงการ`;
    }
    if (language === "cn") {
      return radarUnitsCount > radarProjectsCount
        ? `发现 ${radarProjectsCount} 个项目 (${radarUnitsCount} 套)`
        : `发现 ${radarProjectsCount} 个项目`;
    }
    if (language === "ru") {
      return radarUnitsCount > radarProjectsCount
        ? `Найдено ${radarProjectsCount} проектов (${radarUnitsCount} объектов)`
        : `Найдено ${radarProjectsCount} проектов`;
    }
    return radarUnitsCount > radarProjectsCount
      ? `${radarProjectsCount} projects (${radarUnitsCount} units)`
      : `${radarProjectsCount} projects`;
  }, [radarProjectsCount, radarUnitsCount, language]);

  // External focused property (e.g. swiping bottom mobile strip in /map)
  useEffect(() => {
    if (!focusedPropertyId) return;
    const targetGroup = groups.find((g) => g.unitIds.has(focusedPropertyId));
    if (!targetGroup) return;

    const map = mapRef.current?.getMap();
    if (map) {
      map.stop();
      map.easeTo({
        center: [targetGroup.longitude, targetGroup.latitude],
        zoom: Math.max(map.getZoom(), 14),
        duration: 450,
      });
    }
  }, [focusedPropertyId, groups]);

  const syncViewportMetrics = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const b = map.getBounds();
    if (b) {
      setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    }
    setZoom(map.getZoom());
  }, []);

  // ResizeObserver: prevents half-gray MapLibre canvas when switching Grid <-> Split or toggling drawers
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateSize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        setContainerSize((prev) =>
          prev.width !== w || prev.height !== h ? { width: w, height: h } : prev
        );
      }
    };
    updateSize();

    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        updateSize();
        mapRef.current?.resize();
        syncViewportMetrics();
        const active = selectedGroupRef.current;
        const map = mapRef.current?.getMap();
        if (active && map) {
          const pt = map.project([active.longitude, active.latitude]);
          setPinScreenPos({ x: pt.x, y: pt.y });
        }
      });
    });

    observer.observe(el);
    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [syncViewportMetrics]);

  // Fit bounds helper
  const fitToPins = useCallback(
    (pinsToFit: SlimMapPin[], animate = true) => {
      const map = mapRef.current?.getMap();
      if (!map || pinsToFit.length === 0) return;

      map.stop();

      if (pinsToFit.length === 1) {
        map.flyTo({
          center: [pinsToFit[0].longitude, pinsToFit[0].latitude],
          zoom: 15,
          duration: animate ? 850 : 0,
        });
        return;
      }

      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;

      for (const p of pinsToFit) {
        if (p.longitude < minLng) minLng = p.longitude;
        if (p.latitude < minLat) minLat = p.latitude;
        if (p.longitude > maxLng) maxLng = p.longitude;
        if (p.latitude > maxLat) maxLat = p.latitude;
      }

      if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return;

      // If all pins share identical coordinates, fly directly
      if (
        Math.abs(maxLng - minLng) < 0.0005 &&
        Math.abs(maxLat - minLat) < 0.0005
      ) {
        map.flyTo({
          center: [minLng, minLat],
          zoom: 15,
          duration: animate ? 850 : 0,
        });
        return;
      }

      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: { top: 72, bottom: 72, left: 56, right: 56 },
          maxZoom: 15,
          duration: animate ? 850 : 0,
        }
      );
    },
    []
  );

  // Auto-fly when user explicitly changes location / province / station filter
  const prevSignatureRef = useRef<string>(locationFilterSignature);
  useEffect(() => {
    if (!isMapLoaded) return;
    if (prevSignatureRef.current === locationFilterSignature) return;
    prevSignatureRef.current = locationFilterSignature;

    if (!locationFilterSignature) {
      const map = mapRef.current?.getMap();
      if (map) {
        map.stop();
        map.flyTo({
          center: [
            DEFAULT_BANGKOK_VIEW.longitude,
            DEFAULT_BANGKOK_VIEW.latitude,
          ],
          zoom: DEFAULT_BANGKOK_VIEW.zoom,
          duration: 850,
        });
      }
      return;
    }

    if (filteredPins.length > 0) {
      fitToPins(filteredPins, true);
    } else if (activeStationFilter && stations.length > 0) {
      const norm = activeStationFilter.trim().toLowerCase();
      const matchedStation = stations.find(
        (s) =>
          s.slug.toLowerCase() === norm ||
          s.code.toLowerCase() === norm ||
          s.label.th.toLowerCase().includes(norm) ||
          s.label.en.toLowerCase().includes(norm)
      );
      if (matchedStation) {
        const map = mapRef.current?.getMap();
        map?.stop();
        map?.flyTo({
          center: [matchedStation.longitude, matchedStation.latitude],
          zoom: 14.5,
          duration: 850,
        });
      }
    }
  }, [
    locationFilterSignature,
    isMapLoaded,
    filteredPins,
    activeStationFilter,
    stations,
    fitToPins,
  ]);

  // Also ensure initial load fits filtered pins if user opened URL with a pre-selected area/province
  const didInitialFitRef = useRef(false);
  useEffect(() => {
    if (!isMapLoaded || didInitialFitRef.current) return;
    if (isLoading) return;
    didInitialFitRef.current = true;

    if (locationFilterSignature && filteredPins.length > 0) {
      fitToPins(filteredPins, false);
      syncViewportMetrics();
    } else if (filteredPins.length > 0) {
      // Check if there are any pins in Greater Bangkok; if not, fit all available pins
      const bkkPins = filteredPins.filter(
        (p) =>
          p.latitude >= 13.45 &&
          p.latitude <= 14.15 &&
          p.longitude >= 100.3 &&
          p.longitude <= 100.9
      );
      if (bkkPins.length === 0) {
        fitToPins(filteredPins, false);
        syncViewportMetrics();
      }
    }
  }, [
    isMapLoaded,
    isLoading,
    locationFilterSignature,
    filteredPins,
    fitToPins,
    syncViewportMetrics,
  ]);

  const handleGroupClick = useCallback(
    (group: MapLocationGroup) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setInternalHoverGroupId(null);
      onHoverPropertyId?.(null);

      setSelectedGroupId(group.groupId);
      setSelectedInitialUnitId(group.units[0]?.id || null);
      onSelectGroup?.(group);

      const map = mapRef.current?.getMap();
      const container = containerRef.current;
      if (map) {
        const pt = map.project([group.longitude, group.latitude]);
        setPinScreenPos({ x: pt.x, y: pt.y });

        // Only nudge the map gently if the clicked pin itself is tucked right against a screen border
        if (container) {
          const cw = container.clientWidth || 800;
          const ch = container.clientHeight || 560;
          let panByX = 0;
          let panByY = 0;
          if (pt.x < 84) panByX = pt.x - 110;
          else if (pt.x > cw - 84) panByX = pt.x - (cw - 110);

          if (pt.y < 90) panByY = pt.y - 120;
          else if (pt.y > ch - 36) panByY = pt.y - (ch - 72);

          if (panByX !== 0 || panByY !== 0) {
            map.stop();
            map.panBy([panByX, panByY], { duration: 300 });
          }
        }
      }
    },
    [onSelectGroup]
  );

  const handleClusterClick = useCallback(
    (lng: number, lat: number, expansionZoom: number) => {
      setSelectedGroupId(null);
      onSelectGroup?.(null);
      const map = mapRef.current?.getMap();
      if (map) {
        map.stop();
        map.flyTo({
          center: [lng, lat],
          zoom: expansionZoom,
          duration: 550,
        });
      }
    },
    [onSelectGroup]
  );

  const handleStationClick = useCallback(
    (station: MapTransitStation) => {
      onStationRadarChange?.({ station, radiusKm: 1 });
      const map = mapRef.current?.getMap();
      if (map) {
        map.stop();
        map.flyTo({
          center: [station.longitude, station.latitude],
          zoom: 14.5,
          duration: 600,
        });
      }
    },
    [onStationRadarChange]
  );

  const handleMove = useCallback(() => {
    const active = selectedGroupRef.current;
    if (!active) return;
    const map = mapRef.current?.getMap();
    if (!map) return;
    const pt = map.project([active.longitude, active.latitude]);
    setPinScreenPos({ x: pt.x, y: pt.y });
  }, []);

  const handleMoveEnd = useCallback(
    (_evt: ViewStateChangeEvent) => {
      syncViewportMetrics();
      handleMove();
    },
    [syncViewportMetrics, handleMove]
  );

  // Live basemap street/city/district label localization across TH / EN / CN / RU
  useEffect(() => {
    if (!isMapLoaded) return;
    const rawMap = mapRef.current?.getMap();
    if (!rawMap) return;
    applyMapBasemapLanguage(rawMap, language);
  }, [language, isMapLoaded, mapStyle]);

  const fallbackUI = (
    <div
      className={cn(
        "w-full h-full min-h-[360px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-6 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-slate-900 text-base mb-1">
        {language === "th"
          ? "เบราว์เซอร์ของคุณไม่รองรับการแสดงแผนที่ 3 มิติ (WebGL)"
          : language === "cn"
            ? "当前浏览器不支持 3D 互动地图 (WebGL)"
            : language === "ru"
              ? "Интерактивная карта недоступна в этом браузере (WebGL)"
              : "Interactive Map Unavailable on This Browser"}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4">
        {language === "th"
          ? "คุณยังสามารถค้นหาและกรองรายการทรัพย์ทั้งหมดได้ตามปกติในมุมมองการ์ด หรือเปิดผ่าน Safari / Chrome"
          : language === "cn"
            ? "您仍可在列表视图中正常浏览和筛选所有房源，或使用 Chrome / Safari 打开此页面。"
            : language === "ru"
              ? "Вы можете просматривать и фильтровать все объекты в режиме сетки или открыть страницу в Chrome / Safari."
              : "You can still browse and filter all properties normally in Grid View, or open this page in Chrome / Safari."}
      </p>
      {onFallbackToList && (
        <button
          type="button"
          onClick={onFallbackToList}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
        >
          {language === "th"
            ? "สลับเป็นมุมมองการ์ด"
            : language === "cn"
              ? "切换至列表视图"
              : language === "ru"
                ? "Перейти к сетке"
                : "Switch to Grid View"}
        </button>
      )}
    </div>
  );

  if (!webglSupported) {
    return fallbackUI;
  }

  const countInViewText =
    language === "th"
      ? `${pinsInBounds.length.toLocaleString()} ยูนิตในจอ (${filteredPins.length.toLocaleString()} ทั้งหมด)`
      : language === "cn"
        ? `当前视野 ${pinsInBounds.length} 套 (共 ${filteredPins.length} 套)`
        : language === "ru"
          ? `${pinsInBounds.length} на экране (всего ${filteredPins.length})`
          : `${pinsInBounds.length.toLocaleString()} in view (${filteredPins.length.toLocaleString()} total)`;

  const searchAsMoveLabel =
    language === "th"
      ? "ค้นหาตามพื้นที่แผนที่"
      : language === "cn"
        ? "随地图移动搜索"
        : language === "ru"
          ? "Искать при движении карты"
          : "Search as map moves";

  const smartPopupLayout =
    selectedGroup && pinScreenPos
      ? computeSmartPopupLayout({
          pinX: pinScreenPos.x,
          pinY: pinScreenPos.y,
          cw: containerSize.width,
          ch: containerSize.height,
          cardW: popupSize.width,
          cardH: popupSize.height,
        })
      : null;

  return (
    <MapErrorBoundary fallback={fallbackUI}>
      <div
        ref={containerRef}
        className={cn(
          "relative isolate z-10 w-full h-full min-h-[380px] bg-slate-100 overflow-hidden select-none",
          className
        )}
      >
        {/* Top Floating Controls Bar */}
        <div className="absolute top-3 left-3 right-14 z-30 flex flex-wrap items-center gap-2 pointer-events-none">
          {/* Live Count Pill / Search-As-Move Toggle */}
          {enableSearchAsMove && onSearchAsMoveChange ? (
            <button
              type="button"
              onClick={() => onSearchAsMoveChange(!searchAsMove)}
              className={cn(
                "pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-md border transition-all cursor-pointer",
                searchAsMove
                  ? "bg-[#1B263B] text-white border-slate-800"
                  : "bg-white/95 backdrop-blur-xs text-slate-700 border-slate-200 hover:bg-white"
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-sm flex items-center justify-center border transition-colors",
                  searchAsMove
                    ? "bg-blue-500 border-blue-400 text-white"
                    : "bg-white border-slate-300 text-transparent"
                )}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
              <span>{searchAsMoveLabel}</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px]",
                  searchAsMove
                    ? "bg-white/15 text-blue-200"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {pinsInBounds.length}
              </span>
            </button>
          ) : (
            <div className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-xs text-slate-800 text-xs font-bold shadow-md border border-slate-200/90">
              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{countInViewText}</span>
            </div>
          )}

          {/* BTS / MRT Stations Layer Toggle (ON by default) */}
          <div className="pointer-events-auto">
            <TransitToggleButton
              showTransit={showTransit}
              onToggle={() => setShowTransit((prev) => !prev)}
              language={language}
            />
          </div>

          {/* Fit All Filtered Pins Button (prevents user getting lost when zoomed into empty ocean/province) */}
          {filteredPins.length > 0 && pinsInBounds.length === 0 && (
            <button
              type="button"
              onClick={() => fitToPins(filteredPins, true)}
              className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer animate-in fade-in duration-200"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>
                {language === "th"
                  ? `ซูมไปหาทรัพย์ที่พบ (${filteredPins.length})`
                  : language === "cn"
                    ? `定位至 ${filteredPins.length} 套房源`
                    : language === "ru"
                      ? `Показать ${filteredPins.length} объектов`
                      : `Zoom to ${filteredPins.length} results`}
              </span>
            </button>
          )}
        </div>

        {/* Floating Station Radar Control Pill (Active when clicking a Transit Station) */}
        {stationRadar && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-35 pointer-events-auto max-w-[calc(100vw-24px)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-wrap items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 text-slate-800">
              {/* Station Label & Color */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: stationRadar.station.lineColor || "#2563EB" }}
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-extrabold text-xs text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
                      {stationRadar.station.label?.[language] ||
                        stationRadar.station.label.th ||
                        stationRadar.station.label.en}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                      ({getTransitTypeLabel(stationRadar.station.transitType || stationRadar.station.slug)})
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600">
                    {radarCountText}
                  </span>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200 shrink-0 mx-0.5" />

              {/* Radius Options */}
              <div className="flex items-center gap-1 shrink-0">
                {[
                  { label: "500 ม.", km: 0.5 },
                  { label: "1 กม.", km: 1 },
                  { label: "2 กม.", km: 2 },
                  { label: "3 กม.", km: 3 },
                ].map((opt) => {
                  const isActive = stationRadar.radiusKm === opt.km;
                  return (
                    <button
                      key={opt.km}
                      type="button"
                      onClick={() =>
                        onStationRadarChange?.({
                          station: stationRadar.station,
                          radiusKm: opt.km,
                        })
                      }
                      className={cn(
                        "px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => onStationRadarChange?.(null)}
                title="ปิดเรดาร์สถานี"
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Pill Indicator */}
        {isLoading && (
          <div className="absolute bottom-4 left-4 z-30 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-lg">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>
              {language === "th"
                ? "กำลังโหลดหมุดทรัพย์..."
                : language === "cn"
                  ? "正在加载房源坐标..."
                  : language === "ru"
                    ? "Загрузка объектов на карте..."
                    : "Loading map pins..."}
            </span>
          </div>
        )}

        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={DEFAULT_BANGKOK_VIEW}
          mapStyle={mapStyle}
          style={{ width: "100%", height: "100%" }}
          maxZoom={18.5}
          minZoom={5.2}
          reuseMaps
          attributionControl={{ compact: true }}
          onLoad={(evt) => {
            setIsMapLoaded(true);
            syncViewportMetrics();
            applyMapBasemapLanguage(evt.target, language);
          }}
          onMove={handleMove}
          onMoveEnd={handleMoveEnd}
          onZoomEnd={handleMoveEnd}
          onClick={() => {
            if (selectedGroupId) {
              setSelectedGroupId(null);
              onSelectGroup?.(null);
            }
          }}
          onError={(e) => {
            // Automatic failover from OpenFreeMap to Carto Positron if tile style fails
            if (
              mapStyle === MAP_STYLE_PRIMARY &&
              e?.error?.message &&
              !isMapLoaded
            ) {
              setMapStyle(MAP_STYLE_FALLBACK);
            }
          }}
        >
          <NavigationControl position="top-right" showCompass={false} />
          <GeolocateControl
            position="top-right"
            positionOptions={{ enableHighAccuracy: true }}
            trackUserLocation={false}
          />

          {/* Layer 0.5 (z-5): Station Radius Radar Circle (when a station is selected) */}
          {stationRadar && radarCircleGeoJSON && (
            <Source id="station-radar-source" type="geojson" data={radarCircleGeoJSON}>
              {/* High-visibility contrast blue fill that never blends with green grass or yellow roads */}
              <Layer
                id="radar-fill"
                type="fill"
                paint={{
                  "fill-color": "#2563EB",
                  "fill-opacity": 0.12,
                }}
              />
              {/* Outer dark drop-shadow for guaranteed contrast against white streets & light terrain */}
              <Layer
                id="radar-shadow"
                type="line"
                paint={{
                  "line-color": "#0F172A",
                  "line-width": 5.5,
                  "line-opacity": 0.35,
                }}
              />
              {/* Sharp white contrast ring */}
              <Layer
                id="radar-casing"
                type="line"
                paint={{
                  "line-color": "#ffffff",
                  "line-width": 3.5,
                  "line-opacity": 0.95,
                }}
              />
              {/* Crisp vivid radar line with clean dash */}
              <Layer
                id="radar-stroke"
                type="line"
                paint={{
                  "line-color": "#2563EB",
                  "line-width": 2.5,
                  "line-dasharray": [4, 3],
                  "line-opacity": 1,
                }}
              />
            </Source>
          )}

          {/* Layer 1 (z-10): BTS / MRT / ARL Transit Stations */}
          <MapTransitOverlay
            stations={stations}
            showTransit={showTransit}
            zoom={zoom}
            bounds={bounds}
            language={language}
            activeStationSlugOrName={activeStationFilter}
            onStationClick={handleStationClick}
          />

          {/* Layer 1.5 (z-30..42): Interactive Direct Route Line to Nearest Transit Station */}
          <MapTransitLineLayer
            activeGroup={activeGuideGroup}
            stations={stations}
            language={language}
            overrideStation={stationRadar?.station}
          />

          {/* Layer 2 (z-20..45): Supercluster Bubbles & Smart Price Pill Markers */}
          {visibleItems.map((item) => {
            if (item.type === "cluster") {
              const sizeClass =
                item.unitCount >= 40
                  ? "w-12 h-12 text-sm"
                  : item.unitCount >= 15
                    ? "w-10 h-10 text-xs"
                    : "w-9 h-9 text-xs";

              return (
                <Marker
                  key={`cluster-${item.clusterId}`}
                  longitude={item.longitude}
                  latitude={item.latitude}
                  anchor="center"
                  style={{ zIndex: 25 }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClusterClick(
                        item.longitude,
                        item.latitude,
                        item.expansionZoom
                      );
                    }}
                    aria-label={`${item.unitCount} properties`}
                    className={cn(
                      "rounded-full bg-[#1B263B]/95 hover:bg-blue-600 text-white font-sans font-extrabold flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-slate-900/15 transition-transform duration-150 hover:scale-110 cursor-pointer",
                      sizeClass
                    )}
                  >
                    {item.unitCount}
                  </button>
                </Marker>
              );
            }

            const { group } = item;
            const isSelected = selectedGroup?.groupId === group.groupId;
            const isHovered =
              internalHoverGroupId === group.groupId ||
              externalHoveredGroupId === group.groupId ||
              (!!focusedPropertyId && group.unitIds.has(focusedPropertyId));

            const markerZ = isSelected ? 45 : isHovered ? 35 : 20;

            return (
              <Marker
                key={group.groupId}
                longitude={group.longitude}
                latitude={group.latitude}
                anchor="bottom"
                style={{ zIndex: markerZ }}
              >
                <PricePillMarker
                  group={group}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  language={language}
                  onClick={handleGroupClick}
                  onMouseEnter={handleMarkerMouseEnter}
                  onMouseLeave={handleMarkerMouseLeave}
                />
              </Marker>
            );
          })}
        </Map>

        {/* Layer 3 Desktop (>= 640px): Collision-Aware 4-Way Floating Popup (Top / Bottom / Left / Right + Clamped) */}
        {selectedGroup && smartPopupLayout && (
          <div
            ref={popupElRef}
            style={{
              left: `${smartPopupLayout.left}px`,
              top: `${smartPopupLayout.top}px`,
              maxHeight: `${smartPopupLayout.maxHeight}px`,
            }}
            className="hidden sm:block absolute z-50 transition-[left,top] duration-75 ease-out"
          >
            {/* Dynamic Pointer Triangle aimed toward the active Price Pill */}
            {smartPopupLayout.placement === "top" && (
              <span
                style={{ left: `${smartPopupLayout.arrowOffset}px` }}
                className="pointer-events-none absolute -bottom-2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white border-r border-b border-slate-200/90 shadow-xs z-10"
              />
            )}
            {smartPopupLayout.placement === "bottom" && (
              <span
                style={{ left: `${smartPopupLayout.arrowOffset}px` }}
                className="pointer-events-none absolute -top-2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white border-l border-t border-slate-200/90 shadow-xs z-10"
              />
            )}
            {smartPopupLayout.placement === "right" && (
              <span
                style={{ top: `${smartPopupLayout.arrowOffset}px` }}
                className="pointer-events-none absolute -left-2 -translate-y-1/2 w-4 h-4 rotate-45 bg-white border-l border-b border-slate-200/90 shadow-xs z-10"
              />
            )}
            {smartPopupLayout.placement === "left" && (
              <span
                style={{ top: `${smartPopupLayout.arrowOffset}px` }}
                className="pointer-events-none absolute -right-2 -translate-y-1/2 w-4 h-4 rotate-45 bg-white border-r border-t border-slate-200/90 shadow-xs z-10"
              />
            )}

            <MapSlideablePropertyCard
              group={selectedGroup}
              initialUnitId={selectedInitialUnitId}
              onClose={() => {
                setSelectedGroupId(null);
                onSelectGroup?.(null);
              }}
              className="relative z-20 max-h-[inherit] overflow-y-auto"
            />
          </div>
        )}

        {/* Layer 3 Mobile (< 640px): Thumb-Friendly Bottom Docked Slideable Card */}
        {selectedGroup && !suppressMobilePopup && (
          <div className="sm:hidden absolute bottom-14 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-24px)]">
            <MapSlideablePropertyCard
              group={selectedGroup}
              initialUnitId={selectedInitialUnitId}
              onClose={() => {
                setSelectedGroupId(null);
                onSelectGroup?.(null);
              }}
              className="w-[calc(100vw-24px)] max-w-[340px]"
            />
          </div>
        )}
      </div>
    </MapErrorBoundary>
  );
}

export default PropertyVectorMap;
