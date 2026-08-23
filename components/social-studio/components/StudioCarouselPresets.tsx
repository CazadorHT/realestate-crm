"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Layers } from "lucide-react";
import type { CarouselPageType, CarouselPageConfig } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

interface StudioCarouselPresetsProps {
  carouselPages: CarouselPageConfig[];
  setCarouselPages: React.Dispatch<React.SetStateAction<CarouselPageConfig[]>>;
  activeCarouselPage: CarouselPageType;
  setActiveCarouselPage: (p: CarouselPageType) => void;
}

const PAGE_INFO: Record<CarouselPageType, { label: string; labelEn: string; icon: string; description: string; descriptionEn: string }> = {
  cover: { 
    label: "ภาพปก (Cover)", 
    labelEn: "Cover Banner", 
    icon: "📸", 
    description: "แบนเนอร์ปกหลัก",
    descriptionEn: "Main cover banner",
  },
  specs_highlights: { 
    label: "สเปก & จุดเด่น", 
    labelEn: "Specs & Highlights", 
    icon: "📊", 
    description: "ห้องนอน/น้ำ/ตร.ม. + Highlights",
    descriptionEn: "Bed/Bath/Sqm + Key features",
  },
  location_map: { 
    label: "ทำเลที่ตั้ง", 
    labelEn: "Location & Transit", 
    icon: "📍", 
    description: "ทำเล + รถไฟฟ้า + โครงการ",
    descriptionEn: "Location + Transit + Project",
  },
  contact_cta: { 
    label: "ติดต่อ & CTA", 
    labelEn: "Contact & CTA", 
    icon: "📱", 
    description: "เอเจ้นท์ + QR + ช่องทางติดต่อ",
    descriptionEn: "Agent + QR + Channels",
  },
};

export function StudioCarouselPresets({
  carouselPages,
  setCarouselPages,
  activeCarouselPage,
  setActiveCarouselPage,
}: StudioCarouselPresetsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const togglePage = (type: CarouselPageType) => {
    setCarouselPages((prev) =>
      prev.map((p) => (p.type === type ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const enabledCount = carouselPages.filter((p) => p.enabled).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-amber-400" />
          {isEn ? "Carousel Pages (Multi-Slide)" : "Carousel Pages (สร้างหลายหน้า)"}
        </Label>
        <span className="text-[10px] text-amber-400 font-mono">
          {enabledCount} {isEn ? (enabledCount > 1 ? "slides" : "slide") : "หน้า"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {carouselPages.map((page) => {
          const info = PAGE_INFO[page.type];
          const isActive = activeCarouselPage === page.type;

          return (
            <div
              key={page.type}
              className={`relative p-2.5 rounded-xl border transition-all ${
                isActive && page.enabled
                  ? "bg-amber-500/15 border-amber-500/60"
                  : page.enabled
                    ? "bg-slate-800/40 border-slate-700/80"
                    : "bg-slate-900/30 border-slate-800/40 opacity-50"
              }`}
            >
              {/* Toggle + Preview button */}
              <div className="flex items-start justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (page.enabled) setActiveCarouselPage(page.type);
                  }}
                  disabled={!page.enabled}
                  className={`flex-1 text-left cursor-pointer ${!page.enabled ? "cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{info.icon}</span>
                    <span className={`text-[11px] font-bold ${isActive && page.enabled ? "text-amber-300" : "text-slate-200"}`}>
                      {isEn ? info.labelEn : info.label}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                    {isEn ? info.descriptionEn : info.description}
                  </p>
                </button>
                <Switch
                  checked={page.enabled}
                  onCheckedChange={() => togglePage(page.type)}
                  className="scale-75"
                />
              </div>

              {/* Active indicator */}
              {isActive && page.enabled && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                  <span className="text-[7px] text-slate-950 font-black">👁</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[9px] text-slate-500 text-center pt-1">
        {isEn 
          ? "Click cards to switch preview • Use Export Set to download all slides as ZIP"
          : "กดที่การ์ดเพื่อเปลี่ยน Preview • ใช้ Export ทั้งชุดเพื่อสร้าง ZIP ทุกหน้า"}
      </p>
    </div>
  );
}

