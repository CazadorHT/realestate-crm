"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import JSZip from "jszip";

import {
  renderBannerToCanvas,
  renderSpecsHighlightsPage,
  renderLocationPage,
  renderContactCTAPage,
} from "./canvas-renderer";
import type { PlatformOverlayType } from "./PlatformUiOverlay";
import type {
  AspectRatio,
  StudioTheme,
  StudioLayout,
  CardBackground,
  ContentPosition,
  FontSizeScale,
  SpecFontSizeScale,
  ElementZoneMapping,
  StudioLanguage,
  StudioPriceFormatStyle,
  PhotoFilter,
  PromoPosition,
  CarouselPageType,
  CarouselPageConfig,
  BannerRenderOptions,
  SocialStudioProperty,
} from "./types";
import {
  formatTransitDisplay,
  formatStudioPrice,
  formatStudioLocation,
  fetchImageBlob,
} from "./helpers";
import { generateSocialBannerContentAction } from "@/features/properties/actions/social";
import type { BannerContentResult } from "@/features/properties/actions/social";
import { siteConfig } from "@/lib/site-config";
import { useLanguage } from "@/lib/i18n/language-context";

// Subcomponents
import { StudioPreviewPanel } from "./components/StudioPreviewPanel";
import { StudioLanguageBar } from "./components/StudioLanguageBar";
import { StudioLayoutControls } from "./components/StudioLayoutControls";
import { StudioCardCustomizer } from "./components/StudioCardCustomizer";
import { StudioFieldRouter } from "./components/StudioFieldRouter";
import { StudioContentEditor } from "./components/StudioContentEditor";
import { StudioAlbumPackager } from "./components/StudioAlbumPackager";
import { StudioShareDialog } from "./components/StudioShareDialog";
import { StudioCarouselPresets } from "./components/StudioCarouselPresets";

export type { SocialStudioProperty };

interface SocialStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: SocialStudioProperty;
  onApplyCoverToPost?: (coverDataUrl: string) => void;
}

export function SocialStudioModal({
  isOpen,
  onClose,
  property,
  onApplyCoverToPost,
}: SocialStudioModalProps) {
  // 1. Studio Layout & Style State
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [theme, setTheme] = useState<StudioTheme>("luxury");
  const [layout, setLayout] = useState<StudioLayout>("single");

  const { language: uiLang } = useLanguage();
  const isEn = uiLang === "en";

  // 4-Languages Support (TH, EN, ZH, RU)
  const [language, setLanguage] = useState<StudioLanguage>("th");

  // Extract Project Name reliably
  const initialProjectName = useMemo(() => {
    if (property.project_name && property.project_name.trim()) return property.project_name.trim();
    if (property.project?.name) {
      if (typeof property.project.name === "object") {
        return property.project.name.th || property.project.name.en || property.project.name.cn || property.project.name.ru || "";
      }
      if (typeof property.project.name === "string") return property.project.name;
    }
    return "";
  }, [property.project_name, property.project]);

  // Editable Text Customization
  const [customProjectName, setCustomProjectName] = useState<string>(initialProjectName);
  const [customTitle, setCustomTitle] = useState<string>(property.title || "");
  const [customTransitText, setCustomTransitText] = useState<string>("");

  // Sync if property props change
  useEffect(() => {
    if (initialProjectName) {
      setCustomProjectName(initialProjectName);
    }
  }, [initialProjectName]);

  // Typography Scaling & Content Alignment
  const [contentPosition, setContentPosition] = useState<ContentPosition>("bottom");
  const [fontSizeScale, setFontSizeScale] = useState<FontSizeScale>("md");
  const [specFontSizeScale, setSpecFontSizeScale] = useState<SpecFontSizeScale>("xl");

  // Dual Independent Zones Assignment & Offsets
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

  // Selected image indices for multi-slots (slot 0, 1, 2, 3, 4, 5)
  const [slotIndices, setSlotIndices] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [activeSlot, setActiveSlot] = useState<number>(0);

  // Card Height & Width & Background Customization
  const [cardHeightPercent, setCardHeightPercent] = useState<number>(0); // 0 = Auto-Fit
  const [cardWidthPercent, setCardWidthPercent] = useState<number>(0); // 0 = Auto 100%
  const [cardTextAlign, setCardTextAlign] = useState<"left" | "center" | "right">("left");
  const [cardOpacity, setCardOpacity] = useState<number>(62);
  const [scrimOpacity, setScrimOpacity] = useState<number>(30);
  const [topScrimOpacity, setTopScrimOpacity] = useState<number>(30);
  const [bottomScrimOpacity, setBottomScrimOpacity] = useState<number>(30);
  const [priceFormatStyle, setPriceFormatStyle] = useState<StudioPriceFormatStyle>("default");
  const [cardBackground, setCardBackground] = useState<CardBackground>("glass");
  const [cardYOffset, setCardYOffset] = useState<number>(0);
  const [showHeadline, setShowHeadline] = useState<boolean>(true);

  // Feature 1: Custom Accent Color
  const [customAccentColor, setCustomAccentColor] = useState<string>("#F59E0B");

  // Feature 2: Promotional Overlay
  const [promoText, setPromoText] = useState<string>("");
  const [promoPosition, setPromoPosition] = useState<PromoPosition>("top_right");
  const [promoColor, setPromoColor] = useState<string>("#EF4444");
  const [promoTextColor, setPromoTextColor] = useState<string>("#FFFFFF");

  // Feature 3: Photo Filter
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>("none");

  // Feature: Grid Lines Customization
  const [gridLineWidth, setGridLineWidth] = useState<number>(8);
  const [gridLineColor, setGridLineColor] = useState<string>("#000000");

  // Feature: Custom Element Text & Background Colors
  const [customTitleColor, setCustomTitleColor] = useState<string>("#FFFFFF");
  const [customPriceColor, setCustomPriceColor] = useState<string>("#FFFFFF");
  const [customHeadlineColor, setCustomHeadlineColor] = useState<string>("#F59E0B");
  const [customProjectNameColor, setCustomProjectNameColor] = useState<string>("#FFFFFF");
  const [customCardBgColor, setCustomCardBgColor] = useState<string>("#0F172A");
  const [customCanvasBgColor, setCustomCanvasBgColor] = useState<string>("#0F172A");
  const [customListingBadgeBgColor, setCustomListingBadgeBgColor] = useState<string>("#F59E0B");
  const [customListingBadgeTextColor, setCustomListingBadgeTextColor] = useState<string>("#000000");

  // Feature 5: Carousel Presets
  const [carouselPages, setCarouselPages] = useState<CarouselPageConfig[]>([
    { type: "cover", enabled: true },
    { type: "specs_highlights", enabled: false },
    { type: "location_map", enabled: false },
    { type: "contact_cta", enabled: false },
  ]);
  const [activeCarouselPage, setActiveCarouselPage] = useState<CarouselPageType>("cover");

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<"layout" | "style" | "content" | "album">("layout");

  // Platform UI Safe Zone Simulation Overlay
  const [platformOverlay, setPlatformOverlay] = useState<PlatformOverlayType>("none");

  // Header Branding & Top Badge Controls (Defaults matched to user preference)
  const [showBrandingHeader, setShowBrandingHeader] = useState<boolean>(false);
  const [showTopListingBadge, setShowTopListingBadge] = useState<boolean>(true);
  const [headerFontSizeScale, setHeaderFontSizeScale] = useState<FontSizeScale>("md");
  const [badgeFontSizeScale, setBadgeFontSizeScale] = useState<FontSizeScale>("lg");
  const [headerYOffset, setHeaderYOffset] = useState<number>(40);
  const [cardRightMargin, setCardRightMargin] = useState<number>(0);

  // Modular Field Visibility Toggles
  const [showLocation, setShowLocation] = useState(true);
  const [showProjectName, setShowProjectName] = useState(true);
  const [showListingType, setShowListingType] = useState(true);
  const [showTitle, setShowTitle] = useState(true);
  const [showSpecs, setShowSpecs] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showOriginalPrice, setShowOriginalPrice] = useState(true);

  // Badges, QR & Contact Toggles (Default: Unchecked per user directive)
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [showQrCode, setShowQrCode] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAgentAvatar, setShowAgentAvatar] = useState(false);

  // AI Content State
  const [headline, setHeadline] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  // Album Export & Share State
  const [selectedAlbumIndices, setSelectedAlbumIndices] = useState<number[]>([]);
  const [isExportingAlbum, setIsExportingAlbum] = useState<boolean>(false);
  const [isSharingAlbum, setIsSharingAlbum] = useState<boolean>(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState<boolean>(false);
  const [shareCoverImageUrl, setShareCoverImageUrl] = useState<string | null>(null);
  const [shareCoverFile, setShareCoverFile] = useState<File | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Extract all available real property image URLs (sorted so original property cover photo is ALWAYS at index 0)
  const imageUrls = useMemo(() => {
    const rawImages = property.images || [];

    // Sort rawImages first: is_cover === true first, then sort_order
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
        if (!img.startsWith("data:image/")) {
          u = img;
        }
      } else if (img && typeof img === "object") {
        u = (img as any).url || (img as any).image_url || (img as any).storage_path || null;
        isCover = !!(img as any).is_cover;
      }

      if (u && !u.startsWith("data:image/")) {
        const fullUrl = (u.startsWith("http://") || u.startsWith("https://"))
          ? u
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/${u}`;

        if (!urls.includes(fullUrl)) {
          if (isCover) {
            urls.unshift(fullUrl);
          } else {
            urls.push(fullUrl);
          }
        }
      }
    });

    if (urls.length === 0) {
      urls.push(siteConfig.ogImage || "/hero-realestate.png");
    }

    return urls;
  }, [property.images]);

  // Auto-select all real photos for album by default
  useEffect(() => {
    if (imageUrls.length > 0 && selectedAlbumIndices.length === 0) {
      setSelectedAlbumIndices(imageUrls.map((_, idx) => idx));
    }
  }, [imageUrls, selectedAlbumIndices.length]);

  // Selected image URLs for current layout slots
  const currentSlotImageUrls = useMemo(() => {
    return slotIndices.map((idx) => imageUrls[idx % imageUrls.length] || imageUrls[0]);
  }, [slotIndices, imageUrls]);

  // Multilingual Price & Location formatting
  const priceDisplay = useMemo(() => {
    return formatStudioPrice(property.listing_type, property.price, property.rental_price, language, priceFormatStyle);
  }, [property.listing_type, property.price, property.rental_price, language, priceFormatStyle]);

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

    // Auto-update project name according to language if available in multilingual object
    if (property.project?.name && typeof property.project.name === "object") {
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

    fetchAIContent(newLang);
    const langName =
      newLang === "en"
        ? "English 🇬🇧"
        : newLang === "zh"
          ? "中文 🇨🇳"
          : newLang === "ru"
            ? "Русский 🇷🇺"
            : "ภาษาไทย 🇹🇭";
    toast.success(
      isEn
        ? `Language changed to ${langName}! 🌐`
        : `เปลี่ยนภาษาเป็น ${langName} แล้ว! 🌐`
    );
  };

  const hasFetchedInitialAI = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFetchedInitialAI.current) {
      hasFetchedInitialAI.current = true;
      fetchAIContent();
    }
  }, [isOpen, fetchAIContent]);

  // Canvas Draw
  const drawCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
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
        customAccentColor,
        promoText,
        promoPosition,
        promoColor,
        promoTextColor,
        photoFilter,
        gridLineWidth,
        gridLineColor,
        customTitleColor,
        customPriceColor,
        customHeadlineColor,
        customProjectNameColor,
        customCardBgColor,
        customCanvasBgColor,
        customListingBadgeBgColor,
        customListingBadgeTextColor,
        zoneMapping,
        card1YOffset,
        card2YOffset,
        showBrandingHeader,
        showTopListingBadge,
        headerFontSizeScale,
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
        showQrCode,
        showContact,
        showAgentAvatar,
        imageUrls: currentSlotImageUrls,
        title: customTitle,
        projectName: customProjectName,
        headline: headline,
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
        },
        badges: selectedBadges,
        qrCodeUrl: qrCodeImageUrl,
        companyName: siteConfig.name || "VCC ASSET",
        contactPhone: property.assigned_agent?.phone || siteConfig.contact.phone || "02-xxx-xxxx",
        contactLine: property.assigned_agent?.line_id || "@vccasset",
        agentAvatarUrl: property.assigned_agent?.avatar_url || undefined,
        agentName: property.assigned_agent?.full_name || undefined,
      };

      // Feature 5: Render based on active carousel page
      if (activeCarouselPage === "specs_highlights") {
        await renderSpecsHighlightsPage(canvasRef.current, renderOpts);
      } else if (activeCarouselPage === "location_map") {
        await renderLocationPage(canvasRef.current, renderOpts);
      } else if (activeCarouselPage === "contact_cta") {
        await renderContactCTAPage(canvasRef.current, renderOpts);
      } else {
        await renderBannerToCanvas(canvasRef.current, renderOpts);
      }
    } catch (renderErr) {
      console.error("Canvas draw error:", renderErr);
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
    showTopListingBadge,
    headerFontSizeScale,
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
    showQrCode,
    showContact,
    showAgentAvatar,
    currentSlotImageUrls,
    topScrimOpacity,
    scrimOpacity,
    priceFormatStyle,
    photoFilter,
    promoPosition,
    selectedBadges,
    customProjectName,
    customTitle,
    customTransitText,
    customCardBgColor,
    activeCarouselPage,
    property,
    imageUrls,
    slotIndices,
  ]);

  useEffect(() => {
    if (isOpen) {
      drawCanvas();
    }
  }, [isOpen, drawCanvas]);

  // Handlers for slot changes
  const handleSelectLayout = (newLayout: StudioLayout) => {
    setLayout(newLayout);
    const slotsCount =
      newLayout === "single"
        ? 1
        : newLayout === "split_two"
          ? 2
          : newLayout === "hero_plus_two"
            ? 3
            : newLayout === "four_grid"
              ? 4
              : newLayout === "five_grid"
                ? 5
                : 6;
    setSlotIndices((prev) => {
      const next = [...prev];
      while (next.length < slotsCount) {
        next.push(next.length % Math.max(imageUrls.length, 1));
      }
      return next.slice(0, slotsCount);
    });
  };

  const handleSelectSlotImage = (slotIdx: number, imgIdx: number) => {
    setSlotIndices((prev) => {
      const next = [...prev];
      next[slotIdx] = imgIdx;
      return next;
    });
  };

  const handleSelectImageForSlot = (imgIdx: number) => {
    handleSelectSlotImage(activeSlot, imgIdx);
  };

  const handleShuffleImages = () => {
    if (imageUrls.length <= 1) return;
    setSlotIndices((prev) => {
      const shuffled = [...prev].map(() => Math.floor(Math.random() * imageUrls.length));
      return shuffled;
    });
    toast.success(isEn ? "Images randomized across layout! 🔀" : "สลับรูปภาพใน Layout แล้ว! 🔀");
  };

  const handleToggleBadge = (badgeLabel: string) => {
    setSelectedBadges((prev) => {
      if (prev.includes(badgeLabel)) {
        return prev.filter((b) => b !== badgeLabel);
      }
      if (prev.length >= 2) {
        toast.info(isEn ? "Maximum 2 stickers allowed." : "เลือกสติกเกอร์ได้สูงสุด 2 รายการครับ");
        return prev;
      }
      return [...prev, badgeLabel];
    });
  };

  // Download Single Cover Banner
  const handleDownloadSingle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `vcc-poster-${property.slug || property.id}-${aspectRatio.replace(":", "x")}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
    toast.success(isEn ? "HD Poster downloaded successfully! 📥" : "ดาวน์โหลดภาพโปสเตอร์ HD เรียบร้อยแล้ว! 📥");
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        toast.success(
          isEn
            ? "Image copied! Press Ctrl+V to paste directly into LINE or Facebook 📋"
            : "คัดลอกรูปภาพแล้ว! สามารถกด Ctrl+V วางใน LINE หรือ Facebook ได้ทันที 📋"
        );
        setTimeout(() => setCopiedImage(false), 2000);
      }, "image/png");
    } catch (err) {
      console.error("Failed to copy image to clipboard:", err);
      toast.error(
        isEn
          ? "Browser does not support direct image copying. Please use download button."
          : "เบราว์เซอร์ไม่รองรับการก๊อปปี้รูป ให้ใช้ปุ่มดาวน์โหลดแทนครับ"
      );
    }
  };

  // Copy Caption to Clipboard
  const handleCopyCaption = async () => {
    const fullCaptionText = isEn
      ? `${caption}\n\n${hashtags.join(" ")}\n\n👉 See more photos & details: ${propertyUrl}`
      : `${caption}\n\n${hashtags.join(" ")}\n\n👉 ดูรูปเพิ่มเติม & พิกัด: ${propertyUrl}`;
    await navigator.clipboard.writeText(fullCaptionText);
    setCopiedCaption(true);
    toast.success(isEn ? "Caption & hashtags copied! ✍️" : "คัดลอกแคปชั่น & แฮชแท็กเรียบร้อยแล้ว! ✍️");
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  // Album Selection Handlers
  const handleToggleAlbumImage = (idx: number) => {
    setSelectedAlbumIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAllAlbumImages = () => {
    if (selectedAlbumIndices.length === imageUrls.length) {
      setSelectedAlbumIndices([]);
    } else {
      setSelectedAlbumIndices(imageUrls.map((_, i) => i));
    }
  };

  // Download Album as ZIP
  const handleDownloadAlbumZip = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExportingAlbum(true);
    const toastId = toast.loading(
      isEn
        ? "Packing image set (cover + real photos) as ZIP file..."
        : "กำลังจัดชุดภาพ (ภาพปก + ภาพจริง) เป็นไฟล์ ZIP..."
    );

    try {
      const zip = new JSZip();

      // 1. Cover Banner
      const coverBlob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/png", 1.0)
      );
      if (coverBlob) {
        zip.file("01_cover_banner.png", coverBlob);
      }

      // 2. Selected Real Photos
      const targetIndices =
        selectedAlbumIndices.length > 0 ? selectedAlbumIndices : imageUrls.map((_, i) => i);

      for (let i = 0; i < targetIndices.length; i++) {
        const imgIdx = targetIndices[i];
        const url = imageUrls[imgIdx];
        if (!url) continue;

        try {
          const blob = await fetchImageBlob(url);
          if (blob) {
            const ext = url.toLowerCase().endsWith(".png") ? "png" : "jpg";
            const padIndex = String(i + 2).padStart(2, "0");
            zip.file(`${padIndex}_photo_${i + 1}.${ext}`, blob);
          }
        } catch (fetchErr) {
          console.warn("Failed to fetch image for zip:", url, fetchErr);
        }
      }

      // 3. Caption file
      const fullCaptionText = isEn
        ? `${caption}\n\n${hashtags.join(" ")}\n\n👉 More Information: ${propertyUrl}`
        : `${caption}\n\n${hashtags.join(" ")}\n\n👉 ดูข้อมูลเพิ่มเติม: ${propertyUrl}`;
      zip.file("caption_and_hashtags.txt", fullCaptionText);

      // Auto-copy caption
      await navigator.clipboard.writeText(fullCaptionText);

      // 4. Generate & Trigger Download
      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `vcc-album-${property.slug || property.id}.zip`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      toast.success(
        isEn
          ? `Downloaded album set (${targetIndices.length + 1} photos) & copied caption! 📦✨`
          : `ดาวน์โหลดชุดภาพอัลบั้ม (${targetIndices.length + 1} รูป) พร้อมคัดลอกแคปชั่นแล้ว! 📦✨`,
        { id: toastId }
      );
    } catch (err) {
      console.error("ZIP export error:", err);
      toast.error(isEn ? "Error creating ZIP file" : "เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP", { id: toastId });
    } finally {
      setIsExportingAlbum(false);
    }
  };

  // Share Album / Carousel Modal Trigger
  const handleShareAlbum = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSharingAlbum(true);
    const toastId = toast.loading(
      isEn ? "Preparing image set and share window..." : "กำลังเตรียมชุดภาพและหน้าต่างแชร์..."
    );

    try {
      const coverDataUrl = canvas.toDataURL("image/png", 1.0);
      setShareCoverImageUrl(coverDataUrl);

      const coverBlob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/png", 1.0)
      );

      if (coverBlob) {
        setShareCoverFile(new File([coverBlob], "01_cover_banner.png", { type: "image/png" }));
      }

      toast.dismiss(toastId);
      setIsShareDialogOpen(true);
    } catch (err: any) {
      console.warn("Prepare share dialog failed:", err);
      toast.error(isEn ? "Unable to open share window" : "ไม่สามารถเปิดหน้าต่างแชร์ได้", { id: toastId });
    } finally {
      setIsSharingAlbum(false);
    }
  };

  const handleApplyCoverToPost = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coverDataUrl = canvas.toDataURL("image/png", 1.0);
    if (onApplyCoverToPost) {
      onApplyCoverToPost(coverDataUrl);
      toast.success(
        isEn
          ? "Applied Social Studio cover to social post! 🖼️✨"
          : "นำภาพปก Social Studio ใส่ในโพสต์โซเชียลเรียบร้อยแล้ว! 🖼️✨"
      );
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="p-0! gap-0! bg-slate-900! border-slate-800! text-white rounded-3xl shadow-2xl max-w-[1380px]! w-[96vw]! h-[94vh]! max-h-[94vh]! block overflow-hidden [&>button]:text-slate-400 [&>button]:hover:text-white"
        style={{
          maxWidth: "1380px",
          width: "96vw",
          height: "94vh",
          maxHeight: "94vh",
          padding: 0,
          backgroundColor: "#0F172A",
          borderColor: "#1E293B",
        }}
      >
        <div className="w-full h-full flex flex-col overflow-hidden bg-slate-900">
          {/* Header */}
          <div className="w-full px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  AI Social Media Studio & Banner Generator
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px] uppercase font-mono">
                    Pro Multi-Layout
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-slate-400">
                  {isEn
                    ? "Select layouts, arrange photos, add highlight stickers, and generate AI captions with 1-click"
                    : "เลือก Layouts จัดเรียงภาพ ใส่สติกเกอร์ไฮไลท์ และสร้างแคปชั่น AI ในคลิกเดียว"}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Body Split 50/50 */}
          <div
            className="w-full flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-900"
            style={{ display: "flex", flexDirection: "row", width: "100%", height: "100%" }}
          >
            {/* Left Column: Live Canvas Preview & Action Dock */}
            <StudioPreviewPanel
              canvasRef={canvasRef}
              aspectRatio={aspectRatio}
              isRendering={isRendering}
              platformOverlay={platformOverlay}
              setPlatformOverlay={setPlatformOverlay}
              agentFullName={property.assigned_agent?.full_name}
              selectedAlbumCount={selectedAlbumIndices.length > 0 ? selectedAlbumIndices.length : imageUrls.length}
              isExportingAlbum={isExportingAlbum}
              isSharingAlbum={isSharingAlbum}
              copiedImage={copiedImage}
              onDownloadAlbumZip={handleDownloadAlbumZip}
              onShareAlbum={handleShareAlbum}
              onDownloadSingle={handleDownloadSingle}
              onCopyImage={handleCopyImage}
              onApplyCoverToPost={onApplyCoverToPost ? handleApplyCoverToPost : undefined}
            />

            {/* Right Column: Modular Studio Controls */}
            <div
              className="w-full md:w-1/2 p-4 sm:p-5 space-y-4 overflow-y-auto min-h-0 bg-slate-900 flex-1"
              style={{ width: "50%" }}
            >
              {/* Tab Navigation Header */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 sticky top-0 z-20 backdrop-blur-md shadow-md">
                {[
                  { id: "layout", label: isEn ? "🎨 Layout" : "🎨 รูปแบบ", sub: "Layout & Theme" },
                  { id: "style", label: isEn ? "🎛️ Style" : "🎛️ สไตล์", sub: "Card & Scrim" },
                  { id: "content", label: isEn ? "📝 Content" : "📝 ข้อความ", sub: "Text & AI" },
                  { id: "album", label: isEn ? "📑 Album" : "📑 ชุดภาพ", sub: "Carousel & Zip" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 rounded-xl text-center flex flex-col items-center transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-amber-500 text-slate-950 font-bold shadow-xs scale-102"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-medium"
                    }`}
                  >
                    <span className="text-xs">{tab.label}</span>
                    <span className="text-[9px] opacity-70 hidden sm:inline">{tab.sub}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: Layout & Theme */}
              {activeTab === "layout" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <StudioLanguageBar
                    language={language}
                    onLanguageChange={handleLanguageChange}
                  />

                  <StudioLayoutControls
                    layout={layout}
                    setLayout={setLayout}
                    imageUrls={imageUrls}
                    activeSlot={activeSlot}
                    setActiveSlot={setActiveSlot}
                    slotIndices={slotIndices}
                    onSelectImageForSlot={handleSelectImageForSlot}
                    onShuffleImages={handleShuffleImages}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    theme={theme}
                    setTheme={setTheme}
                    customAccentColor={customAccentColor}
                    setCustomAccentColor={setCustomAccentColor}
                    fontSizeScale={fontSizeScale}
                    setFontSizeScale={setFontSizeScale}
                    contentPosition={contentPosition}
                    setContentPosition={setContentPosition}
                    photoFilter={photoFilter}
                    setPhotoFilter={setPhotoFilter}
                    gridLineWidth={gridLineWidth}
                    setGridLineWidth={setGridLineWidth}
                    gridLineColor={gridLineColor}
                    setGridLineColor={setGridLineColor}
                  />
                </div>
              )}

              {/* TAB 2: Card & Scrim Styling */}
              {activeTab === "style" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <StudioCardCustomizer
                    cardHeightPercent={cardHeightPercent}
                    setCardHeightPercent={setCardHeightPercent}
                    cardWidthPercent={cardWidthPercent}
                    setCardWidthPercent={setCardWidthPercent}
                    cardTextAlign={cardTextAlign}
                    setCardTextAlign={setCardTextAlign}
                    cardOpacity={cardOpacity}
                    setCardOpacity={setCardOpacity}
                    scrimOpacity={scrimOpacity}
                    setScrimOpacity={setScrimOpacity}
                    topScrimOpacity={topScrimOpacity}
                    setTopScrimOpacity={setTopScrimOpacity}
                    bottomScrimOpacity={bottomScrimOpacity}
                    setBottomScrimOpacity={setBottomScrimOpacity}
                    cardBackground={cardBackground}
                    setCardBackground={setCardBackground}
                    showBrandingHeader={showBrandingHeader}
                    setShowBrandingHeader={setShowBrandingHeader}
                    showTopListingBadge={showTopListingBadge}
                    setShowTopListingBadge={setShowTopListingBadge}
                    headerFontSizeScale={headerFontSizeScale}
                    setHeaderFontSizeScale={setHeaderFontSizeScale}
                    badgeFontSizeScale={badgeFontSizeScale}
                    setBadgeFontSizeScale={setBadgeFontSizeScale}
                    headerYOffset={headerYOffset}
                    setHeaderYOffset={setHeaderYOffset}
                    contentPosition={contentPosition}
                    cardYOffset={cardYOffset}
                    setCardYOffset={setCardYOffset}
                    card1YOffset={card1YOffset}
                    setCard1YOffset={setCard1YOffset}
                    card2YOffset={card2YOffset}
                    setCard2YOffset={setCard2YOffset}
                    cardRightMargin={cardRightMargin}
                    setCardRightMargin={setCardRightMargin}
                    customCardBgColor={customCardBgColor}
                    setCustomCardBgColor={setCustomCardBgColor}
                    customCanvasBgColor={customCanvasBgColor}
                    setCustomCanvasBgColor={setCustomCanvasBgColor}
                    customListingBadgeBgColor={customListingBadgeBgColor}
                    setCustomListingBadgeBgColor={setCustomListingBadgeBgColor}
                    customListingBadgeTextColor={customListingBadgeTextColor}
                    setCustomListingBadgeTextColor={setCustomListingBadgeTextColor}
                  />
                </div>
              )}

              {/* TAB 3: Text & AI Content */}
              {activeTab === "content" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <StudioContentEditor
                    language={language}
                    selectedBadges={selectedBadges}
                    onToggleBadge={handleToggleBadge}
                    customProjectName={customProjectName}
                    setCustomProjectName={setCustomProjectName}
                    customTitle={customTitle}
                    setCustomTitle={setCustomTitle}
                    customTransitText={customTransitText}
                    setCustomTransitText={setCustomTransitText}
                    defaultTransitPlaceholder={
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
                      ) || ""
                    }
                    headline={headline}
                    setHeadline={setHeadline}
                    isGeneratingAI={isGeneratingAI}
                    onFetchAIContent={() => fetchAIContent()}
                    showQrCode={showQrCode}
                    setShowQrCode={setShowQrCode}
                    showContact={showContact}
                    setShowContact={setShowContact}
                    showAgentAvatar={showAgentAvatar}
                    setShowAgentAvatar={setShowAgentAvatar}
                    caption={caption}
                    setCaption={setCaption}
                    hashtags={hashtags}
                    copiedCaption={copiedCaption}
                    onCopyCaption={handleCopyCaption}
                    promoText={promoText}
                    setPromoText={setPromoText}
                    promoPosition={promoPosition}
                    setPromoPosition={setPromoPosition}
                    promoColor={promoColor}
                    setPromoColor={setPromoColor}
                    promoTextColor={promoTextColor}
                    setPromoTextColor={setPromoTextColor}
                    customTitleColor={customTitleColor}
                    setCustomTitleColor={setCustomTitleColor}
                    customPriceColor={customPriceColor}
                    setCustomPriceColor={setCustomPriceColor}
                    customHeadlineColor={customHeadlineColor}
                    setCustomHeadlineColor={setCustomHeadlineColor}
                    customProjectNameColor={customProjectNameColor}
                    setCustomProjectNameColor={setCustomProjectNameColor}
                  />

                  <StudioFieldRouter
                    contentPosition={contentPosition}
                    zoneMapping={zoneMapping}
                    setZoneMapping={setZoneMapping}
                    showLocation={showLocation}
                    setShowLocation={setShowLocation}
                    showProjectName={showProjectName}
                    setShowProjectName={setShowProjectName}
                    showListingType={showListingType}
                    setShowListingType={setShowListingType}
                    showTitle={showTitle}
                    setShowTitle={setShowTitle}
                    showSpecs={showSpecs}
                    setShowSpecs={setShowSpecs}
                    specFontSizeScale={specFontSizeScale}
                    setSpecFontSizeScale={setSpecFontSizeScale}
                    showPrice={showPrice}
                    setShowPrice={setShowPrice}
                    priceFormatStyle={priceFormatStyle}
                    setPriceFormatStyle={setPriceFormatStyle}
                    showOriginalPrice={showOriginalPrice}
                    setShowOriginalPrice={setShowOriginalPrice}
                    showHeadline={showHeadline}
                    setShowHeadline={setShowHeadline}
                    showContact={showContact}
                    setShowContact={setShowContact}
                    showQrCode={showQrCode}
                    setShowQrCode={setShowQrCode}
                    hasOriginalPrice={Boolean(property.original_price || property.original_rental_price)}
                  />
                </div>
              )}

              {/* TAB 4: Album & Carousel */}
              {activeTab === "album" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <StudioCarouselPresets
                    carouselPages={carouselPages}
                    setCarouselPages={setCarouselPages}
                    activeCarouselPage={activeCarouselPage}
                    setActiveCarouselPage={setActiveCarouselPage}
                  />

                  <StudioAlbumPackager
                    imageUrls={imageUrls}
                    selectedAlbumIndices={selectedAlbumIndices}
                    onToggleAlbumImage={handleToggleAlbumImage}
                    onSelectAllAlbumImages={handleSelectAllAlbumImages}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Social Share Pack Modal Dialog */}
    <StudioShareDialog
      isOpen={isShareDialogOpen}
      onClose={() => setIsShareDialogOpen(false)}
      coverImageUrl={shareCoverImageUrl}
      coverFile={shareCoverFile}
      propertyTitle={customTitle || property.title}
      caption={caption}
      hashtags={hashtags}
      propertyUrl={propertyUrl}
      onDownloadAlbumZip={handleDownloadAlbumZip}
    />
  </>
  );
}
