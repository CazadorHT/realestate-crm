/* eslint-disable @next/next/no-img-element */
import { Building2 } from "lucide-react";
import { getDistrictName } from "@/lib/utils/provinces";

interface ProjectAboutCardProps {
  project: any;
  language: string;
  nameText: string;
  getString: (key: string, params?: Record<string, string | number>) => string;
}

export function ProjectAboutCard({
  project,
  language,
  nameText,
  getString,
}: ProjectAboutCardProps) {
  const getTransitLogoInfo = (code: string) => {
    const c = code.toUpperCase();
    if (c.startsWith("BTS")) {
      return { logo: "/images/transit/BTS-Logo.svg", bg: "bg-emerald-50 border-emerald-100 text-emerald-800", lineName: "BTS" };
    }
    if (c.startsWith("ARL")) {
      return { logo: "/images/transit/ARLbangkok.svg", bg: "bg-red-50 border-red-100 text-red-800", lineName: "Airport Link" };
    }
    if (c.startsWith("BRT")) {
      return { logo: "/images/transit/Bangkok_BRT_logo.svg", bg: "bg-green-50 border-green-100 text-green-800", lineName: "BRT" };
    }
    if (c.includes("YELLOW")) {
      return { logo: "/images/transit/MRT_(Bangkok)_Yellow_logo.svg", bg: "bg-amber-50 border-amber-100 text-amber-800", lineName: "MRT Yellow" };
    }
    if (c.includes("PINK")) {
      return { logo: "/images/transit/MRT_(Bangkok)_Pink_Logo.svg", bg: "bg-pink-50 border-pink-100 text-pink-800", lineName: "MRT Pink" };
    }
    if (c.includes("PURPLE")) {
      return { logo: "/images/transit/MRT_(Bangkok)_Purple_logo.svg", bg: "bg-purple-50 border-purple-100 text-purple-800", lineName: "MRT Purple" };
    }
    if (c.includes("ORANGE")) {
      return { logo: "/images/transit/MRT_(Bangkok)_Orange_logo.svg", bg: "bg-orange-50 border-orange-100 text-orange-800", lineName: "MRT Orange" };
    }
    if (c.startsWith("MRT")) {
      return { logo: "/images/transit/MRT_(Bangkok)_logo.svg", bg: "bg-blue-50 border-blue-100 text-blue-800", lineName: "MRT Blue" };
    }
    if (c.startsWith("SRT")) {
      return { logo: "/images/transit/SRT_Red_Lines_icon.svg", bg: "bg-rose-50 border-rose-100 text-rose-800", lineName: "SRT Red" };
    }
    return { logo: null, bg: "bg-slate-50 border-slate-100 text-slate-700", lineName: "Train" };
  };

  const formatStationLabel = (code: string): string => {
    const parts = code.split("_");
    const prefixes = ["BTS", "MRT", "ARL", "SRT", "BRT", "YELLOW", "PINK", "PURPLE", "ORANGE"];
    const filtered = parts.filter(p => !prefixes.includes(p.toUpperCase()));
    const name = filtered.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    
    const c = code.toUpperCase();
    if (c.startsWith("BTS")) return `BTS ${name}`;
    if (c.startsWith("MRT")) {
      if (c.includes("YELLOW")) return `MRT Yellow ${name}`;
      if (c.includes("PINK")) return `MRT Pink ${name}`;
      if (c.includes("PURPLE")) return `MRT Purple ${name}`;
      if (c.includes("ORANGE")) return `MRT Orange ${name}`;
      return `MRT ${name}`;
    }
    if (c.startsWith("ARL")) return `ARL ${name}`;
    if (c.startsWith("SRT")) return `SRT Red ${name}`;
    return name || code.replace(/_/g, " ");
  };

  const descObj = project.description;
  const localizedDesc = descObj
    ? (descObj[language as keyof typeof descObj] || descObj.th || "")
    : "";

  const stationsList = (() => {
    const rawCode = project.nearestStationCode || "";
    return rawCode.split(",").map((s: string) => {
      const parts = s.trim().split(":");
      const code = parts[0].trim();
      const dist = parts[1] ? parseInt(parts[1], 10) : null;
      return { code, distance: dist };
    }).filter((s: any) => s.code);
  })();

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-xs space-y-6">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Building2 className="w-5 h-5 text-blue-500" />
        <span>{getString("about_project", { name: nameText })}</span>
      </h3>

      {/* Description */}
      <div className="text-slate-600 text-sm leading-relaxed prose prose-slate">
        {localizedDesc ? (
          <div dangerouslySetInnerHTML={{ __html: localizedDesc }} />
        ) : (
          <p>{getString("no_desc", { name: nameText, district: project.district ? getDistrictName(project.district, language) : "" })}</p>
        )}
      </div>

      {/* Metro Connection */}
      {project.nearestStationCode && stationsList.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
            {getString("nearest_station")}
          </span>
          <div className="space-y-2">
            {stationsList.map(({ code, distance }: any) => {
              const logoInfo = getTransitLogoInfo(code);
              const finalDistance = distance || project.nearestStationDistance;
              const formattedDistance = finalDistance
                ? finalDistance >= 1000
                  ? `${(finalDistance / 1000).toFixed(1)} km`
                  : `${finalDistance} m`
                : null;

              return (
                <div key={code} className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/60 shadow-2xs hover:shadow-xs transition-shadow duration-200">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${logoInfo.bg}`}>
                    {logoInfo.logo ? (
                      <img src={logoInfo.logo} alt={logoInfo.lineName} className="h-5.5 w-auto object-contain" />
                    ) : (
                      <Building2 className="w-5 h-5 text-slate-550" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-sm block leading-snug">
                      {formatStationLabel(code)}
                    </span>
                    {formattedDistance && (
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5 block leading-none">
                        {formattedDistance} away
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
