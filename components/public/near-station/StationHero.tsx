import Link from "next/link";
import { Train, ChevronRight } from "lucide-react";
import type { StationDetail } from "@/features/public/stations";

interface StationHeroProps {
  station: StationDetail;
  language: string;
  stationNameFormatted: string;
  lineTypeLabel: string;
  total: number;
  gradientColor: string;
  getString: (key: string) => string;
}

export function StationHero({
  station,
  language,
  stationNameFormatted,
  lineTypeLabel,
  total,
  gradientColor,
  getString,
}: StationHeroProps) {
  const getStationFallbackBg = (transitType: string) => {
    return "/images/hero-transit.jpg";
  };

  return (
    <section 
      className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-16 text-white min-h-[400px] flex items-center bg-[#020617] transition-colors duration-500"
    >
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-102 opacity-70 blur-xs brightness-50"
        style={{ 
          backgroundImage: `url(${station.bgImage || getStationFallbackBg(station.transitType)})`,
        }}
      />
      {/* Darkened Gradient Overlay */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: `linear-gradient(to right, #020617 0%, rgba(2, 6, 23, 0.85) 10%, ${gradientColor})`
        }}
      />

      <div className="relative w-full max-w-screen-2xl mx-auto px-5 md:px-8 z-10">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
            <li><Link href="/" className="hover:text-white transition-colors">{getString("breadcrumb_home")}</Link></li>
            <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
            <li><Link href="/near-station" className="hover:text-white transition-colors">{getString("breadcrumb_near_transit")}</Link></li>
            <li><ChevronRight className="w-3.5 h-3.5 opacity-60" /></li>
            <li className="text-white font-medium">{stationNameFormatted}</li>
          </ol>
        </nav>

        {/* Station Info */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg shrink-0 border border-slate-100 bg-white p-2 md:p-3 overflow-hidden"
          >
            {(() => {
              const logoPaths: Record<string, string> = {
                BTS: "/images/transit/BTS-Logo.svg",
                GOLD: "/images/transit/BTS-Logo.svg",
                MRT: "/images/transit/MRT_(Bangkok)_logo.svg",
                MRT_PURPLE: "/images/transit/MRT_(Bangkok)_Purple_logo.svg",
                MRT_YELLOW: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg",
                MRT_PINK: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg",
                MRT_ORANGE: "/images/transit/MRT_(Bangkok)_Orange_logo.svg",
                ARL: "/images/transit/ARLbangkok.svg",
                SRT_RED: "/images/transit/SRT_Red_Lines_icon.svg",
                BRT: "/images/transit/Bangkok_BRT_logo.svg",
              };
              const path = logoPaths[station.transitType];
              return path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={path} alt={station.transitType} className="w-full h-full object-contain" />
              ) : (
                <Train className="w-8 h-8 md:w-10 md:h-10" style={{ color: station.lineColor }} />
              );
            })()}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm border border-white/10"
                style={{ backgroundColor: station.lineColor }}
              >
                {lineTypeLabel}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-sm">
              {language === "en" 
                ? `Properties near ${stationNameFormatted}`
                : language === "cn"
                  ? `${stationNameFormatted}附近房源`
                  : language === "ru"
                    ? `Недвижимость рядом с ${stationNameFormatted}`
                    : `อสังหาฯ ใกล้${stationNameFormatted}`}
            </h1>
            <p className="text-lg text-slate-200 mt-1 font-medium drop-shadow-xs">
              {language === "en"
                ? `${stationNameFormatted} · ${total} listings`
                : language === "cn"
                  ? `${stationNameFormatted} · ${total}个房源`
                  : language === "ru"
                    ? `${stationNameFormatted} · ${total} объявлений`
                    : `${stationNameFormatted} · ${total} รายการ`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
