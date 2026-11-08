"use client";

import Link from "next/link";
import Image from "next/image";
import { Map, ArrowUpRight, Compass, Sparkles } from "lucide-react";
import { useLanguage, type Language } from "@/components/providers/LanguageProvider";

interface ExploreMapBannerProps {
  language?: Language;
}

export function ExploreMapBanner({ language: propLanguage }: ExploreMapBannerProps) {
  const { language: contextLanguage, langPrefix } = useLanguage();
  const language = contextLanguage || propLanguage || "th";

  const mapHref = `${langPrefix || ""}/map`;

  const content = {
    th: {
      badge: "มุมมองแผนที่",
      title: "ค้นหาอสังหาฯ ตามทำเลบนแผนที่",
      subtitle: "สำรวจโครงการใกล้รถไฟฟ้า BTS/MRT และทำเลยอดนิยมทั่วกรุงเทพฯ พร้อมดูตำแหน่งจริง",
      cta: "เปิดแผนที่ Interactive",
    },
    en: {
      badge: "Map View",
      title: "Explore Properties on Interactive Map",
      subtitle: "Discover condos & houses near BTS/MRT stations and prime Bangkok locations",
      cta: "Open Map Explorer",
    },
    cn: {
      badge: "地图找房",
      title: "在互动地图上探索全城房源",
      subtitle: "快速查看曼谷轻轨捷运（BTS/MRT）沿线及热门黄金商圈房源位置与价格",
      cta: "打开互动地图",
    },
    ru: {
      badge: "Карта объектов",
      title: "Поиск недвижимости на интерактивной карте",
      subtitle: "Объекты рядом со станциями BTS/MRT и в лучших районах Бангкока",
      cta: "Открыть карту",
    },
  }[language] || {
    badge: "มุมมองแผนที่",
    title: "ค้นหาอสังหาฯ ตามทำเลบนแผนที่",
    subtitle: "สำรวจโครงการใกล้รถไฟฟ้า BTS/MRT และทำเลยอดนิยมทั่วกรุงเทพฯ พร้อมดูตำแหน่งจริง",
    cta: "เปิดแผนที่ Interactive",
  };

  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-8 sm:mb-10">
      <Link
        href={mapHref}
        prefetch={false}
        className="group relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 sm:p-6 md:py-5 md:px-7 rounded-3xl border border-blue-500/20 hover:border-blue-500/50 bg-linear-to-br from-blue-50/70 via-blue-100/30 to-sky-50/20 shadow-sm hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 overflow-hidden cursor-pointer"
      >
        {/* Decorative Corner Glow */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        {/* Left Content */}
        <div className="flex items-center gap-3.5 sm:gap-5 relative z-10 min-w-0 flex-1">
          {/* 3D Isometric Map Illustration */}
          <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 flex items-center justify-center -my-3 sm:-my-4">
            <Image
              src="/images/map-3d-explorer.webp"
              alt="Interactive Map 3D"
              width={160}
              height={160}
              className="w-full h-full object-contain drop-shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ease-out pointer-events-none"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-500/15 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-blue-600" />
                {content.badge}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
              {content.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-0.5">
              {content.subtitle}
            </p>
          </div>
        </div>

        {/* Right Action Button */}
        <div className="relative z-10 flex items-center justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-blue-500/15">
          <span className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-blue-600 group-hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-all duration-200">
            <Map className="w-4 h-4 shrink-0" />
            <span>{content.cta}</span>
            <ArrowUpRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
          </span>
        </div>
      </Link>
    </section>
  );
}
