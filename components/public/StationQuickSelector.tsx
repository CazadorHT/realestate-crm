"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Train, Search, ChevronDown } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import { TransitLine } from "@/features/public/stations";
import { 
  LOGO_PATHS, 
  DISPLAY_ORDER, 
  LINE_DISPLAY_LABELS, 
  LOCALIZED_STRINGS, 
  formatStationName, 
  LineLogo 
} from "./near-station/helpers/station-selector-helpers";

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
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden transition-all duration-300">
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
              <span className="text-xs font-semibold px-2 py-1 rounded-xl border transition-colors cursor-pointer text-white"
                style={{
                  backgroundColor: currentStation?.line.color || "#2563eb",
                  borderColor: currentStation?.line.color || "#2563eb",
                }}>
                {currentStation?.station
                  ? formatStationName((currentStation.station.label as Record<string, string>)[language] || currentStation.station.label.th, language)
                  : getString("current", language)
                }
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shrink-0" style={{ backgroundColor: currentStation?.line.color }}>
                {(currentStation?.line.label as Record<string, string>)?.[language] || currentStation?.line.label.th}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {getString("click_to_search", language)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 shrink-0 ml-4">
          <span 
            className="hidden sm:inline-block text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer"
            style={{
              color: currentStation?.line.color || "#2563eb",
              borderColor: `${currentStation?.line.color || "#2563eb"}30`,
              backgroundColor: `${currentStation?.line.color || "#2563eb"}15`
            }}
          >
            {isExpanded ? getString("hide_options", language) : getString("search_change", language)}
          </span>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </div>

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

                <div className="relative w-full lg:max-w-xs shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={getString("search_placeholder", language)}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl focus:outline-hidden transition-all duration-200"
                    style={{
                      // @ts-ignore
                      "--tw-border-opacity": "1",
                      borderColor: "rgba(226, 232, 240, 1)"
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = currentStation?.line.color || "#3b82f6";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "";
                    }}
                  />
                </div>
              </div>

              {searchQuery.trim() ? (
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
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs font-medium text-slate-800"
                          style={{
                            boxShadow: station.slug === currentStationSlug ? `0 0 0 2px ${lineColor}cc` : undefined
                          }}
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
                <div>
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
                            <LineLogo type={line.type} color={line.color} />
                            
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
                            className="group/item flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all text-xs font-medium w-[150px] xs:w-[170px] lg:w-auto shrink-0 lg:shrink snap-start"
                            style={isCurrent ? {
                              backgroundColor: `${activeLine.color}08`,
                              borderColor: `${activeLine.color}35`,
                              color: activeLine.color,
                              fontWeight: "600",
                              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            } : {
                              backgroundColor: "rgba(248, 250, 252, 0.5)",
                              borderColor: "rgba(241, 245, 249, 1)",
                              color: "rgba(30, 41, 59, 1)"
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: activeLine.color }}
                              />
                              <span className="truncate">{(station.label as Record<string, string>)[language] || station.label.th}</span>
                            </div>
                            {station.propertyCount !== undefined && station.propertyCount > 0 && (
                              <span 
                                className="shrink-0 text-[9px] px-1.5 py-0.5 rounded-sm"
                                style={isCurrent ? {
                                  backgroundColor: `${activeLine.color}15`,
                                  color: activeLine.color,
                                  fontWeight: "700"
                                } : {
                                  backgroundColor: "rgba(226, 232, 240, 0.5)",
                                  color: "rgba(100, 116, 139, 1)",
                                  fontWeight: "600"
                                }}
                              >
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
                            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: scrollActiveIndex === i ? activeLine.color : "rgba(203, 213, 225, 1)",
                              width: scrollActiveIndex === i ? "12px" : "6px"
                            }}
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
