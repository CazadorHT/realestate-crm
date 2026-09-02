"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tag, Layers } from "lucide-react";
import type { ElementZoneMapping, ContentPosition, FontSizeScale, SpecFontSizeScale, StudioPriceFormatStyle } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

interface StudioFieldRouterProps {
  contentPosition: ContentPosition;
  zoneMapping: ElementZoneMapping;
  setZoneMapping: React.Dispatch<React.SetStateAction<ElementZoneMapping>>;
  showLocation: boolean;
  setShowLocation: (s: boolean) => void;
  showProjectName: boolean;
  setShowProjectName: (s: boolean) => void;
  showListingType: boolean;
  setShowListingType: (s: boolean) => void;
  showTitle: boolean;
  setShowTitle: (s: boolean) => void;
  showSpecs: boolean;
  setShowSpecs: (s: boolean) => void;
  specFontSizeScale?: SpecFontSizeScale;
  setSpecFontSizeScale?: (f: SpecFontSizeScale) => void;
  showPrice: boolean;
  setShowPrice: (s: boolean) => void;
  priceFormatStyle?: StudioPriceFormatStyle;
  setPriceFormatStyle?: (s: StudioPriceFormatStyle) => void;
  showOriginalPrice: boolean;
  setShowOriginalPrice: (s: boolean) => void;
  showHeadline: boolean;
  setShowHeadline: (s: boolean) => void;
  showContact: boolean;
  setShowContact: (s: boolean) => void;
  showQrCode: boolean;
  setShowQrCode: (s: boolean) => void;
  hasOriginalPrice: boolean;
  showCardContent?: boolean;
  setShowCardContent?: (s: boolean) => void;
}

export function StudioFieldRouter({
  contentPosition,
  zoneMapping,
  setZoneMapping,
  showLocation,
  setShowLocation,
  showProjectName,
  setShowProjectName,
  showListingType,
  setShowListingType,
  showTitle,
  setShowTitle,
  showSpecs,
  setShowSpecs,
  specFontSizeScale = "md",
  setSpecFontSizeScale,
  showPrice,
  setShowPrice,
  priceFormatStyle = "default",
  setPriceFormatStyle,
  showOriginalPrice,
  setShowOriginalPrice,
  showHeadline,
  setShowHeadline,
  showContact,
  setShowContact,
  showQrCode,
  setShowQrCode,
  hasOriginalPrice,
  showCardContent = true,
  setShowCardContent,
}: StudioFieldRouterProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const isSplitMode = contentPosition === "split_hero";

  const handleToggleAll = () => {
    const allOn =
      showLocation &&
      showProjectName &&
      showListingType &&
      showTitle &&
      showSpecs &&
      showPrice &&
      showHeadline;

    setShowLocation(!allOn);
    setShowProjectName(!allOn);
    setShowListingType(!allOn);
    setShowTitle(!allOn);
    setShowSpecs(!allOn);
    setShowPrice(!allOn);
    setShowHeadline(!allOn);
  };

  return (
    <div className="space-y-2.5">
      {/* Master Toggle: Show Card Content */}
      <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {isEn ? "Show Card Content" : "แสดงกรอบข้อมูลทรัพย์ (Card Content)"}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  showCardContent
                    ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {showCardContent ? (isEn ? "ON" : "เปิดแสดง") : (isEn ? "OFF" : "🚫 ซ่อน")}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {isEn ? "Hide info card for 100% clean photo" : "ปิดเพื่อซ่อนกรอบข้อมูลและแสดงภาพเต็มผืน"}
            </p>
          </div>
        </div>
        {setShowCardContent && (
          <Switch checked={showCardContent} onCheckedChange={setShowCardContent} />
        )}
      </div>

      <div className={`p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2.5 transition-opacity ${!showCardContent ? "opacity-50" : ""}`}>
        <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-amber-400" />
          {isSplitMode
            ? (isEn ? "Zone Router (Split Card Placement)" : "เลือกเปิด/ปิด & ย้ายโซนข้อมูลอิสระ (Zone Router)")
            : (isEn ? "Field Toggles (Visible Elements)" : "เปิด/ปิด ข้อมูลที่จะแสดงบนภาพ (Field Toggles)")}
        </Label>
        <button
          type="button"
          onClick={handleToggleAll}
          className="text-[10px] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          {isEn ? "Toggle All" : "เปิด/ปิด ทั้งหมด"}
        </button>
      </div>

      {isSplitMode ? (
        <div className="space-y-1.5">
          {[
            { id: "projectName" as keyof ElementZoneMapping, label: isEn ? "🏢 Project Name" : "🏢 ชื่อโครงการ", active: showProjectName, toggle: () => setShowProjectName(!showProjectName) },
            { id: "title" as keyof ElementZoneMapping, label: isEn ? "🏠 Listing Title" : "🏠 หัวข้อประกาศ", active: showTitle, toggle: () => setShowTitle(!showTitle) },
            { id: "headline" as keyof ElementZoneMapping, label: isEn ? "✨ AI Headline" : "✨ พาดหัว AI", active: showHeadline, toggle: () => setShowHeadline(!showHeadline) },
            { id: "price" as keyof ElementZoneMapping, label: isEn ? "💰 Price" : "💰 ราคา", active: showPrice, toggle: () => setShowPrice(!showPrice) },
            { id: "location" as keyof ElementZoneMapping, label: isEn ? "📍 Location / Transit" : "📍 ทำเล / รถไฟฟ้า", active: showLocation, toggle: () => setShowLocation(!showLocation) },
            { id: "specs" as keyof ElementZoneMapping, label: isEn ? "🛏️ Specs (Bed/Bath/Sqm)" : "🛏️ สเปกห้อง (นอน/น้ำ/ตร.ม.)", active: showSpecs, toggle: () => setShowSpecs(!showSpecs) },
            { id: "contact" as keyof ElementZoneMapping, label: isEn ? "👤 Contact & QR" : "👤 ข้อมูลติดต่อ & QR", active: showContact || showQrCode, toggle: () => { setShowContact(!showContact); setShowQrCode(!showQrCode); } },
          ].map((item) => {
            const currentZone = zoneMapping[item.id] || "zone_b";
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  item.active
                    ? "bg-slate-900/70 border-slate-700/80"
                    : "bg-slate-900/30 border-slate-800/50 opacity-60"
                }`}
              >
                <button
                  type="button"
                  onClick={item.toggle}
                  className="flex items-center gap-2 text-xs font-medium text-left cursor-pointer"
                >
                  <span
                    className={`h-4 w-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      item.active ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.active ? "✓" : ""}
                  </span>
                  <span className={item.active ? "text-white font-bold" : "text-slate-400"}>
                    {item.label}
                  </span>
                </button>

                {item.active && (
                  <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setZoneMapping((prev) => ({ ...prev, [item.id]: "zone_a" }))}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        currentZone === "zone_a"
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {isEn ? "🔝 Top Card" : "🔝 การ์ดบน"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoneMapping((prev) => ({ ...prev, [item.id]: "zone_b" }))}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        currentZone === "zone_b"
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {isEn ? "🔻 Bottom Card" : "🔻 การ์ดล่าง"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "projectName", label: isEn ? "🏢 Project Name" : "🏢 ชื่อโครงการ", active: showProjectName, toggle: () => setShowProjectName(!showProjectName) },
            { id: "title", label: isEn ? "🏠 Listing Title" : "🏠 หัวข้อประกาศ", active: showTitle, toggle: () => setShowTitle(!showTitle) },
            { id: "listingType", label: isEn ? "🏷️ Listing Type" : "🏷️ ประเภทประกาศ", active: showListingType, toggle: () => setShowListingType(!showListingType) },
            { id: "location", label: isEn ? "📍 Location / Transit" : "📍 ทำเล / รถไฟฟ้า", active: showLocation, toggle: () => setShowLocation(!showLocation) },
            { id: "price", label: isEn ? "💰 Price" : "💰 ราคา", active: showPrice, toggle: () => setShowPrice(!showPrice) },
            { id: "originalPrice", label: isEn ? "❌ Original Price (Strikethrough)" : "❌ ราคาเดิมขีดฆ่า", active: showOriginalPrice, toggle: () => setShowOriginalPrice(!showOriginalPrice), disabled: !hasOriginalPrice },
            { id: "specs", label: isEn ? "🛏️ Specs (Bed/Bath/Sqm)" : "🛏️ สเปกห้อง (นอน/น้ำ/ตร.ม.)", active: showSpecs, toggle: () => setShowSpecs(!showSpecs) },
            { id: "headline", label: isEn ? "✨ AI Headline" : "✨ พาดหัว AI", active: showHeadline, toggle: () => setShowHeadline(!showHeadline) },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={item.toggle}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                item.disabled
                  ? "opacity-35 cursor-not-allowed border-slate-800 text-slate-500 bg-slate-900/40"
                  : item.active
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-xs"
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {item.active ? "✓ " : "✕ "}
              {item.label}
            </button>
          ))}
        </div>
      )}

      {showSpecs && setSpecFontSizeScale && (
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
            {isEn ? "📏 Specs Font Size:" : "📏 ขนาดฟอนต์สเปก (นอน/น้ำ/ตร.ม.):"}
          </span>
          <div className="flex flex-wrap gap-1">
            {[
              { id: "xs", label: isEn ? "XS" : "จิ๋ว" },
              { id: "sm", label: isEn ? "Small" : "เล็ก" },
              { id: "md", label: isEn ? "Normal" : "ปกติ" },
              { id: "lg", label: isEn ? "Large" : "ใหญ่" },
              { id: "xl", label: isEn ? "XL ⭐" : "ยักษ์ ⭐" },
              { id: "2xl", label: isEn ? "2XL" : "มหายักษ์" },
              { id: "3xl", label: isEn ? "3XL" : "ยักษ์ใหญ่" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSpecFontSizeScale(f.id as any)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                  specFontSizeScale === f.id
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

      {/* Price Format Style Selector */}
      {showPrice && setPriceFormatStyle && (
        <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
          <Label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span>{isEn ? "🏷️ Price Format Styles" : "🏷️ รูปแบบการแสดงราคา (Price Format Styles)"}</span>
            <span className="text-[10px] text-amber-400 font-mono">
              {isEn ? "Global & Local" : "สากล & ท้องถิ่น"}
            </span>
          </Label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: "default", label: "฿ 38,000,000", sub: isEn ? "Standard ฿" : "มาตรฐาน ฿" },
              { id: "symbol_short", label: "฿ 38M", sub: isEn ? "Short Symbol" : "ย่อสัญลักษณ์" },
              { id: "code_short_prefix", label: "THB 38M", sub: isEn ? "Global Prefix" : "สากล Prefix" },
              { id: "code_short_suffix", label: "38M THB", sub: isEn ? "Global Suffix" : "สากล Suffix" },
              { id: "code_full_suffix", label: "38,000,000 THB", sub: isEn ? "Full THB" : "เต็ม THB" },
              { id: "thai_lakh", label: "38 ล้านบาท", sub: isEn ? "Thai Lakh" : "ล้าน/หมื่น" },
              { id: "usd_approx", label: "$ 1.08M USD", sub: isEn ? "Approx USD" : "ประมาณ USD" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPriceFormatStyle(item.id as StudioPriceFormatStyle)}
                className={`py-1.5 px-2 rounded-xl border text-[11px] font-medium transition-all text-left flex flex-col justify-center cursor-pointer ${
                  priceFormatStyle === item.id
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-xs scale-102"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="truncate">{item.label}</span>
                <span className="text-[9px] opacity-70 font-mono">{item.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
