"use client";

import { Layout, Maximize2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface PropertyFloorPlanProps {
  floorPlanUrl: string | null | undefined;
}

export function PropertyFloorPlan({ floorPlanUrl }: PropertyFloorPlanProps) {
  const { t } = useLanguage();
  const [isZoomed, setIsZoomed] = useState(false);

  if (!floorPlanUrl) return null;

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h3 className="text-lg md:text-xl border-l-4 border-blue-600 bg-linear-to-r from-blue-50 to-white px-4 py-3 rounded-r-xl font-semibold text-blue-900! mb-2 flex items-center gap-2">
        <Layout className="w-5 h-5 text-blue-600" />{" "}
        {t("property.floor_plan") || "Floor Plan / ผังอาคาร"}
      </h3>

      <div 
        className="relative group cursor-zoom-in rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 transition-all hover:shadow-lg"
        onClick={() => setIsZoomed(true)}
      >
        <div className="relative aspect-video sm:aspect-3/2 md:aspect-2/1 w-full h-full min-h-[300px]">
          <Image
            src={floorPlanUrl}
            alt="Property Floor Plan"
            fill
            className="object-contain p-4 md:p-8 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-w-768px) 100vw, 80vw"
          />
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/5 transition-colors flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-blue-100 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-2 text-blue-700 font-medium text-sm">
            <Maximize2 className="w-4 h-4" />
            คลิกเพื่อดูขนาดใหญ่
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Overlay */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-100 bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 cursor-zoom-out animate-in fade-in duration-300"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setIsZoomed(false)}
          >
            <Maximize2 className="w-8 h-8 rotate-45" />
          </button>
          <div className="relative w-full h-full">
            <Image
              src={floorPlanUrl}
              alt="Floor Plan Fullscreen"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </section>
  );
}
