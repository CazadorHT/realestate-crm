"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import {
  LayoutGrid,
  Shuffle,
  ImageIcon,
  Check,
  Smartphone,
  Palette,
  Sliders,
  Moon,
  Move,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type {
  AspectRatio,
  StudioTheme,
  StudioLayout,
  ContentPosition,
  FontSizeScale,
  PhotoFilter,
} from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

export interface StudioLayoutControlsProps {
  layout: StudioLayout;
  setLayout: (l: StudioLayout) => void;
  fitWithBlurredBackdrop?: boolean;
  setFitWithBlurredBackdrop?: (val: boolean) => void;
  imageUrls: string[];
  activeSlot: number;
  setActiveSlot: (s: number) => void;
  slotIndices: number[];
  onSelectImageForSlot: (idx: number) => void;
  onShuffleImages: () => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (r: AspectRatio) => void;
  theme: StudioTheme;
  setTheme: (t: StudioTheme) => void;
  customAccentColor: string;
  setCustomAccentColor: (c: string) => void;
  fontSizeScale: FontSizeScale;
  setFontSizeScale: (f: FontSizeScale) => void;
  priceFontSizeScale: FontSizeScale;
  setPriceFontSizeScale: (f: FontSizeScale) => void;
  contentPosition: ContentPosition;
  setContentPosition: (p: ContentPosition) => void;
  photoFilter: PhotoFilter;
  setPhotoFilter: (f: PhotoFilter) => void;
  bgDimOpacity?: number;
  setBgDimOpacity?: (val: number) => void;
  bgBlur?: number;
  setBgBlur?: (val: number) => void;
  gridLineWidth: number;
  setGridLineWidth: (w: number) => void;
  gridLineColor: string;
  setGridLineColor: (c: string) => void;
  slotCropOffsets?: Record<number, { x: number; y: number }>;
  onUpdateSlotCropOffset?: (slotIdx: number, offset: { x?: number; y?: number }) => void;
  onResetSlotCropOffset?: (slotIdx: number) => void;
}

export function StudioLayoutControls({
  layout,
  setLayout,
  fitWithBlurredBackdrop = false,
  setFitWithBlurredBackdrop,
  imageUrls,
  activeSlot,
  setActiveSlot,
  slotIndices,
  onSelectImageForSlot,
  onShuffleImages,
  aspectRatio,
  setAspectRatio,
  theme,
  setTheme,
  customAccentColor,
  setCustomAccentColor,
  fontSizeScale,
  setFontSizeScale,
  priceFontSizeScale,
  setPriceFontSizeScale,
  contentPosition,
  setContentPosition,
  photoFilter,
  setPhotoFilter,
  bgDimOpacity = 0,
  setBgDimOpacity,
  bgBlur = 0,
  setBgBlur,
  gridLineWidth,
  setGridLineWidth,
  gridLineColor,
  setGridLineColor,
  slotCropOffsets = {},
  onUpdateSlotCropOffset,
  onResetSlotCropOffset,
}: StudioLayoutControlsProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const currentCropOffset = slotCropOffsets[activeSlot] || { x: 0, y: 0 };
  const getSlotCount = () => {
    switch (layout) {
      case "split_two":
        return 2;
      case "hero_plus_two":
        return 3;
      case "four_grid":
        return 4;
      case "five_grid":
        return 5;
      case "six_grid":
        return 6;
      case "single":
      default:
        return 1;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Layouts Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5 text-amber-400" />
            {isEn ? "Photo Layouts" : "สไตล์การจัดวางรูป (Layouts)"}
          </Label>
          {imageUrls.length > 1 && (
            <button
              type="button"
              onClick={onShuffleImages}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
              title={isEn ? "Shuffle layout photos" : "สุ่มจัดเรียงรูปภาพ"}
            >
              <Shuffle className="h-3 w-3" />
              {isEn ? "Shuffle Photos" : "สลับรูป (Shuffle)"}
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {[
            { id: "single", label: isEn ? "1 Hero" : "1 รูปใหญ่", sub: "1 Hero" },
            { id: "split_two", label: isEn ? "2 Split" : "2 รูปคู่", sub: "Split 2" },
            { id: "hero_plus_two", label: isEn ? "3 Photos" : "3 รูปฮิต", sub: "1 Hero+2" },
            { id: "four_grid", label: isEn ? "4 Grid" : "4 รูปกริด", sub: "2x2 Grid" },
            { id: "five_grid", label: isEn ? "5 Grid" : "5 รูปกริด", sub: isEn ? "1 Hero+2x2" : "1 ใหญ่+4 กริด" },
            { id: "six_grid", label: isEn ? "6 Grid" : "6 รูปกริด", sub: isEn ? "2x3 (3 rows)" : "2x3 (3 แถว)" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setLayout(item.id as StudioLayout);
                setActiveSlot(0);
              }}
              className={`py-2 px-1.5 rounded-xl border text-[11px] font-medium transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                layout === item.id
                  ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-xs scale-102"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[9px] opacity-70 font-mono">{item.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Image Slot Chooser */}
      <div className="space-y-2.5 p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
            {getSlotCount() > 1
              ? (isEn ? `Manage Slots (${getSlotCount()} photos)` : `จัดการรูปแยกช่อง (${getSlotCount()} รูป)`)
              : (isEn ? `Choose Primary Photo (${imageUrls.length} photos)` : `เลือกรูปภาพหลัก (${imageUrls.length} รูป)`)}
          </Label>
          {getSlotCount() > 1 && (
            <span className="text-[10px] text-amber-400/80">
              {isEn ? `Selecting: Slot ${activeSlot + 1}` : `กำลังเลือก: ช่องที่ ${activeSlot + 1}`}
            </span>
          )}
        </div>

        {getSlotCount() > 1 && (
          <div className="grid grid-cols-4 gap-1.5">
            {Array.from({ length: getSlotCount() }).map((_, slotIdx) => (
              <button
                key={slotIdx}
                type="button"
                onClick={() => setActiveSlot(slotIdx)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  activeSlot === slotIdx
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-[1.02]"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                <span>{isEn ? `Slot ${slotIdx + 1}` : `ช่อง ${slotIdx + 1}`}</span>
              </button>
            ))}
          </div>
        )}

        {/* 2 Rows Extra Large Thumbnail Grid Selector */}
        <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-3 overflow-x-auto pb-3 pt-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950 max-h-[300px]">
          {imageUrls.map((url, idx) => {
            const isSelected = slotIndices[activeSlot] === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectImageForSlot(idx)}
                className={`relative shrink-0 h-24 w-32 sm:h-28 sm:w-36 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${
                  isSelected
                    ? "border-amber-400 ring-4 ring-amber-400/40 shadow-xl shadow-amber-500/30 scale-[1.03] z-10"
                    : "border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600 hover:scale-[1.01]"
                }`}
              >
                <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-108" />
                
                {/* Photo Index Badge */}
                <div className="absolute top-1.5 left-1.5 bg-slate-950/85 backdrop-blur-md text-[10px] font-extrabold text-amber-300 px-2 py-0.5 rounded-lg border border-slate-700/60 shadow-md">
                  {idx === 0 ? (isEn ? "⭐ Primary" : "⭐ ปกหลัก") : `#${idx + 1}`}
                </div>

                {isSelected && (
                  <div className="absolute inset-0 bg-amber-500/30 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1">
                    <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/40">
                      <Check className="h-5 w-5 stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-black text-white drop-shadow-lg tracking-wider uppercase">{isEn ? "Selected" : "เลือกแล้ว"}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 2.1 Crop & Pan Offset Slider for Active Slot */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Move className="h-3.5 w-3.5 text-amber-400" />
              <Label className="text-[11px] font-semibold text-slate-300">
                {isEn
                  ? `Pan / Crop Position (Slot ${activeSlot + 1})`
                  : `เลื่อนปรับตำแหน่งรูปที่โดนตัด (ช่องที่ ${activeSlot + 1})`}
              </Label>
            </div>
            {(currentCropOffset.x !== 0 || currentCropOffset.y !== 0) && (
              <button
                type="button"
                onClick={() => onResetSlotCropOffset?.(activeSlot)}
                className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                title={isEn ? "Reset crop position to center" : "รีเซ็ตตำแหน่งกลับสู่กึ่งกลาง"}
              >
                <RotateCcw className="h-2.5 w-2.5" />
                {isEn ? "Reset Center" : "รีเซ็ตกึ่งกลาง"}
              </button>
            )}
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] text-slate-400 font-medium mr-1">
              {isEn ? "Focus:" : "เน้น:"}
            </span>
            {[
              { label: isEn ? "Center" : "🎯 กลาง", x: 0, y: 0 },
              { label: isEn ? "Top" : "⬆️ ด้านบน", x: 0, y: -100 },
              { label: isEn ? "Bottom" : "⬇️ ด้านล่าง", x: 0, y: 100 },
              { label: isEn ? "Left" : "⬅️ ด้านซ้าย", x: -100, y: 0 },
              { label: isEn ? "Right" : "➡️ ด้านขวา", x: 100, y: 0 },
            ].map((p, pIdx) => {
              const isActive = currentCropOffset.x === p.x && currentCropOffset.y === p.y;
              return (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => onUpdateSlotCropOffset?.(activeSlot, { x: p.x, y: p.y })}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-xs"
                      : "bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Dual Sliders: Horizontal X & Vertical Y */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Horizontal (X) */}
            <div className="space-y-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">{isEn ? "Horizontal (X)" : "แนวนอน (ซ้าย-ขวา)"}</span>
                <span className="font-mono text-amber-300 font-bold">
                  {currentCropOffset.x > 0 ? `+${currentCropOffset.x}%` : `${currentCropOffset.x}%`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={currentCropOffset.x}
                onChange={(e) => onUpdateSlotCropOffset?.(activeSlot, { x: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>{isEn ? "Left" : "ซ้าย"}</span>
                <span>{isEn ? "Center" : "กลาง"}</span>
                <span>{isEn ? "Right" : "ขวา"}</span>
              </div>
            </div>

            {/* Vertical (Y) */}
            <div className="space-y-1 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">{isEn ? "Vertical (Y)" : "แนวตั้ง (บน-ล่าง)"}</span>
                <span className="font-mono text-amber-300 font-bold">
                  {currentCropOffset.y > 0 ? `+${currentCropOffset.y}%` : `${currentCropOffset.y}%`}
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={currentCropOffset.y}
                onChange={(e) => onUpdateSlotCropOffset?.(activeSlot, { y: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                <span>{isEn ? "Top" : "บน"}</span>
                <span>{isEn ? "Center" : "กลาง"}</span>
                <span>{isEn ? "Bottom" : "ล่าง"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Aspect Ratio & Theme */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <Smartphone className="h-3.5 w-3.5 text-amber-400" />
            {isEn ? "Aspect Ratio" : "สัดส่วนภาพ"}
          </Label>
          <div className="grid grid-cols-5 gap-1">
            {[
              { id: "9:16", label: "9:16", sub: isEn ? "Story" : "Story/Reel" },
              { id: "2:3", label: "2:3", sub: isEn ? "FB Vertical" : "FB ปกตั้ง" },
              { id: "4:5", label: "4:5", sub: isEn ? "IG Feed" : "IG ฟีด" },
              { id: "1:1", label: "1:1", sub: isEn ? "Square" : "จัตุรัส" },
              { id: "3:2", label: "3:2", sub: isEn ? "FB Horizontal" : "FB ปกนอน" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setAspectRatio(item.id as AspectRatio)}
                className={`py-1.5 px-0.5 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  aspectRatio === item.id
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-xs scale-102"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
                title={
                  item.id === "2:3"
                    ? (isEn ? "Facebook Vertical Album (1 large left + 3 right)" : "อัลบั้ม Facebook แนวตั้ง (1 รูปใหญ่ซ้าย + 3 รูปขวา)")
                    : item.id === "3:2"
                      ? (isEn ? "Facebook Horizontal Album (1 large top + 3 bottom)" : "อัลบั้ม Facebook แนวนอน (1 รูปใหญ่บน + 3 รูปล่าง)")
                      : undefined
                }
              >
                <span className="text-[11px] font-semibold">{item.label}</span>
                <span className="text-[8px] opacity-70 leading-none">{item.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <Palette className="h-3.5 w-3.5 text-amber-400" />
            {isEn ? "Graphic Theme" : "ธีมกราฟิก"}
          </Label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: "luxury", label: "✨ Gold" },
              { id: "modern", label: "🌊 Blue" },
              { id: "hotdeal", label: "🔥 Red" },
              { id: "emerald", label: "💚 Green" },
              { id: "purple", label: "💜 Purple" },
              { id: "orange", label: "🟠 Orange" },
              { id: "custom", label: "🎨 Custom" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id as StudioTheme)}
                className={`py-1.5 rounded-lg border text-[11px] font-medium transition-all text-center cursor-pointer ${
                  theme === t.id
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 font-bold"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {theme === "custom" && (
            <div className="flex items-center gap-2 pt-1.5">
              <input
                type="color"
                value={customAccentColor}
                onChange={(e) => setCustomAccentColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-600 cursor-pointer bg-transparent"
              />
              <span className="text-[11px] text-slate-400 font-mono">{customAccentColor}</span>
              <div className="w-6 h-6 rounded-full border border-slate-600" style={{ backgroundColor: customAccentColor }} />
            </div>
          )}
        </div>
      </div>

      {/* 3.5 Fit Full Image (No Crop with Blurred Background) */}
      {setFitWithBlurredBackdrop && (
        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <Label
              className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
              onClick={() => setFitWithBlurredBackdrop(!fitWithBlurredBackdrop)}
            >
              <span>🖼️</span>
              <span>{isEn ? "Fit Full Photo (No Crop + Blurred Margins)" : "แสดงภาพเต็มใบ ไม่โดนตัดขอบ (Fit + เบลอขอบข้าง)"}</span>
            </Label>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {isEn
                ? "Auto-generates blurred matching backdrop to fit frame without cutting off text or graphics."
                : "สร้างขอบพื้นหลังเบลอเติมเต็มส่วนที่ขาด ไม่ให้ตัวหนังสือหรือขอบภาพถูกครอบตัด"}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={fitWithBlurredBackdrop}
            onClick={() => setFitWithBlurredBackdrop(!fitWithBlurredBackdrop)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              fitWithBlurredBackdrop ? "bg-amber-500" : "bg-slate-800"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                fitWithBlurredBackdrop ? "translate-x-5" : "translate-y-0 translate-x-0"
              }`}
            />
          </button>
        </div>
      )}

      {/* 4. Font Size Scale & Content Position */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <span className="text-amber-400 font-bold font-serif text-sm">Aa</span>
              {isEn ? "Font Size" : "ขนาดตัวอักษร"}
            </Label>
            <span className="text-[10px] text-amber-400 font-mono">
              {fontSizeScale === "sm" ? "85%" : fontSizeScale === "lg" ? "116%" : fontSizeScale === "xl" ? "130%" : "100%"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: "sm", label: isEn ? "Small" : "เล็ก", sub: "85%" },
              { id: "md", label: isEn ? "Normal" : "ปกติ", sub: "100%" },
              { id: "lg", label: isEn ? "Large" : "ใหญ่", sub: "116%" },
              { id: "xl", label: isEn ? "XL" : "ยักษ์", sub: "130%" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFontSizeScale(f.id as FontSizeScale)}
                className={`py-1.5 px-1 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  fontSizeScale === f.id
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs scale-102"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="text-[11px] font-bold">{f.label}</span>
                <span className="text-[9px] opacity-70">{f.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2.5 Price Font Size */}
        <div className="space-y-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-700/50 shadow-inner">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <span className="font-bold text-sm">$</span>
              {isEn ? "Price Font Size" : "ขนาดฟอนต์ราคา"}
            </Label>
            <span className="text-[10px] text-emerald-400 font-mono">
              {priceFontSizeScale === "sm" ? "85%" : priceFontSizeScale === "lg" ? "116%" : priceFontSizeScale === "xl" ? "130%" : "100%"}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: "sm", label: isEn ? "Small" : "เล็ก", sub: "85%" },
              { id: "md", label: isEn ? "Normal" : "ปกติ", sub: "100%" },
              { id: "lg", label: isEn ? "Large" : "ใหญ่", sub: "116%" },
              { id: "xl", label: isEn ? "XL" : "ยักษ์", sub: "130%" },
            ].map((f) => (
              <button
                key={`price-${f.id}`}
                type="button"
                onClick={() => setPriceFontSizeScale(f.id as FontSizeScale)}
                className={`py-1.5 px-1 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  priceFontSizeScale === f.id
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-xs scale-102"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="text-[11px] font-bold">{f.label}</span>
                <span className="text-[9px] opacity-70">{f.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              {isEn ? "Content Position" : "ตำแหน่ง / แยกส่วน"}
            </Label>
            <span className="text-[10px] text-amber-400 font-medium">
              {contentPosition === "bottom"
                ? (isEn ? "📌 Bottom" : "📌 ชิดล่าง")
                : contentPosition === "center"
                ? (isEn ? "📍 Center" : "📍 กลางจอ")
                : contentPosition === "top"
                ? (isEn ? "🔝 Top" : "🔝 ด้านบน")
                : (isEn ? "✨ Split" : "✨ แยกส่วน")}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: "bottom", label: isEn ? "📌 Bottom" : "📌 ล่าง", sub: isEn ? "Standard" : "มาตรฐาน" },
              { id: "center", label: isEn ? "📍 Center" : "📍 กลาง", sub: isEn ? "Centered" : "เด่นกลาง" },
              { id: "top", label: isEn ? "🔝 Top" : "🔝 บน", sub: isEn ? "Header" : "ชิดบน" },
              { id: "split_hero", label: isEn ? "✨ Split" : "✨ แยก", sub: isEn ? "Mid+Bot" : "กลาง+ล่าง" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setContentPosition(p.id as ContentPosition)}
                className={`py-1.5 px-1 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  contentPosition === p.id
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs scale-102"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="text-[11px] font-bold">{p.label}</span>
                <span className="text-[9px] opacity-70">{p.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Photo Filters (Feature 3) */}
      <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
          <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
          {isEn ? "Photo Filters" : "ฟิลเตอร์ภาพถ่าย (Photo Filter)"}
        </Label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
          {[
            { id: "none", label: isEn ? "❌ None" : "❌ ไม่ใส่" },
            { id: "bright", label: "✨ Bright" },
            { id: "dark_moody", label: "🌙 Dark" },
            { id: "warm_gold", label: "☀️ Warm" },
            { id: "high_contrast", label: "🎨 Contrast" },
            { id: "bw", label: "🖤 B&W" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setPhotoFilter(f.id as PhotoFilter)}
              className={`py-1.5 px-1 rounded-xl border text-[11px] font-medium transition-all text-center cursor-pointer ${
                photoFilter === f.id
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs scale-102"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5.1 Background Dimming / Dark Overlay (Custom Dark Tint) */}
      {setBgDimOpacity && (
        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              {isEn ? "Dark Tint Overlay" : "ความมืดของภาพพื้นหลัง (Dark Tint Overlay)"}
            </Label>
            <span className="text-[10px] text-indigo-400 font-mono font-bold">
              {bgDimOpacity === 0 ? (isEn ? "0% (Original)" : "0% (สว่างตามปกติ)") : `${bgDimOpacity}% มืดลง`}
            </span>
          </div>

          <p className="text-[10px] text-slate-400">
            {isEn
              ? "Darken the background image to make texts and badges pop with high contrast."
              : "ปรับความมืด/โปร่งใสของสีดำ เพื่อดึงให้ข้อความและป้ายราคาโดดเด่น อ่านง่ายชัดเจน"}
          </p>

          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-1">
              {[
                { label: isEn ? "0% Off" : "0% ใส", value: 0 },
                { label: isEn ? "20% Light" : "20% บาง", value: 20 },
                { label: isEn ? "40% Mid ⭐" : "40% พอดี ⭐", value: 40 },
                { label: isEn ? "60% Dark" : "60% เข้ม", value: 60 },
                { label: isEn ? "80% Deep" : "80% มืดจัด", value: 80 },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setBgDimOpacity(p.value)}
                  className={`py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                    bgDimOpacity === p.value
                      ? "bg-indigo-600 text-white border-indigo-500 font-bold shadow-xs scale-102"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={bgDimOpacity}
              onChange={(e) => setBgDimOpacity(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 5.2 Background Blur Effect */}
      {setBgBlur && (
        <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              {isEn ? "Background Blur Effect" : "เอฟเฟกต์เบลอภาพพื้นหลัง (Background Blur)"}
            </Label>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">
              {bgBlur === 0 ? (isEn ? "0px (Sharp)" : "0px (ชัดปกติ)") : `${bgBlur}px ${isEn ? "Blur" : "เบลอละมุน"}`}
            </span>
          </div>

          <div className="space-y-2">
            {/* Quick Blur Presets */}
            <div className="grid grid-cols-5 gap-1">
              {[
                { label: isEn ? "Off" : "ปิด", value: 0 },
                { label: isEn ? "4px Light" : "4px เบาๆ", value: 4 },
                { label: isEn ? "8px Mid" : "8px พอดี", value: 8 },
                { label: isEn ? "16px Soft" : "16px ละมุน", value: 16 },
                { label: isEn ? "24px Deep" : "24px จัดเต็ม", value: 24 },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setBgBlur(p.value)}
                  className={`py-1 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                    bgBlur === p.value
                      ? "bg-cyan-600 text-white border-cyan-500 font-bold shadow-xs scale-102"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <input
              type="range"
              min="0"
              max="30"
              step="2"
              value={bgBlur}
              onChange={(e) => setBgBlur(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* 6. Grid Line Border Controls */}
      <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            {isEn ? "Grid Border Lines" : "เส้นแบ่งกริดรูปภาพ (Grid Border Lines)"}
          </Label>
          <span className="text-[10px] text-amber-400 font-mono font-bold">
            {gridLineWidth === 0 ? (isEn ? "None" : "ซ่อนเส้นแบ่ง") : `${gridLineWidth} px`}
          </span>
        </div>

        <div className="space-y-2">
          {/* Preset Buttons */}
          <div className="grid grid-cols-5 gap-1">
            {[
              { label: isEn ? "None" : "ไม่มี", value: 0 },
              { label: isEn ? "Thin" : "บาง", value: 2 },
              { label: isEn ? "Medium" : "กลาง", value: 4 },
              { label: isEn ? "Thick ⭐" : "หนา ⭐", value: 8 },
              { label: isEn ? "Max" : "หนามาก", value: 16 },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setGridLineWidth(item.value)}
                className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  gridLineWidth === item.value
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={gridLineWidth}
            onChange={(e) => setGridLineWidth(Number(e.target.value))}
            className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />

          {/* Color Chooser */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-400 font-medium">
              {isEn ? "🎨 Border Color:" : "🎨 สีเส้นแบ่ง:"}
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { name: isEn ? "Black" : "ดำ", hex: "#000000" },
                { name: isEn ? "Dark Gray" : "เทาเข้ม", hex: "#1E293B" },
                { name: isEn ? "White" : "ขาว", hex: "#FFFFFF" },
                { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setGridLineColor(c.hex)}
                  title={c.name}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                    gridLineColor === c.hex
                      ? "ring-2 ring-amber-400 scale-110 border-white"
                      : "border-slate-700 opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={gridLineColor}
                onChange={(e) => setGridLineColor(e.target.value)}
                className="w-6 h-6 rounded-md bg-transparent border border-slate-700 cursor-pointer p-0"
                title={isEn ? "Select custom color" : "เลือกสี Custom"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
