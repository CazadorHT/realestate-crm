"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sliders, Layers } from "lucide-react";
import type { CardBackground, ContentPosition, FontSizeScale } from "../types";

interface StudioCardCustomizerProps {
  cardHeightPercent: number;
  setCardHeightPercent: (v: number) => void;
  cardWidthPercent: number;
  setCardWidthPercent: (v: number) => void;
  cardTextAlign: "left" | "center" | "right";
  setCardTextAlign: (a: "left" | "center" | "right") => void;
  cardOpacity: number;
  setCardOpacity: (v: number) => void;
  scrimOpacity: number;
  setScrimOpacity: (v: number) => void;
  topScrimOpacity?: number;
  setTopScrimOpacity?: (v: number) => void;
  bottomScrimOpacity?: number;
  setBottomScrimOpacity?: (v: number) => void;
  cardBackground: CardBackground;
  setCardBackground: (b: CardBackground) => void;
  showBrandingHeader: boolean;
  setShowBrandingHeader: (s: boolean) => void;
  showTopListingBadge: boolean;
  setShowTopListingBadge: (s: boolean) => void;
  headerFontSizeScale: FontSizeScale;
  setHeaderFontSizeScale: (f: FontSizeScale) => void;
  badgeFontSizeScale: FontSizeScale;
  setBadgeFontSizeScale: (f: FontSizeScale) => void;
  headerYOffset: number;
  setHeaderYOffset: (v: number) => void;
  contentPosition: ContentPosition;
  cardYOffset: number;
  setCardYOffset: (v: number) => void;
  card1YOffset: number;
  setCard1YOffset: (v: number) => void;
  card2YOffset: number;
  setCard2YOffset: (v: number) => void;
  cardRightMargin: number;
  setCardRightMargin: (v: number) => void;
  customCardBgColor?: string;
  setCustomCardBgColor?: (c: string) => void;
  customCanvasBgColor?: string;
  setCustomCanvasBgColor?: (c: string) => void;
  customListingBadgeBgColor?: string;
  setCustomListingBadgeBgColor?: (c: string) => void;
  customListingBadgeTextColor?: string;
  setCustomListingBadgeTextColor?: (c: string) => void;
}

export function StudioCardCustomizer({
  cardHeightPercent,
  setCardHeightPercent,
  cardWidthPercent,
  setCardWidthPercent,
  cardTextAlign,
  setCardTextAlign,
  cardOpacity,
  setCardOpacity,
  scrimOpacity,
  setScrimOpacity,
  topScrimOpacity,
  setTopScrimOpacity,
  bottomScrimOpacity,
  setBottomScrimOpacity,
  cardBackground,
  setCardBackground,
  showBrandingHeader,
  setShowBrandingHeader,
  showTopListingBadge,
  setShowTopListingBadge,
  headerFontSizeScale,
  setHeaderFontSizeScale,
  badgeFontSizeScale,
  setBadgeFontSizeScale,
  headerYOffset,
  setHeaderYOffset,
  contentPosition,
  cardYOffset,
  setCardYOffset,
  card1YOffset,
  setCard1YOffset,
  card2YOffset,
  setCard2YOffset,
  cardRightMargin,
  setCardRightMargin,
  customCardBgColor,
  setCustomCardBgColor,
  customCanvasBgColor,
  setCustomCanvasBgColor,
  customListingBadgeBgColor,
  setCustomListingBadgeBgColor,
  customListingBadgeTextColor,
  setCustomListingBadgeTextColor,
}: StudioCardCustomizerProps) {
  const isSplitMode = contentPosition === "split_hero";

  return (
    <div className="space-y-3.5">
      {/* 1. Card Height & Background */}
      <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            ความสูงกรอบข้อมูล (Card Height)
          </Label>
          <span className="text-[10px] text-amber-400 font-medium">
            {cardHeightPercent === 0 ? "🎯 Auto-Fit (พอดีข้อความ)" : `กำหนดเอง ${cardHeightPercent}%`}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { val: 0, label: "🎯 Auto-Fit", sub: "พอดีข้อความ" },
            { val: 26, label: "26%", sub: "เน้นรูปภาพ" },
            { val: 36, label: "36%", sub: "สมดุลพอดี" },
            { val: 46, label: "46%", sub: "การ์ดใหญ่" },
          ].map((preset) => (
            <button
              key={preset.val}
              type="button"
              onClick={() => setCardHeightPercent(preset.val)}
              className={`py-1.5 px-1 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                cardHeightPercent === preset.val
                  ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs scale-102"
                  : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span>{preset.label}</span>
              <span className="text-[9px] opacity-70">{preset.sub}</span>
            </button>
          ))}
        </div>

        {cardHeightPercent > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>ลากปรับความสูง</span>
              <span>{cardHeightPercent}% ของภาพ</span>
            </div>
            <input
              type="range"
              min="18"
              max="55"
              step="1"
              value={cardHeightPercent}
              onChange={(e) => setCardHeightPercent(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        )}

        {/* Card Width Control */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium text-slate-300">
              📐 ความกว้างกรอบข้อมูล (Card Width)
            </Label>
            <span className="text-[10px] text-amber-400 font-medium">
              {cardWidthPercent === 0 ? "🎯 Auto 100% เต็มขอบ" : `กำหนดเอง ${cardWidthPercent}%`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { val: 0, label: "🎯 Auto 100%", sub: "เต็มขอบภาพ" },
              { val: 92, label: "92%", sub: "มาตรฐาน" },
              { val: 84, label: "84%", sub: "กระชับ" },
              { val: 75, label: "75%", sub: "เรียวเล็ก" },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setCardWidthPercent(preset.val)}
                className={`py-1.5 px-1 rounded-xl border text-[10px] font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  cardWidthPercent === preset.val
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs scale-102"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{preset.label}</span>
                <span className="text-[9px] opacity-70">{preset.sub}</span>
              </button>
            ))}
          </div>

          {cardWidthPercent > 0 && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>ลากปรับความกว้างละเอียด</span>
                <span>{cardWidthPercent}% ของความกว้าง</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                step="2"
                value={cardWidthPercent}
                onChange={(e) => setCardWidthPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          )}
        </div>

        {/* Text Alignment */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium text-slate-300">
              ✍️ การจัดวางข้อความ (Text Alignment)
            </Label>
            <span className="text-[10px] text-amber-400 font-medium">
              {cardTextAlign === "center" ? "↔️ จัดกึ่งกลาง" : cardTextAlign === "right" ? "➡️ ชิดขวา" : "⬅️ ชิดซ้าย"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "left", label: "⬅️ ชิดซ้าย", sub: "Left Align" },
              { id: "center", label: "↔️ จัดกึ่งกลาง", sub: "Center Align" },
              { id: "right", label: "➡️ ชิดขวา", sub: "Right Align" },
            ].map((align) => (
              <button
                key={align.id}
                type="button"
                onClick={() => setCardTextAlign(align.id as "left" | "center" | "right")}
                className={`py-1.5 px-1 rounded-xl border text-[10px] font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  cardTextAlign === align.id
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs scale-102"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{align.label}</span>
                <span className="text-[9px] opacity-70 font-mono">{align.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card Opacity Control */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
              <Layers className="h-3 w-3 text-amber-400" />
              ความโปร่งใสพื้นหลังการ์ด (Card Opacity)
            </Label>
            <span className="text-[10px] text-amber-400 font-medium font-mono">
              {cardOpacity}%
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { val: 0, label: "0% ใส", sub: "ไร้กรอบ" },
              { val: 40, label: "40%", sub: "โปร่งใส" },
              { val: 62, label: "62%", sub: "กระจกใส" },
              { val: 94, label: "94%", sub: "มืดทึบ" },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setCardOpacity(preset.val)}
                className={`py-1 px-1 rounded-xl border text-[10px] font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                  cardOpacity === preset.val
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs scale-102"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{preset.label}</span>
                <span className="text-[9px] opacity-70">{preset.sub}</span>
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>ลากปรับความโปร่งแสง</span>
              <span>{cardOpacity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="2"
              value={cardOpacity}
              onChange={(e) => setCardOpacity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Custom Card & Canvas Background Color Chooser */}
        <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
          <Label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span>🎨 ปรับเปลี่ยนสีพื้นหลังการ์ดข้อมูล (Custom Card Color)</span>
          </Label>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-medium">สีการ์ด:</span>
            <div className="flex items-center gap-1.5">
              {[
                { name: "น้ำเงินเข้ม", hex: "#0F172A" },
                { name: "ดำสนิท", hex: "#000000" },
                { name: "กรมท่า", hex: "#0B1329" },
                { name: "เขียวมรกต", hex: "#064E3B" },
                { name: "แดงไวน์", hex: "#4C0519" },
                { name: "น้ำตาลมอลต์", hex: "#291E1A" },
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setCustomCardBgColor && setCustomCardBgColor(c.hex)}
                  title={c.name}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                    customCardBgColor === c.hex
                      ? "ring-2 ring-amber-400 scale-110 border-white"
                      : "border-slate-700 opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={customCardBgColor || "#0F172A"}
                onChange={(e) => setCustomCardBgColor && setCustomCardBgColor(e.target.value)}
                className="w-6 h-6 rounded-md bg-transparent border border-slate-700 cursor-pointer p-0"
                title="เลือกสี Custom"
              />
            </div>
          </div>
        </div>

        {/* Scrim Gradient Darkness Controls (Top & Bottom Independent) */}
        <div className="pt-2.5 border-t border-slate-800/80 space-y-3">
          {/* Top Scrim */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-slate-300">
                🌤️ เงาดำขอบบนภาพ (Top Scrim)
              </Label>
              <span className="text-[10px] text-amber-400 font-medium font-mono">
                {(topScrimOpacity ?? scrimOpacity) === 0 ? "🚫 ปิดใส" : `${topScrimOpacity ?? scrimOpacity}%`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: 0, label: "🚫 0% ใส", sub: "ไม่บังภาพ" },
                { val: 30, label: "🌤️ 30%", sub: "บางสบายตา" },
                { val: 60, label: "⛅ 60%", sub: "ปกติ" },
                { val: 100, label: "🌙 100%", sub: "เข้มชัด" },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => {
                    if (setTopScrimOpacity) setTopScrimOpacity(preset.val);
                    else setScrimOpacity(preset.val);
                  }}
                  className={`py-1 px-1 rounded-xl border text-[10px] font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                    (topScrimOpacity ?? scrimOpacity) === preset.val
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs scale-102"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="text-[9px] opacity-70">{preset.sub}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1 pt-0.5">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={topScrimOpacity ?? scrimOpacity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (setTopScrimOpacity) setTopScrimOpacity(val);
                  else setScrimOpacity(val);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Bottom Scrim */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-medium text-slate-300">
                🌙 เงาดำขอบล่างภาพ (Bottom Scrim)
              </Label>
              <span className="text-[10px] text-amber-400 font-medium font-mono">
                {(bottomScrimOpacity ?? scrimOpacity) === 0 ? "🚫 ปิดใส" : `${bottomScrimOpacity ?? scrimOpacity}%`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: 0, label: "🚫 0% ใส", sub: "ไม่บังภาพ" },
                { val: 30, label: "🌤️ 30%", sub: "บางสบายตา" },
                { val: 60, label: "⛅ 60%", sub: "ปกติ" },
                { val: 100, label: "🌙 100%", sub: "เข้มชัด" },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => {
                    if (setBottomScrimOpacity) setBottomScrimOpacity(preset.val);
                    else setScrimOpacity(preset.val);
                  }}
                  className={`py-1 px-1 rounded-xl border text-[10px] font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
                    (bottomScrimOpacity ?? scrimOpacity) === preset.val
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs scale-102"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="text-[9px] opacity-70">{preset.sub}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1 pt-0.5">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={bottomScrimOpacity ?? scrimOpacity}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (setBottomScrimOpacity) setBottomScrimOpacity(val);
                  else setScrimOpacity(val);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Header & Top Badge Controls */}
      <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            Header ด้านบน (Branding & ป้ายสถานะ)
          </Label>
        </div>

        {/* 2.1 Left Branding Header */}
        <div className="space-y-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-slate-300 font-medium">
              🏢 Branding โลโก้ & ชื่อบริษัท (ฝั่งซ้าย)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium">
                {showBrandingHeader ? "เปิดแสดง" : "🚫 ปิด"}
              </span>
              <Switch
                checked={showBrandingHeader}
                onCheckedChange={setShowBrandingHeader}
                className="scale-80"
              />
            </div>
          </div>

          {showBrandingHeader && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-[10px] text-slate-400">ขนาดฟอนต์ Branding:</span>
              <div className="flex gap-1">
                {[
                  { id: "sm", label: "เล็ก" },
                  { id: "md", label: "ปกติ" },
                  { id: "lg", label: "ใหญ่" },
                  { id: "xl", label: "ยักษ์" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHeaderFontSizeScale(f.id as FontSizeScale)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                      headerFontSizeScale === f.id
                        ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                        : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2.2 Right Top Badge (FOR SALE / FOR RENT / FOR RENT/SALE) */}
        <div className="space-y-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-slate-300 font-medium">
              🏷️ ป้ายประเภทประกาศ (FOR SALE / RENT ฝั่งขวา)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium">
                {showTopListingBadge ? "เปิดแสดง" : "🚫 ปิด"}
              </span>
              <Switch
                checked={showTopListingBadge}
                onCheckedChange={setShowTopListingBadge}
                className="scale-80"
              />
            </div>
          </div>

          {showTopListingBadge && (
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">ขนาดป้าย & ฟอนต์:</span>
                <div className="flex gap-1">
                  {[
                    { id: "sm", label: "เล็ก" },
                    { id: "md", label: "ปกติ" },
                    { id: "lg", label: "ใหญ่" },
                    { id: "xl", label: "ยักษ์" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setBadgeFontSizeScale(f.id as FontSizeScale)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                        badgeFontSizeScale === f.id
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                          : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Badge BG & Text Colors */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/40">
                {/* Badge BG Color */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">สีพื้นหลังป้าย:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { name: "ทอง", hex: "#F59E0B" },
                      { name: "ส้ม", hex: "#F97316" },
                      { name: "แดง", hex: "#EF4444" },
                      { name: "น้ำเงิน", hex: "#2563EB" },
                      { name: "เขียว", hex: "#10B981" },
                      { name: "ดำ", hex: "#000000" },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCustomListingBadgeBgColor && setCustomListingBadgeBgColor(c.hex)}
                        title={c.name}
                        className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                          customListingBadgeBgColor === c.hex
                            ? "ring-2 ring-amber-400 scale-110 border-white"
                            : "border-slate-700 opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                    <input
                      type="color"
                      value={customListingBadgeBgColor || "#F59E0B"}
                      onChange={(e) => setCustomListingBadgeBgColor && setCustomListingBadgeBgColor(e.target.value)}
                      className="w-5 h-5 rounded bg-transparent border border-slate-700 cursor-pointer p-0"
                      title="เลือกสี Custom BG"
                    />
                  </div>
                </div>

                {/* Badge Text Color */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">สีข้อความป้าย:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { name: "ดำ", hex: "#000000" },
                      { name: "ขาว", hex: "#FFFFFF" },
                      { name: "ทอง", hex: "#F59E0B" },
                      { name: "ส้ม", hex: "#F97316" },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCustomListingBadgeTextColor && setCustomListingBadgeTextColor(c.hex)}
                        title={c.name}
                        className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                          customListingBadgeTextColor === c.hex
                            ? "ring-2 ring-amber-400 scale-110 border-white"
                            : "border-slate-700 opacity-70 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                    <input
                      type="color"
                      value={customListingBadgeTextColor || "#000000"}
                      onChange={(e) => setCustomListingBadgeTextColor && setCustomListingBadgeTextColor(e.target.value)}
                      className="w-5 h-5 rounded bg-transparent border border-slate-700 cursor-pointer p-0"
                      title="เลือกสี Custom Text"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2.3 Header Offset */}
        {(showBrandingHeader || showTopListingBadge) && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-3 gap-1">
              {[
                { val: 0, label: "ปกติ (0px)" },
                { val: 40, label: "🛡️ หลบสตอรี่ (+40)" },
                { val: 90, label: "⬇️ ต่ำพิเศษ (+90)" },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setHeaderYOffset(preset.val)}
                  className={`py-1 rounded-lg border text-[11px] font-medium transition-all text-center cursor-pointer ${
                    headerYOffset === preset.val
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>เลื่อน Header ขึ้น-ลง ละเอียด</span>
                <span>{headerYOffset > 0 ? `+${headerYOffset}px` : `${headerYOffset}px`}</span>
              </div>
              <input
                type="range"
                min="-40"
                max="140"
                step="5"
                value={headerYOffset}
                onChange={(e) => setHeaderYOffset(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Deadzone Escape & Dual Zone Position Nudge */}
      <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            {isSplitMode
              ? "ปรับตำแหน่งการ์ดทั้ง 2 โซนอิสระ"
              : "ตำแหน่งกรอบข้อมูล (หนี Deadzone แพลตฟอร์ม)"}
          </Label>
          <span className="text-[10px] text-amber-400 font-medium">
            {isSplitMode
              ? "✨ แยก 2 การ์ดอิสระ"
              : cardYOffset === 0
                ? "📌 ล่างสุดปกติ"
                : `ยกขึ้น ${Math.abs(cardYOffset)}px`}
          </span>
        </div>

        {isSplitMode ? (
          <div className="space-y-3 pt-1">
            <div className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-300 font-medium">
                <span>🔝 การ์ดโซนบน/กลาง (Zone A)</span>
                <span className="text-amber-400">
                  {card1YOffset !== 0
                    ? `${card1YOffset > 0 ? `+${card1YOffset}` : card1YOffset}px`
                    : "ปกติ (0px)"}
                </span>
              </div>
              <input
                type="range"
                min="-450"
                max="450"
                step="10"
                value={card1YOffset}
                onChange={(e) => setCard1YOffset(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-300 font-medium">
                <span>🔻 การ์ดโซนล่าง (Zone B)</span>
                <span className="text-amber-400">
                  {card2YOffset !== 0
                    ? `${card2YOffset > 0 ? `+${card2YOffset}` : card2YOffset}px`
                    : "ปกติ (0px)"}
                </span>
              </div>
              <input
                type="range"
                min="-700"
                max="150"
                step="10"
                value={card2YOffset}
                onChange={(e) => setCard2YOffset(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-1">
              {[
                { val: 0, label: "📌 ล่างสุด (0)" },
                { val: -240, label: "📸 หลบ IG (-240)" },
                { val: -380, label: "🛡️ หลบ TikTok (-380)" },
                { val: -580, label: "🎯 กึ่งกลาง (-580)" },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setCardYOffset(preset.val)}
                  className={`py-1.5 px-1 rounded-lg border text-[10px] font-medium transition-all text-center cursor-pointer ${
                    cardYOffset === preset.val
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>เลื่อนกรอบ ขึ้น-ลง ละเอียด</span>
                <span>
                  {cardYOffset < 0
                    ? `ยกขึ้น ${Math.abs(cardYOffset)}px (หลบแถบล่าง)`
                    : cardYOffset > 0
                      ? `กดลง +${cardYOffset}px`
                      : "0px (ล่างสุด)"}
                </span>
              </div>
              <input
                type="range"
                min="-700"
                max="150"
                step="10"
                value={cardYOffset}
                onChange={(e) => setCardYOffset(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <Label className="text-[11px] font-medium text-slate-400">
            🛡️ หลบปุ่ม Like / Share ฝั่งขวา (TikTok)
          </Label>
          <Switch
            checked={cardRightMargin > 0}
            onCheckedChange={(c) => setCardRightMargin(c ? 130 : 0)}
            className="scale-80"
          />
        </div>
      </div>
    </div>
  );
}
