"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Map } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useMapPins } from "@/hooks/search/useMapPins";
import { PropertyVectorMapLazy } from "@/components/public/map/PropertyVectorMapLazy";

export function HeroMiniMapWidget() {
  const { language, langPrefix } = useLanguage();
  const { pins, stations, isLoading } = useMapPins(true);

  const unitsCountLabel = useMemo(() => {
    if (language === "en") return `${pins.length} Units on Map`;
    if (language === "cn") return `地图上 ${pins.length} 套房源`;
    if (language === "ru") return `${pins.length} объектов на карте`;
    return `${pins.length} ยูนิตบนแผนที่`;
  }, [pins.length, language]);

  const fullMapLabel = useMemo(() => {
    if (language === "en") return "Full Map Explorer";
    if (language === "cn") return "打开全屏地图";
    if (language === "ru") return "Открыть карту";
    return "เปิดแผนที่แบบเต็มหน้าจอ";
  }, [language]);

  return (
    <div className="h-[450px] w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
      {/* Map Canvas (Flex-1: Clean container with zero floating z-index overlaps) */}
      <div className="flex-1 w-full relative min-h-0">
        <PropertyVectorMapLazy
          filteredPins={pins}
          stations={stations}
          isLoading={isLoading}
          activeListingFilter="ALL"
          className="w-full h-full"
          suppressMobilePopup={false}
        />
      </div>

      {/* Sleek Dedicated Footer Bar (Zero z-index collision with map pins or popup cards) */}
      <div className="h-11 px-3.5 bg-white border-t border-slate-100 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{unitsCountLabel}</span>
        </div>

        <Link
          href={`${langPrefix}/map`}
          prefetch={false}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 active:scale-95 transition-all duration-150 cursor-pointer"
        >
          <Map className="w-3.5 h-3.5 shrink-0" />
          <span>{fullMapLabel}</span>
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
        </Link>
      </div>
    </div>
  );
}
