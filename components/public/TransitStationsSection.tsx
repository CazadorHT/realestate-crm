"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Train, ChevronRight, Search, Flame } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import type { TransitLine } from "@/features/public/stations";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

interface TransitStationsSectionProps {
  lines: TransitLine[];
}

// ============================================================
// Constants & Ordering
// ============================================================

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

const SECTION_CONTENT: Record<string, { th: string; en: string; cn: string; ru: string }> = {
  title: {
    th: "ค้นหาอสังหาฯ ทำเลดี |ใกล้สถานีรถไฟฟ้า BTS & MRT|",
    en: "Properties near |BTS & MRT| Transit Stations",
    cn: "捷运与地铁 |BTS & MRT| 沿线优质房产",
    ru: "Недвижимость у станций метро |BTS и MRT|",
  },
  description: {
    th: "เดินทางสะดวกสบายทุกพิกัดกับโครงการคอนโดและบ้านแนวรถไฟฟ้าบีทีเอสและเอ็มอาร์ทีสายหลัก ค้นหาอสังหาริมทรัพย์ทำเลทองเพื่อตอบโจทย์ไลฟ์สไตล์คนเมืองและการลงทุนที่คุ้มค่า",
    en: "Commute effortlessly and unlock great potential. Discover outstanding condos and villas near key BTS and MRT lines, perfect for urban living and solid investment returns.",
    cn: "享受轻松便捷的都市通勤！精选轻轨BTS与地铁MRT沿线黄金地段房产，无论是自住还是置业投资，都是您的理想选择。",
    ru: "Путешествуйте по городу без пробок. Откройте для себя квартиры и дома у ключевых линий метро BTS и MRT, идеально подходящие для городской жизни и доходных инвестиций.",
  },
  allStations: {
    th: "สถานีทั้งหมด",
    en: "All Stations",
    cn: "所有车站",
    ru: "Все станции",
  }
};

const getLineLogo = (type: string, color: string) => {
  const logoPaths: Record<string, string> = {
    BTS: "/images/transit/BTS-Logo.svg",
    GOLD: "/images/transit/BTS-Logo.svg",
    MRT: "/images/transit/MRT_(Bangkok)_logo.svg",
    MRT_PURPLE: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
    MRT_YELLOW: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
    MRT_ORANGE: "/images/transit/MRT_(Bangkok)_Orange_logo.svg",
    MRT_PINK: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg",
    ARL: "/images/transit/ARLbangkok.svg",
    SRT_RED: "/images/transit/SRT_Red_Lines_icon.svg",
    BRT: "/images/transit/Bangkok_BRT_logo.svg",
  };

  const path = logoPaths[type];

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

const POPULAR_STATION_CODES = new Set([
  // BTS Main Line
  "E4", "E5", "E6", "E7", "C1", "N5", "N8", "S6", "E9",
  // MRT Blue Line
  "BL22", "BL26", "BL28", "BL23", "BL27", "BL30"
]);

const POPULAR_LABEL: Record<string, string> = {
  th: "ยอดนิยม",
  en: "Popular",
  cn: "热门",
  ru: "Популярно"
};

function isPopularStation(station: any): boolean {
  return (
    POPULAR_STATION_CODES.has(station.code) ||
    (station.propertyCount !== undefined && station.propertyCount >= 20)
  );
}

function getStationPriceInfo(
  minPrice: number | null | undefined,
  minRentalPrice: number | null | undefined,
  lang: string
): {
  sale: { prefix: string; value: string } | null;
  rent: { prefix: string; value: string } | null;
} {
  let sale: { prefix: string; value: string } | null = null;
  let rent: { prefix: string; value: string } | null = null;

  if (minPrice && minPrice > 0) {
    let prefix = "";
    let value = "";
    
    if (lang === "th") {
      prefix = "เริ่ม";
    } else if (lang === "cn") {
      prefix = "起价";
    } else if (lang === "ru") {
      prefix = "от";
    } else {
      prefix = "Starts";
    }

    if (minPrice >= 1000000) {
      const millions = Number((minPrice / 1000000).toFixed(1));
      value = `฿${millions}M`;
    } else {
      value = `฿${minPrice.toLocaleString()}`;
    }

    if (lang === "cn") {
      sale = { prefix: "", value: `${value} 起` };
    } else {
      sale = { prefix, value };
    }
  }

  if (minRentalPrice && minRentalPrice > 0) {
    let prefix = "";
    let value = "";

    if (lang === "th") {
      prefix = "เช่า";
    } else if (lang === "cn") {
      prefix = "租";
    } else if (lang === "ru") {
      prefix = "Аренда";
    } else {
      prefix = "Rent";
    }

    if (minRentalPrice >= 1000) {
      const thousands = Number((minRentalPrice / 1000).toFixed(0));
      value = `฿${thousands}k/mo`;
    } else {
      value = `฿${minRentalPrice}/mo`;
    }

    if (lang === "th") {
      value = value.replace("/mo", "/ด.");
    } else if (lang === "cn") {
      value = value.replace("/mo", "/月");
    } else if (lang === "ru") {
      value = value.replace("/mo", "/мес");
    }

    rent = { prefix, value };
  }

  return { sale, rent };
}

const SkeletonCard = () => (
  <div className="flex items-center gap-2.5 px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-white border border-slate-100 animate-pulse w-full">
    {/* Dot */}
    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0" />
    {/* Text blocks */}
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="h-4 bg-slate-200 rounded-sm w-3/4" />
      <div className="h-3 bg-slate-200 rounded-sm w-1/2" />
    </div>
  </div>
);

// ============================================================
// Main Component
// ============================================================

export function TransitStationsSection({ lines }: TransitStationsSectionProps) {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sort lines dynamically according to user's desired order
  const sortedLines = [...lines].sort((a, b) => {
    const indexA = DISPLAY_ORDER.indexOf(a.type);
    const indexB = DISPLAY_ORDER.indexOf(b.type);
    const posA = indexA === -1 ? 999 : indexA;
    const posB = indexB === -1 ? 999 : indexB;
    return posA - posB;
  });

  const [activeLineType, setActiveLineType] = useState<string>(
    sortedLines[0]?.type || "BTS"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Force clear pointer-events and scroll lock on body when drawer closes
  useEffect(() => {
    if (!drawerOpen) {
      const cleanup = () => {
        if (typeof document !== "undefined") {
          document.body.style.pointerEvents = "";
          document.body.style.overflow = "";
        }
      };
      cleanup();
      const t = setTimeout(cleanup, 100);
      return () => clearTimeout(t);
    }
  }, [drawerOpen]);

  // Force clear pointer-events on body when popover closes
  useEffect(() => {
    if (!popoverOpen) {
      const cleanup = () => {
        if (typeof document !== "undefined") {
          document.body.style.pointerEvents = "";
        }
      };
      cleanup();
      const t = setTimeout(cleanup, 100);
      return () => clearTimeout(t);
    }
  }, [popoverOpen]);

  // General unmount cleanup to avoid memory leaks or style locks on navigation
  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
      }
    };
  }, []);

  const activeLine = sortedLines.find((line) => line.type === activeLineType) || sortedLines[0];

  const handleLineChange = (type: string) => {
    if (type === activeLineType) return;
    setDrawerOpen(false);
    setPopoverOpen(false);
    setSearchQuery("");
    setIsTransitioning(true);
    setActiveLineType(type);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 250);
  };


  if (!lines || lines.length === 0) return null;

  const tTitle = SECTION_CONTENT.title[language as keyof typeof SECTION_CONTENT.title] || SECTION_CONTENT.title.th;
  const tDescription = SECTION_CONTENT.description[language as keyof typeof SECTION_CONTENT.description] || SECTION_CONTENT.description.th;
  const tAllStations = SECTION_CONTENT.allStations[language as keyof typeof SECTION_CONTENT.allStations] || SECTION_CONTENT.allStations.th;

  // Filter stations based on search query
  const filteredStations = activeLine.stations.filter((station) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const thName = station.label.th?.toLowerCase() || "";
    const enName = station.label.en?.toLowerCase() || "";
    const cnName = station.label.cn?.toLowerCase() || "";
    const ruName = station.label.ru?.toLowerCase() || "";
    const code = station.code.toLowerCase();
    
    return (
      thName.includes(query) ||
      enName.includes(query) ||
      cnName.includes(query) ||
      ruName.includes(query) ||
      code.includes(query)
    );
  });

  const activeLineDisplayLabel = LINE_DISPLAY_LABELS[activeLine.type] || activeLine.label;
  const activeLineLabelText = (activeLineDisplayLabel as Record<string, string>)[language] || activeLineDisplayLabel.th;

  // Show only 5 stations if not searching, otherwise show all matching search results
  const showAll = searchQuery.trim().length > 0;
  const displayStations = showAll ? filteredStations : filteredStations.slice(0, 5);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="pb-6 border-b border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-6 rounded-full bg-blue-500 shrink-0" />
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                {tTitle.split("|").map((part, i) =>
                  i % 2 === 1 ? (
                    <span
                      key={i}
                      className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-blue-500 to-purple-600"
                    >
                      {part}
                    </span>
                  ) : (
                    part
                  )
                )}
              </h2>
            </div>
            <p className="text-xs sm:text-sm md:text-md text-slate-500 leading-relaxed pl-3.5">
              {tDescription}
            </p>
          </div>
          <Link
            href="/near-station"
            className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 hover:underline shrink-0 self-start md:self-end transition-all pb-1 row-start-1"
          >
            {tAllStations}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dynamic Card Selector */}
        <div className="flex gap-2 py-6 overflow-x-auto scrollbar-none snap-x snap-mandatory justify-start xl:justify-center">
          {sortedLines.map((line) => {
            const isActive = activeLineType === line.type;
            const displayLabel = LINE_DISPLAY_LABELS[line.type] || line.label;
            const labelText = (displayLabel as Record<string, string>)[language] || displayLabel.th;

            return (
              <m.button
                key={line.type}
                onClick={() => handleLineChange(line.type)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col  items-center shrink-0 w-18 sm:w-22 md:w-26 lg:w-30 snap-start cursor-pointer select-none group focus:outline-hidden"
              >
                {/* Logo Box */}
                <div
                  className="w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 rounded-2xl bg-white border flex items-center justify-center p-2 transition-all duration-300 relative"
                  style={{
                    borderColor: isActive ? line.color : "#e2e8f0",
                    boxShadow: isActive 
                      ? `0 0 0 3px ${line.color}20, 0 8px 24px ${line.color}25` 
                      : `0 2px 4px rgba(0,0,0,0.02)`,
                    transform: isActive ? 'scale(1.04)' : 'none',
                    borderWidth: isActive ? '3px' : '1px',
                  }}
                >
                  {getLineLogo(line.type, line.color)}
                  
                  {/* Active Indicator Dot */}
                  {isActive && (
                    <span 
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 animate-pulse"
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
                    "block text-xs sm:text-xs md:text-sm font-bold text-center mt-2.5 transition-all duration-200 line-clamp-1 w-full px-1",
                    isActive 
                      ? "text-slate-900 font-black scale-105" 
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

        {/* Station Grid Container */}
        <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-4 sm:p-6 md:p-8 mt-4">
          
          {/* Grid Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeLine.color }} />
              {activeLineLabelText}
            </h3>
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder={
                  language === "th" 
                    ? `ค้นหาสถานีในสาย ${activeLineLabelText}...` 
                    : `Search stations in ${activeLineLabelText}...`
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-xs placeholder:text-xs  bg-white border-slate-200 focus-visible:ring-blue-500 focus-visible:ring-1 rounded-xl w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="text-[10px] font-bold">×</span>
                </button>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <m.div
              key={activeLineType + (isTransitioning ? "-loading" : "-ready")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center w-full"
            >
              {isTransitioning ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-3 w-full">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredStations.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center w-full">
                  <Search className="w-10 h-10 text-slate-300 mb-3 animate-bounce" />
                  <p className="text-sm font-bold text-slate-800">
                    {language === "th" ? "ไม่พบสถานีที่ค้นหา" : "No stations found"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {language === "th" 
                      ? `ไม่พบสถานี "${searchQuery}" ในสายนี้` 
                      : `No stations match "${searchQuery}" in this line`}
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {language === "th" ? "ล้างการค้นหา" : "Clear search"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 w-full self-start">
                  {displayStations.map((station) => {
                    const stationName = station.label[language as keyof typeof station.label] || station.label.th;
                    const prices = getStationPriceInfo(station.minPrice, station.minRentalPrice, language);
                    const isPop = isPopularStation(station);
                    
                    return (
                      <Link
                        key={station.code}
                        href={`/near-station/${station.slug}`}
                        className="group relative flex items-center justify-between px-2 sm:px-4 py-2.5 sm:py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xs overflow-hidden w-full"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                          {/* Station Dot with soft wrapper */}
                          <div 
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${activeLine.color}15` }}
                          >
                            <div 
                              className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border border-white"
                              style={{ backgroundColor: activeLine.color }}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                              {stationName}
                            </span>
                            {prices.sale && (
                              <span className="block text-[10px] sm:text-xs mt-0.5 leading-tight">
                                {prices.sale?.prefix && (
                                  <span className="text-slate-400 font-normal mr-0.5">
                                    {prices.sale?.prefix}
                                  </span>
                                )}
                                <span className="text-blue-600 font-extrabold">
                                  {prices.sale?.value}
                                </span>
                              </span>
                            )}
                            {prices.rent && (
                              <span className="block text-[10px] sm:text-xs mt-0.5 leading-tight">
                                {prices.rent?.prefix && (
                                  <span className="text-slate-400 font-normal mr-0.5">
                                    {prices.rent?.prefix}
                                  </span>
                                )}
                                <span className="text-purple-600 font-extrabold">
                                  {prices.rent?.value}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1 pl-1">
                          {isPop && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold px-1 py-0.5 rounded-md border border-amber-100">
                              <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                              {POPULAR_LABEL[language] || POPULAR_LABEL.en}
                            </span>
                          )}
                          <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 bg-slate-100/70 px-1.5 sm:px-2.5 py-0.5 rounded-full shrink-0">
                            {station.propertyCount} {station.propertyCount === 1 ? "unit" : "units"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                  {!showAll && filteredStations.length > 5 && (
                    !mounted ? (
                      <button
                        className="group flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-blue-50/20 hover:bg-blue-50/40 border border-dashed border-blue-200/60 hover:border-blue-300 transition-all duration-200 cursor-pointer text-left w-full h-full"
                      >
                        <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">
                          {language === "th" 
                            ? `ดูอีก +${filteredStations.length - 5} สถานี` 
                            : `View +${filteredStations.length - 5} More`}
                        </span>
                        <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ) : isMobile ? (
                      <Drawer
                        open={drawerOpen}
                        onOpenChange={setDrawerOpen}
                        shouldScaleBackground={false}
                      >
                        <DrawerTrigger asChild>
                          <button
                            className="group flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-blue-50/20 hover:bg-blue-50/40 border border-dashed border-blue-200/60 hover:border-blue-300 transition-all duration-200 cursor-pointer text-left w-full h-full"
                          >
                            <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">
                              {language === "th" 
                                ? `ดูอีก +${filteredStations.length - 5} สถานี` 
                                : `View +${filteredStations.length - 5} More`}
                            </span>
                            <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </DrawerTrigger>
                        <DrawerContent 
                          className="p-4 bg-white rounded-t-3xl max-h-[85vh] outline-none"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DrawerHeader className="text-left px-1 pb-2 border-b border-slate-100">
                            <DrawerTitle className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeLine.color }} />
                              {activeLineLabelText} ({language === "th" ? "สถานีที่เหลือ" : "More Stations"})
                            </DrawerTitle>
                            <DrawerDescription className="sr-only">
                              List of remaining transit stations
                            </DrawerDescription>
                          </DrawerHeader>
                          <div className="flex flex-col gap-1 overflow-y-auto mt-3 pr-1 pb-8">
                            {filteredStations.slice(5).map((station) => {
                              const stationName = station.label[language as keyof typeof station.label] || station.label.th;
                              const prices = getStationPriceInfo(station.minPrice, station.minRentalPrice, language);
                              const isPop = isPopularStation(station);
                              
                              return (
                                <div key={station.code}>
                                  <Link
                                    href={`/near-station/${station.slug}`}
                                    onClick={() => {
                                      setDrawerOpen(false);
                                      setPopoverOpen(false);
                                    }}
                                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors w-full"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {/* Station Dot with soft wrapper */}
                                      <div 
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${activeLine.color}15` }}
                                      >
                                        <div 
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: activeLine.color }}
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="block text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                                          {stationName}
                                        </span>
                                        {prices.sale && (
                                          <span className="block text-[10px] mt-0.5 leading-tight">
                                            {prices.sale?.prefix && (
                                              <span className="text-slate-400 font-normal mr-0.5">
                                                {prices.sale?.prefix}
                                              </span>
                                            )}
                                            <span className="text-blue-600 font-extrabold">
                                              {prices.sale?.value}
                                            </span>
                                          </span>
                                        )}
                                        {prices.rent && (
                                          <span className="block text-[10px] mt-0.5 leading-tight">
                                            {prices.rent?.prefix && (
                                              <span className="text-slate-400 font-normal mr-0.5">
                                                {prices.rent?.prefix}
                                              </span>
                                            )}
                                            <span className="text-purple-600 font-extrabold">
                                              {prices.rent?.value}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end shrink-0 gap-1 pl-2">
                                      {isPop && (
                                        <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-amber-100">
                                          <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                          {POPULAR_LABEL[language] || POPULAR_LABEL.en}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-500 bg-slate-100/70 px-2 py-0.5 rounded-full font-bold">
                                        {station.propertyCount} {station.propertyCount === 1 ? "unit" : "units"}
                                      </span>
                                    </div>
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        </DrawerContent>
                      </Drawer>
                    ) : (
                      <Popover
                        open={popoverOpen}
                        onOpenChange={setPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <button
                            className="group flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl bg-blue-50/20 hover:bg-blue-50/40 border border-dashed border-blue-200/60 hover:border-blue-300 transition-all duration-200 cursor-pointer text-left w-full h-full"
                          >
                            <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">
                              {language === "th" 
                                ? `ดูอีก +${filteredStations.length - 5} สถานี` 
                                : `View +${filteredStations.length - 5} More`}
                            </span>
                            <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-80 p-3 rounded-2xl shadow-xl border-slate-200 bg-white z-50" 
                          align="end"
                          onOpenAutoFocus={(e) => e.preventDefault()}
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 px-1 pb-1 border-b border-slate-100 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeLine.color }} />
                            {activeLineLabelText} ({language === "th" ? "สถานีที่เหลือ" : "More Stations"})
                          </h4>
                          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
                            {filteredStations.slice(5).map((station) => {
                              const stationName = station.label[language as keyof typeof station.label] || station.label.th;
                              const prices = getStationPriceInfo(station.minPrice, station.minRentalPrice, language);
                              const isPop = isPopularStation(station);
                              
                              return (
                                <div key={station.code}>
                                  <Link
                                    href={`/near-station/${station.slug}`}
                                    onClick={() => {
                                      setDrawerOpen(false);
                                      setPopoverOpen(false);
                                    }}
                                    className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors w-full"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {/* Station Dot with soft wrapper */}
                                      <div 
                                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${activeLine.color}15` }}
                                      >
                                        <div 
                                          className="w-2 h-2 rounded-full"
                                          style={{ backgroundColor: activeLine.color }}
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="block text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                                          {stationName}
                                        </span>
                                        {prices.sale && (
                                          <span className="block text-[10px] mt-0.5 leading-tight">
                                            {prices.sale?.prefix && (
                                              <span className="text-slate-400 font-normal mr-0.5">
                                                {prices.sale?.prefix}
                                              </span>
                                            )}
                                            <span className="text-blue-600 font-extrabold">
                                              {prices.sale?.value}
                                            </span>
                                          </span>
                                        )}
                                        {prices.rent && (
                                          <span className="block text-[10px] mt-0.5 leading-tight">
                                            {prices.rent?.prefix && (
                                              <span className="text-slate-400 font-normal mr-0.5">
                                                {prices.rent?.prefix}
                                              </span>
                                            )}
                                            <span className="text-purple-600 font-extrabold">
                                              {prices.rent?.value}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end shrink-0 gap-1 pl-2">
                                      {isPop && (
                                        <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-amber-100">
                                          <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                          {POPULAR_LABEL[language] || POPULAR_LABEL.en}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-500 bg-slate-100/70 px-2 py-0.5 rounded-full font-bold">
                                        {station.propertyCount} {station.propertyCount === 1 ? "unit" : "units"}
                                      </span>
                                    </div>
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )
                  )}
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
