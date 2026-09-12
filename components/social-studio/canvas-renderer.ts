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

interface SpecPillItem {
  icon?: "bed" | "bath" | "parking" | "sqm" | "floor";
  text: string;
}

/**
 * Draw crisp vector line icon for Specs (Bed, Bath, Parking, SQ.M., Floor)
 * Matching the luxury real estate glass card style (no emojis!)
 */
function drawSpecVectorIcon(
  ctx: CanvasRenderingContext2D,
  type: "bed" | "bath" | "parking" | "sqm" | "floor",
  x: number,
  y: number,
  size: number,
  color: string = "#FFFFFF"
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.085);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (type === "bed") {
    // BedDouble: Headboard, 2 pillows, mattress body, 2 legs
    ctx.beginPath();
    roundRect(ctx, x + size * 0.08, y + size * 0.16, size * 0.84, size * 0.32, Math.max(1, size * 0.06));
    ctx.stroke();

    ctx.beginPath();
    roundRect(ctx, x + size * 0.16, y + size * 0.22, size * 0.28, size * 0.20, Math.max(1, size * 0.04));
    roundRect(ctx, x + size * 0.56, y + size * 0.22, size * 0.28, size * 0.20, Math.max(1, size * 0.04));
    ctx.stroke();

    ctx.beginPath();
    roundRect(ctx, x + size * 0.05, y + size * 0.48, size * 0.90, size * 0.34, Math.max(1, size * 0.06));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.12, y + size * 0.82);
    ctx.lineTo(x + size * 0.12, y + size * 0.94);
    ctx.moveTo(x + size * 0.88, y + size * 0.82);
    ctx.lineTo(x + size * 0.88, y + size * 0.94);
    ctx.stroke();
  } else if (type === "bath") {
    // Bathtub with curved shower pipe & droplets
    ctx.beginPath();
    ctx.moveTo(x + size * 0.12, y + size * 0.50);
    ctx.lineTo(x + size * 0.90, y + size * 0.50);
    ctx.lineTo(x + size * 0.90, y + size * 0.66);
    ctx.bezierCurveTo(x + size * 0.90, y + size * 0.86, x + size * 0.76, y + size * 0.86, x + size * 0.51, y + size * 0.86);
    ctx.bezierCurveTo(x + size * 0.26, y + size * 0.86, x + size * 0.12, y + size * 0.86, x + size * 0.12, y + size * 0.66);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.24, y + size * 0.86);
    ctx.lineTo(x + size * 0.20, y + size * 0.95);
    ctx.moveTo(x + size * 0.78, y + size * 0.86);
    ctx.lineTo(x + size * 0.82, y + size * 0.95);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.22, y + size * 0.50);
    ctx.lineTo(x + size * 0.22, y + size * 0.16);
    ctx.bezierCurveTo(x + size * 0.22, y + size * 0.06, x + size * 0.44, y + size * 0.06, x + size * 0.44, y + size * 0.16);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.38, y + size * 0.20);
    ctx.lineTo(x + size * 0.50, y + size * 0.12);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + size * 0.42, y + size * 0.30, Math.max(1, size * 0.035), 0, Math.PI * 2);
    ctx.arc(x + size * 0.49, y + size * 0.36, Math.max(1, size * 0.035), 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "parking") {
    // Front view car: windshield, roof, bumper body, headlights, grille, wheels
    ctx.beginPath();
    ctx.moveTo(x + size * 0.22, y + size * 0.50);
    ctx.lineTo(x + size * 0.31, y + size * 0.20);
    ctx.lineTo(x + size * 0.69, y + size * 0.20);
    ctx.lineTo(x + size * 0.78, y + size * 0.50);
    ctx.stroke();

    ctx.beginPath();
    roundRect(ctx, x + size * 0.12, y + size * 0.48, size * 0.76, size * 0.34, Math.max(1, size * 0.07));
    ctx.stroke();

    ctx.beginPath();
    roundRect(ctx, x + size * 0.20, y + size * 0.58, size * 0.14, size * 0.09, Math.max(1, size * 0.03));
    roundRect(ctx, x + size * 0.66, y + size * 0.58, size * 0.14, size * 0.09, Math.max(1, size * 0.03));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.42, y + size * 0.64);
    ctx.lineTo(x + size * 0.58, y + size * 0.64);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.22, y + size * 0.82);
    ctx.lineTo(x + size * 0.22, y + size * 0.94);
    ctx.moveTo(x + size * 0.78, y + size * 0.82);
    ctx.lineTo(x + size * 0.78, y + size * 0.94);
    ctx.stroke();
  } else if (type === "sqm") {
    // Square with two diagonal expand arrows
    ctx.beginPath();
    roundRect(ctx, x + size * 0.10, y + size * 0.10, size * 0.80, size * 0.80, Math.max(1, size * 0.08));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.26, y + size * 0.46);
    ctx.lineTo(x + size * 0.26, y + size * 0.26);
    ctx.lineTo(x + size * 0.46, y + size * 0.26);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.74, y + size * 0.54);
    ctx.lineTo(x + size * 0.74, y + size * 0.74);
    ctx.lineTo(x + size * 0.54, y + size * 0.74);
    ctx.stroke();
  } else if (type === "floor") {
    // High-rise building with windows
    ctx.beginPath();
    roundRect(ctx, x + size * 0.20, y + size * 0.12, size * 0.60, size * 0.76, Math.max(1, size * 0.06));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size * 0.34, y + size * 0.28);
    ctx.lineTo(x + size * 0.44, y + size * 0.28);
    ctx.moveTo(x + size * 0.56, y + size * 0.28);
    ctx.lineTo(x + size * 0.66, y + size * 0.28);
    ctx.moveTo(x + size * 0.34, y + size * 0.46);
    ctx.lineTo(x + size * 0.44, y + size * 0.46);
    ctx.moveTo(x + size * 0.56, y + size * 0.46);
    ctx.lineTo(x + size * 0.66, y + size * 0.46);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draws luxury dark frosted capsule header badge with specular reflection highlight,
 * regal serif gold typography, and uppercase subtitle (as shown in Botanica luxury reference).
 */
function drawFrostedCapsuleHeader(
  ctx: CanvasRenderingContext2D,
  options: BannerRenderOptions,
  width: number,
  topY: number,
  outerMarginX: number,
  hScale: number
): { bottomY: number; pillX: number; pillW: number; pillY: number; pillH: number; centerY: number } {
  const companyTitle = options.customCompanyName || options.companyName || "Vcc Asset";
  const companySubtitle = options.customCompanySubtitle || "LUXURY VILLAS • CHERNGTALAY, PHUKET";

  // Calculate separate scales for Title and Subtitle
  const tScaleOpt = options.brandingTitleFontSizeScale;
  const sScaleOpt = options.brandingSubtitleFontSizeScale;
  const tScale = tScaleOpt === "sm" ? 0.8 : tScaleOpt === "lg" ? 1.2 : tScaleOpt === "xl" ? 1.4 : (tScaleOpt === "md" ? 1.0 : hScale);
  const sScale = sScaleOpt === "sm" ? 0.8 : sScaleOpt === "lg" ? 1.2 : sScaleOpt === "xl" ? 1.4 : (sScaleOpt === "md" ? 1.0 : hScale);

  // Fonts setup: Regal serif for Title, crisp clean sans-serif for Subtitle
  const titleFontSize = Math.round(40 * tScale);
  const subtitleFontSize = Math.round(14 * sScale);
  const titleFont = `700 ${titleFontSize}px 'Cinzel', 'Playfair Display', 'Cormorant Garamond', 'Georgia', serif`;
  const subtitleFont = `600 ${subtitleFontSize}px 'Prompt', 'Inter', sans-serif`;

  ctx.save();
  ctx.font = titleFont;
  const titleW = ctx.measureText(companyTitle).width;
  ctx.font = subtitleFont;
  const subtitleW = ctx.measureText(companySubtitle).width;

  const contentW = Math.max(titleW, subtitleW);
  const maxScale = Math.max(tScale, sScale, hScale);
  const padX = Math.round(52 * maxScale);
  const pillW = Math.max(Math.round(340 * maxScale), Math.round(contentW + padX * 2));
  
  // Calculate dynamic pill height and vertical positioning so text is centered and never clips
  const lineGap = Math.round(6 * maxScale);
  const contentH = titleFontSize + lineGap + subtitleFontSize;
  const pillH = Math.max(Math.round(92 * maxScale), Math.round(contentH + 28 * maxScale));

  const align = options.brandingHeaderAlign || "center";
  const pillX = align === "left" ? outerMarginX : Math.round((width - pillW) / 2);
  const pillY = topY + (options.headerYOffset || 0);
  const radius = Math.round(pillH / 2);

  // Calculate base background fill color (Supports custom brandingBgColor)
  let baseFill = "rgba(15, 20, 28, 0.82)";
  let shadowFill = "rgba(14, 18, 24, 0.82)";
  if (options.brandingBgColor) {
    const hex = options.brandingBgColor.replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16) || 15;
      const g = parseInt(hex.substring(2, 4), 16) || 20;
      const b = parseInt(hex.substring(4, 6), 16) || 28;
      baseFill = `rgba(${r}, ${g}, ${b}, 0.88)`;
      shadowFill = `rgba(${Math.max(0, r - 5)}, ${Math.max(0, g - 5)}, ${Math.max(0, b - 5)}, 0.85)`;
    } else {
      baseFill = options.brandingBgColor;
      shadowFill = options.brandingBgColor;
    }
  }

  // 1. Soft Drop Shadow Behind Capsule
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.50)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, pillX, pillY, pillW, pillH, radius);
  ctx.fillStyle = shadowFill;
  ctx.fill();
  ctx.restore();

  // 2. Clipped Glass Body: Deep Dark Frosted Obsidian Glass (or custom brandingBgColor)
  ctx.save();
  roundRect(ctx, pillX, pillY, pillW, pillH, radius);
  ctx.clip();

  // Base glass fill
  ctx.fillStyle = baseFill;
  ctx.fill();

  // Soft internal gradient
  const innerGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
  innerGrad.addColorStop(0, "rgba(255, 255, 255, 0.09)");
  innerGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
  innerGrad.addColorStop(1, "rgba(0, 0, 0, 0.25)");
  ctx.fillStyle = innerGrad;
  ctx.fill();

  // 3. Specular Curved Glossy Highlight (Signature luxury glass shine across top-right)
  ctx.beginPath();
  ctx.moveTo(pillX + pillW * 0.38, pillY);
  ctx.bezierCurveTo(
    pillX + pillW * 0.48, pillY + pillH * 0.62,
    pillX + pillW * 0.82, pillY + pillH * 0.52,
    pillX + pillW, pillY + pillH * 0.22
  );
  ctx.lineTo(pillX + pillW, pillY);
  ctx.closePath();
  const sheenGrad = ctx.createLinearGradient(
    pillX + pillW * 0.5, pillY,
    pillX + pillW * 0.75, pillY + pillH * 0.6
  );
  sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  sheenGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
  sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = sheenGrad;
  ctx.fill();

  ctx.restore(); // end clip

  // 4. Delicate Rim Stroke (Base rim around entire capsule)
  ctx.save();
  roundRect(ctx, pillX, pillY, pillW, pillH, radius);
  ctx.lineWidth = 1.2;
  const rimGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillH);
  rimGrad.addColorStop(0, "rgba(255, 255, 255, 0.28)");
  rimGrad.addColorStop(0.4, "rgba(226, 201, 138, 0.20)");
  rimGrad.addColorStop(1, "rgba(255, 255, 255, 0.08)");
  ctx.strokeStyle = rimGrad;
  ctx.stroke();

  // 4.1 Center Specular Rim Glow (สว่างตรงกลาง ส่วนขอบตรงอื่นยังปกติ)
  ctx.beginPath();
  const topCenterGlow = ctx.createLinearGradient(
    pillX + pillW * 0.25, pillY,
    pillX + pillW * 0.75, pillY
  );
  topCenterGlow.addColorStop(0, "rgba(255, 255, 255, 0.0)");
  topCenterGlow.addColorStop(0.30, "rgba(255, 255, 255, 0.45)");
  topCenterGlow.addColorStop(0.50, "rgba(255, 255, 255, 1.0)");
  topCenterGlow.addColorStop(0.70, "rgba(255, 255, 255, 0.45)");
  topCenterGlow.addColorStop(1, "rgba(255, 255, 255, 0.0)");
  ctx.strokeStyle = topCenterGlow;
  ctx.lineWidth = 2.4;
  ctx.shadowColor = "rgba(255, 255, 255, 0.90)";
  ctx.shadowBlur = 8;
  ctx.moveTo(pillX + pillW * 0.25, pillY);
  ctx.lineTo(pillX + pillW * 0.75, pillY);
  ctx.stroke();
  ctx.restore();

  // 5. Line 1: Brand / Project Name (Serif Gold Gradient)
  const centerX = pillX + pillW / 2;
  const titleY = pillY + Math.round((pillH - contentH) / 2) - 1;

  ctx.save();
  ctx.font = titleFont;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetY = 2;

  // Champagne Gold Gradient Fill
  const titleGrad = ctx.createLinearGradient(centerX, titleY, centerX, titleY + titleFontSize);
  titleGrad.addColorStop(0, "#F7E6BF");
  titleGrad.addColorStop(0.45, "#E5C682");
  titleGrad.addColorStop(1, "#BA9547");
  ctx.fillStyle = options.brandingTitleColor || titleGrad;
  ctx.fillText(companyTitle, centerX, titleY);
  ctx.restore();

  // 6. Line 2: Subtitle (Clean Sans-serif Gold)
  const subtitleY = titleY + titleFontSize + lineGap;

  ctx.save();
  ctx.font = subtitleFont;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0, 0, 0, 0.60)";
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = options.brandingSubtitleColor || "#E2C98A";
  ctx.fillText(companySubtitle, centerX, subtitleY);
  ctx.restore();

  ctx.restore();

  return { bottomY: pillY + pillH, pillX, pillW, pillY, pillH, centerY: pillY + pillH / 2 };
}

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
  const isPortraitTall = options.aspectRatio === "2:3";
  const outerMarginX = isStory ? 48 : isPortraitTall ? 44 : options.aspectRatio === "3:2" ? 48 : 36;
  const baseTopY = isStory ? 86 : isPortraitTall ? 60 : 40;
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

  // Localized Spec Pills with Vector Line Icons
  const pills: SpecPillItem[] = [];
  if (showSpecs) {
    if (options.specs.bedrooms) {
      const bedsLabel =
        lang === "en" ? `${options.specs.bedrooms} ${options.specs.bedrooms > 1 ? "Beds" : "Bed"}`
        : lang === "zh" ? `${options.specs.bedrooms} 房`
        : lang === "ru" ? `${options.specs.bedrooms} спальни`
        : `${options.specs.bedrooms} นอน`;
      pills.push({ icon: "bed", text: bedsLabel });
    }
    if (options.specs.bathrooms) {
      const bathsLabel =
        lang === "en" ? `${options.specs.bathrooms} ${options.specs.bathrooms > 1 ? "Baths" : "Bath"}`
        : lang === "zh" ? `${options.specs.bathrooms} 卫`
        : lang === "ru" ? `${options.specs.bathrooms} санузла`
        : `${options.specs.bathrooms} น้ำ`;
      pills.push({ icon: "bath", text: bathsLabel });
    }
    if (options.specs.parking) {
      const parkingLabel =
        lang === "en" ? `${options.specs.parking} Parking`
        : lang === "zh" ? `${options.specs.parking} 车位`
        : lang === "ru" ? `${options.specs.parking} паркинг`
        : `${options.specs.parking} ที่จอด`;
      pills.push({ icon: "parking", text: parkingLabel });
    }
    if (options.specs.sizeSqm) {
      const sqmLabel =
        lang === "en" ? `${options.specs.sizeSqm} SQ.M.`
        : lang === "zh" ? `${options.specs.sizeSqm} 平米`
        : lang === "ru" ? `${options.specs.sizeSqm} м²`
        : `${options.specs.sizeSqm} ตร.ม.`;
      pills.push({ icon: "sqm", text: sqmLabel });
    }
    if (options.specs.floor) {
      const floorLabel =
        lang === "en" ? `Fl. ${options.specs.floor}`
        : lang === "zh" ? `${options.specs.floor} 层`
        : lang === "ru" ? `${options.specs.floor} этаж`
        : `ชั้น ${options.specs.floor}`;
      pills.push({ icon: "floor", text: floorLabel });
    }
  }
  const isFrostedLuxury =
    !options.cardBackground ||
    options.cardBackground === "frosted_luxury" ||
    options.cardBackground === "crystal_glass" ||
    options.cardBackground === "obsidian_glass" ||
    options.cardBackground === "champagne_glass" ||
    options.cardBackground === "smoked_glass";

  const ownershipBadge = options.ownershipBadge;

  // Add highlight sticker badges (excluding dedicated ownership badge) to pills
  const highlightBadges = (options.badges || []).filter((b) => b !== ownershipBadge);
  highlightBadges.slice(0, 2).forEach((b) => pills.push({ text: b }));

  // If ownership badge is selected, but not drawn in frosted luxury price section (e.g. no price or non-frosted card), show in pills
  if (ownershipBadge && (!isFrostedLuxury || options.showPrice === false || !options.priceText)) {
    pills.push({ text: ownershipBadge });
  }

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
  if (isFrostedLuxury && pills.length > 0 && inA("specs") && showPrice && inA("price")) zoneAContentH += 18;
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
  if (isFrostedLuxury && pills.length > 0 && inB("specs") && showPrice && inB("price")) zoneBContentH += 18;
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
    const bottomMargin = isStory ? 116 : isPortraitTall ? 60 : 24;
    card2Y = height - card2H - bottomMargin + card2YOffset;
  } else if (hasZoneAItems && !hasZoneBItems) {
    const bottomMargin = isStory ? 116 : isPortraitTall ? 60 : 24;
    card1Y = options.contentPosition === "center"
      ? Math.round((height - card1H) / 2) + card1YOffset
      : options.contentPosition === "top"
        ? (options.showBrandingHeader !== false ? topY + 70 : baseTopY) + card1YOffset
        : height - card1H - bottomMargin + card1YOffset;
  } else {
    const bottomMargin = isStory ? 116 : isPortraitTall ? 60 : 24;
    card2Y = options.contentPosition === "center"
      ? Math.round((height - card2H) / 2) + card2YOffset
      : options.contentPosition === "top"
        ? (options.showBrandingHeader !== false ? topY + 70 : baseTopY) + card2YOffset
        : height - card2H - bottomMargin + card2YOffset;
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
      options.gridLineColor || options.customCanvasBgColor,
      options.fitWithBlurredBackdrop || false,
      options.slotCropOffsets,
      options.bgBlur || 0
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

  let headerCenterY = topY + 40;
  let badgeBottomY = topY;

  if (showHeader) {
    if (options.brandingHeaderStyle === "frosted_capsule") {
      const capsule = drawFrostedCapsuleHeader(ctx, options, width, topY, outerMarginX, hScale);
      badgeBottomY = Math.max(badgeBottomY, capsule.bottomY);
      headerCenterY = capsule.centerY;
    } else {
      const tScaleOpt = options.brandingTitleFontSizeScale;
      const sScaleOpt = options.brandingSubtitleFontSizeScale;
      const tScale = tScaleOpt === "sm" ? 0.8 : tScaleOpt === "lg" ? 1.2 : tScaleOpt === "xl" ? 1.4 : (tScaleOpt === "md" ? 1.0 : hScale);
      const sScale = sScaleOpt === "sm" ? 0.8 : sScaleOpt === "lg" ? 1.2 : sScaleOpt === "xl" ? 1.4 : (sScaleOpt === "md" ? 1.0 : hScale);

      const titleFontSize = Math.round(30 * tScale);
      const subtitleFontSize = Math.round(16 * sScale);
      const headerEffectiveY = topY + (options.headerYOffset || 0);
      const contentH = titleFontSize + Math.round(8 * tScale) + subtitleFontSize;
      headerCenterY = headerEffectiveY + contentH / 2;

      ctx.textBaseline = "top";
      ctx.font = `bold ${titleFontSize}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = options.brandingTitleColor || "#FFFFFF";
      ctx.textAlign = "left";
      ctx.fillText(options.customCompanyName || options.companyName || "VCC ASSET", outerMarginX, headerEffectiveY);

      ctx.font = `500 ${subtitleFontSize}px 'Prompt', sans-serif`;
      ctx.fillStyle = options.brandingSubtitleColor || primaryColor;
      ctx.fillText(options.customCompanySubtitle || "PREMIUM REAL ESTATE", outerMarginX, headerEffectiveY + titleFontSize + Math.round(8 * tScale));
      badgeBottomY = Math.max(badgeBottomY, headerEffectiveY + contentH);
    }
  }

  if (showBadge) {
    const listingLabel = options.customListingBadgeText || getListingBadgeText();
    ctx.font = `bold ${Math.round(22 * bScale)}px 'Prompt', sans-serif`;
    const textW = ctx.measureText(listingLabel).width;
    const badgeW = Math.max(Math.round(170 * bScale), Math.round(textW + 42 * bScale));
    const badgeH = Math.round(52 * bScale);
    const badgeX = width - outerMarginX - badgeW;
    // Align vertical center with header capsule
    const badgeY = showHeader
      ? Math.round(headerCenterY - badgeH / 2)
      : topY + (options.headerYOffset || 0);
    badgeBottomY = Math.max(badgeBottomY, badgeY + badgeH);

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
    const bgStyle: CardBackground = options.cardBackground || "frosted_luxury";
    const defaultBgAlpha =
      bgStyle === "solid" ? 0.95
      : bgStyle === "minimal_gradient" ? 0.0
      : bgStyle === "crystal_glass" ? 0.65
      : bgStyle === "obsidian_glass" ? 0.86
      : bgStyle === "champagne_glass" ? 0.80
      : bgStyle === "smoked_glass" ? 0.75
      : bgStyle === "frosted_luxury" ? 0.78
      : 0.64;
    const cardAlpha = options.cardOpacity !== undefined ? options.cardOpacity / 100 : defaultBgAlpha;
    const glassBlur = options.glassBlur !== undefined ? options.glassBlur : 24;
    const centerGlow = options.centerGlow !== undefined ? options.centerGlow : 100;
    const centerGlowBlur = options.centerGlowBlur !== undefined ? options.centerGlowBlur : 5;
    const glowBorderWidth = options.glowBorderWidth !== undefined ? options.glowBorderWidth : 55;
    const centerGlowFactor = centerGlow / 100;

    // Parse customizable centerGlowColor (defaults to pure white #FFFFFF)
    const rawGlowColor = options.centerGlowColor?.trim();
    let glowR = 255;
    let glowG = 255;
    let glowB = 255;
    if (rawGlowColor && rawGlowColor.startsWith("#")) {
      const cleanHex = rawGlowColor.replace("#", "");
      if (cleanHex.length === 6) {
        glowR = parseInt(cleanHex.substring(0, 2), 16) || 255;
        glowG = parseInt(cleanHex.substring(2, 4), 16) || 255;
        glowB = parseInt(cleanHex.substring(4, 6), 16) || 255;
      }
    }

    if (cardAlpha > 0) {
      // 0. Backdrop Glass Blur (Actual backdrop-filter: blur(24px) via canvas snapshot clipping)
      if (glassBlur > 0 && bgStyle !== "solid" && bgStyle !== "minimal_gradient") {
        ctx.save();
        roundRect(ctx, cardX, cardYPos, cardW, cardH, 28);
        ctx.clip();
        ctx.filter = `blur(${glassBlur}px)`;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.restore();
      }

      ctx.save();
      const shadowBlur = bgStyle === "obsidian_glass" ? 36 : isFrostedLuxury ? 32 : 24;
      const shadowOffsetY = bgStyle === "obsidian_glass" || isFrostedLuxury ? 12 : 8;
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetY = shadowOffsetY;
      roundRect(ctx, cardX, cardYPos, cardW, cardH, 28);

      const hasCustomTint = Boolean(options.customCardBgColor && options.customCardBgColor.trim() !== "");

      if (hasCustomTint) {
        const hex = options.customCardBgColor!.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) || 15;
        const g = parseInt(hex.substring(2, 4), 16) || 23;
        const b = parseInt(hex.substring(4, 6), 16) || 42;
        const tintGrad = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        tintGrad.addColorStop(0, `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 25)}, ${cardAlpha})`);
        tintGrad.addColorStop(1, `rgba(${Math.max(0, r - 8)}, ${Math.max(0, g - 8)}, ${Math.max(0, b - 8)}, ${Math.min(1.0, cardAlpha * 1.15)})`);
        ctx.fillStyle = tintGrad;
        ctx.fill();

        if (bgStyle !== "solid") {
          const isLightTint = (r * 0.299 + g * 0.587 + b * 0.114) > 160;
          const frostSheen = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
          if (isLightTint) {
            frostSheen.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.55, cardAlpha * 0.50)})`);
            frostSheen.addColorStop(0.3, `rgba(255, 255, 255, ${Math.min(0.30, cardAlpha * 0.25)})`);
            frostSheen.addColorStop(0.7, `rgba(255, 255, 255, ${Math.min(0.15, cardAlpha * 0.15)})`);
            frostSheen.addColorStop(1, `rgba(255, 255, 255, ${Math.min(0.35, cardAlpha * 0.30)})`);
          } else {
            frostSheen.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.35, cardAlpha * 0.35)})`);
            frostSheen.addColorStop(0.25, `rgba(255, 255, 255, ${Math.min(0.18, cardAlpha * 0.20)})`);
            frostSheen.addColorStop(0.70, `rgba(255, 255, 255, ${Math.min(0.08, cardAlpha * 0.10)})`);
            frostSheen.addColorStop(1, `rgba(255, 255, 255, ${Math.min(0.16, cardAlpha * 0.18)})`);
          }
          ctx.fillStyle = frostSheen;
          ctx.fill();
        }
      } else if (bgStyle === "solid") {
        ctx.fillStyle = options.customCardBgColor || `rgba(15, 23, 42, ${cardAlpha})`;
        ctx.fill();
      } else if (bgStyle === "crystal_glass") {
        const grad = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        grad.addColorStop(0, `rgba(240, 246, 255, ${Math.min(0.65, cardAlpha * 0.50)})`);
        grad.addColorStop(0.55, `rgba(215, 230, 252, ${Math.min(0.50, cardAlpha * 0.38)})`);
        grad.addColorStop(1, `rgba(185, 210, 240, ${Math.min(0.60, cardAlpha * 0.48)})`);
        ctx.fillStyle = grad;
        ctx.fill();

        const iceFrost = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        iceFrost.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.55, cardAlpha * 0.50)})`);
        iceFrost.addColorStop(0.3, `rgba(255, 255, 255, ${Math.min(0.30, cardAlpha * 0.25)})`);
        iceFrost.addColorStop(0.7, `rgba(255, 255, 255, ${Math.min(0.15, cardAlpha * 0.12)})`);
        iceFrost.addColorStop(1, `rgba(255, 255, 255, ${Math.min(0.35, cardAlpha * 0.30)})`);
        ctx.fillStyle = iceFrost;
        ctx.fill();
      } else if (bgStyle === "obsidian_glass") {
        const grad = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        grad.addColorStop(0, `rgba(8, 12, 22, ${cardAlpha * 1.05})`);
        grad.addColorStop(0.6, `rgba(4, 7, 15, ${cardAlpha * 1.15})`);
        grad.addColorStop(1, `rgba(2, 3, 8, ${cardAlpha * 1.25})`);
        ctx.fillStyle = grad;
        ctx.fill();

        const frostSheen = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        frostSheen.addColorStop(0, `rgba(147, 197, 253, ${Math.min(0.25, cardAlpha * 0.22)})`);
        frostSheen.addColorStop(0.5, `rgba(255, 255, 255, 0.0)`);
        frostSheen.addColorStop(1, `rgba(147, 197, 253, ${Math.min(0.12, cardAlpha * 0.12)})`);
        ctx.fillStyle = frostSheen;
        ctx.fill();
      } else if (bgStyle === "champagne_glass") {
        const grad = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        grad.addColorStop(0, `rgba(38, 28, 16, ${cardAlpha * 0.95})`);
        grad.addColorStop(0.55, `rgba(22, 16, 9, ${cardAlpha * 1.10})`);
        grad.addColorStop(1, `rgba(12, 8, 4, ${cardAlpha * 1.20})`);
        ctx.fillStyle = grad;
        ctx.fill();

        const goldFrost = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        goldFrost.addColorStop(0, `rgba(254, 240, 138, ${Math.min(0.35, cardAlpha * 0.30)})`);
        goldFrost.addColorStop(0.5, `rgba(251, 191, 36, ${Math.min(0.12, cardAlpha * 0.12)})`);
        goldFrost.addColorStop(1, `rgba(245, 158, 11, ${Math.min(0.20, cardAlpha * 0.18)})`);
        ctx.fillStyle = goldFrost;
        ctx.fill();
      } else if (bgStyle === "smoked_glass") {
        const grad = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        grad.addColorStop(0, `rgba(28, 30, 36, ${cardAlpha * 0.88})`);
        grad.addColorStop(1, `rgba(14, 16, 20, ${cardAlpha * 1.05})`);
        ctx.fillStyle = grad;
        ctx.fill();

        const smokeSheen = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        smokeSheen.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.22, cardAlpha * 0.20)})`);
        smokeSheen.addColorStop(1, `rgba(255, 255, 255, ${Math.min(0.08, cardAlpha * 0.08)})`);
        ctx.fillStyle = smokeSheen;
        ctx.fill();
      } else if (bgStyle === "glass") {
        const grad = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        grad.addColorStop(0, `rgba(30, 41, 59, ${cardAlpha * 0.72})`);
        grad.addColorStop(0.55, `rgba(15, 23, 42, ${cardAlpha * 0.82})`);
        grad.addColorStop(1, `rgba(10, 15, 30, ${cardAlpha * 0.90})`);
        ctx.fillStyle = grad;
        ctx.fill();

        const glassSheen = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        glassSheen.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.32, cardAlpha * 0.32)})`);
        glassSheen.addColorStop(0.25, `rgba(255, 255, 255, ${Math.min(0.16, cardAlpha * 0.16)})`);
        glassSheen.addColorStop(0.70, `rgba(255, 255, 255, ${Math.min(0.06, cardAlpha * 0.06)})`);
        glassSheen.addColorStop(1, `rgba(255, 255, 255, ${Math.min(0.14, cardAlpha * 0.14)})`);
        ctx.fillStyle = glassSheen;
        ctx.fill();
      } else {
        // Default frosted_luxury: Signature Frosted White Glass ("พื้นหลังขาวใสเบลอ")
        // Layer 1: Base dark translucent foundation (rgba(20, 30, 42, 0.45))
        const baseBackdrop = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        baseBackdrop.addColorStop(0, `rgba(20, 30, 42, ${cardAlpha * 0.45})`);
        baseBackdrop.addColorStop(0.55, `rgba(16, 24, 36, ${cardAlpha * 0.58})`);
        baseBackdrop.addColorStop(1, `rgba(12, 18, 28, ${cardAlpha * 0.68})`);
        ctx.fillStyle = baseBackdrop;
        ctx.fill();

        // Layer 2: Radial Gradient at 50% 30% matching exact CSS with center glow color tint
        const radialFrost = ctx.createRadialGradient(
          cardX + cardW * 0.5, cardYPos + cardH * 0.30, 4,
          cardX + cardW * 0.5, cardYPos + cardH * 0.35, cardW * 0.55
        );
        const radCenterWhite = Math.min(0.60, 0.22 * centerGlowFactor * (cardAlpha / 0.78));
        const radMidWhite = Math.min(0.25, 0.05 * centerGlowFactor * (cardAlpha / 0.78));
        const radEdgeDark = Math.min(0.85, 0.55 * (cardAlpha / 0.78));
        radialFrost.addColorStop(0, `rgba(${glowR}, ${glowG}, ${glowB}, ${radCenterWhite})`);
        radialFrost.addColorStop(0.5, `rgba(${glowR}, ${glowG}, ${glowB}, ${radMidWhite})`);
        radialFrost.addColorStop(1, `rgba(15, 23, 30, ${radEdgeDark})`);
        ctx.fillStyle = radialFrost;
        ctx.fill();

        // Layer 3: Milky White Frosted Glass Sheen for rich specular depth
        const frostSheen = ctx.createLinearGradient(cardX, cardYPos, cardX, cardYPos + cardH);
        frostSheen.addColorStop(0, `rgba(255, 255, 255, ${Math.min(0.35, cardAlpha * 0.35)})`);
        frostSheen.addColorStop(0.25, `rgba(255, 255, 255, ${Math.min(0.18, cardAlpha * 0.20)})`);
        frostSheen.addColorStop(0.70, `rgba(255, 255, 255, ${Math.min(0.08, cardAlpha * 0.10)})`);
        frostSheen.addColorStop(1, `rgba(255, 255, 255, ${Math.min(0.16, cardAlpha * 0.18)})`);
        ctx.fillStyle = frostSheen;
        ctx.fill();
      }

      // Base Rim Stroke: Clean translucent white rim (1px solid rgba(255, 255, 255, 0.25))
      roundRect(ctx, cardX, cardYPos, cardW, cardH, 28);
      ctx.lineWidth = isMiddleHero ? 2 : 1.2;
      let rimStroke = `rgba(255, 255, 255, ${Math.min(0.45, cardAlpha * 0.38)})`;
      if (bgStyle === "champagne_glass") {
        rimStroke = `rgba(245, 220, 150, ${Math.min(0.50, cardAlpha * 0.55)})`;
      } else if (bgStyle === "obsidian_glass") {
        rimStroke = `rgba(147, 197, 253, ${Math.min(0.45, cardAlpha * 0.48)})`;
      } else if (bgStyle === "crystal_glass") {
        rimStroke = `rgba(255, 255, 255, ${Math.min(0.60, cardAlpha * 0.68)})`;
      } else if (bgStyle === "solid") {
        rimStroke = "rgba(51, 65, 85, 0.85)";
      }
      ctx.strokeStyle = isMiddleHero ? primaryColor : rimStroke;
      ctx.stroke();
      ctx.restore();

      // Specular Center Glowing Streaks (Thickened line with tight, controlled glow & customizable color on BOTH top and bottom)
      if (bgStyle !== "solid" && bgStyle !== "minimal_gradient" && options.cardBorderGlow !== false && centerGlow > 0) {
        ctx.save();
        const glowHalfW = (cardW * (glowBorderWidth / 100)) / 2;
        const glowStart = cardX + cardW * 0.5 - glowHalfW;
        const glowEnd = cardX + cardW * 0.5 + glowHalfW;
        const bottomY = cardYPos + cardH;

        // Shared specular highlight gradient based on customizable centerGlowColor
        const createGlowGradient = (y: number, isCore = false) => {
          const grad = ctx.createLinearGradient(glowStart, y, glowEnd, y);
          grad.addColorStop(0, `rgba(${glowR}, ${glowG}, ${glowB}, 0.0)`);
          grad.addColorStop(0.25, `rgba(${glowR}, ${glowG}, ${glowB}, ${Math.min(1.0, (isCore ? 0.35 : 0.55) * centerGlowFactor)})`);
          grad.addColorStop(0.50, `rgba(${glowR}, ${glowG}, ${glowB}, ${Math.min(1.0, 1.0 * centerGlowFactor)})`);
          grad.addColorStop(0.75, `rgba(${glowR}, ${glowG}, ${glowB}, ${Math.min(1.0, (isCore ? 0.35 : 0.55) * centerGlowFactor)})`);
          grad.addColorStop(1, `rgba(${glowR}, ${glowG}, ${glowB}, 0.0)`);
          return grad;
        };

        // Draw tight, refined highlight line with customizable glow blur
        const drawRimHighlight = (y: number) => {
          // Layer 1: Thickened highlight line with customizable tight glow (ปรับระดับความฟุ้งได้ตามต้องการ)
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(glowStart, y);
          ctx.lineTo(glowEnd, y);
          ctx.strokeStyle = createGlowGradient(y, false);
          ctx.lineWidth = 3.2; // เส้นหนาขึ้นตามต้องการ
          ctx.shadowColor = `rgba(${glowR}, ${glowG}, ${glowB}, ${Math.min(1.0, 0.90 * centerGlowFactor)})`;
          ctx.shadowBlur = Math.round(centerGlowBlur * centerGlowFactor); // ปรับระดับความฟุ้งได้
          ctx.stroke();
          ctx.restore();

          // Layer 2: Ultra-crisp razor core line with color tint
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(glowStart, y);
          ctx.lineTo(glowEnd, y);
          ctx.strokeStyle = createGlowGradient(y, true);
          ctx.lineWidth = 1.5;
          ctx.shadowColor = `rgba(${Math.round(255 * 0.35 + glowR * 0.65)}, ${Math.round(255 * 0.35 + glowG * 0.65)}, ${Math.round(255 * 0.35 + glowB * 0.65)}, ${Math.min(1.0, 0.95 * centerGlowFactor)})`;
          ctx.shadowBlur = Math.round(Math.min(3, centerGlowBlur * 0.4) * centerGlowFactor);
          ctx.stroke();
          ctx.restore();
        };

        // 1. TOP RIM SPECULAR HIGHLIGHT
        drawRimHighlight(cardYPos);

        // 2. BOTTOM RIM SPECULAR HIGHLIGHT
        drawRimHighlight(bottomY);

        ctx.restore();
      }
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

    // 5. Spec Pills & Badges with Clean Vector Line Icons
    if (pills.length > 0 && matchZ("specs")) {
      const pillH = Math.round(36 * fScale * specScale);
      const iconSize = Math.round(18 * fScale * specScale);
      const iconGap = Math.round(7 * specScale);
      const pillFontPx = Math.round(14 * fScale * specScale);
      const pillPadX = Math.round(22 * specScale);
      ctx.font = `600 ${pillFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textBaseline = "middle";

      const rows: { item: SpecPillItem; width: number }[][] = [[]];
      let currentRowW = 0;
      pills.forEach((pillItem) => {
        const textW = ctx.measureText(pillItem.text).width;
        const iconExtra = pillItem.icon ? iconSize + iconGap : 0;
        const pWidth = Math.round(textW + iconExtra + pillPadX);
        if (currentRowW + pWidth > innerW && currentRowW > 0) {
          rows.push([]);
          currentRowW = 0;
        }
        rows[rows.length - 1].push({ item: pillItem, width: pWidth });
        currentRowW += pWidth + Math.round(8 * specScale);
      });

      let pillRowY = curY;
      rows.forEach((row) => {
        const rowTotalW = row.reduce((acc, p) => acc + p.width, 0) + (row.length - 1) * Math.round(8 * specScale);
        let pillRowX = align === "center" ? innerX + (innerW - rowTotalW) / 2 : align === "right" ? innerX + innerW - rowTotalW : innerX;

        row.forEach((entry) => {
          roundRect(ctx, pillRowX, pillRowY, entry.width, pillH, Math.round(pillH / 2));
          ctx.fillStyle = isFrostedLuxury ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.14)";
          ctx.fill();

          if (isFrostedLuxury) {
            ctx.lineWidth = 1.0;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
            ctx.stroke();
          }

          let contentStartX = pillRowX + Math.round(pillPadX * 0.45);
          if (entry.item.icon) {
            const iconY = pillRowY + (pillH - iconSize) / 2;
            drawSpecVectorIcon(ctx, entry.item.icon, contentStartX, iconY, iconSize, "#FFFFFF");
            contentStartX += iconSize + iconGap;
          }

          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.font = `600 ${pillFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(entry.item.text, contentStartX, pillRowY + pillH / 2);
          pillRowX += entry.width + Math.round(8 * specScale);
        });
        pillRowY += pillH + Math.round(8 * specScale);
      });
      curY = pillRowY + Math.round(8 * specScale);

      // Subtle Frosted Divider Line for Ultra-Luxury Card
      if (isFrostedLuxury && showPrice && matchZ("price")) {
        ctx.save();
        const divGrad = ctx.createLinearGradient(innerX, 0, innerX + innerW, 0);
        divGrad.addColorStop(0, "rgba(255, 255, 255, 0.04)");
        divGrad.addColorStop(0.12, "rgba(255, 255, 255, 0.28)");
        divGrad.addColorStop(0.88, "rgba(255, 255, 255, 0.28)");
        divGrad.addColorStop(1, "rgba(255, 255, 255, 0.04)");
        ctx.strokeStyle = divGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(innerX, curY + 2);
        ctx.lineTo(innerX + innerW, curY + 2);
        ctx.stroke();
        ctx.restore();
        curY += 16;
      }
    }

    // 6. Price & Dual Price
    if (showPrice && matchZ("price")) {
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      let priceFontSize = Math.round((isFrostedLuxury ? 40 : 44) * priceFScale);
      ctx.font = `bold ${priceFontSize}px 'Prompt', sans-serif`;

      // Check if price contains dual currency separator e.g. "฿38,500,000 (~$1,080,000 USD)"
      let effectivePriceText = options.priceText;
      if (!options.showUsdApprox && effectivePriceText.includes(" (~")) {
        effectivePriceText = effectivePriceText.split(" (~")[0].trim();
      }
      const isDualCurrency = Boolean(options.showUsdApprox) && effectivePriceText.includes(" (~");

      // Right-aligned Ownership Badge for Frosted Luxury mode (e.g. "Foreign Freehold")
      let ownershipBadgeW = 0;
      if (isFrostedLuxury && ownershipBadge) {
        ctx.save();
        const badgeFontPx = Math.round(15 * fScale);
        ctx.font = `bold ${badgeFontPx}px 'Prompt', sans-serif`;
        const bTextW = ctx.measureText(ownershipBadge).width;
        const bPadX = 26;
        const bW = Math.round(bTextW + bPadX);
        const bH = Math.round(36 * fScale);
        const bX = innerX + innerW - bW;
        const bY = curY + Math.max(0, Math.round((priceFontSize - bH) / 2));

        roundRect(ctx, bX, bY, bW, bH, Math.round(bH / 2));
        ctx.fillStyle = "rgba(15, 23, 42, 0.64)";
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
        ctx.stroke();

        ctx.fillStyle = "#F8FAFC";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ownershipBadge, bX + bW / 2, bY + bH / 2);
        ctx.restore();
        ownershipBadgeW = bW + 16;
      }

      const availablePriceW = innerW - ownershipBadgeW;
      let pWidth = ctx.measureText(effectivePriceText).width;
      if (pWidth > availablePriceW - 12) {
        priceFontSize = Math.max(18, Math.floor(((availablePriceW - 12) / pWidth) * priceFontSize));
        ctx.font = `bold ${priceFontSize}px 'Prompt', sans-serif`;
        pWidth = ctx.measureText(effectivePriceText).width;
      }

      const priceCenterX = ownershipBadgeW > 0 && align === "center"
        ? Math.round(innerX + availablePriceW / 2)
        : alignX;

      if (isDualCurrency) {
        const [thbPart, ...usdParts] = effectivePriceText.split(" (~");
        const usdPart = "(~" + usdParts.join(" (~");

        ctx.font = `bold ${priceFontSize}px 'Prompt', sans-serif`;
        const thbWidth = ctx.measureText(thbPart).width;
        const usdFontPx = Math.round(priceFontSize * 0.58);
        ctx.save();
        ctx.font = `500 ${usdFontPx}px 'Prompt', sans-serif`;
        const usdWidth = ctx.measureText(" " + usdPart).width;
        ctx.restore();

        const totalPairW = thbWidth + usdWidth;
        const startX = align === "center" ? priceCenterX - totalPairW / 2 : align === "right" ? priceCenterX - totalPairW : innerX;

        ctx.save();
        ctx.textAlign = "left";
        if (isFrostedLuxury && !options.customPriceColor) {
          const goldGrad = ctx.createLinearGradient(startX, curY, startX, curY + priceFontSize);
          goldGrad.addColorStop(0, "#FEF3C7");
          goldGrad.addColorStop(0.40, "#FBBF24");
          goldGrad.addColorStop(1, "#D97706");
          ctx.fillStyle = goldGrad;
          ctx.shadowColor = "rgba(0, 0, 0, 0.70)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
        } else {
          ctx.fillStyle = options.customPriceColor || "#FFFFFF";
        }
        ctx.fillText(thbPart, startX, curY);

        ctx.font = `500 ${usdFontPx}px 'Prompt', sans-serif`;
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.fillText(" " + usdPart, startX + thbWidth, curY + Math.round(priceFontSize * 0.26));
        ctx.restore();
      } else {
        ctx.save();
        ctx.textAlign = ownershipBadgeW > 0 && align === "center" ? "center" : align;
        if (isFrostedLuxury && !options.customPriceColor) {
          const goldGrad = ctx.createLinearGradient(priceCenterX, curY, priceCenterX, curY + priceFontSize);
          goldGrad.addColorStop(0, "#FEF3C7");
          goldGrad.addColorStop(0.40, "#FBBF24");
          goldGrad.addColorStop(1, "#D97706");
          ctx.fillStyle = goldGrad;
          ctx.shadowColor = "rgba(0, 0, 0, 0.70)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
        } else {
          ctx.fillStyle = options.customPriceColor || "#FFFFFF";
        }
        ctx.fillText(effectivePriceText, priceCenterX, curY);
        ctx.restore();
      }

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
