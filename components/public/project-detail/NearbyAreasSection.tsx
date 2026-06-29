"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { m } from "framer-motion";

// ============================================================
// Types
// ============================================================

interface NearbyArea {
  id: string;
  name: { th: string; en: string };
  slug: string;
  imageUrl: string | null;
  province: string | null;
}

interface NearbyAreasSectionProps {
  areas: NearbyArea[];
  language: string;
  /** Optional override heading — falls back to built-in i18n */
  title?: string;
  /** When true the section renders without its own py/bg/border-t wrapper */
  embedded?: boolean;
}

// ============================================================
// Constants
// ============================================================

const I18N: Record<string, Record<string, string>> = {
  title:    { th: "ย่านแนะนำที่น่าสนใจ",  en: "Recommended Nearby Areas",    cn: "推荐周边区域",  ru: "Рекомендуемые районы"  },
  subtitle: { th: "สำรวจทำเลใกล้เคียงที่มีโครงการและอสังหาริมทรัพย์น่าสนใจ", en: "Explore nearby areas with great properties", cn: "探索附近的热门区域", ru: "Откройте интересные районы рядом" },
  bangkok:  { th: "กรุงเทพฯ",             en: "Bangkok",                     cn: "曼谷",         ru: "Бангкок"               },
};

// ============================================================
// Helpers
// ============================================================

function getProvinceName(province: string | null, language: string): string {
  if (!province) return "";
  if (province === "กรุงเทพมหานคร" || province === "Bangkok") {
    return I18N.bangkok[language] || I18N.bangkok.th;
  }
  return province;
}

// ============================================================
// Main Component
// ============================================================

export function NearbyAreasSection({ areas, language, title, embedded }: NearbyAreasSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft]   = useState(false);
  const [showRight, setShowRight] = useState(true);

  const t = (k: string) => I18N[k]?.[language] || I18N[k]?.en || "";
  const headingText = title ?? t("title");

  /* ── scroll tracking ── */
  const checkLimits = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 15);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkLimits, { passive: true });
    window.addEventListener("resize", checkLimits);
    checkLimits();
    return () => {
      el.removeEventListener("scroll", checkLimits);
      window.removeEventListener("resize", checkLimits);
    };
  }, [areas]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    // scroll by roughly 2 card widths
    el.scrollBy({ left: dir === "left" ? -480 : 480, behavior: "smooth" });
  };

  if (!areas || areas.length === 0) return null;

  const inner = (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <Compass className="w-5 h-5 text-indigo-500" />
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
            {headingText}
          </h2>
          {!embedded && <p className="text-xs text-slate-400 mt-0.5">{t("subtitle")}</p>}
        </div>
      </div>

        {/* Carousel wrapper */}
        <div className="relative">

          {/* ── Left fade + arrow ── */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 transition-opacity duration-300"
            style={{
              background: "linear-gradient(to right, white 10%, transparent)",
              opacity: showLeft ? 1 : 0,
            }}
          />
          {showLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-100 active:scale-95 transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* ── Right fade + arrow ── */}
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 transition-opacity duration-300"
            style={{
              background: "linear-gradient(to left, white 10%, transparent)",
              opacity: showRight ? 1 : 0,
            }}
          />
          {showRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-100 active:scale-95 transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* ── Scrollable row ── */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {areas.map((item, i) => (
              <m.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: "easeOut", delay: i * 0.05 }}
                className="shrink-0 snap-start w-44 sm:w-70"
              >
                <Link
                  href={`/areas/${item.slug}`}
                  className="group relative block h-36 sm:h-40 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 border border-slate-200/40"
                >
                  {/* Image */}
                  {item.imageUrl ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500 select-none"
                      style={{ backgroundImage: `url(${item.imageUrl})` }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-indigo-950 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-indigo-400/50" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                  {/* Text */}
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <span className="block text-sm font-bold text-white tracking-tight drop-shadow-xs line-clamp-1">
                      {item.name[language as keyof typeof item.name] || item.name.th}
                    </span>
                    <span className="block text-xs text-slate-300 mt-0.5 truncate">
                      {getProvinceName(item.province, language)}
                    </span>
                  </div>
                </Link>
              </m.div>
            ))}
          </div>
        </div>
      </>
  );

  if (embedded) {
    return <div>{inner}</div>;
  }

  return (
    <section className="py-10 bg-white border-t border-slate-100">
      <div className="max-w-screen-2xl mx-auto px-5 md:px-8">
        {inner}
      </div>
    </section>
  );
}
