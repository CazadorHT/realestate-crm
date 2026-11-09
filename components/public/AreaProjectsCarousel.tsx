"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { parseBilingualProjectName } from "@/lib/utils/project-name-utils";

interface Project {
  id: string;
  name: { th: string; en: string };
  slug: string;
  developer: string | null;
  imageUrl: string | null;
  propertyCount: number;
  propertyType?: number | string | null;
}

function getProjectPropertyTypeLabel(type: number | string | null | undefined, language: string): string {
  let typeKey = "CONDO";
  if (typeof type === "number") {
    const map: Record<number, string> = {
      1: "CONDO",
      2: "HOUSE",
      3: "TOWNHOME",
      4: "LAND",
      5: "COMMERCIAL",
      6: "WAREHOUSE",
      7: "OFFICE",
      8: "VILLA",
      9: "POOL_VILLA",
      11: "HOME_OFFICE",
    };
    typeKey = map[type] || "CONDO";
  } else if (typeof type === "string") {
    typeKey = type.toUpperCase();
  }

  const labels: Record<string, Record<string, string>> = {
    CONDO: { th: "คอนโดมิเนียม", en: "Condominium", cn: "公寓", ru: "Кондоминиум" },
    HOUSE: { th: "บ้านเดี่ยว", en: "Single House", cn: "独栋别墅", ru: "Дом" },
    TOWNHOME: { th: "ทาวน์โฮม", en: "Townhome", cn: "联排别墅", ru: "Таунхаус" },
    VILLA: { th: "วิลล่า", en: "Villa", cn: "独栋别墅", ru: "Вилла" },
    POOL_VILLA: { th: "พูลวิลล่า", en: "Pool Villa", cn: "泳池别墅", ru: "Вилла с бассейном" },
    OFFICE: { th: "อาคารสำนักงาน", en: "Office Building", cn: "写字楼", ru: "Офис" },
    HOME_OFFICE: { th: "โฮมออฟฟิศ", en: "Home Office", cn: "商住办公", ru: "Домашний офис" },
    COMMERCIAL: { th: "อาคารพาณิชย์", en: "Commercial", cn: "商用建筑", ru: "Коммерция" },
    LAND: { th: "ที่ดิน", en: "Land", cn: "土地", ru: "Земля" },
  };

  return labels[typeKey]?.[language] || labels[typeKey]?.th || (language === "th" ? "คอนโดมิเนียม" : "Condominium");
}

interface AreaProjectsCarouselProps {
  projects: Project[];
  language?: string;
  viewDetailsLabel?: string;
  unitsLabel?: string;
  locationArea?: string | null;
  locationAreaDict?: { th?: string | null; en?: string | null; cn?: string | null; ru?: string | null } | null;
  propertyType?: string | null;
  title?: React.ReactNode;
  subtitle?: string;
}

export function AreaProjectsCarousel({
  projects,
  language: propLanguage,
  viewDetailsLabel: propViewDetailsLabel,
  unitsLabel: propUnitsLabel,
  locationArea,
  locationAreaDict,
  propertyType,
  title,
  subtitle,
}: AreaProjectsCarouselProps) {
  const { langPrefix, language: contextLanguage } = useLanguage();
  const language = contextLanguage || propLanguage || "th";

  const unitsLabel =
    propUnitsLabel ||
    (() => {
      if (language === "en") return "units";
      if (language === "cn") return "套";
      if (language === "ru") return "ед.";
      return "ยูนิต";
    })();

  const viewDetailsLabel =
    propViewDetailsLabel ||
    (() => {
      if (language === "en") return "View Project";
      if (language === "cn") return "查看项目";
      if (language === "ru") return "Посмотреть проект";
      return "ดูโครงการ";
    })();

  // Resolve location in current language dynamically
  const localizedLocation = (() => {
    if (locationAreaDict) {
      if (language === "th") return locationAreaDict.th || locationArea;
      if (language === "cn") return locationAreaDict.cn || locationAreaDict.en || locationAreaDict.th || locationArea;
      if (language === "ru") return locationAreaDict.ru || locationAreaDict.en || locationAreaDict.th || locationArea;
      return locationAreaDict.en || locationAreaDict.th || locationArea;
    }
    return locationArea || "";
  })();

  const gradientLocation = localizedLocation ? (
    <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent font-extrabold">
      {localizedLocation}
    </span>
  ) : null;

  const typeName = (() => {
    switch (propertyType) {
      case "CONDO":
        return language === "en" ? "Condo" : language === "cn" ? "公寓" : language === "ru" ? "квартир" : "คอนโด";
      case "HOUSE":
        return language === "en" ? "House" : language === "cn" ? "别墅" : language === "ru" ? "домов" : "บ้านเดี่ยว";
      case "TOWNHOME":
        return language === "en" ? "Townhome" : language === "cn" ? "联排别墅" : language === "ru" ? "таунхаусов" : "ทาวน์โฮม";
      case "VILLA":
      case "POOL_VILLA":
        return language === "en" ? "Villa" : language === "cn" ? "泳池别墅" : language === "ru" ? "вилл" : "วิลล่า";
      default:
        return language === "en" ? "Residential" : language === "cn" ? "房产" : language === "ru" ? "жилых" : "";
    }
  })();

  const dynamicHeading = localizedLocation ? (
    language === "en" ? (
      <>Other Interesting {typeName} Projects near {gradientLocation}</>
    ) : language === "cn" ? (
      <>{gradientLocation} 附近其他热门{typeName}项目</>
    ) : language === "ru" ? (
      <>Другие интересные проекты в районе {gradientLocation}</>
    ) : (
      <>โครงการ{typeName ? `${typeName} ` : ""}อื่นๆ ที่น่าสนใจใกล้เคียง {gradientLocation}</>
    )
  ) : null;

  const dynamicSubtitle = localizedLocation ? (
    language === "en"
      ? `Notable condominium and residential developments around ${localizedLocation}`
      : language === "cn"
        ? `探索 ${localizedLocation} 周边优质楼盘与住宅项目`
        : language === "ru"
          ? `Интересные жилые комплексы и проекты в районе ${localizedLocation}`
          : `โครงการ${typeName || "ที่อยู่อาศัย"}ที่น่าสนใจรอบย่าน ${localizedLocation}`
  ) : null;

  const headerTitle = title || dynamicHeading;
  const headerSubtitle = subtitle || dynamicSubtitle;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollLimits = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      // Add slight padding tolerance for float rounding in zoom levels
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 15);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollLimits);
      // Run once initially
      checkScrollLimits();
      // Handle resize
      window.addEventListener("resize", checkScrollLimits);
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScrollLimits);
      }
      window.removeEventListener("resize", checkScrollLimits);
    };
  }, [projects]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full">
      {headerTitle && (
        <div className="flex items-center gap-2.5 mb-6">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
              {headerTitle}
            </h2>
            {headerSubtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{headerSubtitle}</p>
            )}
          </div>
        </div>
      )}

      <div className="relative group/carousel w-full">
        {/* ── Left fade + arrow ── */}
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 transition-opacity duration-300"
          style={{
            background: "linear-gradient(to right, white 10%, transparent)",
            opacity: showLeftArrow ? 1 : 0,
          }}
        />
        {showLeftArrow && (
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
            opacity: showRightArrow ? 1 : 0,
          }}
        />
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-100 active:scale-95 transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((proj) => {
          const typeLabel = getProjectPropertyTypeLabel(proj.propertyType, language);
          const rawTh = typeof proj.name === "object" ? proj.name.th : proj.name;
          const rawEn = typeof proj.name === "object" ? proj.name.en : undefined;
          const { cleanTh, cleanEn } = parseBilingualProjectName(rawTh, rawEn);

          // กฎ: แต่ชื่อโครงการ หากนอกเหนือจาก th ให้ใช้ eng กับภาษาอื่นหมด
          const displayProjectName = language === "th"
            ? (cleanTh || cleanEn)
            : (cleanEn || cleanTh);

          const hasEnglishLine = language === "th" && cleanEn && cleanEn.trim() !== (cleanTh || "").trim();

          return (
            <Link
              key={proj.id}
              href={`${langPrefix}/projects/${proj.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200/60 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col shrink-0 w-44 sm:w-70 snap-start"
            >
              {/* Project Cover Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                {proj.imageUrl ? (
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url(${proj.imageUrl})` }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center text-indigo-400">
                    <Building2 className="w-12 h-12 stroke-[1.5]" />
                  </div>
                )}

                {/* Unit Count Badge (คงไว้เฉพาะจำนวนยูนิต เอา badge ประเภททรัพย์บนภาพออกตามสั่ง) */}
                <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-white/95 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-slate-100 text-[9px] sm:text-[10px] font-bold text-indigo-600 shadow-xs">
                  {proj.propertyCount} {unitsLabel}
                </div>
              </div>

              {/* Project Details */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between text-left space-y-2">
                <div>
                  {/* Line 1: Primary Project Name (สำหรับภาษาอื่นใช้ eng ทั้งหมด) */}
                  <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug">
                    {displayProjectName}
                  </h3>

                  {/* Line 2 (เฉพาะภาษาไทยเท่านั้น ที่มี ภาษา eng อยู่อีกบรรทัดด้วย) */}
                  {hasEnglishLine && (
                    <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5">
                      {cleanEn}
                    </p>
                  )}

                  {/* Line 3: บอกประเภททรัพย์ + ผู้พัฒนา */}
                  <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-1.5 flex items-center gap-1.5">
                    <span className="text-indigo-600 font-semibold">{typeLabel}</span>
                    {proj.developer && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 truncate">{proj.developer}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                  <span>{viewDetailsLabel}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  </div>
  );
}
