import { MapPin } from "lucide-react";

interface ProjectLocationMapCardProps {
  latitude: number | null;
  longitude: number | null;
  language: string;
}

export function ProjectLocationMapCard({
  latitude,
  longitude,
  language,
}: ProjectLocationMapCardProps) {
  if (!latitude || !longitude) return null;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs space-y-4">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <MapPin className="w-5 h-5 text-blue-500" />
        <span>{language === "en" ? "Location Map" : language === "cn" ? "项目地图" : language === "ru" ? "Карта проезда" : "แผนที่ตั้งโครงการ"}</span>
      </h3>
      
      <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs relative">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${latitude},${longitude}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
        />
      </div>

      <a
        href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 px-4 h-11 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all duration-200 text-sm cursor-pointer shadow-3xs"
      >
        <MapPin className="w-4.5 h-4.5 text-blue-500" />
        <span>{language === "en" ? "Open in Google Maps" : language === "cn" ? "在谷歌地图中打开" : language === "ru" ? "Открыть в Google Maps" : "ดูใน Google Maps"}</span>
      </a>
    </div>
  );
}
