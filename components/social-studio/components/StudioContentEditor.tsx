"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tag,
  Sparkles,
  RefreshCw,
  QrCode,
  Phone,
  UserCheck,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import type { StudioLanguage, PromoPosition, TextEffectTemplate, TextEffectPosition, FontSizeScale, CalloutPointer, CustomTextItem, SocialStudioProperty, TextEffectLineConfig } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";
import { AVAILABLE_BADGES } from "../helpers";
import { StudioTextEffectControls } from "./StudioTextEffectControls";
import { StudioCalloutControls } from "./StudioCalloutControls";
import { StudioCustomTextControls } from "./StudioCustomTextControls";

interface StudioContentEditorProps {
  property?: SocialStudioProperty;
  language: StudioLanguage;
  selectedBadges: string[];
  onToggleBadge: (label: string) => void;
  customProjectName: string;
  setCustomProjectName: (v: string) => void;
  customTitle: string;
  setCustomTitle: (v: string) => void;
  customTransitText: string;
  setCustomTransitText: (v: string) => void;
  defaultTransitPlaceholder: string;
  headline: string;
  setHeadline: (v: string) => void;
  isGeneratingAI: boolean;
  onFetchAIContent: () => void;
  showQrCode: boolean;
  setShowQrCode: (s: boolean) => void;
  showContact: boolean;
  setShowContact: (s: boolean) => void;
  showAgentAvatar: boolean;
  setShowAgentAvatar: (s: boolean) => void;
  caption: string;
  setCaption: (v: string) => void;
  hashtags: string[];
  copiedCaption: boolean;
  onCopyCaption: () => void;
  // Feature 2: Promo Overlay
  promoText: string;
  setPromoText: (v: string) => void;
  promoPosition: PromoPosition;
  setPromoPosition: (p: PromoPosition) => void;
  promoColor: string;
  setPromoColor: (c: string) => void;
  promoTextColor?: string;
  setPromoTextColor?: (c: string) => void;
  customTitleColor?: string;
  setCustomTitleColor?: (c: string) => void;
  customPriceColor?: string;
  setCustomPriceColor?: (c: string) => void;
  customHeadlineColor?: string;
  setCustomHeadlineColor?: (c: string) => void;
  customProjectNameColor?: string;
  setCustomProjectNameColor?: (c: string) => void;
  customLocationColor?: string;
  setCustomLocationColor?: (c: string) => void;
  customSpecsColor?: string;
  setCustomSpecsColor?: (c: string) => void;
  // Text Effect
  textEffectTemplate?: TextEffectTemplate;
  setTextEffectTemplate?: (t: TextEffectTemplate) => void;
  textEffectText?: string;
  setTextEffectText?: (t: string) => void;
  textEffectPosition?: TextEffectPosition;
  setTextEffectPosition?: (p: TextEffectPosition) => void;
  textEffectSize?: FontSizeScale | "2xl";
  setTextEffectSize?: (s: FontSizeScale | "2xl") => void;
  textEffectXOffset?: number;
  setTextEffectXOffset?: (x: number) => void;
  textEffectYOffset?: number;
  setTextEffectYOffset?: (y: number) => void;
  textEffectRotation?: number;
  setTextEffectRotation?: (r: number) => void;
  textEffectCurve?: number;
  setTextEffectCurve?: (c: number) => void;
  textEffectCustomTextColor?: string;
  setTextEffectCustomTextColor?: (c: string) => void;
  textEffectCustomBgColor?: string;
  setTextEffectCustomBgColor?: (c: string) => void;
  textEffectCustomBorderColor?: string;
  setTextEffectCustomBorderColor?: (c: string) => void;
  textEffectCustomShadowColor?: string;
  setTextEffectCustomShadowColor?: (c: string) => void;
  textEffectCustomBgAlpha?: number;
  setTextEffectCustomBgAlpha?: (a: number) => void;
  textEffectCustomBorderWidth?: number;
  setTextEffectCustomBorderWidth?: (w: number) => void;
  // Line 2 (Sub-line) Independent Typography & Styling
  textEffectLine2Template?: TextEffectTemplate | "same";
  setTextEffectLine2Template?: (t: TextEffectTemplate | "same") => void;
  textEffectLine2SizeScale?: number;
  setTextEffectLine2SizeScale?: (s: number) => void;
  textEffectLine2CustomTextColor?: string;
  setTextEffectLine2CustomTextColor?: (c: string) => void;
  textEffectLine2CustomBgColor?: string;
  setTextEffectLine2CustomBgColor?: (c: string) => void;
  textEffectLine2CustomBorderColor?: string;
  setTextEffectLine2CustomBorderColor?: (c: string) => void;
  textEffectLineSpacing?: number;
  setTextEffectLineSpacing?: (g: number) => void;
  textEffectLineConfigs?: TextEffectLineConfig[];
  setTextEffectLineConfigs?: (c: TextEffectLineConfig[]) => void;
  onAddTextEffectLine?: (text?: string, template?: TextEffectTemplate) => void;
  onUpdateTextEffectLine?: (id: string, updates: Partial<TextEffectLineConfig>) => void;
  onRemoveTextEffectLine?: (id: string) => void;
  calloutPointers?: CalloutPointer[];
  onAddCallout?: (pointer: CalloutPointer) => void;
  onUpdateCallout?: (id: string, updates: Partial<CalloutPointer>) => void;
  onRemoveCallout?: (id: string) => void;
  customTexts?: CustomTextItem[];
  onAddCustomText?: (item: CustomTextItem) => void;
  onUpdateCustomText?: (id: string, updates: Partial<CustomTextItem>) => void;
  onRemoveCustomText?: (id: string) => void;
  priceText?: string;
  showCardContent?: boolean;
}

export function StudioContentEditor({
  language: _studioLang,
  selectedBadges,
  onToggleBadge,
  customProjectName,
  setCustomProjectName,
  customTitle,
  setCustomTitle,
  customTransitText,
  setCustomTransitText,
  defaultTransitPlaceholder,
  headline,
  setHeadline,
  isGeneratingAI,
  onFetchAIContent,
  showQrCode,
  setShowQrCode,
  showContact,
  setShowContact,
  showAgentAvatar,
  setShowAgentAvatar,
  caption,
  setCaption,
  hashtags,
  copiedCaption,
  onCopyCaption,
  promoText,
  setPromoText,
  promoPosition,
  setPromoPosition,
  promoColor,
  setPromoColor,
  promoTextColor,
  setPromoTextColor,
  customTitleColor,
  setCustomTitleColor,
  customPriceColor,
  setCustomPriceColor,
  customHeadlineColor,
  setCustomHeadlineColor,
  customProjectNameColor,
  setCustomProjectNameColor,
  customLocationColor,
  setCustomLocationColor,
  customSpecsColor,
  setCustomSpecsColor,
  textEffectTemplate = "none",
  setTextEffectTemplate,
  textEffectText = "",
  setTextEffectText,
  textEffectPosition = "center",
  setTextEffectPosition,
  textEffectSize = "lg",
  setTextEffectSize,
  textEffectXOffset = 0,
  setTextEffectXOffset,
  textEffectYOffset = 0,
  setTextEffectYOffset,
  textEffectRotation = 0,
  setTextEffectRotation,
  textEffectCurve = 0,
  setTextEffectCurve,
  textEffectCustomTextColor = "#FFFFFF",
  setTextEffectCustomTextColor,
  textEffectCustomBgColor = "#0F172A",
  setTextEffectCustomBgColor,
  textEffectCustomBorderColor = "#F59E0B",
  setTextEffectCustomBorderColor,
  textEffectCustomShadowColor = "rgba(0,0,0,0.5)",
  setTextEffectCustomShadowColor,
  textEffectCustomBgAlpha = 85,
  setTextEffectCustomBgAlpha,
  textEffectCustomBorderWidth = 2,
  setTextEffectCustomBorderWidth,
  textEffectLine2Template = "same",
  setTextEffectLine2Template,
  textEffectLine2SizeScale = 0.85,
  setTextEffectLine2SizeScale,
  textEffectLine2CustomTextColor,
  setTextEffectLine2CustomTextColor,
  textEffectLine2CustomBgColor,
  setTextEffectLine2CustomBgColor,
  textEffectLine2CustomBorderColor,
  setTextEffectLine2CustomBorderColor,
  textEffectLineSpacing = 12,
  setTextEffectLineSpacing,
  textEffectLineConfigs,
  setTextEffectLineConfigs,
  onAddTextEffectLine,
  onUpdateTextEffectLine,
  onRemoveTextEffectLine,
  calloutPointers = [],
  onAddCallout,
  onUpdateCallout,
  onRemoveCallout,
  customTexts = [],
  onAddCustomText,
  onUpdateCustomText,
  onRemoveCustomText,
  priceText,
  showCardContent = true,
  property,
}: StudioContentEditorProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  // Compute smart real estate hook texts from property data
  const propertyProjectName =
    customProjectName?.trim() ||
    property?.project_name?.trim() ||
    (typeof property?.project?.name === "string" ? property.project.name.trim() : "") ||
    property?.title?.trim() ||
    "";

  const specParts: string[] = [];
  if (property?.bedrooms) specParts.push(`${property.bedrooms} นอน`);
  if (property?.bathrooms) specParts.push(`${property.bathrooms} น้ำ`);
  if (property?.size_sqm) specParts.push(`${property.size_sqm} ตร.ม.`);
  const propertySpecsText = specParts.join(" ");

  const formatSalePrice = (p: number) => {
    if (p >= 1_000_000) {
      const inMillion = p / 1_000_000;
      const rounded = Number(inMillion.toFixed(2));
      return `${rounded} ล้านบาท`;
    }
    return `${p.toLocaleString("th-TH")} บาท`;
  };

  const formatRentPrice = (r: number) => `${r.toLocaleString("th-TH")} บาท/ด.`;

  let propertyPriceTag = "";
  if (property?.listing_type === "SALE_AND_RENT" && property?.price && property?.rental_price) {
    propertyPriceTag = `${formatSalePrice(property.price)} | ${formatRentPrice(property.rental_price)}`;
  } else if (property?.listing_type === "RENT" && property?.rental_price) {
    propertyPriceTag = formatRentPrice(property.rental_price);
  } else if (property?.price) {
    propertyPriceTag = formatSalePrice(property.price);
  } else if (property?.rental_price) {
    propertyPriceTag = formatRentPrice(property.rental_price);
  } else if (priceText) {
    propertyPriceTag = priceText;
  }

  return (
    <div className="space-y-4">
      {/* 0. Viral Text Effects (TikTok / Reels / Lemon8 Cover Typography) */}
      {setTextEffectTemplate && setTextEffectText && setTextEffectPosition && setTextEffectSize && setTextEffectYOffset && setTextEffectRotation && (
        <StudioTextEffectControls
          textEffectTemplate={textEffectTemplate}
          setTextEffectTemplate={setTextEffectTemplate}
          textEffectText={textEffectText}
          setTextEffectText={setTextEffectText}
          textEffectPosition={textEffectPosition}
          setTextEffectPosition={setTextEffectPosition}
          textEffectSize={textEffectSize}
          setTextEffectSize={setTextEffectSize}
          textEffectXOffset={textEffectXOffset}
          setTextEffectXOffset={setTextEffectXOffset}
          textEffectYOffset={textEffectYOffset}
          setTextEffectYOffset={setTextEffectYOffset}
          textEffectRotation={textEffectRotation}
          setTextEffectRotation={setTextEffectRotation}
          textEffectCurve={textEffectCurve}
          setTextEffectCurve={setTextEffectCurve}
          textEffectCustomTextColor={textEffectCustomTextColor}
          setTextEffectCustomTextColor={setTextEffectCustomTextColor}
          textEffectCustomBgColor={textEffectCustomBgColor}
          setTextEffectCustomBgColor={setTextEffectCustomBgColor}
          textEffectCustomBorderColor={textEffectCustomBorderColor}
          setTextEffectCustomBorderColor={setTextEffectCustomBorderColor}
          textEffectCustomShadowColor={textEffectCustomShadowColor}
          setTextEffectCustomShadowColor={setTextEffectCustomShadowColor}
          textEffectCustomBgAlpha={textEffectCustomBgAlpha}
          setTextEffectCustomBgAlpha={setTextEffectCustomBgAlpha}
          textEffectCustomBorderWidth={textEffectCustomBorderWidth}
          setTextEffectCustomBorderWidth={setTextEffectCustomBorderWidth}
          textEffectLine2Template={textEffectLine2Template}
          setTextEffectLine2Template={setTextEffectLine2Template}
          textEffectLine2SizeScale={textEffectLine2SizeScale}
          setTextEffectLine2SizeScale={setTextEffectLine2SizeScale}
          textEffectLine2CustomTextColor={textEffectLine2CustomTextColor}
          setTextEffectLine2CustomTextColor={setTextEffectLine2CustomTextColor}
          textEffectLine2CustomBgColor={textEffectLine2CustomBgColor}
          setTextEffectLine2CustomBgColor={setTextEffectLine2CustomBgColor}
          textEffectLine2CustomBorderColor={textEffectLine2CustomBorderColor}
          setTextEffectLine2CustomBorderColor={setTextEffectLine2CustomBorderColor}
          textEffectLineSpacing={textEffectLineSpacing}
          setTextEffectLineSpacing={setTextEffectLineSpacing}
          textEffectLineConfigs={textEffectLineConfigs}
          setTextEffectLineConfigs={setTextEffectLineConfigs}
          onAddTextEffectLine={onAddTextEffectLine}
          onUpdateTextEffectLine={onUpdateTextEffectLine}
          onRemoveTextEffectLine={onRemoveTextEffectLine}
          propertyProjectName={propertyProjectName}
          propertySpecsText={propertySpecsText}
          propertyPriceTag={propertyPriceTag}
          headline={headline}
          title={customTitle}
          priceText={priceText}
          showCardContent={showCardContent}
        />
      )}

      {/* 0.5. Callout Feature Pointers (Lemon8 Style Pointers & Arrows) */}
      {onAddCallout && onUpdateCallout && onRemoveCallout && (
        <StudioCalloutControls
          calloutPointers={calloutPointers}
          onAddCallout={onAddCallout}
          onUpdateCallout={onUpdateCallout}
          onRemoveCallout={onRemoveCallout}
          isEn={isEn}
        />
      )}

      {/* 0.6. Additional Custom Text Badges & Stickers */}
      {onAddCustomText && onUpdateCustomText && onRemoveCustomText && (
        <StudioCustomTextControls
          language={_studioLang || (language === "cn" ? "zh" : language as StudioLanguage)}
          customTexts={customTexts}
          onAddCustomText={onAddCustomText}
          onUpdateCustomText={onUpdateCustomText}
          onRemoveCustomText={onRemoveCustomText}
        />
      )}

      {/* 1. Sticker Badges Selection */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-amber-400" />
          {isEn ? "Image Sticker Badges (Max 2)" : "สติกเกอร์ไฮไลท์บนภาพ (เลือกได้สูงสุด 2)"}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_BADGES.map((b) => {
            const badgeLabel = isEn ? (b.labelEn || b.label) : b.label;
            const isSelected = selectedBadges.includes(b.label) || selectedBadges.includes(badgeLabel);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onToggleBadge(b.label)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/30 border-amber-400 text-amber-200 font-bold shadow-xs"
                    : "bg-slate-800/70 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
              >
                {badgeLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Text & AI Content Customizer */}
      <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            {isEn ? "Customize Text & AI Headline" : "ปรับแต่งข้อความ & พาดหัว AI (Content Editor)"}
          </Label>
          <button
            type="button"
            disabled={isGeneratingAI}
            onClick={onFetchAIContent}
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${isGeneratingAI ? "animate-spin" : ""}`} />
            {isEn ? `Regenerate AI (${language.toUpperCase()})` : `ให้ AI คิดใหม่ (${language.toUpperCase()})`}
          </button>
        </div>

        {/* Editable Project Name */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>{isEn ? "🏢 Project Name" : "🏢 ชื่อโครงการ (Project Name)"}</span>
            <span className="text-[10px] text-amber-400/80">{isEn ? "Editable" : "พิมพ์แก้ไขได้"}</span>
          </div>
          <Input
            value={customProjectName}
            onChange={(e) => setCustomProjectName(e.target.value)}
            placeholder={isEn ? "Enter project name e.g. The Line, Ashton..." : "พิมพ์ชื่อโครงการ เช่น นันทวัน กรุงเทพกรีฑา, The Line..."}
            className="bg-slate-800/80 border-slate-700 text-white text-xs h-8 rounded-xl focus-visible:ring-amber-400"
          />
        </div>

        {/* Editable Title */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>{isEn ? "🏠 Property Title" : "🏠 หัวข้อประกาศ (Property Title)"}</span>
            <span className="text-[10px] text-amber-400/80">{isEn ? "Editable" : "พิมพ์แก้ไขได้"}</span>
          </div>
          <Input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={isEn ? "Property title..." : "หัวข้อประกาศ..."}
            className="bg-slate-800/80 border-slate-700 text-white text-xs h-8 rounded-xl focus-visible:ring-amber-400"
          />
        </div>

        {/* Editable Transit Station */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>{isEn ? "🚆 Transit Line & Station" : "🚆 สถานี & ประเภทรถไฟฟ้า (Transit Line & Station)"}</span>
            <span className="text-[10px] text-amber-400/80">{isEn ? "Specify line/type" : "ระบุสาย/ประเภทได้"}</span>
          </div>
          <Input
            value={customTransitText}
            onChange={(e) => setCustomTransitText(e.target.value)}
            placeholder={defaultTransitPlaceholder || (isEn ? "e.g. Near BTS On Nut 400m..." : "เช่น ใกล้ ARL บ้านทับช้าง 400 ม., BTS อ่อนนุช...")}
            className="bg-slate-800/80 border-slate-700 text-white text-xs h-8 rounded-xl focus-visible:ring-amber-400"
          />
        </div>

        {/* Editable AI Headline (Multi-line Support) */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>{isEn ? "✨ AI Hook Headline" : "✨ พาดหัวบนภาพ (AI Hook)"}</span>
            <span className="text-[10px] text-amber-400/80">{isEn ? "Press Enter to wrap" : "กด Enter เพื่อเว้นบรรทัดได้"}</span>
          </div>
          <textarea
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            rows={2}
            placeholder={isEn ? "Catchy headline on image (Press Enter to wrap lines)..." : "ข้อความพาดหัวบนภาพ (กด Enter เพื่อขึ้นบรรทัดใหม่ / เว้นบรรทัดได้)..."}
            className="w-full bg-slate-800/80 border border-slate-700 text-white text-xs p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none font-medium leading-relaxed placeholder:text-slate-500"
          />
        </div>

        {/* Custom Text Color Pickers */}
        <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
          <Label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span>{isEn ? "🎨 Custom Text Colors" : "🎨 ปรับแต่งสีข้อความทุกส่วน (Custom Text Colors)"}</span>
          </Label>

          <div className="grid grid-cols-2 gap-2">
            {/* 1. Title Color */}
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                <span>{isEn ? "🏠 Title Color:" : "🏠 สีหัวข้อประกาศ:"}</span>
                <span className="font-mono text-amber-400">{customTitleColor || "#FFFFFF"}</span>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { name: isEn ? "White" : "ขาว", hex: "#FFFFFF" },
                  { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
                  { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                  { name: isEn ? "Sky" : "ฟ้า", hex: "#38BDF8" },
                  { name: isEn ? "Emerald" : "เขียว", hex: "#10B981" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCustomTitleColor && setCustomTitleColor(c.hex)}
                    title={c.name}
                    className={`w-4.5 h-4.5 rounded-full border transition-all cursor-pointer ${
                      customTitleColor === c.hex
                        ? "ring-2 ring-amber-400 scale-110 border-white"
                        : "border-slate-700 opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={customTitleColor || "#FFFFFF"}
                  onChange={(e) => setCustomTitleColor && setCustomTitleColor(e.target.value)}
                  className="w-5 h-5 rounded bg-transparent border border-slate-700 cursor-pointer p-0"
                  title={isEn ? "Choose custom color" : "เลือกสี Custom"}
                />
              </div>
            </div>

            {/* 2. Price Color */}
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                <span>{isEn ? "💰 Price Color:" : "💰 สีราคาทรัพย์สิน:"}</span>
                <span className="font-mono text-amber-400">{customPriceColor || "#FFFFFF"}</span>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { name: isEn ? "White" : "ขาว", hex: "#FFFFFF" },
                  { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                  { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
                  { name: isEn ? "Emerald" : "เขียว", hex: "#10B981" },
                  { name: isEn ? "Sky" : "ฟ้า", hex: "#38BDF8" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCustomPriceColor && setCustomPriceColor(c.hex)}
                    title={c.name}
                    className={`w-4.5 h-4.5 rounded-full border transition-all cursor-pointer ${
                      customPriceColor === c.hex
                        ? "ring-2 ring-amber-400 scale-110 border-white"
                        : "border-slate-700 opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={customPriceColor || "#FFFFFF"}
                  onChange={(e) => setCustomPriceColor && setCustomPriceColor(e.target.value)}
                  className="w-5 h-5 rounded bg-transparent border border-slate-700 cursor-pointer p-0"
                  title={isEn ? "Choose custom color" : "เลือกสี Custom"}
                />
              </div>
            </div>

            {/* 3. Headline Color */}
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                <span>{isEn ? "✨ AI Hook Color:" : "✨ สีพาดหัว AI:"}</span>
                <span className="font-mono text-amber-400">{customHeadlineColor || "#F59E0B"}</span>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                  { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
                  { name: isEn ? "Sky" : "ฟ้า", hex: "#38BDF8" },
                  { name: isEn ? "Emerald" : "เขียว", hex: "#10B981" },
                  { name: isEn ? "White" : "ขาว", hex: "#FFFFFF" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCustomHeadlineColor && setCustomHeadlineColor(c.hex)}
                    title={c.name}
                    className={`w-4.5 h-4.5 rounded-full border transition-all cursor-pointer ${
                      customHeadlineColor === c.hex
                        ? "ring-2 ring-amber-400 scale-110 border-white"
                        : "border-slate-700 opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={customHeadlineColor || "#F59E0B"}
                  onChange={(e) => setCustomHeadlineColor && setCustomHeadlineColor(e.target.value)}
                  className="w-5 h-5 rounded bg-transparent border border-slate-700 cursor-pointer p-0"
                  title={isEn ? "Choose custom color" : "เลือกสี Custom"}
                />
              </div>
            </div>

            {/* 4. Project Name Color */}
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                <span>{isEn ? "🏢 Project Color:" : "🏢 สีชื่อโครงการ:"}</span>
                <span className="font-mono text-amber-400">{customProjectNameColor || "#FFFFFF"}</span>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { name: isEn ? "White" : "ขาว", hex: "#FFFFFF" },
                  { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                  { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
                  { name: isEn ? "Sky" : "ฟ้า", hex: "#38BDF8" },
                  { name: isEn ? "Emerald" : "เขียว", hex: "#10B981" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setCustomProjectNameColor && setCustomProjectNameColor(c.hex)}
                    title={c.name}
                    className={`w-4.5 h-4.5 rounded-full border transition-all cursor-pointer ${
                      customProjectNameColor === c.hex
                        ? "ring-2 ring-amber-400 scale-110 border-white"
                        : "border-slate-700 opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                <input
                  type="color"
                  value={customProjectNameColor || "#FFFFFF"}
                  onChange={(e) => setCustomProjectNameColor && setCustomProjectNameColor(e.target.value)}
                  className="w-5 h-5 rounded bg-transparent border border-slate-700 cursor-pointer p-0"
                  title={isEn ? "Choose custom color" : "เลือกสี Custom"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Toggles: QR Code, Contact & Agent Avatar */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800">
          <Label className="text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer">
            <QrCode className="h-3 w-3 text-slate-400" />
            QR Code
          </Label>
          <Switch checked={showQrCode} onCheckedChange={setShowQrCode} />
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800">
          <Label className="text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer">
            <Phone className="h-3 w-3 text-slate-400" />
            {isEn ? "Contact Info" : "ข้อมูลติดต่อ"}
          </Label>
          <Switch checked={showContact} onCheckedChange={setShowContact} />
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800">
          <Label className="text-[11px] text-slate-300 flex items-center gap-1 cursor-pointer">
            <UserCheck className="h-3 w-3 text-slate-400" />
            {isEn ? "Agent Avatar" : "รูป Agent"}
          </Label>
          <Switch checked={showAgentAvatar} onCheckedChange={setShowAgentAvatar} />
        </div>
      </div>

      {/* 3.5 Promotional Overlay Badge (Feature 2) */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800">
        <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          {isEn ? "🌟 Promotional Overlay Badge" : "🌟 ป้ายโปรโมชั่น (Promotional Overlay)"}
        </Label>
        <Input
          value={promoText}
          onChange={(e) => setPromoText(e.target.value)}
          placeholder={isEn ? "e.g. 🔥 Special Discount 2M! or ⚡ Free Transfer" : "เช่น 🔥 ลดพิเศษ 2,000,000! หรือ ⚡ ฟรีค่าโอน"}
          className="bg-slate-800/60 border-slate-700 text-xs text-slate-200 rounded-xl"
        />
        <div className="flex flex-wrap gap-1">
          {[
            "🔥 Hot Deal",
            isEn ? "🛋️ Fully Furnished" : "🛋️ แต่งครบ พร้อมอยู่",
            isEn ? "⚡ Free Transfer" : "⚡ ฟรีค่าโอน",
            isEn ? "🔑 Unit Available" : "🔑 ห้องหลุดจอง",
            "🌟 Below Market",
            "💰 High Yield 6%+",
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setPromoText(preset)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                promoText === preset
                  ? "bg-red-500/20 border-red-400 text-red-300"
                  : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {promoText && (
          <div className="flex flex-col gap-2 pt-1.5 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium">
                  {isEn ? "Position:" : "ตำแหน่ง:"}
                </span>
                <div className="flex gap-1">
                  {[
                    { id: "top_left", label: "↖️" },
                    { id: "top_right", label: "↗️" },
                    { id: "bottom_left", label: "↙️" },
                    { id: "bottom_right", label: "↘️" },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPromoPosition(pos.id as PromoPosition)}
                      className={`w-6.5 h-6.5 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${
                        promoPosition === pos.id
                          ? "bg-red-500/20 border-red-400"
                          : "bg-slate-800/60 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPromoText("")}
                className="text-[10px] text-slate-500 hover:text-red-400 cursor-pointer"
              >
                {isEn ? "Remove Badge" : "ลบป้าย"}
              </button>
            </div>

            {/* Custom Promo BG & Text Color Pickers */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/40">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-medium">{isEn ? "Badge BG:" : "สีพื้นหลังป้าย:"}</span>
                <div className="flex items-center gap-1">
                  {[
                    { name: isEn ? "Red" : "แดง", hex: "#EF4444" },
                    { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
                    { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                    { name: isEn ? "Blue" : "น้ำเงิน", hex: "#2563EB" },
                    { name: isEn ? "Green" : "เขียว", hex: "#10B981" },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPromoColor(c.hex)}
                      title={c.name}
                      className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                        promoColor === c.hex
                          ? "ring-2 ring-amber-400 scale-110 border-white"
                          : "border-slate-700 opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={promoColor || "#EF4444"}
                    onChange={(e) => setPromoColor(e.target.value)}
                    className="w-5 h-5 rounded bg-transparent border border-slate-700 cursor-pointer p-0"
                    title={isEn ? "Select custom BG color" : "เลือกสี Custom BG"}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-medium">{isEn ? "Badge Text:" : "สีข้อความป้าย:"}</span>
                <div className="flex items-center gap-1">
                  {[
                    { name: isEn ? "White" : "ขาว", hex: "#FFFFFF" },
                    { name: isEn ? "Black" : "ดำ", hex: "#000000" },
                    { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                    { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPromoTextColor && setPromoTextColor(c.hex)}
                      title={c.name}
                      className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                        promoTextColor === c.hex
                          ? "ring-2 ring-amber-400 scale-110 border-white"
                          : "border-slate-700 opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={promoTextColor || "#FFFFFF"}
                    onChange={(e) => setPromoTextColor && setPromoTextColor(e.target.value)}
                    className="w-5 h-5 rounded bg-transparent border border-slate-700 cursor-pointer p-0"
                    title={isEn ? "Select custom text color" : "เลือกสี Custom Text"}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. AI Caption Box */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5 text-amber-400" />
            {isEn ? "AI Social Caption" : "แคปชั่นสำหรับโพสต์ (AI Social Caption)"}
          </Label>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCopyCaption}
            className="h-7 px-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg cursor-pointer"
          >
            {copiedCaption ? (
              <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 mr-1" />
            )}
            {copiedCaption ? (isEn ? "Copied" : "คัดลอกแล้ว") : (isEn ? "Copy Caption" : "คัดลอกแคปชั่น")}
          </Button>
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none font-sans leading-relaxed"
          placeholder={isEn ? "AI-generated caption ready to post..." : "แคปชั่นที่ AI แต่งให้พร้อมโพสต์..."}
        />
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {hashtags.map((tag, i) => (
              <span key={i} className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
