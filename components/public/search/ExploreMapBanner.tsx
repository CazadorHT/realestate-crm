"use client";

import Link from "next/link";
import Image from "next/image";
import { Compass } from "lucide-react";
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
      title: "ค้นหาตามทำเลบนแผนที่",
      subtitle: "สำรวจคอนโด บ้านเดี่ยว และออฟฟิศใกล้รถไฟฟ้า BTS/MRT พร้อมดูตำแหน่งจริงบนแผนที่",
      cta: "ดูบนแผนที่ทั้งหมด",
    },
    en: {
      title: "Explore on Interactive Map",
      subtitle: "Discover condos, houses, and workspaces near BTS/MRT stations and prime locations",
      cta: "Explore All on Map",
    },
    cn: {
      title: "在互动地图上探索房源",
      subtitle: "快速查看曼谷轻轨捷运（BTS/MRT）沿线及热门商圈真实房源分布",
      cta: "查看全景地图",
    },
    ru: {
      title: "Поиск на интерактивной карте",
      subtitle: "Квартиры, дома и офисы рядом с метро BTS/MRT и в лучших локациях города",
      cta: "Смотреть все на карте",
    },
  }[language] || {
    title: "ค้นหาตามทำเลบนแผนที่",
    subtitle: "สำรวจคอนโด บ้านเดี่ยว และออฟฟิศใกล้รถไฟฟ้า BTS/MRT พร้อมดูตำแหน่งจริงบนแผนที่",
    cta: "ดูบนแผนที่ทั้งหมด",
  };

  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-8 sm:mb-10">
      <Link
        href={mapHref}
        prefetch={false}
        className="group cursor-pointer relative overflow-hidden rounded-2xl sm:rounded-3xl border border-blue-500/20 hover:border-blue-500/50 bg-linear-to-br from-blue-50/70 via-blue-100/30 to-sky-50/20 p-3.5 sm:py-3.5 sm:px-6 md:py-4 md:px-7 shadow-sm hover:shadow-xl hover:shadow-blue-500/15 transition-all duration-300 flex items-center justify-between w-full gap-3 sm:gap-4"
      >
        {/* Decorative Corner Glow */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-500/15 blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-36 h-36 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        {/* Stylized City Roads, River & Transit Map Pattern (ลายผังเมือง แม่น้ำ และแนวรถไฟฟ้าสากล) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Fade out over left text, fade in over middle & right */}
              <linearGradient id="city-map-fade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                <stop offset="28%" stopColor="#fff" stopOpacity="0.15" />
                <stop offset="55%" stopColor="#fff" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0.95" />
              </linearGradient>
              <mask id="city-mask">
                <rect width="100%" height="100%" fill="url(#city-map-fade)" />
              </mask>
            </defs>

            <g mask="url(#city-mask)">
              {/* 1. Curved City River (สายน้ำโค้งนุ่มนวล - ปรับให้จางลง ละมุนตา) */}
              <path
                d="M 450 -20 C 530 40, 610 20, 690 70 C 770 120, 850 80, 940 140"
                stroke="rgba(96, 165, 250, 0.10)"
                strokeWidth="20"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 640 32 C 690 40, 770 30, 850 -10"
                stroke="rgba(96, 165, 250, 0.07)"
                strokeWidth="8"
                fill="none"
              />

              {/* 2. Secondary Urban Road Network (ตรอกซอกซอยผังเมืองบางๆ) */}
              <g stroke="rgba(148, 163, 184, 0.12)" strokeWidth="0.8" fill="none">
                {/* Diagonal Cross Streets */}
                <path d="M 380 -10 L 440 130 M 480 -10 L 540 130 M 760 -10 L 710 130 M 860 -10 L 810 130 M 960 -10 L 910 130 M 1060 -10 L 1010 130" strokeDasharray="3 5" />
                {/* Horizontal Avenues */}
                <path d="M 320 35 L 720 35 M 720 85 L 1200 85 M 480 110 L 1150 110 M 340 15 L 620 15" />
              </g>

              {/* 3. Major Expressway / Arterial Ring Road (ทางด่วนสายหลัก - จางลง) */}
              <path
                d="M 260 140 C 390 75, 540 85, 710 25 C 870 -30, 1010 35, 1250 5"
                stroke="rgba(37, 99, 235, 0.11)"
                strokeWidth="2.5"
                fill="none"
              />
              <path
                d="M 260 140 C 390 75, 540 85, 710 25 C 870 -30, 1010 35, 1250 5"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="0.8"
                strokeDasharray="6 5"
                fill="none"
              />

              {/* 4. Transit Line with Stations (แนวรถไฟฟ้าสายสีเขียว + หมุดสถานี - จางลงไม่แย่งสายตา) */}
              <path
                d="M 330 -10 C 440 55, 590 80, 780 45 C 930 20, 1080 75, 1250 55"
                stroke="rgba(16, 185, 129, 0.18)"
                strokeWidth="1.8"
                fill="none"
              />
              <circle cx="465" cy="42" r="2.5" fill="#10b981" opacity="0.4" />
              <circle cx="585" cy="78" r="2.5" fill="#10b981" opacity="0.4" />
              <circle cx="715" cy="56" r="2.5" fill="#10b981" opacity="0.4" />
              <circle cx="865" cy="32" r="2.5" fill="#10b981" opacity="0.4" />
              <circle cx="1005" cy="44" r="2.5" fill="#10b981" opacity="0.4" />

              {/* 5. Target Location Radar Circles around 3D Pin */}
              <g stroke="rgba(37, 99, 235, 0.12)" fill="none">
                <circle cx="1060" cy="60" r="42" strokeWidth="0.8" strokeDasharray="4 4" />
                <circle cx="1060" cy="60" r="72" strokeWidth="0.6" />
              </g>
            </g>
          </svg>
        </div>

        {/* Left: Icon Box + Typography */}
        <div className="flex items-center gap-3 sm:gap-4 relative z-10 min-w-0 flex-1">
          {/* Rounded Icon Box (Matches Category Cards) */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shadow-xs shrink-0 transition-transform duration-300 group-hover:scale-110">
            <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-base md:text-lg font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors truncate">
              {content.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5 hidden xs:block sm:block">
              {content.subtitle}
            </p>
            <div className="text-[11px] sm:text-xs font-bold text-blue-600 inline-flex items-center gap-1 group-hover:translate-x-1.5 transition-transform mt-0.5 sm:mt-1">
              <span>{content.cta}</span>
              <span>→</span>
            </div>
          </div>
        </div>

        {/* Right: 3D Illustration Image */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 shrink-0 -mr-1 sm:-mr-2 z-10 flex items-center justify-center -my-3 sm:-my-4">
          <Image
            src="/images/map-3d-explorer.webp"
            alt={content.title}
            fill
            sizes="(max-width: 768px) 100px, 150px"
            className="object-contain drop-shadow-xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500 ease-out pointer-events-none"
          />
        </div>
      </Link>
    </section>
  );
}
