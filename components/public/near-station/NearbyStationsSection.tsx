"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Train, Flame, ChevronLeft, ChevronRight } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { TransitLine, StationForSEO } from "@/features/public/stations";

// ============================================================
// Types
// ============================================================

interface NearbyStationsSectionProps {
  lines: TransitLine[];
  currentStationSlug: string;
  currentTransitType: string;
  lineColor: string;
}

// ============================================================
// Constants
// ============================================================

const CARDS_PER_PAGE = 10;

const POPULAR_CODES = new Set([
  "E4", "E5", "E6", "E7", "C1", "N5", "N8", "S6", "E9",
  "BL22", "BL26", "BL28", "BL23", "BL27", "BL30",
]);

const LINE_DISPLAY_LABELS: Record<string, Record<string, string>> = {
  BTS:        { th: "BTS สายหลัก",        en: "BTS Main Line",    cn: "BTS 轻轨主线",  ru: "Основная линия BTS"    },
  GOLD:       { th: "BTS สายสีทอง",       en: "BTS Gold Line",   cn: "BTS 捷运金线",  ru: "Золотая линия BTS"     },
  MRT:        { th: "MRT สายสีน้ำเงิน",   en: "MRT Blue Line",   cn: "MRT 蓝线",      ru: "Синяя линия MRT"       },
  MRT_PURPLE: { th: "MRT สายสีม่วง",      en: "MRT Purple Line", cn: "MRT 紫线",      ru: "Фиолетовая линия MRT"  },
  MRT_YELLOW: { th: "MRT สายสีเหลือง",    en: "MRT Yellow Line", cn: "MRT 黄线",      ru: "Желтая линия MRT"      },
  MRT_PINK:   { th: "MRT สายสีชมพู",      en: "MRT Pink Line",   cn: "MRT 粉线",      ru: "Розовая линия MRT"     },
  ARL:        { th: "Airport Link",        en: "Airport Link",    cn: "机场快线",      ru: "Аэропорт Рейл Линк"    },
  SRT_RED:    { th: "รถไฟฟ้าสายสีแดง",    en: "SRT Red Line",    cn: "SRT 红线",      ru: "Красная линия SRT"     },
  BRT:        { th: "รถ BRT",              en: "BRT Bus",         cn: "BRT 快速公交",  ru: "Автобус BRT"           },
};

const I18N: Record<string, Record<string, string>> = {
  sectionTitle:  { th: "สถานีอื่นๆ ในสายเดียวกัน", en: "Other Stations on This Line",    cn: "同线其他站点",         ru: "Другие станции на этой линии" },
  sectionDesc:   { th: "เลือกดูอสังหาริมทรัพย์ใกล้สถานีอื่นๆ", en: "Browse properties near other stations", cn: "浏览其他站点附近的房产", ru: "Недвижимость у других станций" },
  popular:       { th: "ยอดนิยม",  en: "Popular",     cn: "热门",      ru: "Популярно" },
  current:       { th: "สถานีนี้",  en: "Current",     cn: "当前站",    ru: "Текущая"   },
  priceFrom:     { th: "เริ่ม",     en: "From",        cn: "起价",      ru: "от"        },
  rentFrom:      { th: "เช่าเริ่ม", en: "Rent from",   cn: "租金起",    ru: "Аренда от" },
  units:         { th: "รายการ",    en: "units",       cn: "套",        ru: "объявл."   },
  prevPage:      { th: "ก่อนหน้า",  en: "Previous",    cn: "上一页",    ru: "Назад"     },
  nextPage:      { th: "ถัดไป",     en: "Next",        cn: "下一页",    ru: "Вперёд"    },
  viewAll:       { th: "ดูสถานีทั้งหมด", en: "View All Stations", cn: "查看所有站点", ru: "Все станции" },
};

// ============================================================
// Helpers
// ============================================================

function formatPrice(price: number, lang: string): string {
  if (price >= 1_000_000) {
    const m = Number((price / 1_000_000).toFixed(1));
    return `฿${m}M`;
  }
  return `฿${price.toLocaleString()}`;
}

function formatRent(price: number, lang: string): string {
  const suffix = lang === "th" ? "/ด." : lang === "cn" ? "/月" : lang === "ru" ? "/мес" : "/mo";
  if (price >= 1000) return `฿${Math.round(price / 1000)}k${suffix}`;
  return `฿${price}${suffix}`;
}

function isPopular(station: StationForSEO): boolean {
  return POPULAR_CODES.has(station.code) || (station.propertyCount ?? 0) >= 20;
}

// ============================================================
// Station Card
// ============================================================

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" as const, delay: i * 0.04 },
  }),
};

function StationCard({
  station,
  language,
  lineColor,
  isCurrent,
  index,
}: {
  station: StationForSEO;
  language: string;
  lineColor: string;
  isCurrent: boolean;
  index: number;
}) {
  const name = (station.label as Record<string, string>)[language] || station.label.th;
  const pop = isPopular(station);
  const t = (k: string) => I18N[k]?.[language] || I18N[k]?.en || "";

  return (
    <m.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <Link
        href={`/near-station/${station.slug}`}
        aria-current={isCurrent ? "page" : undefined}
        className={[
          "group relative flex flex-col justify-between gap-2 rounded-2xl border border-slate-200 p-3 sm:p-4 transition-all duration-300",
          isCurrent
            ? "border  shadow-md"
            : "bg-white hover:bg-slate-50/70 hover:-translate-y-0.5 hover:shadow-md border-slate-100 hover:border-slate-200",
        ].join(" ")}
        style={
          isCurrent
            ? {
                backgroundColor: `${lineColor}08`,
                borderColor: `${lineColor}40`,
              }
            : undefined
        }
      >
        {/* Top Row */}
        <div className="flex items-start justify-between gap-1">
          {/* Dot + Name */}
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${lineColor}18` }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: lineColor }}
              />
            </div>
            <span
              className={[
                "text-xs sm:text-sm font-bold truncate transition-colors",
                isCurrent ? "" : "text-slate-800 group-hover:text-blue-600",
              ].join(" ")}
              style={isCurrent ? { color: lineColor } : undefined}
            >
              {name}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {isCurrent && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: lineColor }}
              >
                {t("current")}
              </span>
            )}
            {!isCurrent && pop && (
              <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-amber-100">
                <Flame className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                {t("popular")}
              </span>
            )}
          </div>
        </div>

        {/* Price + Count */}
        <div className="flex items-end justify-between gap-1 mt-1">
          <div className="flex flex-col gap-0.5 min-w-0">
            {station.minPrice && station.minPrice > 0 && (
              <span className="text-[10px] leading-tight">
                <span className="text-slate-400 font-normal mr-0.5">{t("priceFrom")}</span>
                <span className="text-blue-600 font-extrabold">{formatPrice(station.minPrice, language)}</span>
              </span>
            )}
            {station.minRentalPrice && station.minRentalPrice > 0 && (
              <span className="text-[10px] leading-tight">
                <span className="text-slate-400 font-normal mr-0.5">{t("rentFrom")}</span>
                <span className="text-purple-600 font-extrabold">{formatRent(station.minRentalPrice, language)}</span>
              </span>
            )}
          </div>
          {(station.propertyCount ?? 0) > 0 && (
            <span className="text-[10px] text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full font-bold shrink-0">
              {station.propertyCount} {t("units")}
            </span>
          )}
        </div>
      </Link>
    </m.div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function NearbyStationsSection({
  lines,
  currentStationSlug,
  currentTransitType,
  lineColor,
}: NearbyStationsSectionProps) {
  const { language } = useLanguage();
  const [page, setPage] = useState(0);

  const t = (k: string) => I18N[k]?.[language] || I18N[k]?.en || "";

  // Find the current line's stations (excluding current station at top)
  const currentLine = useMemo(
    () => lines.find((l) => l.type === currentTransitType),
    [lines, currentTransitType]
  );

  const otherStations = useMemo(() => {
    if (!currentLine) return [];
    // Put current station first, then others sorted by propertyCount desc
    const curr = currentLine.stations.find((s) => s.slug === currentStationSlug);
    const rest = currentLine.stations
      .filter((s) => s.slug !== currentStationSlug)
      .sort((a, b) => (b.propertyCount ?? 0) - (a.propertyCount ?? 0));
    return curr ? [curr, ...rest] : rest;
  }, [currentLine, currentStationSlug]);

  const totalPages = Math.ceil(otherStations.length / CARDS_PER_PAGE);
  const pageStations = otherStations.slice(
    page * CARDS_PER_PAGE,
    (page + 1) * CARDS_PER_PAGE
  );

  if (!currentLine || otherStations.length <= 1) return null;

  const lineLabelMap = LINE_DISPLAY_LABELS[currentLine.type];
  const lineLabel = lineLabelMap
    ? lineLabelMap[language] || lineLabelMap.en
    : (currentLine.label as Record<string, string>)[language] || currentLine.label.th;

  return (
    <section className="py-10 bg-slate-50/60 border-t border-slate-100">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: lineColor }} />
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${lineColor}20` }}
              >
                <Train className="w-2.5 h-2.5" style={{ color: lineColor }} />
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: lineColor }}
              >
                {lineLabel}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {t("sectionTitle")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{t("sectionDesc")}</p>
          </div>

          <Link
            href="/near-station"
            className="text-xs font-bold flex items-center gap-0.5 hover:underline shrink-0 self-start sm:self-end pb-0.5 transition-colors"
            style={{ color: lineColor }}
          >
            {t("viewAll")}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Cards Grid */}
        <AnimatePresence mode="wait">
          <m.div
            key={page}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5"
          >
            {pageStations.map((station, i) => (
              <StationCard
                key={station.slug}
                station={station}
                language={language}
                lineColor={lineColor}
                isCurrent={station.slug === currentStationSlug}
                index={i}
              />
            ))}
          </m.div>
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t("prevPage")}
            </button>

            {/* Page dots */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Page ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === page ? "20px" : "8px",
                    height: "8px",
                    backgroundColor: i === page ? lineColor : "#cbd5e1",
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {t("nextPage")}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
