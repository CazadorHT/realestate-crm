"use client";

import { useState, useMemo } from "react";
import { Sparkles, MapPin } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { SmartMatchWizard } from "@/components/public/SmartMatchWizard";
import { HeroMiniMapWidget } from "@/components/public/HeroMiniMapWidget";

interface HeroRightWidgetProps {
  hasProperties?: boolean;
}

export function HeroRightWidget({ hasProperties = true }: HeroRightWidgetProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"wizard" | "map">("wizard");
  const [hasMountedMap, setHasMountedMap] = useState(false);

  const handleTabChange = (tab: "wizard" | "map") => {
    setActiveTab(tab);
    if (tab === "map" && !hasMountedMap) {
      // Defer mounting map by 1 frame so the button sliding animation begins instantly without any hitch
      requestAnimationFrame(() => {
        setHasMountedMap(true);
      });
    }
  };

  const smartMatchLabel = useMemo(() => {
    if (language === "cn") return "智能匹配";
    if (language === "ru") return "Smart Match";
    if (language === "en") return "Smart Match";
    return "Smart Match";
  }, [language]);

  const mapLabel = useMemo(() => {
    if (language === "cn") return "地图找房";
    if (language === "ru") return "Поиск на карте";
    if (language === "en") return "Map Explorer";
    return "ค้นหาจากแผนที่";
  }, [language]);

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Sleek Pill Switcher */}
      <div className="flex items-center p-1 sm:p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 shadow-lg shadow-black/10 w-full">
        <div className="relative grid grid-cols-2 w-full">
          {/* Sliding Indicator (100% Pure CSS GPU Compositor - Zero JS overhead, silky 120fps) */}
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md shadow-blue-500/25 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none will-change-transform",
              activeTab === "map" ? "translate-x-full" : "translate-x-0"
            )}
          />

          <button
            type="button"
            onClick={() => handleTabChange("wizard")}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer select-none",
              activeTab === "wizard"
                ? "text-white"
                : "text-slate-600 hover:text-blue-600"
            )}
          >
            <Sparkles
              className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors duration-200",
                activeTab === "wizard" ? "text-amber-300" : "text-amber-500"
              )}
            />
            <span className="truncate">{smartMatchLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("map")}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer select-none",
              activeTab === "map"
                ? "text-white"
                : "text-slate-600 hover:text-blue-600"
            )}
          >
            <MapPin
              className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors duration-200",
                activeTab === "map" ? "text-emerald-300" : "text-emerald-600"
              )}
            />
            <span className="truncate">{mapLabel}</span>
          </button>
        </div>
      </div>

      {/* Widget Container */}
      <div className="relative">
        {!hasProperties && (
          <div className="absolute inset-0 z-50 bg-white/70 rounded-2xl flex items-center justify-center">
            <div className="bg-white px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100/50 text-center transform -translate-y-4">
              <div className="w-12 h-12 mb-3 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <p className="font-semibold text-slate-800 mb-1">
                {t("properties.not_found") || "ยังไม่ได้ลงประกาศทรัพย์"}
              </p>
            </div>
          </div>
        )}

        <div
          className={
            !hasProperties
              ? "opacity-60 select-none pointer-events-none transition-opacity duration-300"
              : ""
          }
        >
          {/* Preserve Wizard state when switching back and forth */}
          <div
            className={cn(
              "transition-opacity duration-200 ease-out",
              activeTab === "wizard"
                ? "opacity-100 block animate-in fade-in-50 duration-200"
                : "hidden"
            )}
          >
            <SmartMatchWizard />
          </div>

          {/* Lazy mount map only on first interaction, and preserve when switching */}
          {hasMountedMap && (
            <div
              className={cn(
                "transition-opacity duration-200 ease-out",
                activeTab === "map"
                  ? "opacity-100 block animate-in fade-in-50 duration-200"
                  : "hidden"
              )}
            >
              <HeroMiniMapWidget />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
