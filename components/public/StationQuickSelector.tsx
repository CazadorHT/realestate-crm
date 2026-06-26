"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Train, MapPin, Search, ChevronDown } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { TransitLine } from "@/features/public/stations";

const LOGO_PATHS: Record<string, string> = {
  BTS: "/images/transit/BTS-Logo.svg",
  GOLD: "/images/transit/BTS-Logo.svg",
  MRT: "/images/transit/MRT_(Bangkok)_logo.svg",
  MRT_PURPLE: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
  MRT_YELLOW: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
  MRT_PINK: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg",
  ARL: "/images/transit/ARLbangkok.svg",
  SRT_RED: "/images/transit/SRT_Red_Lines_icon.svg",
  BRT: "/images/transit/Bangkok_BRT_logo.svg",
};

const DISPLAY_ORDER = ["BTS", "GOLD", "MRT", "MRT_PURPLE", "MRT_YELLOW", "MRT_PINK", "ARL", "SRT_RED", "BRT"];

const LINE_DISPLAY_LABELS: Record<string, { th: string; en: string; cn: string; ru: string }> = {
  BTS: { th: "BTS สายหลัก", en: "BTS Main Line", cn: "BTS 轻轨主线", ru: "Основная линия BTS" },
  GOLD: { th: "BTS สายสีทอง", en: "BTS Gold Line", cn: "BTS 捷运金线", ru: "Золотая линия BTS" },
  MRT: { th: "MRT สายสีน้ำเงิน", en: "MRT Blue Line", cn: "MRT 蓝线", ru: "Синяя линия MRT" },
  MRT_PURPLE: { th: "MRT สายสีม่วง", en: "MRT Purple Line", cn: "MRT 紫线", ru: "Фиолетовая линия MRT" },
  MRT_YELLOW: { th: "MRT สายสีเหลือง", en: "MRT Yellow Line", cn: "MRT 黄线", ru: "Желтая линия MRT" },
  MRT_PINK: { th: "MRT สายสีชมพู", en: "MRT Pink Line", cn: "MRT 粉线", ru: "Розовая линия MRT" },
  ARL: { th: "Airport link", en: "Airport Link", cn: "机场快线", ru: "Аэропорт Рейл Линк" },
  SRT_RED: { th: "รถไฟฟ้าสายสีแดง", en: "SRT Red Line", cn: "SRT 红线", ru: "Красная линия SRT" },
  BRT: { th: "รถ BRT", en: "BRT Bus", cn: "BRT 快速公交", ru: "Автобус BRT" },
};

const getLineLogo = (type: string, color: string) => {
  const path = LOGO_PATHS[type];

  if (path) {
    return (
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={path}
          alt={`${type} Logo`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-slate-100" style={{ color }}>
      <Train className="w-5 h-5 sm:w-6 sm:h-6" />
    </div>
  );
};

const LOCALIZED_STRINGS: Record<string, Record<string, string>> = {
  viewing_near: {
    th: "กำลังดูอสังหาฯ ใกล้:",
    en: "Viewing properties near:",
    cn: "正在查看房源，靠近：",
    ru: "Недвижимость рядом с:"
  },
  station: {
    th: "สถานี",
    en: "Station",
    cn: "站",
    ru: "Станция"
  },
  current: {
    th: "ปัจจุบัน",
    en: "Current Location",
    cn: "当前位置",
    ru: "Текущее местоположение"
  },
  click_to_search: {
    th: "คลิกเพื่อค้นหา หรือเปลี่ยนไปยังสถานี/รถไฟฟ้าสายอื่นๆ",
    en: "Click to search or switch to other stations/lines",
    cn: "点击搜索或切换到其他站点/铁路线",
    ru: "Нажмите для поиска или переключения на другие станции/линии"
  },
  hide_options: {
    th: "ซ่อนตัวเลือก",
    en: "Hide options",
    cn: "隐藏选项",
    ru: "Скрыть"
  },
  search_change: {
    th: "ค้นหา/เปลี่ยนสถานี",
    en: "Search/Change station",
    cn: "搜索/更改站点",
    ru: "Поиск/Смена станции"
  },
  shortcut_title: {
    th: "ทางลัดเลือกสถานีอื่น",
    en: "Shortcut to other stations",
    cn: "选择其他站点的快捷方式",
    ru: "Быстрый переход к другим станциям"
  },
  shortcut_desc: {
    th: "เลือกดูอสังหาริมทรัพย์ทำเลรถไฟฟ้าสายอื่น หรือค้นหาสถานีที่ต้องการได้ทันที",
    en: "Select properties near other transit lines or search for your desired station instantly",
    cn: "选择其他铁路线附近的房源或立即搜索您想要的站点",
    ru: "Выберите недвижимость рядом с другими линиями или найдите нужную станцию мгновенно"
  },
  search_placeholder: {
    th: "ค้นหาชื่อสถานี...",
    en: "Search station name...",
    cn: "搜索站名...",
    ru: "Поиск названия станции..."
  },
  search_results: {
    th: "ผลการค้นหา",
    en: "Search results",
    cn: "搜索结果",
    ru: "Результаты поиска"
  },
  stations_unit: {
    th: "สถานี",
    en: "stations",
    cn: "个站点",
    ru: "станций"
  },
  not_found: {
    th: "ไม่พบสถานีที่คุณค้นหา",
    en: "No stations found for your search",
    cn: "没有找到您搜索的站点",
    ru: "Станции по вашему запросу не найдены"
  },
  all_stations_of: {
    th: "สถานีทั้งหมดของ",
    en: "All stations of",
    cn: "所有站点：",
    ru: "Все станции"
  }
};

const formatStationName = (name: string, lang: string) => {
  if (lang === "en") return `${name} Station`;
  if (lang === "cn") return `${name}站`;
  if (lang === "ru") return `Станция ${name}`;
  return `สถานี${name}`;
};

interface StationQuickSelectorProps {
  lines: TransitLine[];
  currentStationSlug: string;
  currentTransitType: string;
}

export function StationQuickSelector({
  lines,
  currentStationSlug,
  currentTransitType,
}: StationQuickSelectorProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(currentTransitType);
  const [searchQuery, setSearchQuery] = useState("");

  const getString = (key: string, lang: string) => {
    return LOCALIZED_STRINGS[key]?.[lang] || LOCALIZED_STRINGS[key]?.th || "";
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollActiveIndex, setScrollActiveIndex] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  const updatePageCount = () => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      if (clientWidth > 0) {
        setPageCount(Math.ceil(scrollWidth / clientWidth));
      }
    }
  };

  const sortedLines = useMemo(() => {
    return [...lines].sort((a, b) => {
      const indexA = DISPLAY_ORDER.indexOf(a.type);
      const indexB = DISPLAY_ORDER.indexOf(b.type);
      const posA = indexA === -1 ? 999 : indexA;
      const posB = indexB === -1 ? 999 : indexB;
      return posA - posB;
    });
  }, [lines]);

  useEffect(() => {
    updatePageCount();
    const timer = setTimeout(updatePageCount, 400);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
      setScrollActiveIndex(0);
    }

    return () => clearTimeout(timer);
  }, [isExpanded, selectedType, searchQuery]);

  useEffect(() => {
    window.addEventListener("resize", updatePageCount);
    const timer = setTimeout(updatePageCount, 150);
    return () => {
      window.removeEventListener("resize", updatePageCount);
      clearTimeout(timer);
    };
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      if (clientWidth > 0) {
        setScrollActiveIndex(Math.round(scrollLeft / clientWidth));
      }
    }
  };

  const currentStation = useMemo(() => {
    for (const line of sortedLines) {
      const found = line.stations.find((s) => s.slug === currentStationSlug);
      if (found) return { station: found, line };
    }
    return null;
  }, [sortedLines, currentStationSlug]);

  const activeLine = useMemo(() => {
    return sortedLines.find((l) => l.type === selectedType) || sortedLines[0];
  }, [sortedLines, selectedType]);

  // Find all stations matching the search query across all lines
  const filteredAllStations = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    const matches: { station: any; lineColor: string }[] = [];
    
    for (const line of sortedLines) {
      for (const station of line.stations) {
        if (
          station.label.th.toLowerCase().includes(query) ||
          station.label.en.toLowerCase().includes(query) ||
          (station.label.cn && station.label.cn.toLowerCase().includes(query)) ||
          (station.label.ru && station.label.ru.toLowerCase().includes(query)) ||
          station.code.toLowerCase().includes(query)
        ) {
          matches.push({ station, lineColor: line.color });
        }
      }
    }
    return matches;
  }, [sortedLines, searchQuery]);

  return (
    <div className="bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-3xl shadow-xs overflow-hidden transition-all duration-300">
      {/* Header bar (Toggle) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors text-left cursor-pointer select-none outline-hidden"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 bg-white p-1.5 overflow-hidden shadow-xs"
          >
            {(() => {
              const path = LOGO_PATHS[currentStation?.line.type || ""];
              return path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={path} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Train className="w-5 h-5" style={{ color: currentStation?.line.color || "#3b82f6" }} />
              );
            })()}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
              <span>{getString("viewing_near", language)}</span>
              <span className="text-blue-650">
                {currentStation?.station 
                  ? formatStationName((currentStation.station.label as Record<string, string>)[language] || currentStation.station.label.th, language)
                  : getString("current", language)
                }
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: currentStation?.line.color }}>
                {(currentStation?.line.label as Record<string, string>)?.[language] || currentStation?.line.label.th}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {getString("click_to_search", language)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 shrink-0 ml-4">
          <span className="hidden sm:inline-block text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/85 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors">
            {isExpanded ? getString("hide_options", language) : getString("search_change", language)}
          </span>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Train className="w-5 h-5 text-blue-600" />
                    {getString("shortcut_title", language)}
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {getString("shortcut_desc", language)}
                  </p>
                </div>

                {/* Search Station Input */}
                <div className="relative w-full lg:max-w-xs shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={getString("search_placeholder", language)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-hidden transition-all duration-200"
                  />
                </div>
              </div>

              {searchQuery.trim() ? (
                // Search Results Panel
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {getString("search_results", language)} ({filteredAllStations.length} {getString("stations_unit", language)})
                  </span>
                  {filteredAllStations.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {filteredAllStations.map(({ station, lineColor }) => (
                        <Link
                          key={station.code}
                          href={`/near-station/${station.slug}`}
                          onClick={() => setSearchQuery("")}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs font-medium text-slate-800 ${
                            station.slug === currentStationSlug ? "ring-2 ring-blue-500/80" : ""
                          }`}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: lineColor }}
                          />
                          <span className="truncate">{(station.label as Record<string, string>)[language] || station.label.th}</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      {getString("not_found", language)}
                    </div>
                  )}
                </div>
              ) : (
                // Standard Tab-based Selector
                <div>
                  {/* Transit Lines Tabs */}
                  <div className="flex gap-2 py-6 overflow-x-auto scrollbar-none snap-x snap-mandatory justify-start lg:justify-center border-b border-slate-100 mb-6">
                    {sortedLines.map((line) => {
                      const isActive = line.type === selectedType;
                      const displayLabel = LINE_DISPLAY_LABELS[line.type] || line.label;
                      const labelText = (displayLabel as Record<string, string>)[language] || displayLabel.th;

                      return (
                        <m.button
                          key={line.type}
                          onClick={() => setSelectedType(line.type)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex flex-col items-center shrink-0 w-18 sm:w-22 md:w-26 lg:w-30 snap-start cursor-pointer select-none group focus:outline-hidden"
                        >
                          {/* Logo Box */}
                          <div
                            className="w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 rounded-2xl bg-white border-2 flex items-center justify-center p-2 transition-all duration-300 relative"
                            style={{
                              borderColor: line.color,
                              boxShadow: isActive 
                                ? `0 0 16px ${line.color}35` 
                                : `0 2px 4px rgba(0,0,0,0.02)`,
                              transform: isActive ? 'scale(1.02)' : 'none',
                              borderWidth: isActive ? '2.5px' : '2px',
                            }}
                          >
                            {getLineLogo(line.type, line.color)}
                            
                            {/* Active Indicator Dot */}
                            {isActive && (
                              <span 
                                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2"
                                style={{ 
                                  backgroundColor: line.color,
                                  // @ts-ignore
                                  "--tw-ring-color": `${line.color}40`
                                }} 
                              />
                            )}
                          </div>

                          {/* Name Label */}
                          <span
                            className={cn(
                              "block text-2xs sm:text-xs md:text-sm font-bold text-center mt-2.5 transition-colors duration-200 line-clamp-1 w-full px-1",
                              isActive 
                                ? "text-slate-900 font-extrabold" 
                                : "text-slate-500 group-hover:text-slate-800"
                            )}
                            style={{
                              color: isActive ? line.color : undefined
                            }}
                          >
                            {labelText}
                          </span>
                        </m.button>
                      );
                    })}
                  </div>

                  {/* Stations of the Selected Line */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      {getString("all_stations_of", language)} {(activeLine.label as Record<string, string>)[language] || activeLine.label.th} ({activeLine.stations.length} {getString("stations_unit", language)})
                    </span>
                    <div 
                      ref={scrollContainerRef}
                      onScroll={handleScroll}
                      className="grid grid-rows-3 grid-flow-col overflow-x-auto gap-2 lg:grid-rows-none lg:grid-flow-row lg:grid-cols-5 xl:grid-cols-6 lg:overflow-x-visible scrollbar-none snap-x snap-mandatory pb-2"
                    >
                      {activeLine.stations.map((station) => {
                        const isCurrent = station.slug === currentStationSlug;
                        return (
                          <Link
                            key={station.code}
                            href={`/near-station/${station.slug}`}
                            className={`group/item flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium w-[150px] xs:w-[170px] lg:w-auto shrink-0 lg:shrink snap-start ${
                              isCurrent
                                ? "bg-blue-50 border-blue-200 text-blue-700 shadow-xs font-semibold"
                                : "bg-slate-50/50 hover:bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: activeLine.color }}
                              />
                              <span className="truncate">{(station.label as Record<string, string>)[language] || station.label.th}</span>
                            </div>
                            {station.propertyCount !== undefined && station.propertyCount > 0 && (
                              <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-sm ${
                                isCurrent
                                  ? "bg-blue-100 text-blue-800 font-bold"
                                  : "bg-slate-200/50 group-hover/item:bg-slate-200/80 text-slate-500 font-semibold"
                              }`}>
                                {station.propertyCount}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                    {pageCount > 1 && (
                      <div className="flex lg:hidden justify-center gap-1.5 mt-4">
                        {Array.from({ length: pageCount }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (scrollContainerRef.current) {
                                const { clientWidth } = scrollContainerRef.current;
                                scrollContainerRef.current.scrollTo({
                                  left: i * clientWidth,
                                  behavior: "smooth",
                                });
                              }
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              scrollActiveIndex === i 
                                ? "bg-blue-600 w-3" 
                                : "bg-slate-300 hover:bg-slate-400"
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
