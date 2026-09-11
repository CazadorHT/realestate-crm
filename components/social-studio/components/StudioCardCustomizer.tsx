"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sliders, Layers } from "lucide-react";
import type { CardBackground, ContentPosition, FontSizeScale } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

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
  brandingTitleFontSizeScale?: FontSizeScale;
  setBrandingTitleFontSizeScale?: (f: FontSizeScale) => void;
  brandingSubtitleFontSizeScale?: FontSizeScale;
  setBrandingSubtitleFontSizeScale?: (f: FontSizeScale) => void;
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
  showCardContent?: boolean;
  setShowCardContent?: (s: boolean) => void;
  cardBorderGlow?: boolean;
  setCardBorderGlow?: (v: boolean) => void;
  glowBorderWidth?: number;
  setGlowBorderWidth?: (v: number) => void;
  centerGlow?: number;
  setCenterGlow?: (v: number) => void;
  centerGlowBlur?: number;
  setCenterGlowBlur?: (v: number) => void;
  centerGlowColor?: string;
  setCenterGlowColor?: (c: string) => void;
  glassBlur?: number;
  setGlassBlur?: (v: number) => void;
  brandingHeaderStyle?: "classic_left" | "frosted_capsule";
  setBrandingHeaderStyle?: (style: "classic_left" | "frosted_capsule") => void;
  brandingHeaderAlign?: "center" | "left";
  setBrandingHeaderAlign?: (align: "center" | "left") => void;
  brandingBgColor?: string;
  setBrandingBgColor?: (c: string) => void;
  brandingTitleColor?: string;
  setBrandingTitleColor?: (c: string) => void;
  brandingSubtitleColor?: string;
  setBrandingSubtitleColor?: (c: string) => void;
  customCompanyName?: string;
  setCustomCompanyName?: (name: string) => void;
  customCompanySubtitle?: string;
  setCustomCompanySubtitle?: (sub: string) => void;
  companyNameDefault?: string;
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
  topScrimOpacity = 0,
  setTopScrimOpacity,
  bottomScrimOpacity = 0,
  setBottomScrimOpacity,
  cardBackground,
  setCardBackground,
  showBrandingHeader,
  setShowBrandingHeader,
  showTopListingBadge,
  setShowTopListingBadge,
  headerFontSizeScale,
  setHeaderFontSizeScale,
  brandingTitleFontSizeScale,
  setBrandingTitleFontSizeScale,
  brandingSubtitleFontSizeScale,
  setBrandingSubtitleFontSizeScale,
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
  showCardContent = true,
  setShowCardContent,
  cardBorderGlow = true,
  setCardBorderGlow,
  glowBorderWidth = 55,
  setGlowBorderWidth,
  centerGlow = 100,
  setCenterGlow,
  centerGlowBlur = 5,
  setCenterGlowBlur,
  centerGlowColor = "#FFFFFF",
  setCenterGlowColor,
  glassBlur = 24,
  setGlassBlur,
  brandingHeaderStyle = "frosted_capsule",
  setBrandingHeaderStyle,
  brandingHeaderAlign = "center",
  setBrandingHeaderAlign,
  brandingBgColor = "",
  setBrandingBgColor,
  brandingTitleColor,
  setBrandingTitleColor,
  brandingSubtitleColor,
  setBrandingSubtitleColor,
  customCompanyName,
  setCustomCompanyName,
  customCompanySubtitle,
  setCustomCompanySubtitle,
  companyNameDefault,
}: StudioCardCustomizerProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const isSplitMode = contentPosition === "split_hero";

  return (
    <div className="space-y-3.5">
      {/* 0. Master Toggle: Show Card Content */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {isEn ? "Property Card Content" : "กรอบข้อมูลทรัพย์ (Card Content)"}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    showCardContent
                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  {showCardContent ? (isEn ? "Visible" : "เปิดแสดง") : (isEn ? "Hidden" : "🚫 ปิดซ่อน")}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isEn
                  ? "Toggle on to show property info card, or off for 100% clean image"
                  : "เปิดเพื่อแสดงกรอบข้อมูลทรัพย์ หรือปิดเพื่อซ่อนการ์ดแสดงรูปภาพเต็มใบ 100%"}
              </p>
            </div>
          </div>
          {setShowCardContent && (
            <Switch
              checked={showCardContent}
              onCheckedChange={setShowCardContent}
            />
          )}
        </div>

        {!showCardContent && (
          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-2">
            <span className="text-amber-400">💡</span>
            <span>
              {isEn
                ? "Card is hidden. Background photo will be displayed clean without overlay card. You can add viral Text Effects in the Content tab."
                : "ซ่อนการ์ดข้อมูลอยู่: รูปภาพจะแสดงแบบคลีนเต็มตา สามารถใส่ Text Effect สไตล์ TikTok / Lemon8 เพิ่มในแท็บ Content ได้"}
            </span>
          </div>
        )}
      </div>

      {/* 1. Card Height & Background */}
      <div className={`p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3 transition-opacity ${!showCardContent ? "opacity-60" : ""}`}>
        {/* Card Surface Style Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              {isEn ? "Glass Skin Styles & Surface" : "สไตล์กระจกสำเร็จรูป (Glass Skin Styles)"}
            </Label>
            <span className="text-[10px] text-amber-400 font-mono">
              {cardBackground === "frosted_luxury" ? "💎 Ultra Frosted"
                : cardBackground === "crystal_glass" ? "🧊 Crystal Ice"
                : cardBackground === "obsidian_glass" ? "🌌 Midnight Obsidian"
                : cardBackground === "champagne_glass" ? "✨ Champagne Gold"
                : cardBackground === "smoked_glass" ? "🌫️ Smoked Charcoal"
                : cardBackground === "solid" ? "⬛ Deep Solid"
                : cardBackground === "minimal_gradient" ? "🎯 Clear View"
                : "🪟 Modern Clean"}
            </span>
          </div>

          {/* 1-Click Glass Skin Quick Styles */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400">
              {isEn ? "⚡ 1-Click Glass Styles:" : "⚡ สไตล์กระจกสำเร็จรูป (1-Click Presets):"}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                {
                  id: "frosted_luxury",
                  name: "💎 Phuket Frosted",
                  sub: isEn ? "Botanica Glow" : "ฝ้าหรู + ขอบเงาวาว",
                  opacity: 78,
                  glow: true,
                },
                {
                  id: "crystal_glass",
                  name: "🧊 Crystal Ice",
                  sub: isEn ? "Ice Pure White" : "คริสตัลใสประกายขาว",
                  opacity: 65,
                  glow: true,
                },
                {
                  id: "champagne_glass",
                  name: "✨ Champagne Gold",
                  sub: isEn ? "Luxury Villa Gold" : "ทองหรูแชมเปญ",
                  opacity: 80,
                  glow: true,
                },
                {
                  id: "obsidian_glass",
                  name: "🌌 Midnight Obsidian",
                  sub: isEn ? "Moody Penthouse" : "ออบซิเดียนดาร์กหรู",
                  opacity: 86,
                  glow: true,
                },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setCardBackground(preset.id as CardBackground);
                    setCardOpacity(preset.opacity);
                    if (setCardBorderGlow) setCardBorderGlow(preset.glow);
                    if (setCustomCardBgColor && customCardBgColor === "#0F172A") {
                      setCustomCardBgColor("");
                    }
                  }}
                  className={`p-2 rounded-xl border text-left flex flex-col justify-center transition-all cursor-pointer relative overflow-hidden ${
                    cardBackground === preset.id
                      ? "bg-amber-500/25 border-amber-400 text-amber-200 font-bold shadow-xs scale-102"
                      : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span className="text-[11px] font-bold truncate">{preset.name}</span>
                  <span className="text-[9px] opacity-75 truncate">{preset.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* All 8 Available Glass Skins */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
            {[
              {
                id: "frosted_luxury",
                label: "💎 Frosted Luxury",
                sub: isEn ? "Botanica Center Glow" : "กระจกฝ้าหรู + ขอบสว่างตรงกลาง",
                popular: true,
              },
              {
                id: "crystal_glass",
                label: "🧊 Crystal Ice",
                sub: isEn ? "Ice Crystalline Glass" : "กระจกคริสตัลใสประกายขาว",
              },
              {
                id: "obsidian_glass",
                label: "🌌 Midnight Obsidian",
                sub: isEn ? "Deep Moody Dark Glass" : "กระจกดำออบซิเดียนหรู",
              },
              {
                id: "champagne_glass",
                label: "✨ Champagne Gold",
                sub: isEn ? "Warm Amber Gold Rim" : "กระจกทองแชมเปญเรืองรอง",
              },
              {
                id: "smoked_glass",
                label: "🌫️ Smoked Charcoal",
                sub: isEn ? "Matte Smoked Rim" : "กระจกรมควันมินิมอล",
              },
              {
                id: "glass",
                label: "🪟 Modern Clean",
                sub: isEn ? "Standard Glass" : "กระจกใสมาตรฐาน",
              },
              {
                id: "solid",
                label: "⬛ Deep Solid",
                sub: isEn ? "Dark Opaque 95%" : "การ์ดมืดทึบคมชัดสูง",
              },
              {
                id: "minimal_gradient",
                label: "🎯 Clear View",
                sub: isEn ? "Borderless Floating" : "โปร่งใสไร้ขอบลอยตัว",
              },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => {
                  setCardBackground(style.id as CardBackground);
                  if (setCustomCardBgColor && customCardBgColor === "#0F172A") {
                    setCustomCardBgColor("");
                  }
                }}
                className={`p-2 rounded-xl border text-left flex flex-col justify-center transition-all cursor-pointer relative overflow-hidden ${
                  cardBackground === style.id
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-xs scale-101"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {style.popular && (
                  <span className="absolute top-1 right-1 text-[8px] bg-amber-500 text-slate-950 px-1 rounded-sm font-black">
                    HOT
                  </span>
                )}
                <span className="text-[11px] font-bold">{style.label}</span>
                <span className="text-[9px] opacity-75 leading-tight mt-0.5">{style.sub}</span>
              </button>
            ))}
          </div>

          {/* Center Rim Glow Controls (Glow Border Width, Center Glow, Glass Blur) */}
          {setCardBorderGlow && cardBackground !== "solid" && cardBackground !== "minimal_gradient" && (
            <div className="space-y-2.5 p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✨</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-white">
                        {isEn ? "Specular Center Glow Rim" : "ขอบสว่างฟุ้งตรงกลาง (Center Glow)"}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          cardBorderGlow
                            ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {cardBorderGlow ? (isEn ? "ON" : "เปิด") : (isEn ? "OFF" : "ปิด")}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400">
                      {isEn
                        ? "Top & bottom specular highlights glow bright in center"
                        : "ขอบบนและล่างเรืองแสงฟุ้งตรงกลาง ค่อยๆ จางกลายเป็นเส้นปกติ"}
                    </p>
                  </div>
                </div>
                <Switch checked={cardBorderGlow} onCheckedChange={setCardBorderGlow} className="scale-85" />
              </div>

              {cardBorderGlow && (
                <div className="pt-2 border-t border-slate-800/80 space-y-3">
                  {/* 1. Glow Border Width */}
                  {setGlowBorderWidth && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                          <span>↔️</span>
                          <span>{isEn ? "Glow Border Width" : "ความกว้างสันเรืองแสง (Glow Width)"}</span>
                        </Label>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">{glowBorderWidth}%</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { val: 30, label: isEn ? "30% Narrow" : "30% แคบ" },
                          { val: 55, label: isEn ? "55% Bal. ⭐" : "55% ปกติ ⭐" },
                          { val: 75, label: isEn ? "75% Wide" : "75% กว้าง" },
                          { val: 100, label: isEn ? "100% Full" : "100% เต็ม" },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setGlowBorderWidth(item.val)}
                            className={`py-1 px-1 rounded-lg text-[9px] font-medium border transition-all cursor-pointer text-center ${
                              glowBorderWidth === item.val
                                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs"
                                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={glowBorderWidth}
                        onChange={(e) => setGlowBorderWidth(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  )}

                  {/* 2. Center Glow Intensity */}
                  {setCenterGlow && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                          <span>🔆</span>
                          <span>{isEn ? "Center Glow Intensity" : "ความสว่างฟุ้งตรงกลาง (Center Glow)"}</span>
                        </Label>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">{centerGlow}%</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { val: 50, label: isEn ? "50% Soft" : "50% นุ่มนวล" },
                          { val: 100, label: isEn ? "100% Crisp ⭐" : "100% สมจริง ⭐" },
                          { val: 125, label: isEn ? "125% Bright" : "125% สว่างจ้า" },
                          { val: 150, label: isEn ? "150% Neon" : "150% นีออน" },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setCenterGlow(item.val)}
                            className={`py-1 px-1 rounded-lg text-[9px] font-medium border transition-all cursor-pointer text-center ${
                              centerGlow === item.val
                                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs"
                                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="150"
                        step="5"
                        value={centerGlow}
                        onChange={(e) => setCenterGlow(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  )}

                  {/* 2.1 Center Glow Blur / Spread */}
                  {setCenterGlowBlur && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                          <span>✨</span>
                          <span>{isEn ? "Center Glow Blur / Spread" : "ความฟุ้งของแสง (Glow Blur)"}</span>
                        </Label>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">{centerGlowBlur} px</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { val: 0, label: isEn ? "0px Sharp" : "0px คมชัด" },
                          { val: 4, label: isEn ? "4px Subtle ⭐" : "4px ฟุ้งน้อย ⭐" },
                          { val: 8, label: isEn ? "8px Soft" : "8px ฟุ้งนุ่ม" },
                          { val: 15, label: isEn ? "15px Wide" : "15px ฟุ้งกว้าง" },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setCenterGlowBlur(item.val)}
                            className={`py-1 px-1 rounded-lg text-[9px] font-medium border transition-all cursor-pointer text-center ${
                              centerGlowBlur === item.val
                                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs"
                                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        step="1"
                        value={centerGlowBlur}
                        onChange={(e) => setCenterGlowBlur(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  )}

                  {/* 2.1 Center Glow Color */}
                  {setCenterGlowColor && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                          <span>🎨</span>
                          <span>{isEn ? "Center Glow Color" : "สีเรืองแสงฟุ้งตรงกลาง (Glow Color)"}</span>
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={centerGlowColor || "#FFFFFF"}
                            onChange={(e) => setCenterGlowColor(e.target.value)}
                            className="h-5 w-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                            title={isEn ? "Pick Center Glow color" : "เลือกสีความสว่างฟุ้งตรงกลาง"}
                          />
                          <span className="text-[9px] font-mono text-slate-400">
                            {centerGlowColor && centerGlowColor !== "#FFFFFF" ? centerGlowColor : (isEn ? "White" : "ขาวสว่าง")}
                          </span>
                          {centerGlowColor && centerGlowColor !== "#FFFFFF" && (
                            <button
                              type="button"
                              onClick={() => setCenterGlowColor("#FFFFFF")}
                              className="text-[9px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                              title={isEn ? "Reset to white" : "รีเซ็ตเป็นสีขาว"}
                            >
                              {isEn ? "Reset" : "รีเซ็ต"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Swatches */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { name: isEn ? "White" : "ขาวสว่าง", hex: "#FFFFFF" },
                          { name: isEn ? "Ice Blue" : "ฟ้าไอซ์บลู", hex: "#B4F0FF" },
                          { name: isEn ? "Gold" : "ทองหรู", hex: "#F59E0B" },
                          { name: isEn ? "Amber" : "ส้มอำพัน", hex: "#FB923C" },
                          { name: isEn ? "Emerald" : "มรกต", hex: "#10B981" },
                          { name: isEn ? "Violet" : "ม่วงนีออน", hex: "#A855F7" },
                          { name: isEn ? "Rose" : "ชมพูกุหลาบ", hex: "#F43F5E" },
                        ].map((swatch) => (
                          <button
                            key={swatch.hex}
                            type="button"
                            onClick={() => setCenterGlowColor(swatch.hex)}
                            className={`h-5.5 px-2 rounded-lg border text-[9px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                              centerGlowColor === swatch.hex
                                ? "border-amber-400 ring-1 ring-amber-400 text-white font-bold scale-102"
                                : "border-slate-700 text-slate-300 hover:border-slate-500 bg-slate-900/60"
                            }`}
                            title={swatch.name}
                          >
                            <span
                              className="w-2 h-2 rounded-full border border-white/40 shadow-xs"
                              style={{ backgroundColor: swatch.hex }}
                            />
                            <span>{swatch.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Glass Blur (Backdrop Blur) */}
                  {setGlassBlur && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
                          <span>🌫️</span>
                          <span>{isEn ? "Glass Blur (Backdrop Filter)" : "ความเบลอกระจก (Glass Blur)"}</span>
                        </Label>
                        <span className="text-[10px] text-amber-400 font-mono font-bold">{glassBlur} px</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { val: 0, label: isEn ? "0px Clear" : "0px ไม่เบลอ" },
                          { val: 14, label: isEn ? "14px Light" : "14px บางเบา" },
                          { val: 24, label: isEn ? "24px True ⭐" : "24px สมจริง ⭐" },
                          { val: 36, label: isEn ? "36px Deep" : "36px ฝ้านุ่ม" },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setGlassBlur(item.val)}
                            className={`py-1 px-1 rounded-lg text-[9px] font-medium border transition-all cursor-pointer text-center ${
                              glassBlur === item.val
                                ? "bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs"
                                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="2"
                        value={glassBlur}
                        onChange={(e) => setGlassBlur(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            {isEn ? "Card Height" : "ความสูงกรอบข้อมูล (Card Height)"}
          </Label>
          <span className="text-[10px] text-amber-400 font-medium">
            {cardHeightPercent === 0
              ? (isEn ? "🎯 Auto-Fit" : "🎯 Auto-Fit (พอดีข้อความ)")
              : (isEn ? `Custom ${cardHeightPercent}%` : `กำหนดเอง ${cardHeightPercent}%`)}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { val: 0, label: "🎯 Auto-Fit", sub: isEn ? "Fit text" : "พอดีข้อความ" },
            { val: 26, label: "26%", sub: isEn ? "Photo focus" : "เน้นรูปภาพ" },
            { val: 36, label: "36%", sub: isEn ? "Balanced" : "สมดุลพอดี" },
            { val: 46, label: "46%", sub: isEn ? "Large card" : "การ์ดใหญ่" },
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
              <span>{isEn ? "Adjust height" : "ลากปรับความสูง"}</span>
              <span>{isEn ? `${cardHeightPercent}% of height` : `${cardHeightPercent}% ของภาพ`}</span>
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
              {isEn ? "📐 Card Width" : "📐 ความกว้างกรอบข้อมูล (Card Width)"}
            </Label>
            <span className="text-[10px] text-amber-400 font-medium">
              {cardWidthPercent === 0
                ? (isEn ? "🎯 Auto 100%" : "🎯 Auto 100% เต็มขอบ")
                : (isEn ? `Custom ${cardWidthPercent}%` : `กำหนดเอง ${cardWidthPercent}%`)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { val: 0, label: "🎯 Auto 100%", sub: isEn ? "Full width" : "เต็มขอบภาพ" },
              { val: 92, label: "92%", sub: isEn ? "Standard" : "มาตรฐาน" },
              { val: 84, label: "84%", sub: isEn ? "Compact" : "กระชับ" },
              { val: 75, label: "75%", sub: isEn ? "Slim" : "เรียวเล็ก" },
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
                <span>{isEn ? "Fine-tune width" : "ลากปรับความกว้างละเอียด"}</span>
                <span>{isEn ? `${cardWidthPercent}% of width` : `${cardWidthPercent}% ของความกว้าง`}</span>
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
              {isEn ? "✍️ Text Alignment" : "✍️ การจัดวางข้อความ (Text Alignment)"}
            </Label>
            <span className="text-[10px] text-amber-400 font-medium">
              {cardTextAlign === "center"
                ? (isEn ? "↔️ Center" : "↔️ จัดกึ่งกลาง")
                : cardTextAlign === "right"
                ? (isEn ? "➡️ Right" : "➡️ ชิดขวา")
                : (isEn ? "⬅️ Left" : "⬅️ ชิดซ้าย")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "left", label: isEn ? "⬅️ Left" : "⬅️ ชิดซ้าย", sub: "Left Align" },
              { id: "center", label: isEn ? "↔️ Center" : "↔️ จัดกึ่งกลาง", sub: "Center Align" },
              { id: "right", label: isEn ? "➡️ Right" : "➡️ ชิดขวา", sub: "Right Align" },
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
              {isEn ? "Card Opacity" : "ความโปร่งใสพื้นหลังการ์ด (Card Opacity)"}
            </Label>
            <span className="text-[10px] text-amber-400 font-medium font-mono">
              {cardOpacity}%
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[
              { val: 0, label: isEn ? "0% Clear" : "0% ใส", sub: isEn ? "Frameless" : "ไร้กรอบ" },
              { val: 40, label: "40%", sub: isEn ? "Transparent" : "โปร่งใส" },
              { val: 62, label: "62%", sub: isEn ? "Glass" : "กระจกใส" },
              { val: 94, label: "94%", sub: isEn ? "Solid" : "มืดทึบ" },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setCardOpacity(preset.val)}
                className={`py-1.5 px-1 rounded-xl border text-[10px] font-medium transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
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
              <span>{isEn ? "Adjust opacity" : "ลากปรับความโปร่งแสง"}</span>
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
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold text-slate-300">
              {isEn ? "🎨 Custom Card Color & Brightness" : "🎨 ปรับเปลี่ยนสีและความสว่างการ์ด (Card Color)"}
            </Label>
            {customCardBgColor && (
              <button
                type="button"
                onClick={() => setCustomCardBgColor && setCustomCardBgColor("")}
                className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                title={isEn ? "Reset to style default" : "รีเซ็ตเป็นสีดั้งเดิมของสไตล์"}
              >
                {isEn ? "↺ Reset" : "↺ รีเซ็ตค่าเดิม"}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-400 font-medium">
              {isEn ? "Card Color:" : "สีการ์ด:"}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { name: isEn ? "Frosted White" : "⚪ ขาวใสฝ้า", hex: "#FFFFFF" },
                { name: isEn ? "Crystal Ice" : "🧊 คริสตัลใส", hex: "#F0F9FF" },
                { name: isEn ? "Warm Cream" : "🧈 ครีมบัตเตอร์", hex: "#FFFBEB" },
                { name: isEn ? "Deep Slate" : "สเลทน้ำเงิน", hex: "#0F172A" },
                { name: isEn ? "Pure Black" : "ดำสนิท", hex: "#000000" },
                { name: isEn ? "Navy Blue" : "กรมท่า", hex: "#0B1329" },
                { name: isEn ? "Emerald" : "เขียวมรกต", hex: "#064E3B" },
                { name: isEn ? "Wine Red" : "แดงไวน์", hex: "#4C0519" },
                { name: isEn ? "Malt Brown" : "น้ำตาลมอลต์", hex: "#291E1A" },
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setCustomCardBgColor && setCustomCardBgColor(c.hex)}
                  title={c.name}
                  className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                    customCardBgColor === c.hex
                      ? "ring-2 ring-amber-400 scale-110 border-white shadow-sm"
                      : "border-slate-600/80 opacity-80 hover:opacity-100 hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={customCardBgColor || "#0F172A"}
                onChange={(e) => setCustomCardBgColor && setCustomCardBgColor(e.target.value)}
                className="w-6 h-6 rounded-md bg-transparent border border-slate-700 cursor-pointer p-0"
                title={isEn ? "Pick custom color" : "เลือกสี Custom"}
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
                {isEn ? "🌤️ Top Scrim Shadow" : "🌤️ เงาดำขอบบนภาพ (Top Scrim)"}
              </Label>
              <span className="text-[10px] text-amber-400 font-medium font-mono">
                {(topScrimOpacity ?? scrimOpacity) === 0
                  ? (isEn ? "🚫 Transparent" : "🚫 ปิดใส")
                  : `${topScrimOpacity ?? scrimOpacity}%`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: 0, label: isEn ? "🚫 0% Off" : "🚫 0% ใส", sub: isEn ? "Clear" : "ไม่บังภาพ" },
                { val: 30, label: "🌤️ 30%", sub: isEn ? "Subtle" : "บางสบายตา" },
                { val: 60, label: "⛅ 60%", sub: isEn ? "Normal" : "ปกติ" },
                { val: 100, label: "🌙 100%", sub: isEn ? "Dark" : "เข้มชัด" },
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
                {isEn ? "🌙 Bottom Scrim Shadow" : "🌙 เงาดำขอบล่างภาพ (Bottom Scrim)"}
              </Label>
              <span className="text-[10px] text-amber-400 font-medium font-mono">
                {(bottomScrimOpacity ?? scrimOpacity) === 0 ? (isEn ? "🚫 Clear" : "🚫 ปิดใส") : `${bottomScrimOpacity ?? scrimOpacity}%`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[
                { val: 0, label: isEn ? "🚫 0% Clear" : "🚫 0% ใส", sub: isEn ? "No overlay" : "ไม่บังภาพ" },
                { val: 30, label: isEn ? "🌤️ 30%" : "🌤️ 30%", sub: isEn ? "Subtle" : "บางสบายตา" },
                { val: 60, label: isEn ? "⛅ 60%" : "⛅ 60%", sub: isEn ? "Normal" : "ปกติ" },
                { val: 100, label: isEn ? "🌙 100%" : "🌙 100%", sub: isEn ? "Heavy" : "เข้มชัด" },
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
            {isEn ? "Top Header (Branding & Status Badges)" : "Header ด้านบน (Branding & ป้ายสถานะ)"}
          </Label>
        </div>

        {/* 2.1 Left Branding Header */}
        <div className="space-y-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-slate-300 font-medium">
              {isEn ? "🏢 Branding Logo & Company (Left)" : "🏢 Branding โลโก้ & ชื่อบริษัท (ฝั่งซ้าย)"}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium">
                {showBrandingHeader ? (isEn ? "Enabled" : "เปิดแสดง") : (isEn ? "🚫 Off" : "🚫 ปิด")}
              </span>
              <Switch
                checked={showBrandingHeader}
                onCheckedChange={setShowBrandingHeader}
                className="scale-80"
              />
            </div>
          </div>

          {showBrandingHeader && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
              {/* Header Style Selector */}
              {setBrandingHeaderStyle && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-300">
                      {isEn ? "Header Badge Style:" : "สไตล์ Header / โลโก้แบรนด์:"}
                    </span>
                    <span className="text-[9px] text-amber-400 font-mono">
                      {brandingHeaderStyle === "frosted_capsule" ? "Luxury Glass" : "Classic"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBrandingHeaderStyle("frosted_capsule")}
                      className={`p-2 rounded-xl border text-[11px] font-medium transition-all text-left flex flex-col cursor-pointer ${
                        brandingHeaderStyle === "frosted_capsule"
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-xs"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>💊 {isEn ? "Frosted Capsule" : "แคปซูลกระจกเงา"}</span>
                      <span className="text-[9px] opacity-70 font-mono">
                        {isEn ? "Botanica Luxury Glass" : "สไตล์หรูหราตามภาพ"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrandingHeaderStyle("classic_left")}
                      className={`p-2 rounded-xl border text-[11px] font-medium transition-all text-left flex flex-col cursor-pointer ${
                        brandingHeaderStyle === "classic_left"
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-xs"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span>🏷️ {isEn ? "Classic Left" : "ข้อความเรียบชิดซ้าย"}</span>
                      <span className="text-[9px] opacity-70 font-mono">
                        {isEn ? "Standard Header" : "มาตรฐานมุมซ้ายบน"}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Header Placement (if capsule) */}
              {setBrandingHeaderAlign && brandingHeaderStyle === "frosted_capsule" && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    {isEn ? "Capsule Placement:" : "ตำแหน่งแคปซูล:"}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setBrandingHeaderAlign("center")}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                        brandingHeaderAlign === "center"
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                          : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {isEn ? "Center" : "ตรงกลาง"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBrandingHeaderAlign("left")}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                        brandingHeaderAlign === "left"
                          ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                          : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {isEn ? "Left" : "ชิดซ้าย"}
                    </button>
                  </div>
                </div>
              )}

              {/* Master Overall Branding Size scaling */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {isEn ? "Branding Overall Size:" : "ขนาดภาพรวม Branding:"}
                </span>
                <div className="flex gap-1">
                  {[
                    { id: "sm", label: isEn ? "Small" : "เล็ก" },
                    { id: "md", label: isEn ? "Medium" : "ปกติ" },
                    { id: "lg", label: isEn ? "Large" : "ใหญ่" },
                    { id: "xl", label: isEn ? "XL" : "ยักษ์" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setHeaderFontSizeScale(f.id as FontSizeScale);
                        setBrandingTitleFontSizeScale?.(f.id as FontSizeScale);
                        setBrandingSubtitleFontSizeScale?.(f.id as FontSizeScale);
                      }}
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

              {/* Capsule Background Color (สีพื้นหลังแคปซูลแบรนด์) */}
              {brandingHeaderStyle === "frosted_capsule" && setBrandingBgColor && (
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <span>🎨</span>
                      <span>{isEn ? "Capsule Background Color" : "สีพื้นหลังแคปซูลแบรนด์ (Capsule BG Color)"}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={brandingBgColor || "#0F141C"}
                        onChange={(e) => setBrandingBgColor(e.target.value)}
                        className="h-5 w-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                        title={isEn ? "Pick capsule background color" : "เลือกสีพื้นหลังแคปซูล"}
                      />
                      <span className="text-[9px] font-mono text-slate-400">
                        {brandingBgColor ? brandingBgColor : (isEn ? "Default" : "ค่าเริ่มต้น")}
                      </span>
                      {brandingBgColor && (
                        <button
                          type="button"
                          onClick={() => setBrandingBgColor("")}
                          className="text-[9px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                          title={isEn ? "Reset to default" : "รีเซ็ตค่าเริ่มต้น"}
                        >
                          {isEn ? "Reset" : "รีเซ็ต"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preset Swatches */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { name: isEn ? "Obsidian" : "ดำนิล", hex: "#0F141C" },
                      { name: isEn ? "Bronze" : "บรอนซ์", hex: "#2D1F17" },
                      { name: isEn ? "Navy" : "กรมท่า", hex: "#0F1E36" },
                      { name: isEn ? "Emerald" : "เขียวเข้ม", hex: "#0A261D" },
                      { name: isEn ? "Wine" : "ไวน์แดง", hex: "#330C16" },
                      { name: isEn ? "Charcoal" : "เทาชาร์โคล", hex: "#1E293B" },
                      { name: isEn ? "Pure Black" : "ดำสนิท", hex: "#000000" },
                    ].map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => setBrandingBgColor(swatch.hex)}
                        className={`h-6 px-2 rounded-lg border text-[9px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          brandingBgColor === swatch.hex
                            ? "border-amber-400 ring-1 ring-amber-400 text-white font-bold scale-102"
                            : "border-slate-700 text-slate-300 hover:border-slate-500"
                        }`}
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.name}
                      >
                        <span className="w-2 h-2 rounded-full border border-white/40" style={{ backgroundColor: swatch.hex }} />
                        <span className="drop-shadow-xs">{swatch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Line 1: Company / Brand Name */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-300">
                    🏢 {isEn ? "Line 1 (Company / Brand Name)" : "บรรทัดที่ 1 (ชื่อบริษัท / แบรนด์)"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={brandingTitleColor || "#FFFFFF"}
                      onChange={(e) => setBrandingTitleColor?.(e.target.value)}
                      className="h-5 w-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                      title={isEn ? "Choose company title color" : "เลือกสีชื่อบริษัท"}
                    />
                    <span className="text-[9px] font-mono text-slate-400">
                      {brandingTitleColor || "#FFFFFF"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customCompanyName ?? ""}
                    onChange={(e) => setCustomCompanyName?.(e.target.value)}
                    placeholder={companyNameDefault || "VCC ASSET"}
                    className="flex-1 px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                  <div className="flex items-center gap-1">
                    {[
                      { c: "#FFFFFF", l: "⚪" },
                      { c: "#F59E0B", l: "🟡" },
                      { c: "#38BDF8", l: "🔵" },
                      { c: "#0F172A", l: "⚫" },
                    ].map((btn) => (
                      <button
                        key={btn.c}
                        type="button"
                        onClick={() => setBrandingTitleColor?.(btn.c)}
                        className={`h-5 w-5 rounded border flex items-center justify-center text-[10px] cursor-pointer ${
                          brandingTitleColor === btn.c ? "border-amber-400 scale-110" : "border-slate-700"
                        }`}
                        title={btn.c}
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line 1 Individual Font Size */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-[9px] text-slate-400 font-medium">
                    {isEn ? "Line 1 Font Size:" : "ขนาดอักษรบรรทัดที่ 1:"}
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: "sm", label: isEn ? "Small" : "เล็ก" },
                      { id: "md", label: isEn ? "Medium" : "ปกติ" },
                      { id: "lg", label: isEn ? "Large" : "ใหญ่" },
                      { id: "xl", label: isEn ? "XL" : "ยักษ์" },
                    ].map((f) => {
                      const active = (brandingTitleFontSizeScale || headerFontSizeScale) === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setBrandingTitleFontSizeScale?.(f.id as FontSizeScale)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                            active
                              ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                              : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Line 2: Subtitle / Tagline */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-300">
                    ✨ {isEn ? "Line 2 (Tagline / Subtitle)" : "บรรทัดที่ 2 (สโลแกน / สับไตเติ้ล)"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={brandingSubtitleColor || "#F59E0B"}
                      onChange={(e) => setBrandingSubtitleColor?.(e.target.value)}
                      className="h-5 w-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                      title={isEn ? "Choose subtitle color" : "เลือกสีสโลแกน"}
                    />
                    <span className="text-[9px] font-mono text-slate-400">
                      {brandingSubtitleColor || (isEn ? "Theme" : "สีธีม")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customCompanySubtitle ?? ""}
                    onChange={(e) => setCustomCompanySubtitle?.(e.target.value)}
                    placeholder="PREMIUM REAL ESTATE"
                    className="flex-1 px-2 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-400"
                  />
                  <div className="flex items-center gap-1">
                    {[
                      { c: "#F59E0B", l: "🟡" },
                      { c: "#FFFFFF", l: "⚪" },
                      { c: "#F97316", l: "🟠" },
                      { c: "#10B981", l: "🟢" },
                    ].map((btn) => (
                      <button
                        key={btn.c}
                        type="button"
                        onClick={() => setBrandingSubtitleColor?.(btn.c)}
                        className={`h-5 w-5 rounded border flex items-center justify-center text-[10px] cursor-pointer ${
                          brandingSubtitleColor === btn.c ? "border-amber-400 scale-110" : "border-slate-700"
                        }`}
                        title={btn.c}
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line 2 Individual Font Size */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-[9px] text-slate-400 font-medium">
                    {isEn ? "Line 2 Font Size:" : "ขนาดอักษรบรรทัดที่ 2:"}
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: "sm", label: isEn ? "Small" : "เล็ก" },
                      { id: "md", label: isEn ? "Medium" : "ปกติ" },
                      { id: "lg", label: isEn ? "Large" : "ใหญ่" },
                      { id: "xl", label: isEn ? "XL" : "ยักษ์" },
                    ].map((f) => {
                      const active = (brandingSubtitleFontSizeScale || headerFontSizeScale) === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setBrandingSubtitleFontSizeScale?.(f.id as FontSizeScale)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                            active
                              ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                              : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reset Branding Colors & Sizes */}
              {(brandingTitleColor ||
                brandingSubtitleColor ||
                customCompanyName ||
                customCompanySubtitle ||
                (brandingTitleFontSizeScale && brandingTitleFontSizeScale !== "md") ||
                (brandingSubtitleFontSizeScale && brandingSubtitleFontSizeScale !== "md")) && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBrandingTitleColor?.("");
                      setBrandingSubtitleColor?.("");
                      setCustomCompanyName?.("");
                      setCustomCompanySubtitle?.("");
                      setBrandingTitleFontSizeScale?.("md");
                      setBrandingSubtitleFontSizeScale?.("md");
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                  >
                    {isEn ? "↺ Reset Branding Text & Styles" : "↺ รีเซ็ตข้อความและสไตล์ Branding"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2.2 Right Top Badge (FOR SALE / FOR RENT / FOR RENT/SALE) */}
        <div className="space-y-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-slate-300 font-medium">
              {isEn ? "🏷️ Listing Type Badge (Right)" : "🏷️ ป้ายประเภทประกาศ (FOR SALE / RENT ฝั่งขวา)"}
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-medium">
                {showTopListingBadge ? (isEn ? "Enabled" : "เปิดแสดง") : (isEn ? "🚫 Off" : "🚫 ปิด")}
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
                <span className="text-[10px] text-slate-400 font-medium">
                  {isEn ? "Badge Size & Font:" : "ขนาดป้าย & ฟอนต์:"}
                </span>
                <div className="flex gap-1">
                  {[
                    { id: "sm", label: isEn ? "Small" : "เล็ก" },
                    { id: "md", label: isEn ? "Medium" : "ปกติ" },
                    { id: "lg", label: isEn ? "Large" : "ใหญ่" },
                    { id: "xl", label: isEn ? "XL" : "ยักษ์" },
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
                  <span className="text-slate-400 font-medium">
                    {isEn ? "Badge BG:" : "สีพื้นหลังป้าย:"}
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                      { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
                      { name: isEn ? "Red" : "แดง", hex: "#EF4444" },
                      { name: isEn ? "Blue" : "น้ำเงิน", hex: "#2563EB" },
                      { name: isEn ? "Emerald" : "เขียว", hex: "#10B981" },
                      { name: isEn ? "Black" : "ดำ", hex: "#000000" },
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
                      title={isEn ? "Choose custom BG color" : "เลือกสี Custom BG"}
                    />
                  </div>
                </div>

                {/* Badge Text Color */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">
                    {isEn ? "Badge Text:" : "สีข้อความป้าย:"}
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { name: isEn ? "Black" : "ดำ", hex: "#000000" },
                      { name: isEn ? "White" : "ขาว", hex: "#FFFFFF" },
                      { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                      { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
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
                      title={isEn ? "Choose custom Text color" : "เลือกสี Custom Text"}
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
                { val: 0, label: isEn ? "Normal (0px)" : "ปกติ (0px)" },
                { val: 40, label: isEn ? "🛡️ Story Safe (+40)" : "🛡️ หลบสตอรี่ (+40)" },
                { val: 90, label: isEn ? "⬇️ Extra Low (+90)" : "⬇️ ต่ำพิเศษ (+90)" },
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
                <span>{isEn ? "Fine-tune Header Offset" : "เลื่อน Header ขึ้น-ลง ละเอียด"}</span>
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
              ? (isEn ? "Dual Zone Card Positioning" : "ปรับตำแหน่งการ์ดทั้ง 2 โซนอิสระ")
              : (isEn ? "Card Position & Platform Deadzone" : "ตำแหน่งกรอบข้อมูล (หนี Deadzone แพลตฟอร์ม)")}
          </Label>
          <span className="text-[10px] text-amber-400 font-medium">
            {isSplitMode
              ? (isEn ? "✨ Split 2 Cards" : "✨ แยก 2 การ์ดอิสระ")
              : cardYOffset === 0
                ? (isEn ? "📌 Default Bottom" : "📌 ล่างสุดปกติ")
                : (isEn ? `Lifted ${Math.abs(cardYOffset)}px` : `ยกขึ้น ${Math.abs(cardYOffset)}px`)}
          </span>
        </div>

        {isSplitMode ? (
          <div className="space-y-3 pt-1">
            <div className="space-y-1 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-300 font-medium">
                <span>{isEn ? "🔝 Top/Mid Zone Card (Zone A)" : "🔝 การ์ดโซนบน/กลาง (Zone A)"}</span>
                <span className="text-amber-400">
                  {card1YOffset !== 0
                    ? `${card1YOffset > 0 ? `+${card1YOffset}` : card1YOffset}px`
                    : (isEn ? "Normal (0px)" : "ปกติ (0px)")}
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
                <span>{isEn ? "🔻 Bottom Zone Card (Zone B)" : "🔻 การ์ดโซนล่าง (Zone B)"}</span>
                <span className="text-amber-400">
                  {card2YOffset !== 0
                    ? `${card2YOffset > 0 ? `+${card2YOffset}` : card2YOffset}px`
                    : (isEn ? "Normal (0px)" : "ปกติ (0px)")}
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
                { val: 0, label: isEn ? "📌 Bottom (0)" : "📌 ล่างสุด (0)" },
                { val: -240, label: isEn ? "📸 IG Safe (-240)" : "📸 หลบ IG (-240)" },
                { val: -380, label: isEn ? "🛡️ TikTok Safe (-380)" : "🛡️ หลบ TikTok (-380)" },
                { val: -580, label: isEn ? "🎯 Center (-580)" : "🎯 กึ่งกลาง (-580)" },
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
                <span>{isEn ? "Fine-tune Card Offset" : "เลื่อนกรอบ ขึ้น-ลง ละเอียด"}</span>
                <span>
                  {cardYOffset < 0
                    ? (isEn ? `Lifted ${Math.abs(cardYOffset)}px (Safe zone)` : `ยกขึ้น ${Math.abs(cardYOffset)}px (หลบแถบล่าง)`)
                    : cardYOffset > 0
                      ? `+${cardYOffset}px`
                      : (isEn ? "0px (Bottom)" : "0px (ล่างสุด)")}
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
            {isEn ? "🛡️ Avoid TikTok Right Action Buttons" : "🛡️ หลบปุ่ม Like / Share ฝั่งขวา (TikTok)"}
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

