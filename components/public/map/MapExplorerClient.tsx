"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Bath,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LayoutGrid,
  Maximize2,
  Layers,
  Car,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
} from "lucide-react";
import { SearchFilterBar } from "@/components/public/search/SearchFilterBar";
import { PropertyCard } from "@/components/public/PropertyCard";
import { PropertyVectorMapLazy } from "./PropertyVectorMapLazy";
import {
  getPinProjectOrPropertyHeadline,
  haversineDistanceMeters,
} from "./map-price-utils";
import { usePropertyFilters } from "@/hooks/search/usePropertyFilters";
import { usePropertyFiltering } from "@/hooks/search/usePropertyFiltering";
import { useMapPins } from "@/hooks/search/useMapPins";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getEffectivePrice } from "@/lib/property-hardened-utils";
import { formatPrice, getOfficePrice } from "@/lib/property-utils";
import { cn } from "@/lib/utils";
import type {
  MapPinsPayload,
  MapTransitStation,
  SlimMapPin,
} from "@/lib/services/map-pins";
import type { MapLocationGroup } from "./useMapClusters";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop";

interface MapExplorerClientProps {
  initialPayload?: MapPinsPayload | null;
}

export function MapExplorerClient({ initialPayload }: MapExplorerClientProps) {
  const { language, langPrefix, t } = useLanguage();
  const router = useRouter();
  const basePath = `${langPrefix || ""}/map`;
  const filters = usePropertyFilters("", basePath);

  const gridReturnHref = useMemo(() => {
    const listBase = `${langPrefix || ""}/properties`;
    return filters.queryString ? `${listBase}?${filters.queryString}` : listBase;
  }, [langPrefix, filters.queryString]);

  const gridReturnLabel =
    language === "en"
      ? "Grid View"
      : language === "cn"
        ? "返回列表"
        : language === "ru"
          ? "Сетка"
          : "หน้ารายการ";

  const { pins, stations, isLoading } = useMapPins(true, initialPayload);

  const {
    filtered: filteredRaw,
    availableProvinces,
    availableAreas,
    availableTypes,
    availableListingTypes,
    availableQuickFilters,
    availableBedrooms,
    availablePrices,
    availableSizes,
    availableStations,
    allStations,
    matchesFilters,
  } = usePropertyFiltering(pins, {
    ...filters,
    keyword: filters.debouncedKeyword,
  });

  const filteredPins = filteredRaw as SlimMapPin[];

  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [searchAsMove, setSearchAsMove] = useState<boolean>(true);
  const [boundsPins, setBoundsPins] = useState<SlimMapPin[]>(filteredPins);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(
    null
  );
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(
    null
  );
  const [activePopupGroup, setActivePopupGroup] =
    useState<MapLocationGroup | null>(null);
  const [mobileStripCollapsed, setMobileStripCollapsed] =
    useState<boolean>(false);
  const [drawerLimit, setDrawerLimit] = useState<number>(12);

  const [stationRadar, setStationRadar] = useState<{
    station: MapTransitStation;
    radiusKm: number;
  } | null>(null);

  const mobileStripRef = useRef<HTMLDivElement | null>(null);

  const activeList = useMemo(() => {
    const base = searchAsMove ? boundsPins : filteredPins;
    if (!stationRadar) return base;
    const s = stationRadar.station;
    const maxMeters = stationRadar.radiusKm * 1000;
    return base
      .map((p) => {
        const dist = haversineDistanceMeters(
          s.latitude,
          s.longitude,
          p.latitude,
          p.longitude
        );
        return { pin: p, dist };
      })
      .filter((item) => item.dist <= maxMeters)
      .sort((a, b) => a.dist - b.dist)
      .map((item) => item.pin);
  }, [searchAsMove, boundsPins, filteredPins, stationRadar]);

  useEffect(() => {
    setDrawerLimit(12);
  }, [activeList.length, filters.queryString]);

  const locationFilterSignature = useMemo(() => {
    const parts = [
      filters.province && filters.province !== "ALL"
        ? `p:${filters.province}`
        : "",
      filters.area && filters.area !== "ALL" ? `a:${filters.area}` : "",
      filters.transitStation ? `s:${filters.transitStation}` : "",
      filters.cbd ? "cbd" : "",
      filters.luxuryVilla ? "villa" : "",
    ].filter(Boolean);
    return parts.join("|");
  }, [
    filters.province,
    filters.area,
    filters.transitStation,
    filters.cbd,
    filters.luxuryVilla,
  ]);

  const visibleDrawerItems = useMemo(
    () => activeList.slice(0, drawerLimit),
    [activeList, drawerLimit]
  );

  const mobileCarouselItems = useMemo(
    () => activeList.slice(0, 20),
    [activeList]
  );

  return (
    <div className="h-dvh pt-[52px] sm:pt-(--nav-offset,64px) flex flex-col overflow-hidden bg-slate-50">
      {/* Top Filter Bar (100% Shared with /properties) */}
      <div className="shrink-0 z-40 bg-white shadow-xs">
        <SearchFilterBar
          {...filters}
          isLoading={isLoading}
          filteredLength={filteredPins.length}
          availableAreas={availableAreas}
          availableProvinces={availableProvinces}
          availableTypes={availableTypes}
          availableListingTypes={availableListingTypes}
          availableQuickFilters={availableQuickFilters}
          availablePrices={availablePrices}
          availableSizes={availableSizes}
          availableBedrooms={availableBedrooms}
          availableStations={availableStations}
          allStations={allStations}
          properties={pins}
          matchesFilters={matchesFilters}
          setBulkFilters={filters.setBulkFilters}
        />
      </div>

      {/* Interactive Workspace: Collapsible Left List Drawer + Full-Screen Map */}
      <div className="flex-1 relative flex overflow-hidden min-h-0">
        {/* Desktop Collapsible Side Drawer */}
        <aside
          className={cn(
            "hidden lg:flex flex-col bg-slate-50 border-r border-slate-200/90 transition-all duration-300 ease-in-out overflow-hidden shrink-0 z-20",
            drawerOpen ? "w-[390px] xl:w-[430px]" : "w-0 border-r-0"
          )}
        >
          <div className="px-4 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-[#1B263B] truncate">
                {language === "en"
                  ? "Interactive Price Map"
                  : language === "cn"
                    ? "地图找房 · 真实价格"
                    : language === "ru"
                      ? "Поиск недвижимости на карте"
                      : "สำรวจทรัพย์โดยแผนที่"}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {language === "en"
                  ? `${activeList.length.toLocaleString()} properties in area (${filteredPins.length.toLocaleString()} matched)`
                  : language === "cn"
                    ? `视野内 ${activeList.length} 套 (共匹配 ${filteredPins.length} 套)`
                    : language === "ru"
                      ? `${activeList.length} в этой зоне (всего ${filteredPins.length})`
                      : `ในพื้นที่นี้ ${activeList.length.toLocaleString()} ยูนิต (ตรงเงื่อนไข ${filteredPins.length.toLocaleString()} ยูนิต)`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                href={gridReturnHref}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#1B263B] text-slate-700 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                title={gridReturnLabel}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{gridReturnLabel}</span>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                title={
                  language === "th"
                    ? "พับแผงรายการ"
                    : language === "cn"
                      ? "收起列表"
                      : language === "ru"
                        ? "Свернуть список"
                        : "Collapse list"
                }
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Station Radar Filter Alert in Drawer */}
          {stationRadar && (
            <div className="px-4 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{
                    backgroundColor:
                      stationRadar.station.lineColor || "#2563EB",
                  }}
                />
                <div className="text-xs truncate">
                  <span className="font-bold text-slate-800">
                    {stationRadar.station.label?.[language] ||
                      stationRadar.station.label.th ||
                      stationRadar.station.label.en}
                  </span>
                  <span className="text-slate-500 ml-1">
                    (รัศมี{" "}
                    {stationRadar.radiusKm >= 1
                      ? `${stationRadar.radiusKm} กม.`
                      : `${stationRadar.radiusKm * 1000} ม.`}
                    )
                    {" · "}
                    {language === "th"
                      ? `${new Set(activeList.map((p) => p.project_id || p.id)).size} โครงการ (${activeList.length} ห้อง)`
                      : `${new Set(activeList.map((p) => p.project_id || p.id)).size} projects (${activeList.length} units)`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStationRadar(null)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline shrink-0 cursor-pointer"
              >
                {language === "th"
                  ? "ล้าง"
                  : language === "cn"
                    ? "清除"
                    : "Clear"}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {activeList.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center my-4">
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {language === "th"
                    ? "ไม่พบทรัพย์ในบริเวณที่ซูมอยู่"
                    : language === "cn"
                      ? "当前地图视野内暂无房源"
                      : language === "ru"
                        ? "В этой области карты нет объектов"
                        : "No properties in this map view"}
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  {filteredPins.length > 0
                    ? language === "th"
                      ? `ลองซูมออก หรือกดแสดงทั้ง ${filteredPins.length} รายการ`
                      : language === "cn"
                        ? `请缩小地图，或点击查看全部 ${filteredPins.length} 套房源`
                        : language === "ru"
                          ? `Отдалите карту или покажите все ${filteredPins.length} объектов`
                          : `Zoom out or view all ${filteredPins.length} matching units`
                    : language === "th"
                      ? "ลองล้างตัวกรองบางตัวเพื่อดูทรัพย์ทั้งหมด"
                      : language === "cn"
                        ? "请尝试清除部分筛选条件以查看更多房源"
                        : language === "ru"
                          ? "Попробуйте сбросить часть фильтров"
                          : "Try clearing some filters to see more results"}
                </p>
                {filteredPins.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSearchAsMove(false)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    {language === "th"
                      ? `แสดงทั้ง ${filteredPins.length} รายการ`
                      : language === "cn"
                        ? `显示全部 ${filteredPins.length} 套房源`
                        : language === "ru"
                          ? `Показать все ${filteredPins.length}`
                          : `Show all ${filteredPins.length} units`}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={filters.clearFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {language === "th"
                        ? "ล้างตัวกรอง"
                        : language === "cn"
                          ? "重置筛选"
                          : language === "ru"
                            ? "Сбросить фильтры"
                            : "Reset Filters"}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {visibleDrawerItems.map((item, idx) => {
                  const isHighlighted =
                    hoveredPropertyId === item.id ||
                    focusedPropertyId === item.id;
                  return (
                    <div
                      key={item.id}
                      onMouseEnter={() => setHoveredPropertyId(item.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                      onClick={() => setFocusedPropertyId(item.id)}
                    >
                      <PropertyCard
                        property={item}
                        priority={idx < 2}
                        isHighlighted={isHighlighted}
                      />
                    </div>
                  );
                })}

                {visibleDrawerItems.length < activeList.length && (
                  <button
                    type="button"
                    onClick={() => setDrawerLimit((prev) => prev + 12)}
                    className="w-full py-3 rounded-2xl bg-white hover:bg-blue-50 text-blue-600 font-bold text-xs border border-blue-200 shadow-xs transition-colors cursor-pointer"
                  >
                    {language === "th"
                      ? `ดูเพิ่มอีก +${Math.min(12, activeList.length - visibleDrawerItems.length)} ยูนิต`
                      : language === "cn"
                        ? `加载更多 +${Math.min(12, activeList.length - visibleDrawerItems.length)} 套`
                        : language === "ru"
                          ? `Показать ещё +${Math.min(12, activeList.length - visibleDrawerItems.length)}`
                          : `Show +${Math.min(12, activeList.length - visibleDrawerItems.length)} more`}
                  </button>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Re-open Drawer + Return to Grid Floating Controls on Desktop when Collapsed */}
        {!drawerOpen && (
          <div className="hidden lg:inline-flex items-center gap-2 absolute top-14 left-3 z-30">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-lg border border-slate-200/90 cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4 text-blue-600" />
              <span>
                {language === "th"
                  ? `เปิดรายการการ์ด (${activeList.length})`
                  : language === "cn"
                    ? `展开房源列表 (${activeList.length})`
                    : language === "ru"
                      ? `Показать список (${activeList.length})`
                      : `Show List (${activeList.length})`}
              </span>
            </button>
            <Link
              href={gridReturnHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1B263B] hover:bg-blue-600 text-white font-bold text-xs shadow-lg border border-white/15 transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-300" />
              <span>{gridReturnLabel}</span>
            </Link>
          </div>
        )}

        {/* Full-Screen Vector Map Canvas */}
        <div className="flex-1 h-full relative min-w-0">
          <PropertyVectorMapLazy
            filteredPins={filteredPins}
            stations={stations}
            isLoading={isLoading}
            activeListingFilter={filters.priceType || filters.listingType}
            activeStationFilter={filters.transitStation}
            locationFilterSignature={locationFilterSignature}
            hoveredPropertyId={hoveredPropertyId}
            onHoverPropertyId={setHoveredPropertyId}
            focusedPropertyId={focusedPropertyId}
            onSelectGroup={setActivePopupGroup}
            enableSearchAsMove
            searchAsMove={searchAsMove}
            onSearchAsMoveChange={setSearchAsMove}
            onBoundsPinsChange={setBoundsPins}
            onFallbackToList={() => router.push(gridReturnHref)}
            stationRadar={stationRadar}
            onStationRadarChange={setStationRadar}
            className="rounded-none border-0"
          />

          {/* Mobile Swipeable Bottom Property Carousel + Return to Grid Pill (Hidden when a pin popup is actively open) */}
          {!activePopupGroup && (
            <div className="lg:hidden absolute bottom-3 left-0 right-0 z-30 pointer-events-none">
              <div className="px-3 mb-1.5 flex items-center justify-between gap-2">
                <Link
                  href={gridReturnHref}
                  className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1B263B]/95 backdrop-blur-xs text-white text-[11px] font-bold shadow-md border border-white/15 cursor-pointer"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-blue-300" />
                  <span>{gridReturnLabel}</span>
                </Link>

                {mobileCarouselItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMobileStripCollapsed((prev) => !prev)}
                    className="pointer-events-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold shadow-md cursor-pointer"
                  >
                    {mobileStripCollapsed ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>
                          {language === "th"
                            ? `ดูการ์ดทรัพย์ (${activeList.length})`
                            : language === "cn"
                              ? `展开房源卡片 (${activeList.length})`
                              : language === "ru"
                                ? `Карточки (${activeList.length})`
                                : `Cards (${activeList.length})`}
                        </span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>
                          {language === "th"
                            ? "ซ่อนแถบการ์ด"
                            : language === "cn"
                              ? "收起卡片"
                              : language === "ru"
                                ? "Скрыть карточки"
                                : "Hide cards"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {!mobileStripCollapsed && mobileCarouselItems.length > 0 && (
                <div
                  ref={mobileStripRef}
                  className="pointer-events-auto flex items-stretch gap-2.5 overflow-x-auto snap-x snap-mandatory px-3 pb-1 no-scrollbar"
                >
                  {mobileCarouselItems.map((unit) => {
                    const { primaryTitle, secondarySubtitle } =
                      getPinProjectOrPropertyHeadline(unit, language);
                    const prices = getEffectivePrice(unit);
                    const office = getOfficePrice(unit);
                    const isRentFocus =
                      (filters.priceType || filters.listingType) === "RENT" ||
                      unit.listing_type === "RENT";

                    const displayVal = isRentFocus
                      ? prices.rentalPrice ||
                        (office?.isCalculated ? office.totalPrice || 0 : 0) ||
                        prices.salePrice
                      : prices.salePrice ||
                        (office?.isCalculated ? office.totalPrice || 0 : 0) ||
                        prices.rentalPrice;

                    const origVal = isRentFocus
                      ? prices.hasRentalDiscount
                        ? prices.originalRentalPrice
                        : 0
                      : prices.hasSaleDiscount
                        ? prices.originalPrice
                        : 0;

                    const detailHref = `${langPrefix || ""}/properties/${unit.slug || unit.id}`;

                    return (
                      <div
                        key={unit.id}
                        onClick={() => setFocusedPropertyId(unit.id)}
                        className={cn(
                          "snap-center shrink-0 w-[285px] bg-white/98 backdrop-blur-xs rounded-2xl shadow-xl border p-2.5 flex items-center gap-3 cursor-pointer transition-all",
                          focusedPropertyId === unit.id
                            ? "border-blue-600 ring-2 ring-blue-500/30"
                            : "border-slate-200/90"
                        )}
                      >
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                          <Image
                            src={
                              unit.image_url ||
                              unit.project_image_url ||
                              FALLBACK_IMG
                            }
                            alt={primaryTitle}
                            fill
                            unoptimized
                            sizes="80px"
                            className="object-cover"
                          />
                          {unit.listing_type && (
                            <span
                              className={cn(
                                "absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs text-white leading-none tracking-tight",
                                unit.listing_type === "RENT"
                                  ? "bg-blue-600/95"
                                  : unit.listing_type === "SALE"
                                    ? "bg-emerald-600/95"
                                    : "bg-purple-600/95"
                              )}
                            >
                              {unit.listing_type === "RENT"
                                ? (language === "th" ? "เช่า" : language === "cn" ? "租" : language === "ru" ? "Аренда" : "Rent")
                                : unit.listing_type === "SALE"
                                  ? (language === "th" ? "ขาย" : language === "cn" ? "售" : language === "ru" ? "Продажа" : "Sale")
                                  : (language === "th" ? "ขาย/เช่า" : language === "cn" ? "租售" : language === "ru" ? "Прод/Аренда" : "Sale/Rent")}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-extrabold text-[#1B263B] truncate">
                            {primaryTitle}
                          </h4>
                          {secondarySubtitle && (
                            <p className="text-[11px] text-slate-500 truncate">
                              {secondarySubtitle}
                            </p>
                          )}
                          {(() => {
                            const unitFloor =
                              unit.floor != null
                                ? unit.floor
                                : (unit.amenities as any)?.floor != null &&
                                    !isNaN(Number((unit.amenities as any)?.floor))
                                  ? Number((unit.amenities as any)?.floor)
                                  : null;
                            const unitParking =
                              unit.parking_slots != null
                                ? unit.parking_slots
                                : (unit.amenities as any)?.parking_slots != null &&
                                    !isNaN(Number((unit.amenities as any)?.parking_slots))
                                  ? Number((unit.amenities as any)?.parking_slots)
                                  : null;

                            return (
                              <div className="flex items-center flex-wrap gap-2 text-[11px] text-slate-500 mt-1">
                                {unit.bedrooms != null && unit.bedrooms > 0 && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <BedDouble className="w-3 h-3" />
                                    {unit.bedrooms}
                                  </span>
                                )}
                                {unit.bathrooms != null && unit.bathrooms > 0 && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Bath className="w-3 h-3" />
                                    {unit.bathrooms}
                                  </span>
                                )}
                                {unit.size_sqm && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Maximize2 className="w-3 h-3" />
                                    {unit.size_sqm}m²
                                  </span>
                                )}
                                {unitFloor != null && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Layers className="w-3 h-3" />
                                    {language === "th"
                                      ? `ชั้น ${unitFloor}`
                                      : language === "cn"
                                        ? `${unitFloor}层`
                                        : language === "ru"
                                          ? `эт. ${unitFloor}`
                                          : `Fl. ${unitFloor}`}
                                  </span>
                                )}
                                {unitParking != null && unitParking > 0 && (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Car className="w-3 h-3" />
                                    {unitParking}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          <div className="mt-1.5 flex items-center justify-between gap-1">
                            <div className="min-w-0">
                              {unit.listing_type === "SALE_AND_RENT" &&
                              prices.salePrice &&
                              prices.rentalPrice &&
                              !filters.priceType &&
                              !filters.listingType ? (
                                <div className="flex flex-col text-[10px] leading-tight">
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="text-[9px] font-bold text-slate-500">
                                      {language === "th" ? "ขาย" : language === "cn" ? "售" : language === "ru" ? "Прод." : "Sale"}
                                    </span>
                                    <span className="font-extrabold text-[#1B263B]">
                                      {formatPrice(prices.salePrice, language)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="text-[9px] font-bold text-blue-600">
                                      {language === "th" ? "เช่า" : language === "cn" ? "租" : language === "ru" ? "Аренда" : "Rent"}
                                    </span>
                                    <span className="font-extrabold text-blue-600">
                                      {formatPrice(prices.rentalPrice, language)}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      {language === "th" ? "/ด." : language === "cn" ? "/月" : language === "ru" ? "/мес." : "/mo"}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-baseline gap-1 flex-wrap">
                                  <span className="text-[10px] font-bold text-slate-500 shrink-0">
                                    {isRentFocus
                                      ? (language === "th" ? "เช่า" : language === "cn" ? "租" : language === "ru" ? "Аренда" : "Rent")
                                      : (language === "th" ? "ขาย" : language === "cn" ? "售" : language === "ru" ? "Продажа" : "Sale")}
                                  </span>
                                  {origVal > 0 && (
                                    <span className="text-[10px] text-slate-400 line-through mr-0.5">
                                      {formatPrice(origVal, language)}
                                    </span>
                                  )}
                                  <span
                                    className={cn(
                                      "text-xs font-extrabold",
                                      origVal > 0
                                        ? "text-rose-600"
                                        : isRentFocus
                                          ? "text-blue-600"
                                          : "text-[#1B263B]"
                                    )}
                                  >
                                    {displayVal > 0
                                      ? formatPrice(displayVal, language)
                                      : t("common.contact_for_price")}
                                  </span>
                                  {isRentFocus && displayVal > 0 && (
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      {language === "th"
                                        ? "/ด."
                                        : language === "cn"
                                          ? "/月"
                                          : language === "ru"
                                            ? "/мес."
                                            : "/mo"}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <Link
                              href={detailHref}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-colors shrink-0"
                              aria-label="Open property"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
