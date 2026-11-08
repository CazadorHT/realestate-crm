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
      setHasMountedMap(true);
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
      <div className="flex items-center p-1 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl w-full">
        <button
          type="button"
          onClick={() => handleTabChange("wizard")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none",
            activeTab === "wizard"
              ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="truncate">{smartMatchLabel}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("map")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none",
            activeTab === "map"
              ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
              : "text-slate-300 hover:text-white hover:bg-white/5"
          )}
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{mapLabel}</span>
        </button>
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
          <div className={activeTab === "wizard" ? "block" : "hidden"}>
            <SmartMatchWizard />
          </div>

          {/* Lazy mount map only on first interaction, and preserve when switching */}
          {hasMountedMap && (
            <div className={activeTab === "map" ? "block" : "hidden"}>
              <HeroMiniMapWidget />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
