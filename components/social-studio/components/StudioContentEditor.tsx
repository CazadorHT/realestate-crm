"use client";

import React, { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
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
  Sliders,
} from "lucide-react";
import type {
  StudioLanguage,
  PromoPosition,
  TextEffectTemplate,
  TextEffectPosition,
  FontSizeScale,
  SpecFontSizeScale,
  CalloutPointer,
  CustomTextItem,
  SocialStudioProperty,
  TextEffectLineConfig,
  TextEffectCardMode,
  EnabledSpecsConfig,
  StudioPriceEffect,
} from "../types";
import { useLanguage } from "@/lib/i18n/language-context";
import { AVAILABLE_BADGES, formatStudioPrice, getDynamicPropertyBadges } from "../helpers";
import { StudioTextEffectControls } from "./StudioTextEffectControls";
import { StudioCalloutControls } from "./StudioCalloutControls";
import { StudioCustomTextControls } from "./StudioCustomTextControls";

interface StudioContentEditorProps {
  property?: SocialStudioProperty;
  language: StudioLanguage;
  onLanguageChange?: (lang: StudioLanguage) => void;
  selectedBadges: string[];
  onToggleBadge: (label: string) => void;
  priceFontSizeScale?: FontSizeScale;
  setPriceFontSizeScale?: (s: FontSizeScale) => void;
  cardPaddingTop?: number;
  setCardPaddingTop?: (val: number) => void;
  pricePaddingTop?: number;
  setPricePaddingTop?: (val: number) => void;
  specFontSizeScale?: SpecFontSizeScale;
  setSpecFontSizeScale?: (s: SpecFontSizeScale) => void;
  specFontSizeCustom?: number;
  setSpecFontSizeCustom?: (val: number) => void;
  customProjectName: string;
  setCustomProjectName: (v: string) => void;
  customTitle: string;
  setCustomTitle: (v: string) => void;
  customTransitText: string;
  setCustomTransitText: (v: string) => void;
  customBedrooms?: number | string | null;
  setCustomBedrooms?: (v: number | string | null) => void;
  customBathrooms?: number | string | null;
  setCustomBathrooms?: (v: number | string | null) => void;
  customSizeSqm?: number | string | null;
  setCustomSizeSqm?: (v: number | string | null) => void;
  customLandSizeSqwah?: number | string | null;
  setCustomLandSizeSqwah?: (v: number | string | null) => void;
  customParking?: number | string | null;
  setCustomParking?: (v: number | string | null) => void;
  customFloor?: number | string | null;
  setCustomFloor?: (v: number | string | null) => void;
  enabledSpecs?: EnabledSpecsConfig;
  setEnabledSpecs?: React.Dispatch<React.SetStateAction<EnabledSpecsConfig>>;
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
  priceEffect?: StudioPriceEffect;
  setPriceEffect?: (effect: StudioPriceEffect) => void;
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
  // Single Modern Card Mode (ยุบรวมทุกบรรทัดเป็นการ์ดแผ่นเดียว ลดความหนา >30%)
  textEffectCardMode?: TextEffectCardMode;
  setTextEffectCardMode?: (m: TextEffectCardMode) => void;
  textEffectSingleCardBgColor?: string;
  setTextEffectSingleCardBgColor?: (c: string) => void;
  textEffectSingleCardTextColor?: string;
  setTextEffectSingleCardTextColor?: (c: string) => void;
  textEffectSingleCardBorderColor?: string;
  setTextEffectSingleCardBorderColor?: (c: string) => void;
  textEffectSingleCardBorderWidth?: number;
  setTextEffectSingleCardBorderWidth?: (w: number) => void;
  textEffectSingleCardRadius?: number;
  setTextEffectSingleCardRadius?: (r: number) => void;
  textEffectSingleCardPadding?: number;
  setTextEffectSingleCardPadding?: (p: number) => void;
  textEffectSingleCardAlign?: "center" | "left" | "right";
  setTextEffectSingleCardAlign?: (a: "center" | "left" | "right") => void;
  textEffectSingleCardOpacity?: number;
  setTextEffectSingleCardOpacity?: (o: number) => void;
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
  priceFontSizeScale,
  setPriceFontSizeScale,
  cardPaddingTop,
  setCardPaddingTop,
  pricePaddingTop,
  setPricePaddingTop,
  specFontSizeScale,
  setSpecFontSizeScale,
  specFontSizeCustom = 140,
  setSpecFontSizeCustom,
  customProjectName,
  setCustomProjectName,
  customTitle,
  setCustomTitle,
  customTransitText,
  setCustomTransitText,
  customBedrooms,
  setCustomBedrooms,
  customBathrooms,
  setCustomBathrooms,
  customSizeSqm,
  setCustomSizeSqm,
  customLandSizeSqwah,
  setCustomLandSizeSqwah,
  customParking,
  setCustomParking,
  customFloor,
  setCustomFloor,
  enabledSpecs,
  setEnabledSpecs,
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
  priceEffect = "none",
  setPriceEffect,
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
  textEffectCardMode,
  setTextEffectCardMode,
  textEffectSingleCardBgColor,
  setTextEffectSingleCardBgColor,
  textEffectSingleCardTextColor,
  setTextEffectSingleCardTextColor,
  textEffectSingleCardBorderColor,
  setTextEffectSingleCardBorderColor,
  textEffectSingleCardBorderWidth,
  setTextEffectSingleCardBorderWidth,
  textEffectSingleCardRadius,
  setTextEffectSingleCardRadius,
  textEffectSingleCardPadding,
  setTextEffectSingleCardPadding,
  textEffectSingleCardAlign,
  setTextEffectSingleCardAlign,
  textEffectSingleCardOpacity,
  setTextEffectSingleCardOpacity,
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
  onLanguageChange,
  language: studioLanguage = "th",
}: StudioContentEditorProps) {
  const { language: uiLang } = useLanguage();
  const effectiveLang: StudioLanguage = studioLanguage || (uiLang as StudioLanguage) || "th";
  const isEn = effectiveLang === "en";

  // Dynamic Property Badges (Real-data: SQM, Land Sq.wah, Parking, Beds, Baths, Floor, Amenities)
  const dynamicPropertyBadges = useMemo(() => {
    return getDynamicPropertyBadges(
      property,
      {
        customSizeSqm,
        customLandSizeSqwah,
        customParking,
        customBedrooms,
        customBathrooms,
        customFloor,
      },
      effectiveLang
    );
  }, [
    property,
    customSizeSqm,
    customLandSizeSqwah,
    customParking,
    customBedrooms,
    customBathrooms,
    customFloor,
    effectiveLang,
  ]);

  // Compute smart real estate hook texts from property data according to Studio Language
  const propertyProjectName = useMemo(() => {
    if (effectiveLang === "en") {
      const enProj = (property as any)?.project_name_en?.trim() || (property?.project?.name as any)?.en?.trim();
      if (enProj) return enProj;
      if (property?.title_en?.trim()) return property.title_en.trim();
      if (customProjectName?.trim()) return customProjectName.trim();
      return (
        property?.project_name?.trim() ||
        (typeof property?.project?.name === "string" ? property.project.name.trim() : "") ||
        property?.title?.trim() ||
        ""
      );
    }
    if (effectiveLang === "zh") {
      const zhProj =
        (property as any)?.project_name_cn?.trim() ||
        (property?.project?.name as any)?.cn?.trim() ||
        (property?.project?.name as any)?.zh?.trim() ||
        (property as any)?.project_name_en?.trim();
      if (zhProj) return zhProj;
      if (customProjectName?.trim()) return customProjectName.trim();
      return (
        property?.project_name?.trim() ||
        (typeof property?.project?.name === "string" ? property.project.name.trim() : "") ||
        property?.title?.trim() ||
        ""
      );
    }
    if (effectiveLang === "ru") {
      const ruProj =
        (property as any)?.project_name_ru?.trim() ||
        (property?.project?.name as any)?.ru?.trim() ||
        (property as any)?.project_name_en?.trim();
      if (ruProj) return ruProj;
      if (customProjectName?.trim()) return customProjectName.trim();
      return (
        property?.project_name?.trim() ||
        (typeof property?.project?.name === "string" ? property.project.name.trim() : "") ||
        property?.title?.trim() ||
        ""
      );
    }
    // Default Thai
    return (
      customProjectName?.trim() ||
      property?.project_name?.trim() ||
      (typeof property?.project?.name === "string"
        ? property.project.name.trim()
        : (property?.project?.name as any)?.th?.trim()) ||
      property?.title?.trim() ||
      ""
    );
  }, [property, customProjectName, effectiveLang]);

  const propertySpecsText = useMemo(() => {
    const parts: string[] = [];
    if (property?.bedrooms) {
      if (effectiveLang === "en") parts.push(`${property.bedrooms} ${property.bedrooms === 1 ? "Bed" : "Beds"}`);
      else if (effectiveLang === "zh") parts.push(`${property.bedrooms} 卧`);
      else if (effectiveLang === "ru") parts.push(`${property.bedrooms} спальн.`);
      else parts.push(`${property.bedrooms} นอน`);
    }
    if (property?.bathrooms) {
      if (effectiveLang === "en") parts.push(`${property.bathrooms} ${property.bathrooms === 1 ? "Bath" : "Baths"}`);
      else if (effectiveLang === "zh") parts.push(`${property.bathrooms} 卫`);
      else if (effectiveLang === "ru") parts.push(`${property.bathrooms} сануз.`);
      else parts.push(`${property.bathrooms} น้ำ`);
    }
    if (property?.size_sqm) {
      if (effectiveLang === "en") parts.push(`${property.size_sqm} Sq.m.`);
      else if (effectiveLang === "zh") parts.push(`${property.size_sqm} 平米`);
      else if (effectiveLang === "ru") parts.push(`${property.size_sqm} кв.м`);
      else parts.push(`${property.size_sqm} ตร.ม.`);
    }
    return parts.join(" ");
  }, [property?.bedrooms, property?.bathrooms, property?.size_sqm, effectiveLang]);

  const propertyPriceTag = useMemo(() => {
    if (!property?.price && !property?.rental_price) {
      return (
        priceText ||
        (effectiveLang === "en"
          ? "Contact for Price"
          : effectiveLang === "zh"
            ? "咨询价格"
            : effectiveLang === "ru"
              ? "Цена по запросу"
              : "ติดต่อสอบถาม")
      );
    }
    return formatStudioPrice(
      property.listing_type,
      property.price,
      property.rental_price,
      effectiveLang,
      "default"
    );
  }, [property?.listing_type, property?.price, property?.rental_price, priceText, effectiveLang]);

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
          textEffectCardMode={textEffectCardMode}
          setTextEffectCardMode={setTextEffectCardMode}
          textEffectSingleCardBgColor={textEffectSingleCardBgColor}
          setTextEffectSingleCardBgColor={setTextEffectSingleCardBgColor}
          textEffectSingleCardTextColor={textEffectSingleCardTextColor}
          setTextEffectSingleCardTextColor={setTextEffectSingleCardTextColor}
          textEffectSingleCardBorderColor={textEffectSingleCardBorderColor}
          setTextEffectSingleCardBorderColor={setTextEffectSingleCardBorderColor}
          textEffectSingleCardBorderWidth={textEffectSingleCardBorderWidth}
          setTextEffectSingleCardBorderWidth={setTextEffectSingleCardBorderWidth}
          textEffectSingleCardRadius={textEffectSingleCardRadius}
          setTextEffectSingleCardRadius={setTextEffectSingleCardRadius}
          textEffectSingleCardPadding={textEffectSingleCardPadding}
          setTextEffectSingleCardPadding={setTextEffectSingleCardPadding}
          textEffectSingleCardAlign={textEffectSingleCardAlign}
          setTextEffectSingleCardAlign={setTextEffectSingleCardAlign}
          textEffectSingleCardOpacity={textEffectSingleCardOpacity}
          setTextEffectSingleCardOpacity={setTextEffectSingleCardOpacity}
          language={effectiveLang}
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
          language={effectiveLang}
          customTexts={customTexts}
          onAddCustomText={onAddCustomText}
          onUpdateCustomText={onUpdateCustomText}
          onRemoveCustomText={onRemoveCustomText}
        />
      )}

      {/* 1. Sticker Badges Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-amber-400" />
              {isEn ? "Image Sticker Badges" : "สติกเกอร์ไฮไลท์บนภาพ (Image Badges)"}
            </Label>
            {/* Quick TH / EN Toggle for Badges */}
            {onLanguageChange && (
              <div className="inline-flex rounded-lg p-0.5 bg-slate-900 border border-slate-700 text-[10px]">
                <button
                  type="button"
                  onClick={() => onLanguageChange("th")}
                  className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    !isEn ? "bg-amber-500 text-slate-950 shadow-xs font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="สลับสติกเกอร์เป็นภาษาไทย (TH)"
                >
                  TH
                </button>
                <button
                  type="button"
                  onClick={() => onLanguageChange("en")}
                  className={`px-1.5 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    isEn ? "bg-amber-500 text-slate-950 shadow-xs font-bold" : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Switch badges to English (EN)"
                >
                  EN
                </button>
              </div>
            )}
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
            {isEn ? `Selected ${selectedBadges.length}/5` : `เลือกแล้ว ${selectedBadges.length}/5`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[...dynamicPropertyBadges, ...AVAILABLE_BADGES].map((b) => {
            const badgeLabel = isEn ? (b.labelEn || b.label) : b.label;
            const isSelected = selectedBadges.some((s) => {
              if (!s) return false;
              if (s === b.id || s === b.label || s === b.labelEn) return true;
              const cleanNorm = (str: string) =>
                str.replace(/[\s\-_]/g, "").replace(/^[\p{Emoji}\s]+/u, "").toLowerCase();
              const normS = cleanNorm(s);
              const normId = cleanNorm(b.id);
              const normLabel = cleanNorm(b.label);
              const normLabelEn = cleanNorm(b.labelEn || "");
              if (normS === normId || normS === normLabel || normS === normLabelEn) return true;
              if (
                (normS.includes("foreignfreehold") || normS === "foreignfreehold") &&
                (normId.includes("foreignfreehold") || normId === "foreignfreehold" || normLabel.includes("foreignfreehold"))
              ) return true;
              if (
                (normS.includes("foreignerquota") || normS === "foreignerquota") &&
                (normId.includes("foreignerquota") || normId === "foreignerquota" || normLabel.includes("foreignerquota"))
              ) return true;
              if (b.id === "prop_sqm" && (s.includes("ตร.ม.") || s.toLowerCase().includes("sq.m") || s.toLowerCase().includes("sqm") || s === "prop_sqm")) return true;
              if (b.id === "prop_land_sqwah" && (s.includes("ตร.วา") || s.toLowerCase().includes("sq.wah") || s === "prop_land_sqwah")) return true;
              if (b.id === "prop_parking" && (s.includes("ที่จอด") || s.toLowerCase().includes("parking") || s === "prop_parking")) return true;
              if (b.id === "prop_bedrooms" && (s.includes("ห้องนอน") || s.toLowerCase().includes("bed") || s === "prop_bedrooms")) return true;
              if (b.id === "prop_bathrooms" && (s.includes("ห้องน้ำ") || s.toLowerCase().includes("bath") || s === "prop_bathrooms")) return true;
              if (b.id === "prop_floor" && (s.includes("ชั้น") || s.toLowerCase().includes("floor") || s.toLowerCase().includes("fl.") || s === "prop_floor")) return true;
              return false;
            });

            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onToggleBadge(b.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/30 border-amber-400 text-amber-200 font-bold shadow-xs scale-102"
                    : b.isProp
                      ? "bg-emerald-950/50 border-emerald-600/70 text-emerald-300 hover:text-emerald-100 shadow-xs"
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
            {isEn ? `Regenerate AI (${effectiveLang.toUpperCase()})` : `ให้ AI คิดใหม่ (${effectiveLang.toUpperCase()})`}
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

        {/* Editable Property Specs (Display Pills with On/Off Toggles) */}
        {setCustomBedrooms && (
          <div className="space-y-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <span className="text-amber-400">🏠</span>
                <span>{isEn ? "Property Specs (Display Pills)" : "สเปกห้อง & ที่ดิน & ที่จอดรถ (Specs Pills)"}</span>
              </div>
              {/* Quick Spec Presets */}
              {setEnabledSpecs && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledSpecs({
                        bedrooms: true,
                        bathrooms: true,
                        parking: true,
                        sizeSqm: true,
                        landSizeSqwah: true,
                        floor: true,
                      })
                    }
                    className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer border border-slate-700"
                  >
                    {isEn ? "All ON" : "เปิดหมด"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledSpecs({
                        bedrooms: false,
                        bathrooms: false,
                        parking: true,
                        sizeSqm: true,
                        landSizeSqwah: false,
                        floor: false,
                      })
                    }
                    className="px-2 py-0.5 rounded-md text-[10px] bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 border border-amber-500/50 font-bold transition cursor-pointer shadow-xs"
                    title="Show Parking & SQ.M. pills only"
                  >
                    {isEn ? "🚗 Parking + SQM" : "🚗 ที่จอด + SQM"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEnabledSpecs({
                        bedrooms: false,
                        bathrooms: false,
                        parking: false,
                        sizeSqm: false,
                        landSizeSqwah: false,
                        floor: false,
                      })
                    }
                    className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium transition cursor-pointer border border-slate-700"
                  >
                    {isEn ? "All OFF" : "ปิดหมด"}
                  </button>
                </div>
              )}
            </div>

            {/* Live Spec Pills with Individual Clickable Toggles */}
            {(() => {
              const handleToggleSpec = (key: keyof EnabledSpecsConfig) => {
                if (!setEnabledSpecs) return;
                setEnabledSpecs((prev) => ({
                  ...prev,
                  [key]: !prev[key],
                }));
              };

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {/* 1. Parking */}
                  {(() => {
                    const val = customParking !== "" && customParking !== null && customParking !== undefined ? customParking : (property?.parking_slots ?? property?.parking ?? "");
                    const isEnabled = enabledSpecs?.parking !== false;
                    return (
                      <div className={`p-2 rounded-xl border transition-all ${
                        isEnabled
                          ? "bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30 shadow-xs"
                          : "bg-slate-950/40 border-slate-800/80 opacity-50"
                      }`}>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("parking")}
                            className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition cursor-pointer text-left"
                          >
                            <span>🚗</span>
                            <span>{isEn ? `${val || "0"} Parking` : `ที่จอดรถ ${val || "0"}`}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("parking")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                              isEnabled
                                ? "bg-amber-500 text-slate-950 shadow-xs"
                                : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                          >
                            {isEnabled ? "ON" : "OFF"}
                          </button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={customParking ?? ""}
                          onChange={(e) => setCustomParking?.(e.target.value)}
                          placeholder={String(property?.parking_slots ?? property?.parking ?? "2")}
                          className="bg-slate-800/90 border-slate-700 text-white text-xs h-7 px-2 rounded-lg"
                        />
                      </div>
                    );
                  })()}

                  {/* 2. Size SQ.M. */}
                  {(() => {
                    const val = customSizeSqm !== "" && customSizeSqm !== null && customSizeSqm !== undefined ? customSizeSqm : (property?.size_sqm ?? (property as any)?.floor_area ?? "");
                    const isEnabled = enabledSpecs?.sizeSqm !== false;
                    return (
                      <div className={`p-2 rounded-xl border transition-all ${
                        isEnabled
                          ? "bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30 shadow-xs"
                          : "bg-slate-950/40 border-slate-800/80 opacity-50"
                      }`}>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("sizeSqm")}
                            className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition cursor-pointer text-left"
                          >
                            <span>⤢</span>
                            <span>{isEn ? `${val || "0"} SQ.M.` : `${val || "0"} ตร.ม.`}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("sizeSqm")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                              isEnabled
                                ? "bg-amber-500 text-slate-950 shadow-xs"
                                : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                          >
                            {isEnabled ? "ON" : "OFF"}
                          </button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={customSizeSqm ?? ""}
                          onChange={(e) => setCustomSizeSqm?.(e.target.value)}
                          placeholder={String(property?.size_sqm ?? (property as any)?.floor_area ?? "485")}
                          className="bg-slate-800/90 border-slate-700 text-white text-xs h-7 px-2 rounded-lg"
                        />
                      </div>
                    );
                  })()}

                  {/* 3. Land Size Sq.wah */}
                  {(() => {
                    const val = customLandSizeSqwah !== "" && customLandSizeSqwah !== null && customLandSizeSqwah !== undefined ? customLandSizeSqwah : (property?.land_size_sqwah ?? (property as any)?.land_area ?? "");
                    const isEnabled = enabledSpecs?.landSizeSqwah !== false;
                    return (
                      <div className={`p-2 rounded-xl border transition-all ${
                        isEnabled
                          ? "bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-xs"
                          : "bg-slate-950/40 border-slate-800/80 opacity-50"
                      }`}>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("landSizeSqwah")}
                            className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition cursor-pointer text-left"
                          >
                            <span>📐</span>
                            <span>{isEn ? `${val || "0"} Sq.wah` : `${val || "0"} ตร.วา`}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("landSizeSqwah")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                              isEnabled
                                ? "bg-emerald-500 text-slate-950 shadow-xs"
                                : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                          >
                            {isEnabled ? "ON" : "OFF"}
                          </button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={customLandSizeSqwah ?? ""}
                          onChange={(e) => setCustomLandSizeSqwah?.(e.target.value)}
                          placeholder={String(property?.land_size_sqwah ?? (property as any)?.land_area ?? "50")}
                          className="bg-slate-800/90 border-slate-700 text-white text-xs h-7 px-2 rounded-lg"
                        />
                      </div>
                    );
                  })()}

                  {/* 4. Bedrooms */}
                  {(() => {
                    const val = customBedrooms !== "" && customBedrooms !== null && customBedrooms !== undefined ? customBedrooms : (property?.bedrooms ?? "");
                    const isEnabled = enabledSpecs?.bedrooms !== false;
                    return (
                      <div className={`p-2 rounded-xl border transition-all ${
                        isEnabled
                          ? "bg-slate-800/80 border-slate-700 ring-1 ring-slate-600/40 shadow-xs"
                          : "bg-slate-950/40 border-slate-800/80 opacity-50"
                      }`}>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("bedrooms")}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer text-left"
                          >
                            <span>🛏️</span>
                            <span>{isEn ? `${val || "0"} Beds` : `${val || "0"} ห้องนอน`}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("bedrooms")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                              isEnabled
                                ? "bg-slate-200 text-slate-950 shadow-xs"
                                : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                          >
                            {isEnabled ? "ON" : "OFF"}
                          </button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={customBedrooms ?? ""}
                          onChange={(e) => setCustomBedrooms?.(e.target.value)}
                          placeholder={String(property?.bedrooms ?? "3")}
                          className="bg-slate-800/90 border-slate-700 text-white text-xs h-7 px-2 rounded-lg"
                        />
                      </div>
                    );
                  })()}

                  {/* 5. Bathrooms */}
                  {(() => {
                    const val = customBathrooms !== "" && customBathrooms !== null && customBathrooms !== undefined ? customBathrooms : (property?.bathrooms ?? "");
                    const isEnabled = enabledSpecs?.bathrooms !== false;
                    return (
                      <div className={`p-2 rounded-xl border transition-all ${
                        isEnabled
                          ? "bg-slate-800/80 border-slate-700 ring-1 ring-slate-600/40 shadow-xs"
                          : "bg-slate-950/40 border-slate-800/80 opacity-50"
                      }`}>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("bathrooms")}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer text-left"
                          >
                            <span>🚿</span>
                            <span>{isEn ? `${val || "0"} Baths` : `${val || "0"} ห้องน้ำ`}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("bathrooms")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                              isEnabled
                                ? "bg-slate-200 text-slate-950 shadow-xs"
                                : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                          >
                            {isEnabled ? "ON" : "OFF"}
                          </button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={customBathrooms ?? ""}
                          onChange={(e) => setCustomBathrooms?.(e.target.value)}
                          placeholder={String(property?.bathrooms ?? "3")}
                          className="bg-slate-800/90 border-slate-700 text-white text-xs h-7 px-2 rounded-lg"
                        />
                      </div>
                    );
                  })()}

                  {/* 6. Floor */}
                  {(() => {
                    const val = customFloor !== "" && customFloor !== null && customFloor !== undefined ? customFloor : (property?.floor ?? "");
                    const isEnabled = enabledSpecs?.floor !== false;
                    return (
                      <div className={`p-2 rounded-xl border transition-all ${
                        isEnabled
                          ? "bg-slate-800/80 border-slate-700 ring-1 ring-slate-600/40 shadow-xs"
                          : "bg-slate-950/40 border-slate-800/80 opacity-50"
                      }`}>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("floor")}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer text-left"
                          >
                            <span>🏢</span>
                            <span>{isEn ? `Fl. ${val || "0"}` : `ชั้น ${val || "0"}`}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSpec("floor")}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition ${
                              isEnabled
                                ? "bg-slate-200 text-slate-950 shadow-xs"
                                : "bg-slate-800 text-slate-500 border border-slate-700"
                            }`}
                          >
                            {isEnabled ? "ON" : "OFF"}
                          </button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={customFloor ?? ""}
                          onChange={(e) => setCustomFloor?.(e.target.value)}
                          placeholder={String(property?.floor ?? "2")}
                          className="bg-slate-800/90 border-slate-700 text-white text-xs h-7 px-2 rounded-lg"
                        />
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* Specs Font Size continuous slider & presets */}
            {setSpecFontSizeCustom && (
              <div className="pt-2.5 mt-1 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    {isEn ? "📏 Specs Font Size (Continuous):" : "📏 ขนาดฟอนต์สเปก (เลื่อนปรับอิสระ):"}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                    {specFontSizeCustom || 140}% ({((specFontSizeCustom || 140) / 100).toFixed(2)}x)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpecFontSizeCustom(Math.max(50, (specFontSizeCustom || 140) - 5))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-700 cursor-pointer transition-colors"
                    title="-5%"
                  >
                    -
                  </button>
                  <Slider
                    value={[specFontSizeCustom || 140]}
                    min={50}
                    max={250}
                    step={2}
                    onValueChange={([val]) => setSpecFontSizeCustom(val)}
                    className="flex-1 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setSpecFontSizeCustom(Math.min(250, (specFontSizeCustom || 140) + 5))}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-700 cursor-pointer transition-colors"
                    title="+5%"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-500 mr-1">{isEn ? "Presets:" : "ระดับด่วน:"}</span>
                  {[
                    { id: "xs", val: 75, label: "XS (75%)" },
                    { id: "sm", val: 90, label: "S (90%)" },
                    { id: "md", val: 105, label: "M (105%)" },
                    { id: "lg", val: 125, label: "L (125%)" },
                    { id: "xl", val: 145, label: "XL (145%) ⭐" },
                    { id: "2xl", val: 175, label: "2XL (175%)" },
                    { id: "3xl", val: 210, label: "3XL (210%)" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSpecFontSizeCustom(f.val);
                        if (setSpecFontSizeScale) setSpecFontSizeScale(f.id as any);
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        specFontSizeCustom === f.val
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
        )}

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

            {/* 2. Price Visual Effects & Color Gallery */}
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="text-amber-400">💰</span>
                  <span>{isEn ? "Price Visual Effects & Styling:" : "เอฟเฟคราคา & สีข้อความ (Price Effects):"}</span>
                </span>
                <span className="font-mono text-[11px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                  {priceEffect === "gold_metallic"
                    ? isEn ? "✨ Gold Metallic" : "✨ ทองเมทัลลิก"
                    : priceEffect === "rose_gold"
                      ? isEn ? "🌸 Rose Gold" : "🌸 โรสโกลด์"
                      : priceEffect === "neon_amber"
                        ? isEn ? "⚡ Neon Amber" : "⚡ นีออนส้มไฟ"
                        : priceEffect === "emerald_glow"
                          ? isEn ? "💎 Emerald Glow" : "💎 เขียวมรกต"
                          : priceEffect === "ice_diamond"
                            ? isEn ? "❄️ Ice Diamond" : "❄️ ไอซ์ไดมอนด์"
                            : priceEffect === "platinum_chrome"
                              ? isEn ? "👑 Platinum" : "👑 แพลตินัม"
                              : priceEffect === "pill_capsule"
                                ? isEn ? "🏷️ VIP Capsule" : "🏷️ ป้ายแคปซูล VIP"
                                : priceEffect === "shadow_3d"
                                  ? isEn ? "💥 3D Pop" : "💥 3D นูนมีมิติ"
                                  : priceEffect === "glow_sparkle"
                                    ? isEn ? "✦ Sparkle" : "✦ วิบวับมีประกาย"
                                    : (customPriceColor || (isEn ? "Standard" : "สีปกติ"))}
                </span>
              </div>

              {/* Price Effects Pill Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {[
                  { id: "gold_metallic" as StudioPriceEffect, icon: "✨", labelEn: "Gold Metallic", labelTh: "ทองเมทัลลิก", colorClass: "from-amber-400 via-yellow-200 to-amber-600 text-amber-950 border-amber-300" },
                  { id: "rose_gold" as StudioPriceEffect, icon: "🌸", labelEn: "Rose Gold", labelTh: "โรสโกลด์", colorClass: "from-rose-300 via-pink-200 to-rose-500 text-rose-950 border-rose-300" },
                  { id: "neon_amber" as StudioPriceEffect, icon: "⚡", labelEn: "Neon Amber", labelTh: "นีออนส้มไฟ", colorClass: "from-amber-300 to-orange-500 text-orange-950 border-orange-400" },
                  { id: "emerald_glow" as StudioPriceEffect, icon: "💎", labelEn: "Emerald Glow", labelTh: "เขียวมรกต", colorClass: "from-emerald-300 via-green-200 to-teal-500 text-emerald-950 border-emerald-300" },
                  { id: "ice_diamond" as StudioPriceEffect, icon: "❄️", labelEn: "Ice Diamond", labelTh: "ไอซ์ไดมอนด์", colorClass: "from-cyan-200 via-sky-200 to-blue-500 text-cyan-950 border-cyan-300" },
                  { id: "platinum_chrome" as StudioPriceEffect, icon: "👑", labelEn: "Platinum", labelTh: "แพลตินัม", colorClass: "from-white via-slate-200 to-slate-400 text-slate-900 border-slate-300" },
                  { id: "pill_capsule" as StudioPriceEffect, icon: "🏷️", labelEn: "VIP Capsule", labelTh: "ป้ายแคปซูล VIP", colorClass: "from-slate-800 to-slate-900 text-amber-300 border-amber-400" },
                  { id: "shadow_3d" as StudioPriceEffect, icon: "💥", labelEn: "3D Shadow", labelTh: "3D นูนมีมิติ", colorClass: "from-amber-100 to-amber-200 text-slate-950 border-slate-400" },
                  { id: "glow_sparkle" as StudioPriceEffect, icon: "✦", labelEn: "Sparkle Flare", labelTh: "วิบวับประกาย", colorClass: "from-amber-200 via-yellow-100 to-amber-400 text-amber-950 border-yellow-300" },
                  { id: "none" as StudioPriceEffect, icon: "⚪", labelEn: "Plain / Solid", labelTh: "สีพื้นปกติ", colorClass: "from-slate-800 to-slate-800 text-slate-200 border-slate-700" },
                ].map((eff) => {
                  const isActive = priceEffect === eff.id;
                  return (
                    <button
                      key={eff.id}
                      type="button"
                      onClick={() => {
                        if (setPriceEffect) setPriceEffect(eff.id);
                        if (eff.id === "gold_metallic" && setCustomPriceColor) setCustomPriceColor("gold");
                        else if (eff.id === "none" && customPriceColor === "gold" && setCustomPriceColor) setCustomPriceColor("#FFFFFF");
                      }}
                      className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 text-center ${
                        isActive
                          ? `bg-gradient-to-r ${eff.colorClass} shadow-md ring-2 ring-amber-400 scale-102 font-extrabold`
                          : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700/80"
                      }`}
                    >
                      <span>{eff.icon}</span>
                      <span className="truncate">{isEn ? eff.labelEn : eff.labelTh}</span>
                    </button>
                  );
                })}
              </div>

              {/* Price Solid Accent Color / Color Swatches */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 flex-wrap">
                <span className="text-[10px] text-slate-400 font-medium">
                  {isEn ? "Base Tint / Custom Color:" : "สีพื้นฐาน / เลือกสีเพิ่มเติม:"}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { name: isEn ? "White" : "ขาว", hex: "#FFFFFF" },
                    { name: isEn ? "Gold" : "ทอง", hex: "#F59E0B" },
                    { name: isEn ? "Orange" : "ส้ม", hex: "#F97316" },
                    { name: isEn ? "Rose Pink" : "ชมพู", hex: "#FB7185" },
                    { name: isEn ? "Emerald" : "เขียว", hex: "#10B981" },
                    { name: isEn ? "Sky Blue" : "ฟ้า", hex: "#38BDF8" },
                    { name: isEn ? "Crimson Red" : "แดง", hex: "#EF4444" },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        if (setCustomPriceColor) setCustomPriceColor(c.hex);
                        if (priceEffect === "gold_metallic" && setPriceEffect) setPriceEffect("none");
                      }}
                      title={c.name}
                      className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                        customPriceColor === c.hex
                          ? "ring-2 ring-amber-400 scale-110 border-white"
                          : "border-slate-700 opacity-75 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={customPriceColor === "gold" ? "#F59E0B" : (customPriceColor || "#FFFFFF")}
                    onChange={(e) => {
                      if (setCustomPriceColor) setCustomPriceColor(e.target.value);
                      if (priceEffect === "gold_metallic" && setPriceEffect) setPriceEffect("none");
                    }}
                    className="w-5 h-5 rounded bg-transparent border border-slate-700 cursor-pointer p-0"
                    title={isEn ? "Choose custom color" : "เลือกสี Custom"}
                  />
                </div>
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

            {/* Price Font Size Quick Selector */}
            {setPriceFontSizeScale && (
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 col-span-2">
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="font-bold text-xs">$</span>
                    {isEn ? "Price Font Size:" : "ขนาดฟอนต์ราคา (Price Size):"}
                  </span>
                  <span className="font-mono text-emerald-400">
                    {priceFontSizeScale === "sm" ? "85%" : priceFontSizeScale === "lg" ? "116%" : priceFontSizeScale === "xl" ? "130%" : priceFontSizeScale === "2xl" ? "160% (จัมโบ้)" : "100%"}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: "sm", label: isEn ? "SM" : "เล็ก", sub: "85%" },
                    { id: "md", label: isEn ? "MD" : "ปกติ", sub: "100%" },
                    { id: "lg", label: isEn ? "LG" : "ใหญ่", sub: "116%" },
                    { id: "xl", label: isEn ? "XL" : "ยักษ์", sub: "130%" },
                    { id: "2xl", label: isEn ? "2XL" : "จัมโบ้", sub: "160%" },
                  ].map((f) => (
                    <button
                      key={`content-price-size-${f.id}`}
                      type="button"
                      onClick={() => setPriceFontSizeScale(f.id as FontSizeScale)}
                      className={`py-1 px-1 rounded-lg border text-center flex flex-col items-center cursor-pointer transition-all ${
                        priceFontSizeScale === f.id
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-xs scale-102"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-[11px] font-bold">{f.label}</span>
                      <span className="text-[8px] opacity-70">{f.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Padding Top & Price Nudge Controls */}
            {(setCardPaddingTop || setPricePaddingTop) && (
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 col-span-2">
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Sliders className="h-3 w-3" />
                    {isEn ? "Vertical Spacing & Padding Top:" : "ปรับระยะขอบบนการ์ด & ตำแหน่งราคา (Padding Top):"}
                  </span>
                </div>

                {/* Card Top Padding */}
                {setCardPaddingTop && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>{isEn ? "Card Internal Top Padding" : "ระยะขอบบนการ์ด (Card Top Padding)"}</span>
                      <span className="text-amber-400 font-mono">{cardPaddingTop ?? 36}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="90"
                      step="2"
                      value={cardPaddingTop ?? 36}
                      onChange={(e) => setCardPaddingTop(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500">
                      <span>12px ({isEn ? "Tight" : "ชิดบน"})</span>
                      <span>36px ({isEn ? "Standard" : "มาตรฐาน"})</span>
                      <span>90px ({isEn ? "Spacious" : "โปร่ง"})</span>
                    </div>
                  </div>
                )}

                {/* Price Vertical Offset */}
                {setPricePaddingTop && (
                  <div className="space-y-1 pt-1.5 border-t border-slate-800/70">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>{isEn ? "Price Position Nudge (Up/Down)" : "เลื่อนตำแหน่งราคาสูง-ต่ำ (Price Top Offset)"}</span>
                      <span className="text-amber-400 font-mono">
                        {(pricePaddingTop ?? 0) === 0
                          ? (isEn ? "0px (Default)" : "0px (ปกติ)")
                          : `${(pricePaddingTop ?? 0) > 0 ? `+${pricePaddingTop}` : pricePaddingTop}px`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="60"
                      step="2"
                      value={pricePaddingTop ?? 0}
                      onChange={(e) => setPricePaddingTop(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[8px] text-slate-500">
                      <span>-40px ({isEn ? "Lift Up" : "ดันขึ้น"})</span>
                      <span>0px</span>
                      <span>+60px ({isEn ? "Push Down" : "ดันลง"})</span>
                    </div>
                  </div>
                )}
              </div>
            )}
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
