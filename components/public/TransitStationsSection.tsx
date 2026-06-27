"use client";

import { useState } from "react";
import Link from "next/link";
import { Train, ChevronRight } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { cn } from "@/lib/utils";
import type { TransitLine } from "@/features/public/stations";

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

// ============================================================
// Main Component
// ============================================================

export function TransitStationsSection({ lines }: TransitStationsSectionProps) {
  const { language } = useLanguage();

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

  const activeLine = sortedLines.find((line) => line.type === activeLineType) || sortedLines[0];

  if (!lines || lines.length === 0) return null;

  const tTitle = SECTION_CONTENT.title[language as keyof typeof SECTION_CONTENT.title] || SECTION_CONTENT.title.th;
  const tDescription = SECTION_CONTENT.description[language as keyof typeof SECTION_CONTENT.description] || SECTION_CONTENT.description.th;
  const tAllStations = SECTION_CONTENT.allStations[language as keyof typeof SECTION_CONTENT.allStations] || SECTION_CONTENT.allStations.th;

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
                onClick={() => setActiveLineType(line.type)}
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

        {/* Station Grid Container */}
        <div className="bg-slate-50/50 rounded-3xl border border-slate-100 p-4 sm:p-6 md:p-8 mt-4">
          <AnimatePresence mode="wait">
            <m.div
              key={activeLineType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-3"
            >
              {activeLine.stations.slice(0, 5).map((station) => {
                const stationName = station.label[language as keyof typeof station.label] || station.label.th;
                
                return (
                  <Link
                    key={station.code}
                    href={`/near-station/${station.slug}`}
                    className="group flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white hover:bg-slate-100/50 border border-slate-100 hover:border-slate-200 transition-all duration-200 hover:shadow-xs"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1"
                      style={{ 
                        backgroundColor: activeLine.color, 
                        // @ts-ignore
                        "--tw-ring-color": `${activeLine.color}25` 
                      }}
                    />
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-slate-800 group-hover:text-blue-600 truncate transition-colors">
                        {stationName}
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                        {station.label.en}
                      </span>
                    </div>
                  </Link>
                );
              })}

              {activeLine.stations.length > 5 && (
                <Link
                  href={`/near-station`}
                  className="group flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-blue-50/30 hover:bg-blue-50/60 border border-dashed border-blue-200/80 hover:border-blue-300 transition-all duration-200"
                >
                  <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">
                    {language === "th" 
                      ? `ดูทั้งหมด +${activeLine.stations.length - 5} สถานี` 
                      : `View +${activeLine.stations.length - 5} More`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </m.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
