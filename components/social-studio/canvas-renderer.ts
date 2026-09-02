/**
 * [S-Tier] High-Resolution HTML5 Canvas Renderer for Real Estate Social Banners & Stories
 * Main Facade / Entry Point orchestrating:
 * - renderer/canvas-utils.ts (low-level primitives)
 * - renderer/background-layouts.ts (grid layouts & filters)
 * - renderer/text-effects.ts (22 viral templates & arc curve engine)
 * - renderer/carousel-pages.ts (multi-page carousel exports)
 */

import type {
  AspectRatio,
  StudioTheme,
  StudioLayout,
  CardBackground,
  ContentPosition,
  FontSizeScale,
  ElementZone,
  ElementZoneMapping,
  StudioLanguage,
  PhotoFilter,
  PromoPosition,
  BannerRenderOptions,
  TextEffectTemplate,
  TextEffectPosition,
} from "./types";

// Re-export types for backward compatibility
export type {
  AspectRatio,
  StudioTheme,
  StudioLayout,
  CardBackground,
  ContentPosition,
  FontSizeScale,
  ElementZone,
  ElementZoneMapping,
  StudioLanguage,
  PhotoFilter,
  PromoPosition,
  BannerRenderOptions,
  TextEffectTemplate,
  TextEffectPosition,
};

// Re-export utility functions
export {
  getDimensions,
  loadImage,
  roundRect,
  drawCoverImage,
  wrapTextTop,
  countWrapLines,
  splitThaiGraphemes,
  hexToRgba,
} from "./renderer/canvas-utils";

// Re-export background & layout functions
export {
  drawBackgroundLayout,
  applyPhotoFilter,
} from "./renderer/background-layouts";

// Re-export text effect functions
export {
  renderTextEffect,
  drawPromoOverlay,
} from "./renderer/text-effects";

// Re-export callout pointer functions
export {
  renderCalloutPointers,
} from "./renderer/callout-pointers";

// Re-export custom texts functions
export {
  renderCustomTexts,
} from "./renderer/custom-texts";

// Re-export carousel page renderers
export {
  renderSpecsHighlightsPage,
  renderLocationPage,
  renderContactCTAPage,
} from "./renderer/carousel-pages";

// Internal imports for banner pipeline
import { getDimensions, loadImage, roundRect, wrapTextTop, countWrapLines } from "./renderer/canvas-utils";
import { drawBackgroundLayout, applyPhotoFilter } from "./renderer/background-layouts";
import { renderTextEffect, drawPromoOverlay } from "./renderer/text-effects";
import { renderCalloutPointers } from "./renderer/callout-pointers";
import { renderCustomTexts } from "./renderer/custom-texts";

/**
 * Main Banner Render Pipeline
 */
export async function renderBannerToCanvas(
  canvas: HTMLCanvasElement,
  options: BannerRenderOptions
): Promise<void> {
  const { width, height } = getDimensions(options.aspectRatio);
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not supported");

  // Font Size Multipliers
  const fScale =
    options.fontSizeScale === "sm" ? 0.85
    : options.fontSizeScale === "lg" ? 1.16
    : options.fontSizeScale === "xl" ? 1.30
    : 1.0;

  const priceFScale =
    options.priceFontSizeScale === "sm" ? 0.85
    : options.priceFontSizeScale === "lg" ? 1.16
    : options.priceFontSizeScale === "xl" ? 1.30
    : (options.priceFontSizeScale ? 1.0 : fScale);

  const isSplitMode = options.contentPosition === "split_hero";
  const isStory = options.aspectRatio === "9:16";
  const outerMarginX = isStory ? 48 : 36;
  const baseTopY = isStory ? 86 : 40;
  const headerYOffset = options.headerYOffset || 0;
  const topY = baseTopY + headerYOffset;

  // Symmetrical Equal Card Padding (px === py = 36px)
  const pad = Math.round(36 * (fScale > 1.1 ? 1.05 : 1.0));
  const cardRightMargin = options.cardRightMargin || 0;
  const maxCardW = width - outerMarginX * 2 - cardRightMargin;
  const customW = options.cardWidthPercent && options.cardWidthPercent > 0
    ? Math.round((width - cardRightMargin) * (options.cardWidthPercent / 100))
    : maxCardW;
  const cardW = Math.max(280, Math.min(maxCardW, customW));
  const cardX = outerMarginX + Math.round((maxCardW - cardW) / 2);
  const innerW = cardW - pad * 2;
  const innerX = cardX + pad;

  // Theme Colors
  let primaryColor = "#F59E0B";
  let badgeBg = "rgba(245, 158, 11, 0.95)";
  let badgeText = "#000000";

  if (options.theme === "modern") {
    primaryColor = "#38BDF8";
    badgeBg = "rgba(37, 99, 235, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "hotdeal") {
    primaryColor = "#EF4444";
    badgeBg = "rgba(239, 68, 68, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "emerald") {
    primaryColor = "#10B981";
    badgeBg = "rgba(16, 185, 129, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "purple") {
    primaryColor = "#8B5CF6";
    badgeBg = "rgba(139, 92, 246, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "orange") {
    primaryColor = "#F97316";
    badgeBg = "rgba(249, 115, 22, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "custom" && options.customAccentColor) {
    primaryColor = options.customAccentColor;
    const hex = options.customAccentColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    badgeBg = `rgba(${r}, ${g}, ${b}, 0.95)`;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    badgeText = luminance > 0.5 ? "#000000" : "#FFFFFF";
  }

  // 1. Evaluate Enabled Fields
  const lang = options.language || "th";
  const hasLoc = Boolean(options.showLocation !== false && (options.locationText?.trim() || options.transitText?.trim()));
  const hasProject = Boolean(options.showProjectName !== false && options.projectName && options.projectName.trim());
  const hasTitle = Boolean(options.showTitle !== false && options.title && options.title.trim());
  const hasHeadline = Boolean(options.showHeadline !== false && options.headline && options.headline.trim());
  const showSpecs = options.showSpecs !== false;

  // Localized Spec Pills
  const pills: string[] = [];
  if (showSpecs) {
    if (options.specs.bedrooms) {
      pills.push(
        lang === "en" ? `🛏️ ${options.specs.bedrooms} Bed`
        : lang === "zh" ? `🛏️ ${options.specs.bedrooms} 房`
        : lang === "ru" ? `🛏️ ${options.specs.bedrooms} спальни`
        : `🛏️ ${options.specs.bedrooms} นอน`
      );
    }
    if (options.specs.bathrooms) {
      pills.push(
        lang === "en" ? `🚿 ${options.specs.bathrooms} Bath`
        : lang === "zh" ? `🚿 ${options.specs.bathrooms} 卫`
        : lang === "ru" ? `🚿 ${options.specs.bathrooms} санузла`
        : `🚿 ${options.specs.bathrooms} น้ำ`
      );
    }
    if (options.specs.sizeSqm) {
      pills.push(
        lang === "en" ? `📐 ${options.specs.sizeSqm} Sqm`
        : lang === "zh" ? `📐 ${options.specs.sizeSqm} 平米`
        : lang === "ru" ? `📐 ${options.specs.sizeSqm} м²`
        : `📐 ${options.specs.sizeSqm} ตร.ม.`
      );
    }
    if (options.specs.floor) {
      pills.push(
        lang === "en" ? `🏢 Fl. ${options.specs.floor}`
        : lang === "zh" ? `🏢 ${options.specs.floor} 层`
        : lang === "ru" ? `🏢 ${options.specs.floor} этаж`
        : `🏢 ชั้น ${options.specs.floor}`
      );
    }
  }
  (options.badges || []).slice(0, 2).forEach((b) => pills.push(b));

  const showPrice = options.showPrice !== false;
  const showQr = options.showQrCode !== false && Boolean(options.qrCodeUrl);
  const showContact = options.showContact !== false && Boolean(options.agentName || options.contactPhone || options.contactLine);
  const hasFooter = showQr || showContact;

  // Localized Listing Prefix & Header Badge
  const getListingPrefix = () => {
    if (options.showListingType === false || !options.listingType) return "";
    const isRent = options.listingType === "RENT";
    const isBoth = options.listingType === "SALE_AND_RENT";
    if (lang === "en") return isBoth ? "[Sale/Rent] " : isRent ? "[Rent] " : "[Sale] ";
    if (lang === "zh") return isBoth ? "[售/租] " : isRent ? "[出租] " : "[出售] ";
    if (lang === "ru") return isBoth ? "[Продажа/Аренда] " : isRent ? "[Аренда] " : "[Продажа] ";
    return isBoth ? "[ขาย/เช่า] " : isRent ? "[เช่า] " : "[ขาย] ";
  };

  const getListingBadgeText = () => {
    const isRent = options.listingType === "RENT";
    const isBoth = options.listingType === "SALE_AND_RENT";
    if (lang === "zh") return isRent ? "出租" : isBoth ? "租售" : "待售";
    if (lang === "ru") return isRent ? "АРЕНДА" : isBoth ? "ПРОДАЖА/АРЕНДА" : "ПРОДАЖА";
    return isRent ? "FOR RENT" : isBoth ? "SALE & RENT" : "FOR SALE";
  };

  const getScanQrText = () => {
    if (lang === "en") return "Scan for Details";
    if (lang === "zh") return "扫码查看详情";
    if (lang === "ru") return "Сканируйте QR";
    return "สแกนดูห้องจริง";
  };

  const cleanTitleText = (raw: string) => {
    if (!raw) return "";
    return raw
      .replace(/^\[(ขาย|เช่า|ขาย\/เช่า|Sale|Rent|Sale\/Rent|FOR SALE|FOR RENT)\]\s*/gi, "")
      .replace(/^(🏡|🏠|🏢|✨)\s*/, "")
      .replace(/^\[(ขาย|เช่า|ขาย\/เช่า|Sale|Rent|Sale\/Rent)\]\s*/gi, "")
      .trim();
  };
  const processedTitle = getListingPrefix() + cleanTitleText(options.title);

  // Zone Assignment
  const zMap: ElementZoneMapping = isSplitMode
    ? (options.zoneMapping || {
        projectName: "zone_a",
        title: hasProject ? "zone_b" : "zone_a",
        headline: "zone_a",
        location: "zone_b",
        price: "zone_b",
        specs: "zone_b",
        contact: "zone_b",
      })
    : {
        projectName: "zone_b",
        title: "zone_b",
        headline: "zone_b",
        location: "zone_b",
        price: "zone_b",
        specs: "zone_b",
        contact: "zone_b",
      };

  const inA = (field: keyof ElementZoneMapping) => zMap[field] === "zone_a";
  const inB = (field: keyof ElementZoneMapping) => zMap[field] === "zone_b";

  const specScale =
    options.specFontSizeScale === "xs" ? 0.75
    : options.specFontSizeScale === "sm" ? 0.88
    : options.specFontSizeScale === "lg" ? 1.18
    : options.specFontSizeScale === "xl" ? 1.4
    : options.specFontSizeScale === "2xl" ? 1.7
    : options.specFontSizeScale === "3xl" ? 2.05
    : 1.0;

  // Measure Zone A Elements
  let zoneAContentH = 0;
  if (hasTitle && inA("title")) {
    ctx.font = `bold ${Math.round(34 * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
    const lines = countWrapLines(ctx, processedTitle, innerW, 2);
    zoneAContentH += lines * Math.round(44 * fScale) + 12;
  }
  if (hasProject && inA("projectName")) zoneAContentH += Math.round(30 * fScale) + 10;
  if (hasLoc && inA("location")) zoneAContentH += Math.round(24 * fScale) + 12;
  if (hasHeadline && inA("headline")) zoneAContentH += Math.round(26 * fScale) + 12;
  if (pills.length > 0 && inA("specs")) zoneAContentH += Math.round(36 * fScale * specScale) + 14;
  if (showPrice && inA("price")) zoneAContentH += Math.round(48 * fScale);
  if (hasFooter && inA("contact")) zoneAContentH += 90;

  const showCardContent = options.showCardContent !== false;
  const hasZoneAItems = showCardContent && isSplitMode && zoneAContentH > 0;
  const card1H = hasZoneAItems ? pad + zoneAContentH + pad : 0;

  // Measure Zone B Elements
  let zoneBContentH = 0;
  if (hasTitle && inB("title")) {
    ctx.font = `bold ${Math.round(34 * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
    const lines = countWrapLines(ctx, processedTitle, innerW, 2);
    zoneBContentH += lines * Math.round(44 * fScale) + 12;
  }
  if (hasProject && inB("projectName")) zoneBContentH += Math.round(28 * fScale) + 10;
  if (hasLoc && inB("location")) zoneBContentH += Math.round(24 * fScale) + 12;
  if (hasHeadline && inB("headline")) zoneBContentH += Math.round(26 * fScale) + 12;
  if (pills.length > 0 && inB("specs")) zoneBContentH += Math.round(36 * fScale * specScale) + 14;
  if (showPrice && inB("price")) zoneBContentH += Math.round(48 * fScale);
  if (hasFooter && inB("contact")) zoneBContentH += (showPrice && inB("price") ? 18 : 0) + 80;

  const customCardH = options.cardHeightPercent && options.cardHeightPercent > 0
    ? Math.round(height * (options.cardHeightPercent / 100))
    : 0;
  const hasZoneBItems = showCardContent && zoneBContentH > 0;
  const card2H = showCardContent ? (customCardH > 0 ? customCardH : (hasZoneBItems ? pad + zoneBContentH + pad : 0)) : 0;

  // Placement Offsets
  const shiftY = options.cardYOffset || 0;
  const card1YOffset = isSplitMode ? (options.card1YOffset ?? shiftY) : shiftY;
  const card2YOffset = isSplitMode ? (options.card2YOffset ?? shiftY) : shiftY;

  let card1Y = 0;
  let card2Y = 0;

  if (hasZoneAItems && hasZoneBItems) {
    card1Y = Math.round(height * 0.36) + card1YOffset;
    const bottomMargin = isStory ? 116 : 24;
    card2Y = height - card2H - bottomMargin + card2YOffset;
  } else if (hasZoneAItems && !hasZoneBItems) {
    card1Y = options.contentPosition === "center"
      ? Math.round((height - card1H) / 2) + card1YOffset
      : options.contentPosition === "top"
        ? (options.showBrandingHeader !== false ? topY + 70 : baseTopY) + card1YOffset
        : height - card1H - (isStory ? 116 : 24) + card1YOffset;
  } else {
    card2Y = options.contentPosition === "center"
      ? Math.round((height - card2H) / 2) + card2YOffset
      : options.contentPosition === "top"
        ? (options.showBrandingHeader !== false ? topY + 70 : baseTopY) + card2YOffset
        : height - card2H - (isStory ? 116 : 24) + card2YOffset;
  }

  // Draw Background Image Layout
  try {
    const urls = options.imageUrls.length > 0 ? options.imageUrls : ["/hero-realestate.png"];
    await drawBackgroundLayout(
      ctx,
      options.layout || "single",
      urls,
      width,
      height,
      options.gridLineWidth,
      options.gridLineColor || options.customCanvasBgColor
    );
  } catch {
    ctx.fillStyle = options.customCanvasBgColor || "#0F172A";
    ctx.fillRect(0, 0, width, height);
  }

  // Apply Photo Filter
  applyPhotoFilter(ctx, width, height, options.photoFilter || "none");

  // Apply Background Dark Tint / Dimming Overlay (Customizable 0-100%)
  const bgDim = options.bgDimOpacity !== undefined ? options.bgDimOpacity : 0;
  if (bgDim > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${bgDim / 100})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // Scrim Gradients
  const defaultScrim = options.scrimOpacity !== undefined ? options.scrimOpacity : 40;
  const topSFactor = (options.topScrimOpacity !== undefined ? options.topScrimOpacity : defaultScrim) / 100;
  const bottomSFactor = (options.bottomScrimOpacity !== undefined ? options.bottomScrimOpacity : defaultScrim) / 100;

  if (topSFactor > 0) {
    const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.22);
    topGradient.addColorStop(0, `rgba(10, 15, 29, ${0.85 * topSFactor})`);
    topGradient.addColorStop(1, "rgba(10, 15, 29, 0.0)");
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, height * 0.22);
  }

  if (bottomSFactor > 0) {
    if (showCardContent) {
      const bottomBaseY = hasZoneBItems ? card2Y : card1Y;
      const bottomGradient = ctx.createLinearGradient(0, Math.max(0, bottomBaseY - 40), 0, height);
      bottomGradient.addColorStop(0, "rgba(10, 15, 29, 0.0)");
      bottomGradient.addColorStop(0.35, `rgba(10, 15, 29, ${0.65 * bottomSFactor})`);
      bottomGradient.addColorStop(1, `rgba(5, 8, 16, ${0.90 * bottomSFactor})`);
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, Math.max(0, bottomBaseY - 40), width, height - Math.max(0, bottomBaseY - 40));
    } else {
      const bottomGradient = ctx.createLinearGradient(0, height * 0.78, 0, height);
      bottomGradient.addColorStop(0, "rgba(10, 15, 29, 0.0)");
      bottomGradient.addColorStop(1, `rgba(5, 8, 16, ${0.40 * bottomSFactor})`);
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, height * 0.78, width, height * 0.22);
    }
  }

  // Top Header (Branding & Listing Badge)
  const showHeader = options.showBrandingHeader !== false;
  const showBadge = options.showTopListingBadge !== false;
  const hScale = options.headerFontSizeScale === "sm" ? 0.8 : options.headerFontSizeScale === "lg" ? 1.2 : options.headerFontSizeScale === "xl" ? 1.4 : 1.0;
  const bScale = options.badgeFontSizeScale === "sm" ? 0.9 : options.badgeFontSizeScale === "lg" ? 1.35 : options.badgeFontSizeScale === "xl" ? 1.6 : 1.15;

  let badgeBottomY = topY;

  if (showHeader) {
    ctx.textBaseline = "top";
    ctx.font = `bold ${Math.round(30 * hScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = options.brandingTitleColor || "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(options.customCompanyName || options.companyName || "VCC ASSET", outerMarginX, topY);

    ctx.font = `500 ${Math.round(16 * hScale)}px 'Prompt', sans-serif`;
    ctx.fillStyle = options.brandingSubtitleColor || primaryColor;
    ctx.fillText(options.customCompanySubtitle || "PREMIUM REAL ESTATE", outerMarginX, topY + Math.round(38 * hScale));
  }

  if (showBadge) {
    const listingLabel = options.customListingBadgeText || getListingBadgeText();
    ctx.font = `bold ${Math.round(22 * bScale)}px 'Prompt', sans-serif`;
    const textW = ctx.measureText(listingLabel).width;
    const badgeW = Math.max(Math.round(170 * bScale), Math.round(textW + 42 * bScale));
    const badgeH = Math.round(52 * bScale);
    const badgeX = width - outerMarginX - badgeW;
    const badgeY = topY;
    badgeBottomY = badgeY + badgeH;

    const finalBadgeBg = options.customListingBadgeBgColor || badgeBg;
    const finalBadgeText = options.customListingBadgeTextColor || badgeText;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 10;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, Math.round(badgeH / 2));
    ctx.fillStyle = finalBadgeBg;
    ctx.fill();
    ctx.restore();

    ctx.font = `bold ${Math.round(22 * bScale)}px 'Prompt', sans-serif`;
    ctx.fillStyle = finalBadgeText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(listingLabel, badgeX + badgeW / 2, badgeY + badgeH / 2);
  }

  // Promotional Overlay Badge
  if (options.promoText && options.promoText.trim()) {
    drawPromoOverlay(
      ctx,
      options.promoText,
      options.promoPosition || "top_right",
      options.promoColor || "#EF4444",
      width,
      height,
      showBadge ? badgeBottomY + 12 : topY,
      bScale,
      outerMarginX,
      options.promoTextColor || "#FFFFFF"
    );
  }

  // Card Zone Renderer
  const renderCardZone = (zone: "zone_a" | "zone_b", cardYPos: number, cardH: number, isMiddleHero: boolean) => {
    const defaultBgAlpha = options.cardBackground === "solid" ? 0.94 : options.cardBackground === "minimal_gradient" ? 0.0 : 0.62;
    const cardAlpha = options.cardOpacity !== undefined ? options.cardOpacity / 100 : defaultBgAlpha;

    if (cardAlpha > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      roundRect(ctx, cardX, cardYPos, cardW, cardH, 28);
      if (options.customCardBgColor) {
        const hex = options.customCardBgColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) || 15;
        const g = parseInt(hex.substring(2, 4), 16) || 23;
        const b = parseInt(hex.substring(4, 6), 16) || 42;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${cardAlpha})`;
      } else {
        ctx.fillStyle = `rgba(15, 23, 42, ${cardAlpha})`;
      }
      ctx.fill();
      ctx.lineWidth = isMiddleHero ? 2 : 1.5;
      ctx.strokeStyle = isMiddleHero ? primaryColor : `rgba(255, 255, 255, ${Math.min(0.35, cardAlpha * 0.4)})`;
      ctx.stroke();
      ctx.restore();
    }

    let curY = cardYPos + pad;
    const matchZ = (field: keyof ElementZoneMapping) => zMap[field] === zone;
    const align = options.cardTextAlign || "left";
    const alignX = align === "center" ? innerX + innerW / 2 : align === "right" ? innerX + innerW : innerX;

    // 1. Title
    if (hasTitle && matchZ("title")) {
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.round(34 * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = options.customTitleColor || "#FFFFFF";
      curY = wrapTextTop(ctx, processedTitle, alignX, curY, innerW, Math.round(44 * fScale), 2, align);
      curY += 10;
    }

    // 2. Project Name
    if (hasProject && matchZ("projectName")) {
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.round((isMiddleHero ? 34 : 24) * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = options.customProjectNameColor || (isMiddleHero ? "#FFFFFF" : primaryColor);
      ctx.fillText(`🏢 ${options.projectName}`, alignX, curY);
      curY += Math.round((isMiddleHero ? 38 : 28) * fScale) + 8;
    }

    // 3. Location / Transit
    if (hasLoc && matchZ("location")) {
      const locStr = [options.locationText, options.transitText].filter(Boolean).join("  •  ");
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.round(18 * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = "#E2E8F0";
      ctx.fillText(`📍 ${locStr}`, alignX, curY);
      curY += Math.round(24 * fScale) + 12;
    }

    // 4. Headline
    if (hasHeadline && matchZ("headline")) {
      ctx.save();
      ctx.font = `600 ${Math.round(20 * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = options.customHeadlineColor || primaryColor;
      curY = wrapTextTop(ctx, `✨ ${options.headline}`, alignX, curY, innerW, Math.round(28 * fScale), 1, align);
      ctx.restore();
      curY += 12;
    }

    // 5. Spec Pills & Badges
    if (pills.length > 0 && matchZ("specs")) {
      const pillH = Math.round(32 * fScale * specScale);
      const pillFontPx = Math.round(14 * fScale * specScale);
      const pillPadX = Math.round(22 * specScale);
      ctx.font = `bold ${pillFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textBaseline = "middle";

      const rows: { text: string; width: number }[][] = [[]];
      let currentRowW = 0;
      pills.forEach((pillText) => {
        const pWidth = ctx.measureText(pillText).width + pillPadX;
        if (currentRowW + pWidth > innerW && currentRowW > 0) {
          rows.push([]);
          currentRowW = 0;
        }
        rows[rows.length - 1].push({ text: pillText, width: pWidth });
        currentRowW += pWidth + Math.round(8 * specScale);
      });

      let pillRowY = curY;
      rows.forEach((row) => {
        const rowTotalW = row.reduce((acc, p) => acc + p.width, 0) + (row.length - 1) * Math.round(8 * specScale);
        let pillRowX = align === "center" ? innerX + (innerW - rowTotalW) / 2 : align === "right" ? innerX + innerW - rowTotalW : innerX;

        row.forEach((item) => {
          roundRect(ctx, pillRowX, pillRowY, item.width, pillH, Math.round(pillH / 2));
          ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
          ctx.fill();

          ctx.textAlign = "left";
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(item.text, pillRowX + Math.round(pillPadX / 2), pillRowY + pillH / 2);
          pillRowX += item.width + Math.round(8 * specScale);
        });
        pillRowY += pillH + Math.round(8 * specScale);
      });
      curY = pillRowY + Math.round(8 * specScale);
    }

    // 6. Price & Dual Price
    if (showPrice && matchZ("price")) {
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      let priceFontSize = Math.round(44 * priceFScale);
      ctx.font = `bold ${priceFontSize}px 'Prompt', sans-serif`;
      let pWidth = ctx.measureText(options.priceText).width;
      if (pWidth > innerW) {
        priceFontSize = Math.max(26, Math.floor((innerW / pWidth) * priceFontSize));
        ctx.font = `bold ${priceFontSize}px 'Prompt', sans-serif`;
        pWidth = ctx.measureText(options.priceText).width;
      }

      ctx.fillStyle = options.customPriceColor || "#FFFFFF";
      ctx.fillText(options.priceText, alignX, curY);

      if (options.showOriginalPrice !== false && options.originalPriceText) {
        const origFontSize = Math.round(priceFontSize * 0.52);
        ctx.font = `500 ${origFontSize}px 'Prompt', sans-serif`;
        ctx.fillStyle = "#94A3B8";
        const origX = align === "center" ? alignX + pWidth / 2 + 14 : align === "right" ? alignX - pWidth - 14 : innerX + pWidth + 14;

        if (origX + 60 <= innerX + innerW && origX >= innerX) {
          ctx.textAlign = align === "right" ? "right" : "left";
          ctx.fillText(options.originalPriceText, origX, curY + Math.round(priceFontSize * 0.3));
          const origW = ctx.measureText(options.originalPriceText).width;
          const strikeLeft = align === "right" ? origX - origW - 2 : origX - 2;
          const strikeRight = align === "right" ? origX + 2 : origX + origW + 2;
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#EF4444";
          ctx.beginPath();
          ctx.moveTo(strikeLeft, curY + Math.round(priceFontSize * 0.55));
          ctx.lineTo(strikeRight, curY + Math.round(priceFontSize * 0.55));
          ctx.stroke();
        }
      }
      curY += priceFontSize + 8;
    }

    // 7. Footer (Contact & QR Code)
    if (hasFooter && matchZ("contact")) {
      if (showPrice && matchZ("price")) curY += 12;
      const footerY = curY;
      const qrSize = Math.round(78 * (fScale > 1.1 ? 1.05 : 1.0));

      if (showQr && options.qrCodeUrl) {
        loadImage(options.qrCodeUrl).then((qrImg) => {
          const qrX = width - outerMarginX - pad - qrSize - cardRightMargin;
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.3)";
          ctx.shadowBlur = 8;
          roundRect(ctx, qrX - 4, footerY - 4, qrSize + 8, qrSize + 8, 12);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();
          ctx.drawImage(qrImg, qrX, footerY, qrSize, qrSize);
          ctx.restore();

          ctx.font = `bold ${Math.round(11 * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
          ctx.fillStyle = "#94A3B8";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(getScanQrText(), qrX + qrSize / 2, footerY + qrSize + 6);
        }).catch(() => {});
      }

      let contactLeftX = innerX;
      if (options.showAgentAvatar && options.agentAvatarUrl) {
        loadImage(options.agentAvatarUrl).then((avatarImg) => {
          const avSize = 54;
          const avX = innerX;
          const avY = footerY;
          ctx.save();
          ctx.beginPath();
          ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatarImg, avX, avY, avSize, avSize);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.strokeStyle = primaryColor;
          ctx.stroke();
        }).catch(() => {});
        contactLeftX += 54 + 12;
      }

      if (showContact) {
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = `bold ${Math.round(16 * fScale)}px 'Prompt', sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        let textLineY = footerY;
        if (options.agentName) { ctx.fillText(`👤 ${options.agentName}`, contactLeftX, textLineY); textLineY += 24; }
        if (options.contactPhone) { ctx.fillText(`📞 ${options.contactPhone}`, contactLeftX, textLineY); textLineY += 24; }
        if (options.contactLine) { ctx.fillText(`💬 LINE: ${options.contactLine}`, contactLeftX, textLineY); }
      }
    }
  };

  // Draw Card 1 (Zone A)
  if (showCardContent && hasZoneAItems) {
    renderCardZone("zone_a", card1Y, card1H, hasZoneBItems);
  }

  // Draw Card 2 (Zone B)
  if (showCardContent && hasZoneBItems) {
    renderCardZone("zone_b", card2Y, card2H, false);
  }

  // Draw Viral Text Effect
  renderTextEffect(ctx, options, width, height, card1Y, card1H, card2Y, card2H, showCardContent);

  // Draw Callout Feature Pointers
  renderCalloutPointers(ctx, options.calloutPointers, width, height);

  // Draw Additional Custom Text Badges
  renderCustomTexts(ctx, options.customTexts, width, height);
}
