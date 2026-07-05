"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Building2, ArrowRight, Sparkles, MapPin } from "lucide-react";
import type { PublicProject } from "@/features/public/projects";
import { SectionBackground } from "./SectionBackground";
import { getProvinceName } from "@/lib/utils/provinces";

interface FeaturedProjectsSectionProps {
  projects: PublicProject[];
  language: string;
}

const SECTION_LOCALIZATION: Record<string, Record<string, string>> = {
  badge: {
    th: "โครงการแนะนำ",
    en: "Featured Projects",
    cn: "热门项目",
    ru: "Рекомендуемые",
  },
  title: {
    th: "ค้นหาตาม|โครงการอสังหาฯ เด่น",
    en: "Explore |Featured Projects",
    cn: "发现曼谷|热门楼盘推荐",
    ru: "Каталог |Рекомендуемых Комплексов",
  },
  subtitle: {
    th: "เลือกชมห้องว่างและเปรียบเทียบราคาในโครงการคอนโดและบ้านเด่น",
    en: "Browse active listings and compare prices in top residential developments",
    cn: "浏览热门公寓及住宅项目中的全部在售/在租房源",
    ru: "Просматривайте доступные квартиры в лучших новостройках",
  },
  view_all: {
    th: "ดูโครงการทั้งหมด",
    en: "View All Projects",
    cn: "查看所有项目",
    ru: "Все проекты",
  },
  units_available: {
    th: "{count} ยูนิตว่าง",
    en: "{count} rooms available",
    cn: "{count} 套房源",
    ru: "{count} в наличии",
  },
  no_units: {
    th: "ไม่มีห้องว่างขณะนี้",
    en: "No active listings",
    cn: "暂无房源",
    ru: "Нет объявлений",
  },
  price_from: {
    th: "เริ่มต้น {price}",
    en: "From {price}",
    cn: "{price} 起",
    ru: "От {price}",
  },
  price_sale: {
    th: "ขาย",
    en: "Sale",
    cn: "售",
    ru: "Продажа",
  },
  price_rent: {
    th: "เช่า",
    en: "Rent",
    cn: "租",
    ru: "Аренда",
  },
  developer: {
    th: "ผู้พัฒนา",
    en: "Developer",
    cn: "开发商",
    ru: "Застройщик",
  }
};

function formatPrice(amount: number, lang: string): string {
  if (amount >= 1000000) {
    const value = amount / 1000000;
    const formatted = value.toFixed(1).replace(/\.0$/, "");
    return lang === "th" ? `${formatted} ล้าน` : `${formatted}M`;
  }
  return new Intl.NumberFormat(lang === "th" ? "th-TH" : "en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FeaturedProjectsSection({
  projects,
  language,
}: FeaturedProjectsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const getPageString = (key: string, params?: Record<string, string | number>) => {
    let val = SECTION_LOCALIZATION[key]?.[language] || SECTION_LOCALIZATION[key]?.th || "";
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, String(v));
      });
    }
    return val;
  };

  const checkScrollLimits = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 15);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollLimits);
      checkScrollLimits();
      window.addEventListener("resize", checkScrollLimits);
    }
    return () => {
      if (el) el.removeEventListener("scroll", checkScrollLimits);
      window.removeEventListener("resize", checkScrollLimits);
    };
  }, [projects]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  if (projects.length === 0) return null;

  return (
    <section className="py-12 bg-slate-50 relative overflow-hidden z-0 border-t border-b border-slate-100">
      <SectionBackground pattern="blobs" intensity="low" showDots={true} />
      
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 gap-4">
          <div className="max-w-2xl text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-linear-to-r from-blue-50 to-purple-50 border border-blue-100 w-fit">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-blue-700">
                {getPageString("badge")}
              </span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              {(() => {
                const titleStr = getPageString("title");
                if (titleStr.includes("|")) {
                  const [prefix, highlighted] = titleStr.split("|");
                  return (
                    <>
                      {prefix}
                      <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                        {highlighted}
                      </span>
                    </>
                  );
                }
                return titleStr;
              })()}
            </h2>
            <p className="text-base md:text-lg text-slate-550 font-medium">
              {getPageString("subtitle")}
            </p>
          </div>
          
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-5 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-xl hover:shadow-xl hover:shadow-blue-550/30 transition-all hover:scale-105"
          >
            <span>{getPageString("view_all")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative group/carousel w-full">
          {/* Left/Right Edge Fades to indicate scrollability */}
          <div className={`absolute left-0 top-0 bottom-6 w-20 bg-gradient-to-r from-slate-50 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${showLeftArrow ? "opacity-100" : "opacity-0"}`} />
          <div className={`absolute right-0 top-0 bottom-6 w-20 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none z-10 transition-opacity duration-300 ${showRightArrow ? "opacity-100" : "opacity-0"}`} />

          {/* Left Arrow Button */}
          <button
            onClick={() => scroll("left")}
            className={`absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg flex items-center justify-center text-slate-700 hover:text-blue-650 active:scale-95 transition-all duration-300 z-20 cursor-pointer hidden md:flex ${
              showLeftArrow ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={() => scroll("right")}
            className={`absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg flex items-center justify-center text-slate-700 hover:text-blue-650 active:scale-95 transition-all duration-300 z-20 cursor-pointer hidden md:flex ${
              showRightArrow ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Scrollable Row */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-6 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {projects.map((proj) => {
              const nameText = proj.name[language as keyof typeof proj.name] || proj.name.th;
              const hasSale = proj.priceMin != null;
              const hasRent = proj.rentalMin != null;
              
              const areaName = (
                language === "en" ? proj.popularAreaEn :
                language === "cn" ? proj.popularAreaCn :
                language === "ru" ? proj.popularAreaRu :
                proj.popularArea
              ) || proj.popularArea;

              const provinceName = proj.province ? getProvinceName(proj.province, language) : "";
              const districtName = proj.district || "";

              const locationText = areaName 
                ? `${areaName}, ${provinceName}`
                : districtName 
                  ? `${districtName}, ${provinceName}`
                  : provinceName;

              return (
                <Link
                  key={proj.id}
                  href={`/projects/${proj.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-200/60 hover:border-slate-350 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col shrink-0 w-72 md:w-80 snap-start"
                >
                  {/* Project Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
                    {proj.imageUrl ? (
                      <div
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${proj.imageUrl})` }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-150 flex items-center justify-center text-slate-300">
                        <Building2 className="w-12 h-12 stroke-[1.5]" />
                      </div>
                    )}
                    {/* Unit Count Badge */}
                    <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1.2 rounded-full border border-white/10 shadow-xs">
                      {proj.propertyCount > 0 
                        ? getPageString("units_available", { count: proj.propertyCount })
                        : getPageString("no_units")
                      }
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between text-left">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                        {nameText}
                      </h3>
                      {proj.developer && (
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                          {getPageString("developer")}: {proj.developer}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 mt-2.5 flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{locationText}</span>
                      </p>
                    </div>
                    
                    {/* Divider */}
                    <div className="h-px bg-slate-100 my-3.5 w-full" />
                    
                    {/* Price Info */}
                    <div className="space-y-1.5">
                      {hasSale && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{getPageString("price_sale")}</span>
                          <span className="font-extrabold text-blue-600">
                            {getPageString("price_from", { price: `${formatPrice(proj.priceMin!, language)} THB` })}
                          </span>
                        </div>
                      )}
                      {hasRent && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">{getPageString("price_rent")}</span>
                          <span className="font-extrabold text-teal-600">
                            {getPageString("price_from", { price: `${formatPrice(proj.rentalMin!, language)} /mo` })}
                          </span>
                        </div>
                      )}
                      {!hasSale && !hasRent && (
                        <div className="text-center py-1">
                          <span className="text-xs text-slate-400 font-semibold italic">{getPageString("no_units")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
