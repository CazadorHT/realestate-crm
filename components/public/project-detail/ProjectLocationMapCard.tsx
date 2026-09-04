"use client";

import { MapPin } from "lucide-react";
import { LuMap } from "react-icons/lu";

interface ProjectLocationMapCardProps {
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  projectName?: string;
  language: string;
}

// Helper to extract location query from various Google Maps URL formats
function extractQuery(url: string | null) {
  if (!url) return null;
  if (!url.startsWith("http")) return url;

  try {
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
  } catch (e) {
    return url;
  }
}

export function ProjectLocationMapCard({
  googleMapsUrl,
  latitude,
  longitude,
  projectName,
  language,
}: ProjectLocationMapCardProps) {
  const query = googleMapsUrl
    ? extractQuery(googleMapsUrl)
    : latitude && longitude
      ? `${latitude},${longitude}`
      : projectName || null;

  if (!query && !googleMapsUrl) return null;

  const embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(query || "")}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const externalLink = googleMapsUrl || (latitude && longitude ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(projectName || "")}`);

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
      <div className="w-full h-[260px] md:h-[320px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative group">
        {embedSrc ? (
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={embedSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="grayscale-[0.2] contrast-[1.1] hover:grayscale-0 transition-all duration-700"
            title="Project Location"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <MapPin className="h-10 w-10 text-slate-300" />
            <p className="text-sm">{noDataText}</p>
          </div>
        )}
      </div>

      {/* Centered Capsule Button matching PropertyMapClient */}
      <div className="flex justify-center pt-1">
        <a
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-full text-sm font-semibold transition-all border border-slate-200 shadow-xs hover:shadow-md cursor-pointer group"
        >
          <MapPin className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          <span>{openMapsText}</span>
        </a>
      </div>
    </div>
  );
}
