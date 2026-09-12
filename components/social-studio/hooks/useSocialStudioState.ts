"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { siteConfig } from "@/lib/site-config";
import { getSocialStudioPresets, saveSocialStudioPreset } from "@/features/properties/actions/social-presets";
import { generateSocialBannerContentAction, type BannerContentResult } from "@/features/properties/actions/social";
import {
  formatTransitDisplay,
  formatStudioPrice,
  formatStudioLocation,
} from "../helpers";
import {
  renderBannerToCanvas,
  renderSpecsHighlightsPage,
  renderLocationPage,
  renderContactCTAPage,
} from "../canvas-renderer";
import type {
  AspectRatio,
  StudioTheme,
  StudioLayout,
  CardBackground,
  ContentPosition,
  FontSizeScale,
  SpecFontSizeScale,
  StudioPriceFormatStyle,
  ElementZoneMapping,
  StudioLanguage,
  PhotoFilter,
  PromoPosition,
  CarouselPageType,
  CarouselPageConfig,
  SocialStudioPresetConfig,
  SocialStudioProperty,
  TextEffectTemplate,
  TextEffectPosition,
  CalloutPointer,
  CustomTextItem,
  BannerRenderOptions,
  TextEffectLineConfig,
  TextEffectCardMode,
} from "../types";
import { STARTER_TEMPLATES } from "../constants/starter-templates";

export interface UseSocialStudioStateProps {
  isOpen: boolean;
  property: SocialStudioProperty;
  initialLanguage?: StudioLanguage;
}

export function useSocialStudioState({ isOpen, property, initialLanguage = "th" }: UseSocialStudioStateProps) {
  // 4-Languages Support (TH, EN, ZH, RU)
  const [language, setLanguage] = useState<StudioLanguage>(initialLanguage);

  // Base Visual State
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [theme, setTheme] = useState<StudioTheme>("luxury");
  const [layout, setLayout] = useState<StudioLayout>("single");
  const [fitWithBlurredBackdrop, setFitWithBlurredBackdrop] = useState<boolean>(false);
  const [slotIndices, setSlotIndices] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [slotCropOffsets, setSlotCropOffsets] = useState<Record<number, { x: number; y: number }>>({});

  const updateSlotCropOffset = (slotIdx: number, offset: { x?: number; y?: number }) => {
    setSlotCropOffsets((prev) => ({
      ...prev,
      [slotIdx]: {
        x: offset.x !== undefined ? Math.max(-100, Math.min(100, offset.x)) : (prev[slotIdx]?.x ?? 0),
        y: offset.y !== undefined ? Math.max(-100, Math.min(100, offset.y)) : (prev[slotIdx]?.y ?? 0),
      },
    }));
  };

  const resetSlotCropOffset = (slotIdx: number) => {
    setSlotCropOffsets((prev) => {
      const next = { ...prev };
      delete next[slotIdx];
      return next;
    });
  };

  // Extract Project Name reliably
  const initialProjectName = useMemo(() => {
    if (initialLanguage === "en") {
      const en = (property as any)?.project_name_en?.trim() || (property?.project?.name as any)?.en?.trim();
      if (en) return en;
      if (property?.title_en?.trim()) return property.title_en.trim();
    }
    if (property.project_name && property.project_name.trim()) return property.project_name.trim();
    if (property.project?.name) {
      if (typeof property.project.name === "object") {
        return initialLanguage === "en"
          ? property.project.name.en || property.project.name.th || ""
          : property.project.name.th || property.project.name.en || property.project.name.cn || property.project.name.ru || "";
      }
      if (typeof property.project.name === "string") return property.project.name;
    }
    return "";
  }, [property.project_name, property.project, property.title_en, initialLanguage]);

  // Editable Text Customization
  const [customProjectName, setCustomProjectName] = useState<string>(initialProjectName);
  const [customTitle, setCustomTitle] = useState<string>(
    initialLanguage === "en" && property.title_en ? property.title_en : (property.title || "")
  );
  const [customTransitText, setCustomTransitText] = useState<string>("");

  // Helper: Reliable Clean Project Name across 4 languages
  const getCleanPropertyProjectName = useCallback(() => {
    if (language === "en") {
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
    if (language === "zh") {
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
    if (language === "ru") {
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
      initialProjectName?.trim() ||
      property?.project_name?.trim() ||
      (typeof property?.project?.name === "string"
        ? property.project.name.trim()
        : (property?.project?.name as any)?.th?.trim()) ||
      property?.title?.trim() ||
      "ดีลเด็ด คอนโดพร้อมอยู่!"
    );
  }, [property, initialProjectName, customProjectName, language]);

  // Helper: Reliable Clean Specs Text (Beds / Baths / Sqm) across 4 languages
  const getCleanPropertySpecsText = useCallback(() => {
    const parts: string[] = [];
    if (property?.bedrooms) {
      if (language === "en") parts.push(`${property.bedrooms} ${property.bedrooms === 1 ? "Bed" : "Beds"}`);
      else if (language === "zh") parts.push(`${property.bedrooms} 卧`);
      else if (language === "ru") parts.push(`${property.bedrooms} спальн.`);
      else parts.push(`${property.bedrooms} นอน`);
    }
    if (property?.bathrooms) {
      if (language === "en") parts.push(`${property.bathrooms} ${property.bathrooms === 1 ? "Bath" : "Baths"}`);
      else if (language === "zh") parts.push(`${property.bathrooms} 卫`);
      else if (language === "ru") parts.push(`${property.bathrooms} сануз.`);
      else parts.push(`${property.bathrooms} น้ำ`);
    }
    if (property?.size_sqm) {
      if (language === "en") parts.push(`${property.size_sqm} Sq.m.`);
      else if (language === "zh") parts.push(`${property.size_sqm} 平米`);
      else if (language === "ru") parts.push(`${property.size_sqm} кв.м`);
      else parts.push(`${property.size_sqm} ตร.ม.`);
    }
    return parts.join(" ");
  }, [property?.bedrooms, property?.bathrooms, property?.size_sqm, language]);

  // Helper: Reliable Clean Price Text across 4 languages & styles
  const getCleanPropertyPriceText = useCallback((priceStyle?: StudioPriceFormatStyle) => {
    if (!property?.price && !property?.rental_price) {
      return (
        language === "en"
          ? "Contact for Price"
          : language === "zh"
            ? "咨询价格"
            : language === "ru"
              ? "Цена по запросу"
              : "ติดต่อสอบถาม"
      );
    }
    return formatStudioPrice(
      property.listing_type,
      property.price,
      property.rental_price,
      language,
      priceStyle || "default"
    );
  }, [property?.listing_type, property?.price, property?.rental_price, language]);

  // Helper: Smart Multi-line Text Effect Layer Adapter for Current Property
  const updateLineConfigsForCurrentProperty = useCallback((
    presetLines: TextEffectLineConfig[],
    formatStyle?: StudioPriceFormatStyle
  ): TextEffectLineConfig[] => {
    if (!presetLines || presetLines.length === 0) return presetLines;

    const propProject = getCleanPropertyProjectName();
    const propSpecs = getCleanPropertySpecsText();
    const propPrice = getCleanPropertyPriceText(formatStyle);

    // Regex to match Specs keywords (Thai, English, Chinese, Russian)
    const isSpecsLine = (txt: string) =>
      /(นอน|น้ำ|ตร\.?ม|ตร\.?ว|sq\.?m|sqm|sqft|bed|bath|studio|สตูดิโอ|floor|ชั้น|ห้องนอน|ห้องน้ำ|卧|卫|平米|спальн|сануз|кв\.м)/i.test(txt);

    // Regex to match Price keywords & currency
    const isPriceLine = (txt: string) =>
      /(฿|บาท|thb|\$|usd|¥|€|₽|\/ด|\/เดือน|\/mo|\/month|\/night|\/คืน|\/ปี|\/yr|ล้าน|price|rental|咨询价格|Цена)/i.test(txt);

    const hasExplicitSpecs = presetLines.some((l) => isSpecsLine(l.text));
    const hasExplicitPrice = presetLines.some((l) => isPriceLine(l.text));

    return presetLines.map((line, idx) => {
      // 1. Explicit Price match
      if (isPriceLine(line.text)) {
        return { ...line, text: propPrice };
      }

      // 2. Explicit Specs match
      if (isSpecsLine(line.text)) {
        return { ...line, text: propSpecs || line.text };
      }

      // 3. Fallback matching when lines don't have explicit keywords:
      if (!hasExplicitSpecs && !hasExplicitPrice) {
        if (idx === 0) return { ...line, text: propProject };
        if (idx === 1 && presetLines.length >= 2) return { ...line, text: propSpecs || propPrice };
        if (idx === 2 && presetLines.length >= 3) return { ...line, text: propPrice };
      } else {
        // Line 0 is project name if it didn't match price or specs
        if (idx === 0 && !isPriceLine(line.text) && !isSpecsLine(line.text)) {
          return { ...line, text: propProject };
        }
        // If price wasn't found in any line, assign it to the last line
        if (!hasExplicitPrice && idx === presetLines.length - 1 && presetLines.length >= 2) {
          return { ...line, text: propPrice };
        }
        // If specs wasn't found in any line, assign it to line 1 in 3+ line layouts
        if (!hasExplicitSpecs && idx === 1 && presetLines.length >= 3) {
          return { ...line, text: propSpecs || line.text };
        }
      }

      return line;
    });
  }, [getCleanPropertyProjectName, getCleanPropertySpecsText, getCleanPropertyPriceText]);

  useEffect(() => {
    // When property changes (e.g. user opens modal for Property B after Property A)
    // always sync current property data
    const projName = initialProjectName;
    const currentPropTitle = language === "en" && property.title_en ? property.title_en : property.title || "";
    setCustomProjectName(projName);
    setCustomTitle(currentPropTitle);
    setCustomTransitText("");
    hasFetchedInitialAI.current = false;
    fetchAIContent(language);

    // Sync Text Effect lines to current property
    setTextEffectLineConfigs((prev) => {
      const propProject = getCleanPropertyProjectName();
      if (!prev || prev.length === 0) {
        return [{
          id: "line-1",
          text: propProject,
          template: "same",
          sizeScale: 1.0,
          xOffset: 0,
          yOffset: 0,
          rotation: 0,
          curve: 0,
        }];
      }
      return updateLineConfigsForCurrentProperty(prev);
    });

    if (property?.is_foreigner_quota) {
      setSelectedBadges(["Foreign Freehold"]);
    } else {
      setSelectedBadges([]);
    }
  }, [property.id, initialProjectName, getCleanPropertyProjectName, updateLineConfigsForCurrentProperty]);

  // Card Geometry & Style State
  const [cardBackground, setCardBackground] = useState<CardBackground>("glass");
  const [cardHeightPercent, setCardHeightPercent] = useState<number>(0);
  const [cardWidthPercent, setCardWidthPercent] = useState<number>(0);
  const [cardTextAlign, setCardTextAlign] = useState<"left" | "center" | "right">("left");
  const [cardOpacity, setCardOpacity] = useState<number>(62);
  const [scrimOpacity, setScrimOpacity] = useState<number>(30);
  const [topScrimOpacity, setTopScrimOpacity] = useState<number>(30);
  const [bottomScrimOpacity, setBottomScrimOpacity] = useState<number>(30);
  const [priceFormatStyle, setPriceFormatStyle] = useState<StudioPriceFormatStyle>("default");
  const [cardYOffset, setCardYOffset] = useState<number>(0);
  const [cardRightMargin, setCardRightMargin] = useState<number>(0);
  const [contentPosition, setContentPosition] = useState<ContentPosition>("bottom");
  const [fontSizeScale, setFontSizeScale] = useState<FontSizeScale>("md");
  const [priceFontSizeScale, setPriceFontSizeScale] = useState<FontSizeScale>("md");

  // Custom Colors
  const [customAccentColor, setCustomAccentColor] = useState<string>("#F59E0B");
  const [customTitleColor, setCustomTitleColor] = useState<string>("#FFFFFF");
  const [customPriceColor, setCustomPriceColor] = useState<string>("#FFFFFF");
  const [customHeadlineColor, setCustomHeadlineColor] = useState<string>("#F59E0B");
  const [customProjectNameColor, setCustomProjectNameColor] = useState<string>("#FFFFFF");
  const [customCardBgColor, setCustomCardBgColor] = useState<string>("");
  const [customCanvasBgColor, setCustomCanvasBgColor] = useState<string>("#000000");
  const [customListingBadgeBgColor, setCustomListingBadgeBgColor] = useState<string>("#F59E0B");
  const [customListingBadgeTextColor, setCustomListingBadgeTextColor] = useState<string>("#000000");

  // Grid & Promo Overlays
  const [gridLineWidth, setGridLineWidth] = useState<number>(8);
  const [gridLineColor, setGridLineColor] = useState<string>("#000000");
  const [promoText, setPromoText] = useState<string>("");
  const [promoPosition, setPromoPosition] = useState<PromoPosition>("top_right");
  const [promoColor, setPromoColor] = useState<string>("#EF4444");
  const [promoTextColor, setPromoTextColor] = useState<string>("#FFFFFF");
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>("none");

  // Carousel & Zones
  const [activeCarouselPage, setActiveCarouselPage] = useState<CarouselPageType>("cover");
  const [carouselPages, setCarouselPages] = useState<CarouselPageConfig[]>([
    { type: "cover", enabled: true },
    { type: "specs_highlights", enabled: true },
    { type: "location_map", enabled: true },
    { type: "contact_cta", enabled: true },
  ]);

  const [zoneMapping, setZoneMapping] = useState<ElementZoneMapping>({
    projectName: "zone_a",
    title: "zone_a",
    headline: "zone_a",
    location: "zone_b",
    price: "zone_b",
    specs: "zone_b",
    contact: "zone_b",
  });
  const [card1YOffset, setCard1YOffset] = useState<number>(0);
  const [card2YOffset, setCard2YOffset] = useState<number>(0);

  // Modular Field Visibility Toggles
  const [showCardContent, setShowCardContent] = useState<boolean>(true);
  const [cardBorderGlow, setCardBorderGlow] = useState<boolean>(true);
  const [glowBorderWidth, setGlowBorderWidth] = useState<number>(55);
  const [centerGlow, setCenterGlow] = useState<number>(100);
  const [centerGlowBlur, setCenterGlowBlur] = useState<number>(5);
  const [centerGlowColor, setCenterGlowColor] = useState<string>("#FFFFFF");
  const [glassBlur, setGlassBlur] = useState<number>(24);
  const [showBrandingHeader, setShowBrandingHeader] = useState<boolean>(true);
  const [brandingHeaderStyle, setBrandingHeaderStyle] = useState<"classic_left" | "frosted_capsule">("frosted_capsule");
  const [brandingHeaderAlign, setBrandingHeaderAlign] = useState<"center" | "left">("center");
  const [brandingBgColor, setBrandingBgColor] = useState<string>("");
  const [brandingTitleColor, setBrandingTitleColor] = useState<string>("");
  const [brandingSubtitleColor, setBrandingSubtitleColor] = useState<string>("");
  const [customCompanyName, setCustomCompanyName] = useState<string>("");
  const [customCompanySubtitle, setCustomCompanySubtitle] = useState<string>("");
  const [showTopListingBadge, setShowTopListingBadge] = useState<boolean>(true);
  const [headerFontSizeScale, setHeaderFontSizeScale] = useState<FontSizeScale>("md");
  const [brandingTitleFontSizeScale, setBrandingTitleFontSizeScale] = useState<FontSizeScale>("md");
  const [brandingSubtitleFontSizeScale, setBrandingSubtitleFontSizeScale] = useState<FontSizeScale>("md");
  const [badgeFontSizeScale, setBadgeFontSizeScale] = useState<FontSizeScale>("md");
  const [specFontSizeScale, setSpecFontSizeScale] = useState<SpecFontSizeScale>("xl");
  const [headerYOffset, setHeaderYOffset] = useState<number>(0);
  const [showLocation, setShowLocation] = useState<boolean>(true);
  const [showProjectName, setShowProjectName] = useState<boolean>(true);
  const [showListingType, setShowListingType] = useState<boolean>(true);
  const [showTitle, setShowTitle] = useState<boolean>(true);
  const [showSpecs, setShowSpecs] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showOriginalPrice, setShowOriginalPrice] = useState<boolean>(true);
  const [showHeadline, setShowHeadline] = useState<boolean>(true);
  const [showUsdApprox, setShowUsdApprox] = useState<boolean>(false);

  // Viral Text Effect State
  const [textEffectTemplate, setTextEffectTemplate] = useState<TextEffectTemplate>("none");
  const [textEffectText, setTextEffectText] = useState<string>("");
  const [textEffectPosition, setTextEffectPosition] = useState<TextEffectPosition>("center");
  const [textEffectSize, setTextEffectSize] = useState<FontSizeScale | "2xl">("lg");
  const [textEffectXOffset, setTextEffectXOffset] = useState<number>(0);
  const [textEffectYOffset, setTextEffectYOffset] = useState<number>(0);
  const [textEffectRotation, setTextEffectRotation] = useState<number>(0);
  const [textEffectCurve, setTextEffectCurve] = useState<number>(0);
  const [textEffectCustomTextColor, setTextEffectCustomTextColor] = useState<string>("#FFFFFF");
  const [textEffectCustomBgColor, setTextEffectCustomBgColor] = useState<string>("#0F172A");
  const [textEffectCustomBorderColor, setTextEffectCustomBorderColor] = useState<string>("#F59E0B");
  const [textEffectCustomShadowColor, setTextEffectCustomShadowColor] = useState<string>("rgba(0,0,0,0.5)");
  const [textEffectCustomBgAlpha, setTextEffectCustomBgAlpha] = useState<number>(85);
  const [textEffectCustomBorderWidth, setTextEffectCustomBorderWidth] = useState<number>(2);

  // Line 2 (Sub-line) Independent Typography & Styling
  const [textEffectLine2Template, setTextEffectLine2Template] = useState<TextEffectTemplate | "same">("same");
  const [textEffectLine2SizeScale, setTextEffectLine2SizeScale] = useState<number>(0.85);
  const [textEffectLine2CustomTextColor, setTextEffectLine2CustomTextColor] = useState<string>("");
  const [textEffectLine2CustomBgColor, setTextEffectLine2CustomBgColor] = useState<string>("");
  const [textEffectLine2CustomBorderColor, setTextEffectLine2CustomBorderColor] = useState<string>("");
  const [textEffectLine2CustomShadowColor, setTextEffectLine2CustomShadowColor] = useState<string>("");
  const [textEffectLineSpacing, setTextEffectLineSpacing] = useState<number>(12);

  // Single Card Mode State (ยุบรวมทุกบรรทัดเป็นการ์ดแผ่นเดียว ลดความหนา >30%)
  const [textEffectCardMode, setTextEffectCardMode] = useState<TextEffectCardMode>("stacked_pills");
  const [textEffectSingleCardBgColor, setTextEffectSingleCardBgColor] = useState<string>("#FFFFFF");
  const [textEffectSingleCardTextColor, setTextEffectSingleCardTextColor] = useState<string>("#0F172A");
  const [textEffectSingleCardBorderColor, setTextEffectSingleCardBorderColor] = useState<string>("rgba(226, 232, 240, 0.9)");
  const [textEffectSingleCardBorderWidth, setTextEffectSingleCardBorderWidth] = useState<number>(1);
  const [textEffectSingleCardRadius, setTextEffectSingleCardRadius] = useState<number>(20);
  const [textEffectSingleCardPadding, setTextEffectSingleCardPadding] = useState<number>(20);
  const [textEffectSingleCardAlign, setTextEffectSingleCardAlign] = useState<"center" | "left" | "right">("center");
  const [textEffectSingleCardOpacity, setTextEffectSingleCardOpacity] = useState<number>(98);

  // Dynamic Multi-Line Text Effect Layers (Universal Canva / CapCut standard)
  const [textEffectLineConfigs, setTextEffectLineConfigs] = useState<TextEffectLineConfig[]>([
    {
      id: "line-1",
      text: initialProjectName || (initialLanguage === "en" ? (property.title_en || property.title || "Exclusive Deal Ready to Move In!") : (property.project_name || property.title || "ดีลเด็ด คอนโดพร้อมอยู่!")),
      template: "same",
      sizeScale: 1.0,
      xOffset: 0,
      yOffset: 0,
      rotation: 0,
      curve: 0,
    },
  ]);

  const addTextEffectLine = useCallback((text?: string, template?: TextEffectTemplate) => {
    setTextEffectLineConfigs((prev) => {
      if (prev.length >= 6) {
        toast.info(language === "en" ? "Maximum 6 text lines allowed" : "จำกัดข้อความสูงสุด 6 บรรทัดครับ");
        return prev;
      }
      const newLine: TextEffectLineConfig = {
        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        text: text || "",
        template: template || "same",
        sizeScale: 0.85,
        xOffset: 0,
        yOffset: 0,
        rotation: 0,
        curve: 0,
      };
      return [...prev, newLine];
    });
  }, []);

  const updateTextEffectLine = useCallback((id: string, updates: Partial<TextEffectLineConfig>) => {
    setTextEffectLineConfigs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const removeTextEffectLine = useCallback((id: string) => {
    setTextEffectLineConfigs((prev) => {
      if (prev.length <= 1) {
        toast.info("ต้องมีข้อความอย่างน้อย 1 บรรทัดครับ");
        return prev;
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  // Callout Feature Pointers
  const [calloutPointers, setCalloutPointers] = useState<CalloutPointer[]>([]);

  const addCalloutPointer = (pointer: CalloutPointer) => {
    if (calloutPointers.length >= 4) {
      toast.info("จำกัดลูกศรชี้จุดเด่นสูงสุด 4 จุดครับ");
      return;
    }
    setCalloutPointers((prev) => [...prev, pointer]);
  };

  const updateCalloutPointer = (id: string, updates: Partial<CalloutPointer>) => {
    setCalloutPointers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const removeCalloutPointer = (id: string) => {
    setCalloutPointers((prev) => prev.filter((p) => p.id !== id));
  };

  // Background Dark Tint / Dimming Overlay (0 - 100%) & Blur (0 - 30px)
  const [bgDimOpacity, setBgDimOpacity] = useState<number>(0);
  const [bgBlur, setBgBlur] = useState<number>(0);

  // Additional Custom Text Badges & Stickers
  const [customTexts, setCustomTexts] = useState<CustomTextItem[]>([]);

  const addCustomText = (item: CustomTextItem) => {
    if (customTexts.length >= 6) {
      toast.info("จำกัดข้อความเพิ่มเติมสูงสุด 6 รายการครับ");
      return;
    }
    setCustomTexts((prev) => [...prev, item]);
  };

  const updateCustomText = (id: string, updates: Partial<CustomTextItem>) => {
    setCustomTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const removeCustomText = (id: string) => {
    setCustomTexts((prev) => prev.filter((t) => t.id !== id));
  };

  // Badges, QR & Contact
  const [selectedBadges, setSelectedBadges] = useState<string[]>(() => {
    if (property?.is_foreigner_quota) {
      return ["Foreign Freehold"];
    }
    return [];
  });
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [showContact, setShowContact] = useState<boolean>(false);
  const [showAgentAvatar, setShowAgentAvatar] = useState<boolean>(false);

  // AI Content State
  const [headline, setHeadline] = useState<string>("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [caption, setCaption] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Presets
  const [presets, setPresets] = useState<Record<string, SocialStudioPresetConfig>>({});
  const [isLoadingPresets, setIsLoadingPresets] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Extract real property image URLs
  const imageUrls = useMemo(() => {
    const rawImages = property.images || [];
    const sortedRaw = [...rawImages].sort((a: any, b: any) => {
      const aCover = typeof a === "object" && a ? !!a.is_cover : false;
      const bCover = typeof b === "object" && b ? !!b.is_cover : false;
      if (aCover && !bCover) return -1;
      if (!aCover && bCover) return 1;
      const aSort = typeof a === "object" && a ? (a.sort_order ?? 0) : 0;
      const bSort = typeof b === "object" && b ? (b.sort_order ?? 0) : 0;
      return aSort - bSort;
    });

    const urls: string[] = [];
    sortedRaw.forEach((img) => {
      let u: string | null = null;
      let isCover = false;

      if (typeof img === "string") {
        if (!img.startsWith("data:image/")) u = img;
      } else if (img && typeof img === "object") {
        u = (img as any).url || (img as any).image_url || (img as any).storage_path || null;
        isCover = !!(img as any).is_cover;
      }

      if (u && !u.startsWith("data:image/")) {
        const fullUrl = (u.startsWith("http://") || u.startsWith("https://"))
          ? u
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/${u}`;

        if (!urls.includes(fullUrl)) {
          if (isCover) urls.unshift(fullUrl);
          else urls.push(fullUrl);
        }
      }
    });

    if (urls.length === 0) {
      urls.push(siteConfig.ogImage || "/hero-realestate.png");
    }
    return urls;
  }, [property.images]);

  // Load Presets
  useEffect(() => {
    if (isOpen) {
      if (Object.keys(presets).length === 0) {
        setIsLoadingPresets(true);
      }
      getSocialStudioPresets()
        .then((data) => {
          setPresets(data || {});
          setIsLoadingPresets(false);
        })
        .catch(() => {
          setIsLoadingPresets(false);
        });
    }
  }, [isOpen]);

  const handleApplyPreset = (key: string) => {
    const config = presets[key];
    if (!config) return;

    if (config.aspectRatio) setAspectRatio(config.aspectRatio);
    if (config.theme) setTheme(config.theme);
    if (config.layout) setLayout(config.layout);
    if (config.contentPosition) setContentPosition(config.contentPosition);
    if (config.fontSizeScale) setFontSizeScale(config.fontSizeScale);
    if (config.priceFontSizeScale) setPriceFontSizeScale(config.priceFontSizeScale);
    if (config.specFontSizeScale) setSpecFontSizeScale(config.specFontSizeScale);
    if (config.zoneMapping) setZoneMapping(config.zoneMapping);
    if (config.card1YOffset !== undefined) setCard1YOffset(config.card1YOffset);
    if (config.card2YOffset !== undefined) setCard2YOffset(config.card2YOffset);
    if (config.cardHeightPercent !== undefined) setCardHeightPercent(config.cardHeightPercent);
    if (config.cardWidthPercent !== undefined) setCardWidthPercent(config.cardWidthPercent);
    if (config.cardTextAlign) setCardTextAlign(config.cardTextAlign);
    if (config.cardOpacity !== undefined) setCardOpacity(config.cardOpacity);
    if (config.scrimOpacity !== undefined) setScrimOpacity(config.scrimOpacity);
    if (config.topScrimOpacity !== undefined) setTopScrimOpacity(config.topScrimOpacity);
    if (config.bottomScrimOpacity !== undefined) setBottomScrimOpacity(config.bottomScrimOpacity);
    if (config.priceFormatStyle) setPriceFormatStyle(config.priceFormatStyle);
    if (config.cardBackground) setCardBackground(config.cardBackground);
    if (config.cardYOffset !== undefined) setCardYOffset(config.cardYOffset);
    if (config.customAccentColor) setCustomAccentColor(config.customAccentColor);
    if (config.promoPosition) setPromoPosition(config.promoPosition);
    if (config.promoColor) setPromoColor(config.promoColor);
    if (config.promoTextColor) setPromoTextColor(config.promoTextColor);
    if (config.photoFilter) setPhotoFilter(config.photoFilter);
    if (config.gridLineWidth !== undefined) setGridLineWidth(config.gridLineWidth);
    if (config.gridLineColor) setGridLineColor(config.gridLineColor);
    if (config.customTitleColor) setCustomTitleColor(config.customTitleColor);
    if (config.customPriceColor) setCustomPriceColor(config.customPriceColor);
    if (config.customHeadlineColor) setCustomHeadlineColor(config.customHeadlineColor);
    if (config.customProjectNameColor) setCustomProjectNameColor(config.customProjectNameColor);
    if (config.customCardBgColor) setCustomCardBgColor(config.customCardBgColor);
    if (config.customCanvasBgColor) setCustomCanvasBgColor(config.customCanvasBgColor);
    if (config.customListingBadgeBgColor) setCustomListingBadgeBgColor(config.customListingBadgeBgColor);
    if (config.customListingBadgeTextColor) setCustomListingBadgeTextColor(config.customListingBadgeTextColor);
    if (config.showBrandingHeader !== undefined) setShowBrandingHeader(config.showBrandingHeader);
    if (config.brandingHeaderStyle) setBrandingHeaderStyle(config.brandingHeaderStyle);
    if (config.brandingHeaderAlign) setBrandingHeaderAlign(config.brandingHeaderAlign);
    if (config.brandingBgColor !== undefined) setBrandingBgColor(config.brandingBgColor);
    if (config.brandingTitleColor !== undefined) setBrandingTitleColor(config.brandingTitleColor);
    if (config.brandingSubtitleColor !== undefined) setBrandingSubtitleColor(config.brandingSubtitleColor);

    // Keep branding company name aligned with current property unless custom company name was explicitly customized
    const currentPropProject = getCleanPropertyProjectName();
    if (config.customCompanyName && !config.customCompanyName.includes("VCC") && !config.customCompanyName.toLowerCase().includes("agency") && !config.customCompanyName.toLowerCase().includes("realty") && !config.customCompanyName.toLowerCase().includes("asset")) {
      setCustomCompanyName(currentPropProject);
    } else if (config.customCompanyName) {
      setCustomCompanyName(config.customCompanyName);
    } else {
      setCustomCompanyName(currentPropProject || "VCC Asset");
    }

    const area = property.popular_area || property.province || "";
    if (config.customCompanySubtitle && !config.customCompanySubtitle.includes("•")) {
      setCustomCompanySubtitle(config.customCompanySubtitle);
    } else {
      setCustomCompanySubtitle(area ? `LUXURY PROPERTIES • ${area.toUpperCase()}` : "PREMIUM REAL ESTATE");
    }

    if (config.showTopListingBadge !== undefined) setShowTopListingBadge(config.showTopListingBadge);
    if (config.headerFontSizeScale) setHeaderFontSizeScale(config.headerFontSizeScale);
    if (config.brandingTitleFontSizeScale) setBrandingTitleFontSizeScale(config.brandingTitleFontSizeScale);
    if (config.brandingSubtitleFontSizeScale) setBrandingSubtitleFontSizeScale(config.brandingSubtitleFontSizeScale);
    if (config.badgeFontSizeScale) setBadgeFontSizeScale(config.badgeFontSizeScale);
    if (config.headerYOffset !== undefined) setHeaderYOffset(config.headerYOffset);
    if (config.cardRightMargin !== undefined) setCardRightMargin(config.cardRightMargin);
    if (config.showHeadline !== undefined) setShowHeadline(config.showHeadline);
    if (config.showUsdApprox !== undefined) setShowUsdApprox(config.showUsdApprox);
    if (config.showCardContent !== undefined) setShowCardContent(config.showCardContent);
    if (config.cardBorderGlow !== undefined) setCardBorderGlow(config.cardBorderGlow);
    if (config.textEffectTemplate) setTextEffectTemplate(config.textEffectTemplate);
    if (config.textEffectPosition) setTextEffectPosition(config.textEffectPosition);
    if (config.textEffectSize) setTextEffectSize(config.textEffectSize);
    if (config.textEffectXOffset !== undefined) setTextEffectXOffset(config.textEffectXOffset);
    if (config.textEffectYOffset !== undefined) setTextEffectYOffset(config.textEffectYOffset);
    if (config.textEffectRotation !== undefined) setTextEffectRotation(config.textEffectRotation);
    if (config.textEffectCurve !== undefined) setTextEffectCurve(config.textEffectCurve);
    if (config.textEffectCustomTextColor) setTextEffectCustomTextColor(config.textEffectCustomTextColor);
    if (config.textEffectCustomBgColor) setTextEffectCustomBgColor(config.textEffectCustomBgColor);
    if (config.textEffectCustomBorderColor) setTextEffectCustomBorderColor(config.textEffectCustomBorderColor);
    if (config.textEffectCustomShadowColor) setTextEffectCustomShadowColor(config.textEffectCustomShadowColor);
    if (config.textEffectCustomBgAlpha !== undefined) setTextEffectCustomBgAlpha(config.textEffectCustomBgAlpha);
    if (config.textEffectCustomBorderWidth !== undefined) setTextEffectCustomBorderWidth(config.textEffectCustomBorderWidth);
    
    // Apply Text Effect styles while adapting all line texts to current property (Project, Specs, Price)
    if (config.textEffectLineConfigs && config.textEffectLineConfigs.length > 0) {
      const updatedLines = updateLineConfigsForCurrentProperty(
        config.textEffectLineConfigs,
        config.priceFormatStyle
      );
      setTextEffectLineConfigs(updatedLines);
      setTextEffectText(updatedLines.map((l) => l.text).join("\n"));
    }
    if (config.textEffectCardMode) setTextEffectCardMode(config.textEffectCardMode);
    if (config.textEffectSingleCardBgColor) setTextEffectSingleCardBgColor(config.textEffectSingleCardBgColor);
    if (config.textEffectSingleCardTextColor) setTextEffectSingleCardTextColor(config.textEffectSingleCardTextColor);
    if (config.textEffectSingleCardBorderColor) setTextEffectSingleCardBorderColor(config.textEffectSingleCardBorderColor);
    if (config.textEffectSingleCardBorderWidth !== undefined) setTextEffectSingleCardBorderWidth(config.textEffectSingleCardBorderWidth);
    if (config.textEffectSingleCardRadius !== undefined) setTextEffectSingleCardRadius(config.textEffectSingleCardRadius);
    if (config.textEffectSingleCardPadding !== undefined) setTextEffectSingleCardPadding(config.textEffectSingleCardPadding);
    if (config.textEffectSingleCardAlign) setTextEffectSingleCardAlign(config.textEffectSingleCardAlign);
    if (config.textEffectSingleCardOpacity !== undefined) setTextEffectSingleCardOpacity(config.textEffectSingleCardOpacity);
    if (config.calloutPointers) setCalloutPointers(config.calloutPointers);
    if (config.bgDimOpacity !== undefined) setBgDimOpacity(config.bgDimOpacity);
    if (config.customTexts) setCustomTexts(config.customTexts);
    if (config.fitWithBlurredBackdrop !== undefined) setFitWithBlurredBackdrop(config.fitWithBlurredBackdrop);
    if (config.glowBorderWidth !== undefined) setGlowBorderWidth(config.glowBorderWidth);
    if (config.centerGlow !== undefined) setCenterGlow(config.centerGlow);
    if (config.centerGlowBlur !== undefined) setCenterGlowBlur(config.centerGlowBlur);
    if (config.centerGlowColor !== undefined) setCenterGlowColor(config.centerGlowColor);
    if (config.glassBlur !== undefined) setGlassBlur(config.glassBlur);
    if (config.bgBlur !== undefined) setBgBlur(config.bgBlur);
    if (config.slotCropOffsets) setSlotCropOffsets(config.slotCropOffsets);

    toast.success(`Applied Custom ${key.split("_")[1]} preset!`);
  };

  const handleApplyCuratedPreset = (presetId: string) => {
    const template = STARTER_TEMPLATES.find((t) => t.id === presetId);
    if (template) {
      const cfg = template.config;
      setAspectRatio(cfg.aspectRatio);
      setLayout(cfg.layout);
      setTheme(cfg.theme);
      setCardBackground(cfg.cardBackground);
      setCardOpacity(cfg.cardOpacity);
      setContentPosition(cfg.contentPosition);
      setFontSizeScale(cfg.fontSizeScale);
      setPriceFontSizeScale(cfg.priceFontSizeScale);
      if (cfg.specFontSizeScale) setSpecFontSizeScale(cfg.specFontSizeScale);
      setPriceFormatStyle(cfg.priceFormatStyle);
      setPhotoFilter(cfg.photoFilter);
      setBgBlur(cfg.bgBlur || 0);
      setBgDimOpacity(cfg.bgDimOpacity || 0);
      if (cfg.fitWithBlurredBackdrop !== undefined) setFitWithBlurredBackdrop(cfg.fitWithBlurredBackdrop);
      if (cfg.gridLineWidth !== undefined) setGridLineWidth(cfg.gridLineWidth);
      if (cfg.gridLineColor !== undefined) setGridLineColor(cfg.gridLineColor);
      if (cfg.customPriceColor !== undefined) setCustomPriceColor(cfg.customPriceColor);
      if (cfg.customAccentColor !== undefined) setCustomAccentColor(cfg.customAccentColor);
      if (cfg.customCardBgColor !== undefined) setCustomCardBgColor(cfg.customCardBgColor);
      if (cfg.showCardContent !== undefined) setShowCardContent(cfg.showCardContent);
      if (cfg.showSpecs !== undefined) setShowSpecs(cfg.showSpecs);
      if (cfg.showPrice !== undefined) setShowPrice(cfg.showPrice);
      if (cfg.showHeadline !== undefined) setShowHeadline(cfg.showHeadline);
      if (cfg.showBrandingHeader !== undefined) setShowBrandingHeader(cfg.showBrandingHeader);
      if (cfg.brandingHeaderStyle) setBrandingHeaderStyle(cfg.brandingHeaderStyle);
      if (cfg.brandingHeaderAlign) setBrandingHeaderAlign(cfg.brandingHeaderAlign);
      if (cfg.showUsdApprox !== undefined) setShowUsdApprox(cfg.showUsdApprox);
      if (cfg.textEffectTemplate) setTextEffectTemplate(cfg.textEffectTemplate);
      if (cfg.textEffectPosition) setTextEffectPosition(cfg.textEffectPosition);

      if (cfg.showBrandingHeader) {
        setCustomCompanyName(getCleanPropertyProjectName() || "VCC Asset");
        const area = property.popular_area || property.province || "";
        setCustomCompanySubtitle(area ? `LUXURY PROPERTIES • ${area.toUpperCase()}` : "PREMIUM REAL ESTATE");
      }

      // Sync Text Effect lines to current property if template has text effect
      if (cfg.textEffectTemplate && cfg.textEffectTemplate !== "none") {
        setTextEffectLineConfigs((prev) => {
          const propProject = getCleanPropertyProjectName();
          const propSpecs = getCleanPropertySpecsText();
          const propPrice = getCleanPropertyPriceText(cfg.priceFormatStyle);

          let baseLines: TextEffectLineConfig[] = prev && prev.length > 0 ? prev : [
            {
              id: "line-1",
              text: propProject,
              template: "same",
              sizeScale: 1.0,
              xOffset: 0,
              yOffset: 0,
              rotation: 0,
              curve: 0,
            },
            {
              id: "line-2",
              text: propSpecs,
              template: "same",
              sizeScale: 0.85,
              xOffset: 0,
              yOffset: 0,
              rotation: 0,
              curve: 0,
            },
            {
              id: "line-3",
              text: propPrice,
              template: "same",
              sizeScale: 0.95,
              xOffset: 0,
              yOffset: 0,
              rotation: 0,
              curve: 0,
            },
          ];

          const updated = updateLineConfigsForCurrentProperty(baseLines, cfg.priceFormatStyle);
          setTextEffectText(updated.map((l) => l.text).join("\n"));
          return updated;
        });
      }

      if (cfg.badges && cfg.badges.length > 0) {
        setSelectedBadges((prev) => {
          const combined = [...cfg.badges!, ...prev.filter((b) => !cfg.badges!.includes(b))];
          return combined.slice(0, 3);
        });
      }

      toast.success(
        language === "en"
          ? `Applied ${template.icon} ${template.name.en} template!`
          : `ใช้แม่แบบ ${template.icon} ${template.name.th} เรียบร้อย! ✨`
      );
      return;
    }

    // Fallback legacy IDs
    if (presetId === "editorial_luxury") {
      setCardBackground("glass");
      setTheme("luxury");
      setPriceFormatStyle("symbol_short");
      setCustomPriceColor("#F59E0B");
      setContentPosition("bottom");
      setCardOpacity(62);
      toast.success("Applied 🏛️ Editorial Luxury preset!");
    }
  };

  const handleSavePreset = async (key: string) => {
    const config: SocialStudioPresetConfig = {
      aspectRatio, theme, layout, fitWithBlurredBackdrop, contentPosition, fontSizeScale, priceFontSizeScale, specFontSizeScale, zoneMapping,
      card1YOffset, card2YOffset, cardHeightPercent, cardWidthPercent, cardTextAlign, cardOpacity, scrimOpacity,
      topScrimOpacity, bottomScrimOpacity, priceFormatStyle, cardBackground, cardYOffset, customAccentColor,
      promoPosition, promoColor, promoTextColor, photoFilter, gridLineWidth, gridLineColor, customTitleColor,
      customPriceColor, customHeadlineColor, customProjectNameColor, customCardBgColor, customCanvasBgColor,
      customListingBadgeBgColor, customListingBadgeTextColor, showBrandingHeader, showTopListingBadge,
      brandingHeaderStyle, brandingHeaderAlign, brandingBgColor,
      brandingTitleColor, brandingSubtitleColor, customCompanyName, customCompanySubtitle,
      headerFontSizeScale, brandingTitleFontSizeScale, brandingSubtitleFontSizeScale, badgeFontSizeScale, headerYOffset, cardRightMargin, showHeadline,
      showUsdApprox,
      showCardContent,
      cardBorderGlow,
      glowBorderWidth,
      centerGlow,
      centerGlowBlur,
      centerGlowColor,
      glassBlur,
      textEffectTemplate, textEffectPosition, textEffectSize, textEffectXOffset, textEffectYOffset, textEffectRotation,
      textEffectCurve, textEffectCustomTextColor, textEffectCustomBgColor, textEffectCustomBorderColor,
      textEffectCustomShadowColor, textEffectCustomBgAlpha, textEffectCustomBorderWidth, textEffectLineConfigs,
      textEffectCardMode, textEffectSingleCardBgColor, textEffectSingleCardTextColor, textEffectSingleCardBorderColor,
      textEffectSingleCardBorderWidth, textEffectSingleCardRadius, textEffectSingleCardPadding,
      textEffectSingleCardAlign, textEffectSingleCardOpacity,
      calloutPointers,
      bgDimOpacity, bgBlur, customTexts,
      slotCropOffsets,
    };

    const res = await saveSocialStudioPreset(key, config);
    if (res.success) {
      setPresets((prev) => ({ ...prev, [key]: config }));
      toast.success(`Saved as Custom ${key.split("_")[1]} preset!`);
    } else {
      toast.error(`Failed to save preset: ${res.error}`);
    }
  };

  // Synchronize slot indices with layout
  const currentSlotImageUrls = useMemo(() => {
    return slotIndices.map((idx) => imageUrls[idx % imageUrls.length] || imageUrls[0]);
  }, [slotIndices, imageUrls]);

  // Formatted Displays
  const priceDisplay = useMemo(() => {
    let effectiveStyle = priceFormatStyle;
    if (showUsdApprox && (effectiveStyle === "default" || effectiveStyle === "thb_with_usd")) {
      effectiveStyle = "thb_with_usd";
    } else if (!showUsdApprox && effectiveStyle === "thb_with_usd") {
      effectiveStyle = "default";
    }
    return formatStudioPrice(
      property.listing_type,
      property.price,
      property.rental_price,
      language,
      effectiveStyle
    );
  }, [property.listing_type, property.price, property.rental_price, language, priceFormatStyle, showUsdApprox]);

  const originalPriceDisplay = useMemo(() => {
    const isRent = property.listing_type === "RENT";
    const amount = isRent ? property.original_rental_price : property.original_price;
    if (!amount) return undefined;
    return language === "en" || language === "zh" || language === "ru"
      ? `฿ ${amount.toLocaleString()}`
      : `฿ ${amount.toLocaleString()} บาท`;
  }, [property.listing_type, property.original_price, property.original_rental_price, language]);

  const locationDisplay = useMemo(() => {
    return formatStudioLocation(
      property.popular_area,
      property.province,
      language,
      {
        en: property.popular_area_en,
        cn: property.popular_area_cn,
        ru: property.popular_area_ru,
      }
    );
  }, [property.popular_area, property.popular_area_en, property.popular_area_cn, property.popular_area_ru, property.province, language]);

  const propertyUrl = useMemo(() => {
    const baseUrl = siteConfig.url || "https://vccasset.com";
    return `${baseUrl}/properties/${property.slug || property.id}`;
  }, [property.slug, property.id]);

  const qrCodeImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(propertyUrl)}`;
  }, [propertyUrl]);

  // AI Content Generator
  const fetchAIContent = useCallback(
    async (overrideLang?: StudioLanguage) => {
      const targetLang = overrideLang || language;
      setIsGeneratingAI(true);
      try {
        const targetTitle =
          targetLang === "en" && property.title_en
            ? property.title_en
            : customTitle || property.title;

        const res: BannerContentResult = await generateSocialBannerContentAction({
          title: targetTitle,
          projectName: customProjectName || initialProjectName || null,
          propertyType: property.property_type,
          listingType: property.listing_type,
          price: property.price,
          rentalPrice: property.rental_price,
          popularArea: property.popular_area,
          province: property.province,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sizeSqm: property.size_sqm,
          transitStationName: property.transit_station_name,
          transitDistanceMeters: property.transit_distance_meters,
          language: targetLang === "zh" ? "cn" : targetLang,
        });

        setHeadline(res.headline);
        if (res.translatedTitle) {
          setCustomTitle(res.translatedTitle);
        } else if (targetLang === "en" && property.title_en) {
          setCustomTitle(property.title_en);
        } else if (targetLang === "th") {
          setCustomTitle(property.title);
        }
        setHighlights(res.highlights || []);
        setCaption(res.caption);
        setHashtags(res.hashtags || []);
      } catch (e) {
        console.warn("AI generation failed, fallback to default headline:", e);
        setHeadline(property.title);
      } finally {
        setIsGeneratingAI(false);
      }
    },
    [property, language, customTitle, customProjectName, initialProjectName]
  );

  const handleLanguageChange = (newLang: StudioLanguage) => {
    setLanguage(newLang);
    if (newLang === "en" && property.title_en) {
      setCustomTitle(property.title_en);
    } else if (newLang === "th") {
      setCustomTitle(property.title || "");
    }

    const enProj = (property as any).project_name_en || (property.project?.name as any)?.en;
    if (newLang === "en" && enProj) {
      setCustomProjectName(enProj);
    } else if (newLang === "th") {
      setCustomProjectName(property.project_name || (property.project?.name as any)?.th || initialProjectName);
    } else if (property.project?.name && typeof property.project.name === "object") {
      const pNameInLang =
        newLang === "en"
          ? property.project.name.en || property.project.name.th
          : newLang === "zh"
            ? property.project.name.cn || property.project.name.zh || property.project.name.en || property.project.name.th
            : newLang === "ru"
              ? property.project.name.ru || property.project.name.en || property.project.name.th
              : property.project.name.th || property.project.name.en;
      if (pNameInLang) setCustomProjectName(pNameInLang);
    }

    setTextEffectLineConfigs((prev) => {
      if (!prev || prev.length === 0) return prev;
      const targetProj = newLang === "en"
        ? ((property as any).project_name_en || (property.project?.name as any)?.en || property.title_en || "Exclusive Deal Ready to Move In!")
        : (property.project_name || (property.project?.name as any)?.th || property.title || "ดีลเด็ด คอนโดพร้อมอยู่!");
      return prev.map((line, idx) => idx === 0 ? { ...line, text: targetProj } : line);
    });

    fetchAIContent(newLang);
    const langName =
      newLang === "en"
        ? "English (EN)"
        : newLang === "zh"
          ? "中文 (CN)"
          : newLang === "ru"
            ? "Русский (RU)"
            : "ภาษาไทย (TH)";
    toast.success(newLang === "en" ? `Switched language to ${langName}!` : `เปลี่ยนภาษาเป็น ${langName} แล้ว!`);
  };

  const hasFetchedInitialAI = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFetchedInitialAI.current) {
      hasFetchedInitialAI.current = true;
      fetchAIContent();
    }
  }, [isOpen, fetchAIContent]);

  // Draw Canvas
  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsRendering(true);

    try {
      const renderOpts: BannerRenderOptions = {
        aspectRatio,
        theme,
        layout,
        language,
        cardBackground,
        cardHeightPercent,
        cardWidthPercent,
        cardTextAlign,
        cardOpacity,
        scrimOpacity,
        topScrimOpacity,
        bottomScrimOpacity,
        priceFormatStyle,
        cardYOffset,
        cardRightMargin,
        contentPosition,
        fontSizeScale,
        priceFontSizeScale,
        customAccentColor,
        customTitleColor,
        customPriceColor,
        customHeadlineColor,
        customProjectNameColor,
        customCardBgColor,
        customCanvasBgColor,
        customListingBadgeBgColor,
        customListingBadgeTextColor,
        gridLineWidth,
        gridLineColor,
        promoText,
        promoPosition,
        promoColor,
        promoTextColor,
        photoFilter,
        zoneMapping,
        card1YOffset,
        card2YOffset,
        showCardContent,
        textEffectTemplate,
        textEffectText,
        textEffectPosition,
        textEffectSize,
        textEffectXOffset,
        textEffectYOffset,
        textEffectRotation,
        textEffectCurve,
        textEffectCustomTextColor,
        textEffectCustomBgColor,
        textEffectCustomBorderColor,
        textEffectCustomShadowColor,
        textEffectCustomBgAlpha,
        textEffectCustomBorderWidth,
        textEffectLine2Template,
        textEffectLine2SizeScale,
        textEffectLine2CustomTextColor,
        textEffectLine2CustomBgColor,
        textEffectLine2CustomBorderColor,
        textEffectLine2CustomShadowColor,
        textEffectLineSpacing,
        textEffectLineConfigs,
        textEffectCardMode,
        textEffectSingleCardBgColor,
        textEffectSingleCardTextColor,
        textEffectSingleCardBorderColor,
        textEffectSingleCardBorderWidth,
        textEffectSingleCardRadius,
        textEffectSingleCardPadding,
        textEffectSingleCardAlign,
        textEffectSingleCardOpacity,
        calloutPointers,
        bgDimOpacity,
        bgBlur,
        cardBorderGlow,
        glowBorderWidth,
        centerGlow,
        centerGlowBlur,
        centerGlowColor,
        glassBlur,
        customTexts,
        showBrandingHeader,
        brandingHeaderStyle,
        brandingHeaderAlign,
        brandingBgColor,
        brandingTitleColor,
        brandingSubtitleColor,
        customCompanyName,
        customCompanySubtitle,
        showTopListingBadge,
        headerFontSizeScale,
        brandingTitleFontSizeScale,
        brandingSubtitleFontSizeScale,
        badgeFontSizeScale,
        specFontSizeScale,
        headerYOffset,
        showLocation,
        showProjectName,
        showListingType,
        showTitle,
        showHeadline,
        showSpecs,
        showPrice,
        showOriginalPrice,
        showUsdApprox,
        showQrCode,
        showContact,
        showAgentAvatar,
        imageUrls: currentSlotImageUrls,
        title: customTitle,
        projectName: customProjectName,
        headline,
        highlights,
        propertyType: property.property_type,
        listingType: property.listing_type,
        priceText: priceDisplay,
        originalPriceText: originalPriceDisplay,
        locationText: locationDisplay,
        transitText:
          customTransitText ||
          formatTransitDisplay(
            property.transit_station_name,
            property.transit_type,
            property.transit_distance_meters,
            language,
            {
              en: property.transit_station_name_en,
              cn: property.transit_station_name_cn,
              ru: property.transit_station_name_ru,
            }
          ),
        specs: {
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          sizeSqm: property.size_sqm,
          floor: property.floor,
          parking: property.parking_slots ?? property.parking ?? null,
        },
        ownershipBadge: selectedBadges.find(
          (b) => b.includes("Freehold") || b.includes("Quota") || b.includes("Leasehold")
        ),
        badges: selectedBadges,
        fitWithBlurredBackdrop,
        slotCropOffsets,
        qrCodeUrl: qrCodeImageUrl,
        companyName: siteConfig.name || "VCC ASSET",
        contactPhone: property.assigned_agent?.phone || siteConfig.contact.phone || "02-xxx-xxxx",
        contactLine: property.assigned_agent?.line_id || "@vccasset",
        agentAvatarUrl: property.assigned_agent?.avatar_url || undefined,
        agentName: property.assigned_agent?.full_name || undefined,
      };

      if (activeCarouselPage === "specs_highlights") {
        await renderSpecsHighlightsPage(canvas, renderOpts);
      } else if (activeCarouselPage === "location_map") {
        await renderLocationPage(canvas, renderOpts);
      } else if (activeCarouselPage === "contact_cta") {
        await renderContactCTAPage(canvas, renderOpts);
      } else {
        await renderBannerToCanvas(canvas, renderOpts);
      }
    } catch (err) {
      console.error("Canvas draw error:", err);
    } finally {
      setIsRendering(false);
    }
  }, [
    aspectRatio,
    theme,
    layout,
    language,
    cardBackground,
    cardHeightPercent,
    cardWidthPercent,
    cardTextAlign,
    cardOpacity,
    scrimOpacity,
    topScrimOpacity,
    bottomScrimOpacity,
    priceFormatStyle,
    cardYOffset,
    cardRightMargin,
    contentPosition,
    fontSizeScale,
    priceFontSizeScale,
    customAccentColor,
    customTitleColor,
    customPriceColor,
    customHeadlineColor,
    customProjectNameColor,
    customCardBgColor,
    customCanvasBgColor,
    customListingBadgeBgColor,
    customListingBadgeTextColor,
    gridLineWidth,
    gridLineColor,
    promoText,
    promoPosition,
    promoColor,
    promoTextColor,
    photoFilter,
    activeCarouselPage,
    zoneMapping,
    card1YOffset,
    card2YOffset,
    showBrandingHeader,
    brandingHeaderStyle,
    brandingHeaderAlign,
    showTopListingBadge,
    headerFontSizeScale,
    brandingTitleFontSizeScale,
    brandingSubtitleFontSizeScale,
    badgeFontSizeScale,
    specFontSizeScale,
    headerYOffset,
    showLocation,
    showProjectName,
    showListingType,
    showTitle,
    showHeadline,
    showSpecs,
    showPrice,
    showOriginalPrice,
    showUsdApprox,
    showQrCode,
    showContact,
    showAgentAvatar,
    showCardContent,
    cardBorderGlow,
    textEffectTemplate,
    textEffectText,
    textEffectPosition,
    textEffectSize,
    textEffectXOffset,
    textEffectYOffset,
    textEffectRotation,
    textEffectCurve,
    textEffectCustomTextColor,
    textEffectCustomBgColor,
    textEffectCustomBorderColor,
    textEffectCustomShadowColor,
    textEffectCustomBgAlpha,
    textEffectCustomBorderWidth,
    textEffectLineSpacing,
    textEffectLineConfigs,
    textEffectCardMode,
    textEffectSingleCardBgColor,
    textEffectSingleCardTextColor,
    textEffectSingleCardBorderColor,
    textEffectSingleCardBorderWidth,
    textEffectSingleCardRadius,
    textEffectSingleCardPadding,
    textEffectSingleCardAlign,
    textEffectSingleCardOpacity,
    brandingBgColor,
    brandingTitleColor,
    brandingSubtitleColor,
    customCompanyName,
    customCompanySubtitle,
    calloutPointers,
    bgDimOpacity,
    bgBlur,
    cardBorderGlow,
    glowBorderWidth,
    centerGlow,
    centerGlowBlur,
    centerGlowColor,
    glassBlur,
    customTexts,
    currentSlotImageUrls,
    selectedBadges,
    fitWithBlurredBackdrop,
    slotCropOffsets,
    customProjectName,
    customTitle,
    customTransitText,
    property,
    priceDisplay,
    originalPriceDisplay,
    locationDisplay,
    headline,
    highlights,
    qrCodeImageUrl,
  ]);

  useEffect(() => {
    if (isOpen) {
      drawCanvas();
    }
  }, [isOpen, drawCanvas]);

  return {
    canvasRef,
    isRendering,
    drawCanvas,
    // Language
    language,
    setLanguage,
    handleLanguageChange,
    // Base layout & aspect ratio
    aspectRatio, setAspectRatio,
    theme, setTheme,
    layout, setLayout,
    fitWithBlurredBackdrop, setFitWithBlurredBackdrop,
    slotIndices, setSlotIndices,
    activeSlot, setActiveSlot,
    slotCropOffsets, setSlotCropOffsets,
    updateSlotCropOffset, resetSlotCropOffset,
    imageUrls, currentSlotImageUrls,
    // Card configs
    cardBackground, setCardBackground,
    cardHeightPercent, setCardHeightPercent,
    cardWidthPercent, setCardWidthPercent,
    cardTextAlign, setCardTextAlign,
    cardOpacity, setCardOpacity,
    scrimOpacity, setScrimOpacity,
    topScrimOpacity, setTopScrimOpacity,
    bottomScrimOpacity, setBottomScrimOpacity,
    priceFormatStyle, setPriceFormatStyle,
    cardYOffset, setCardYOffset,
    cardRightMargin, setCardRightMargin,
    contentPosition, setContentPosition,
    fontSizeScale, setFontSizeScale,
    priceFontSizeScale, setPriceFontSizeScale,
    // Custom colors
    customAccentColor, setCustomAccentColor,
    customTitleColor, setCustomTitleColor,
    customPriceColor, setCustomPriceColor,
    customHeadlineColor, setCustomHeadlineColor,
    customProjectNameColor, setCustomProjectNameColor,
    customCardBgColor, setCustomCardBgColor,
    customCanvasBgColor, setCustomCanvasBgColor,
    customListingBadgeBgColor, setCustomListingBadgeBgColor,
    customListingBadgeTextColor, setCustomListingBadgeTextColor,
    // Overlays
    gridLineWidth, setGridLineWidth,
    gridLineColor, setGridLineColor,
    promoText, setPromoText,
    promoPosition, setPromoPosition,
    promoColor, setPromoColor,
    promoTextColor, setPromoTextColor,
    photoFilter, setPhotoFilter,
    bgDimOpacity, setBgDimOpacity,
    bgBlur, setBgBlur,
    // Carousel & zones
    activeCarouselPage, setActiveCarouselPage,
    carouselPages, setCarouselPages,
    zoneMapping, setZoneMapping,
    card1YOffset, setCard1YOffset,
    card2YOffset, setCard2YOffset,
    // Field toggles
    showCardContent, setShowCardContent,
    cardBorderGlow, setCardBorderGlow,
    glowBorderWidth, setGlowBorderWidth,
    centerGlow, setCenterGlow,
    centerGlowBlur, setCenterGlowBlur,
    centerGlowColor, setCenterGlowColor,
    glassBlur, setGlassBlur,
    showBrandingHeader, setShowBrandingHeader,
    brandingHeaderStyle, setBrandingHeaderStyle,
    brandingHeaderAlign, setBrandingHeaderAlign,
    brandingBgColor, setBrandingBgColor,
    brandingTitleColor, setBrandingTitleColor,
    brandingSubtitleColor, setBrandingSubtitleColor,
    customCompanyName, setCustomCompanyName,
    customCompanySubtitle, setCustomCompanySubtitle,
    showTopListingBadge, setShowTopListingBadge,
    headerFontSizeScale, setHeaderFontSizeScale,
    brandingTitleFontSizeScale, setBrandingTitleFontSizeScale,
    brandingSubtitleFontSizeScale, setBrandingSubtitleFontSizeScale,
    badgeFontSizeScale, setBadgeFontSizeScale,
    specFontSizeScale, setSpecFontSizeScale,
    headerYOffset, setHeaderYOffset,
    showLocation, setShowLocation,
    showProjectName, setShowProjectName,
    showListingType, setShowListingType,
    showTitle, setShowTitle,
    showSpecs, setShowSpecs,
    showPrice, setShowPrice,
    showOriginalPrice, setShowOriginalPrice,
    showUsdApprox, setShowUsdApprox,
    showHeadline, setShowHeadline,
    // Text Effects
    textEffectTemplate, setTextEffectTemplate,
    textEffectText, setTextEffectText,
    textEffectPosition, setTextEffectPosition,
    textEffectSize, setTextEffectSize,
    textEffectXOffset, setTextEffectXOffset,
    textEffectYOffset, setTextEffectYOffset,
    textEffectRotation, setTextEffectRotation,
    textEffectCurve, setTextEffectCurve,
    textEffectCustomTextColor, setTextEffectCustomTextColor,
    textEffectCustomBgColor, setTextEffectCustomBgColor,
    textEffectCustomBorderColor, setTextEffectCustomBorderColor,
    textEffectCustomShadowColor, setTextEffectCustomShadowColor,
    textEffectCustomBgAlpha, setTextEffectCustomBgAlpha,
    textEffectCustomBorderWidth, setTextEffectCustomBorderWidth,
    // Line 2 (Sub-line) Independent Typography & Styling
    textEffectLine2Template, setTextEffectLine2Template,
    textEffectLine2SizeScale, setTextEffectLine2SizeScale,
    textEffectLine2CustomTextColor, setTextEffectLine2CustomTextColor,
    textEffectLine2CustomBgColor, setTextEffectLine2CustomBgColor,
    textEffectLine2CustomBorderColor, setTextEffectLine2CustomBorderColor,
    textEffectLine2CustomShadowColor, setTextEffectLine2CustomShadowColor,
    textEffectLineSpacing, setTextEffectLineSpacing,
    // Single Card Mode
    textEffectCardMode, setTextEffectCardMode,
    textEffectSingleCardBgColor, setTextEffectSingleCardBgColor,
    textEffectSingleCardTextColor, setTextEffectSingleCardTextColor,
    textEffectSingleCardBorderColor, setTextEffectSingleCardBorderColor,
    textEffectSingleCardBorderWidth, setTextEffectSingleCardBorderWidth,
    textEffectSingleCardRadius, setTextEffectSingleCardRadius,
    textEffectSingleCardPadding, setTextEffectSingleCardPadding,
    textEffectSingleCardAlign, setTextEffectSingleCardAlign,
    textEffectSingleCardOpacity, setTextEffectSingleCardOpacity,
    // Dynamic Multi-Line Text Effect Layers (Universal Canva / CapCut standard)
    textEffectLineConfigs, setTextEffectLineConfigs,
    addTextEffectLine, updateTextEffectLine, removeTextEffectLine,
    // Callout Pointers
    calloutPointers, setCalloutPointers,
    addCalloutPointer, updateCalloutPointer, removeCalloutPointer,
    // Custom Text Badges & Stickers
    customTexts, setCustomTexts,
    addCustomText, updateCustomText, removeCustomText,
    // Badges, QR & Contact
    selectedBadges, setSelectedBadges,
    showQrCode, setShowQrCode,
    showContact, setShowContact,
    showAgentAvatar, setShowAgentAvatar,
    // AI Content
    headline, setHeadline,
    highlights, setHighlights,
    caption, setCaption,
    hashtags, setHashtags,
    isGeneratingAI,
    fetchAIContent,
    // Custom overrides
    customProjectName, setCustomProjectName,
    customTitle, setCustomTitle,
    customTransitText, setCustomTransitText,
    // Formatted texts
    priceDisplay, originalPriceDisplay, locationDisplay,
    // Presets
    presets, isLoadingPresets, handleApplyPreset, handleApplyCuratedPreset, handleSavePreset,
    siteConfig,
  };
}
