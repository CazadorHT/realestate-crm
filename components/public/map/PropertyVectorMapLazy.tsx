"use client";

import dynamic from "next/dynamic";
import { Loader2, Map as MapIcon } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { PropertyVectorMapProps } from "./PropertyVectorMap";

function MapLoadingPlaceholder() {
  const { language } = useLanguage();
  const label =
    language === "en"
      ? "Preparing interactive map..."
      : language === "cn"
        ? "正在加载互动地图..."
        : language === "ru"
          ? "Подготовка интерактивной карты..."
          : "กำลังเตรียมแผนที่...";

  return (
    <div className="w-full h-full min-h-[380px] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500">
      <div className="w-11 h-11 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-blue-600">
        <MapIcon className="w-5 h-5" />
      </div>
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export const PropertyVectorMapLazy = dynamic<PropertyVectorMapProps>(
  () => import("./PropertyVectorMap").then((mod) => mod.PropertyVectorMap),
  {
    ssr: false,
    loading: () => <MapLoadingPlaceholder />,
  }
);
