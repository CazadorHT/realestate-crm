"use client";

import { MapPin } from "lucide-react";
import { LuMap } from "react-icons/lu";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { parseBilingualProjectName } from "@/lib/utils/project-name-utils";

interface ProjectLocationMapCardProps {
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  projectName?: string;
  language?: string;
}

// Helper to extract location query from various Google Maps URL formats
function extractQuery(url: string | null) {
  if (!url) return null;
  if (!url.startsWith("http")) return url;

  try {
    if (
      url.includes("maps.app.goo.gl") ||
      url.includes("goo.gl/maps") ||
      url.includes("goo.gl/") ||
      url.includes("share.google")
    ) {
      return null;
    }

    const urlObj = new URL(url);
    const daddr = urlObj.searchParams.get("daddr") || urlObj.searchParams.get("destination");
    if (daddr) return daddr;

    const q = urlObj.searchParams.get("q") || urlObj.searchParams.get("query");
    if (q) return q;

    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) return `${coordMatch[1]},${coordMatch[2]}`;

    const placeMatch = url.match(/\/place\/([^\/]+)/);
    if (placeMatch && placeMatch[1])
      return decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");

    return url;
  } catch {
    return url;
  }
}

export function ProjectLocationMapCard({
  googleMapsUrl,
  latitude,
  longitude,
  projectName,
  language: propLanguage,
}: ProjectLocationMapCardProps) {
  const { language: ctxLanguage } = useLanguage();
  const language = ctxLanguage || propLanguage || "th";

  const parsedName = projectName ? parseBilingualProjectName(projectName) : null;
  const resolvedProjectName = parsedName
    ? (language === "th" ? (parsedName.cleanTh || parsedName.cleanEn) : (parsedName.cleanEn || parsedName.cleanTh))
    : projectName;

  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  const query = hasCoords
    ? `${latitude},${longitude}`
    : googleMapsUrl
      ? extractQuery(googleMapsUrl)
      : resolvedProjectName || null;

  if (!query && !googleMapsUrl) return null;

  const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(query || "")}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const externalLink = googleMapsUrl || (latitude && longitude ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(resolvedProjectName || "")}`);

  const sectionTitle = language === "en" ? "Project Location Map" : language === "cn" ? "项目地图位置" : language === "ru" ? "Карта проекта" : "แผนที่ตั้งโครงการ";
  const openMapsText = language === "en" ? "Open in Google Maps" : language === "cn" ? "在谷歌地图中打开" : language === "ru" ? "Открыть в Google Maps" : "ดูใน Google Maps";
  const noDataText = language === "en" ? "No location map available" : language === "cn" ? "暂无地图信息" : language === "ru" ? "Информация о карте отсутствует" : "ไม่มีข้อมูลแผนที่";

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs space-y-4">
      {/* Header with blue accent bar matching PropertyMapClient */}
      <h3 className="text-base md:text-lg border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-3.5 py-2.5 rounded-r-xl font-semibold text-blue-900 flex items-center gap-2">
        <LuMap className="w-4.5 h-4.5 text-blue-600" />
        <span>{sectionTitle}</span>
      </h3>
      
      {/* Map iframe container with grayscale hover effect matching PropertyMapClient */}
      <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs group/map">
        {embedSrc ? (
          <iframe
            src={embedSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full grayscale-[15%] group-hover/map:grayscale-0 transition-all duration-500"
            title={resolvedProjectName ? `Map for ${resolvedProjectName}` : "Project Location"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
            {noDataText}
          </div>
        )}
      </div>

      {/* External Link CTA */}
      <div className="pt-1">
        <a
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
        >
          <MapPin className="w-4 h-4 text-blue-600" />
          <span>{openMapsText}</span>
        </a>
      </div>
    </div>
  );
}
