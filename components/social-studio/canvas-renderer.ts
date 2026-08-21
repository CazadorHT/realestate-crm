/**
 * [S-Tier] High-Resolution HTML5 Canvas Renderer for Real Estate Social Banners & Stories
 * Generates 1080p crisp graphics with:
 * 1. Dual Independent Custom Zones (Zone A: บน/กลาง & Zone B: ล่าง)
 * 2. Per-Element Zone Assignment (Assign any field to Zone A or Zone B freely)
 * 3. Font Size Scaling (sm, md, lg, xl)
 * 4. Symmetrical Equal Padding (px === py = 36px) & Safe Zone Protection
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
} from "./types";

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
};

export function getDimensions(ratio: AspectRatio): { width: number; height: number } {
  switch (ratio) {
    case "9:16":
      return { width: 1080, height: 1920 };
    case "4:5":
      return { width: 1080, height: 1350 };
    case "1:1":
    default:
      return { width: 1080, height: 1080 };
  }
}

/**
 * Helper to load an image safely with CORS handling
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error("Empty image src"));
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = (e) => reject(e);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Helper to draw a rounded rectangle
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draw an image fitted into a bounding box with object-fit: cover
 */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 0
) {
  ctx.save();
  ctx.beginPath();
  if (radius > 0) {
    roundRect(ctx, x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.clip();

  const hRatio = w / img.width;
  const vRatio = h / img.height;
  const ratio = Math.max(hRatio, vRatio);
  const centerShiftX = x + (w - img.width * ratio) / 2;
  const centerShiftY = y + (h - img.height * ratio) / 2;

  ctx.drawImage(
    img,
    0,
    0,
    img.width,
    img.height,
    centerShiftX,
    centerShiftY,
    img.width * ratio,
    img.height * ratio
  );
  ctx.restore();
}

/**
 * Draw wrapped text from top-baseline and return the bottom Y position
 */
function wrapTextTop(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  topY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 2,
  align: CanvasTextAlign = "left"
): number {
  ctx.textBaseline = "top";
  ctx.textAlign = align;
  const words = text.split(" ");
  let line = "";
  let currentY = topY;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1) {
        const remaining = words.slice(n).join(" ");
        let truncated = remaining;
        while (ctx.measureText(truncated + "...").width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(truncated.trim() + "...", x, currentY);
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
}

/**
 * Pre-calculate wrap text line count without drawing
 */
function countWrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 2
): number {
  const words = text.split(" ");
  let line = "";
  let lineCount = 1;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      line = words[n] + " ";
      lineCount++;
      if (lineCount >= maxLines) break;
    } else {
      line = testLine;
    }
  }
  return Math.min(lineCount, maxLines);
}

/**
 * Draw Multi-Image Background Layout (Absolute Static Full-Canvas Background)
 */
async function drawBackgroundLayout(
  ctx: CanvasRenderingContext2D,
  layout: StudioLayout,
  imageUrls: string[],
  width: number,
  height: number,
  gridLineWidth?: number,
  gridLineColor?: string
) {
  const gap = gridLineWidth !== undefined ? gridLineWidth : 8;
  const bgColor = gridLineColor || "#000000";

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const images = await Promise.all(
    imageUrls.map((url) => loadImage(url).catch(() => null))
  );
  const validImages = images.filter((img): img is HTMLImageElement => !!img);

  if (validImages.length === 0) return;

  if (layout === "single" || validImages.length === 1) {
    drawCoverImage(ctx, validImages[0], 0, 0, width, height);
  } else if (layout === "split_two") {
    const img1 = validImages[0];
    const img2 = validImages[1] || validImages[0];
    const splitH = (height - gap) / 2;

    drawCoverImage(ctx, img1, 0, 0, width, splitH);
    drawCoverImage(ctx, img2, 0, splitH + gap, width, splitH);
  } else if (layout === "hero_plus_two") {
    const img1 = validImages[0];
    const img2 = validImages[1] || validImages[0];
    const img3 = validImages[2] || validImages[0];

    const heroH = Math.round(height * 0.60);
    const subH = height - heroH - gap;
    const subW = (width - gap) / 2;

    drawCoverImage(ctx, img1, 0, 0, width, heroH);
    drawCoverImage(ctx, img2, 0, heroH + gap, subW, subH);
    drawCoverImage(ctx, img3, subW + gap, heroH + gap, subW, subH);
  } else if (layout === "four_grid") {
    const img1 = validImages[0];
    const img2 = validImages[1] || validImages[0];
    const img3 = validImages[2] || validImages[0];
    const img4 = validImages[3] || validImages[1] || validImages[0];

    const rowH = (height - gap) / 2;
    const colW = (width - gap) / 2;

    drawCoverImage(ctx, img1, 0, 0, colW, rowH);
    drawCoverImage(ctx, img2, colW + gap, 0, colW, rowH);
    drawCoverImage(ctx, img3, 0, rowH + gap, colW, rowH);
    drawCoverImage(ctx, img4, colW + gap, rowH + gap, colW, rowH);
  } else if (layout === "five_grid") {
    const img1 = validImages[0];
    const img2 = validImages[1] || validImages[0];
    const img3 = validImages[2] || validImages[0];
    const img4 = validImages[3] || validImages[1] || validImages[0];
    const img5 = validImages[4] || validImages[2] || validImages[0];

    const heroH = Math.round(height * 0.65);
    const subH = height - heroH - gap;
    const subW = (width - gap * 3) / 4;

    drawCoverImage(ctx, img1, 0, 0, width, heroH);
    drawCoverImage(ctx, img2, 0, heroH + gap, subW, subH);
    drawCoverImage(ctx, img3, subW + gap, heroH + gap, subW, subH);
    drawCoverImage(ctx, img4, (subW + gap) * 2, heroH + gap, subW, subH);
    drawCoverImage(ctx, img5, (subW + gap) * 3, heroH + gap, subW, subH);
  } else if (layout === "six_grid") {
    const img1 = validImages[0];
    const img2 = validImages[1] || validImages[0];
    const img3 = validImages[2] || validImages[0];
    const img4 = validImages[3] || validImages[1] || validImages[0];
    const img5 = validImages[4] || validImages[2] || validImages[0];
    const img6 = validImages[5] || validImages[3] || validImages[0];

    const colW = (width - gap) / 2;
    const rowH = (height - gap * 2) / 3;

    // Row 1
    drawCoverImage(ctx, img1, 0, 0, colW, rowH);
    drawCoverImage(ctx, img2, colW + gap, 0, colW, rowH);
    // Row 2
    drawCoverImage(ctx, img3, 0, rowH + gap, colW, rowH);
    drawCoverImage(ctx, img4, colW + gap, rowH + gap, colW, rowH);
    // Row 3
    drawCoverImage(ctx, img5, 0, (rowH + gap) * 2, colW, rowH);
    drawCoverImage(ctx, img6, colW + gap, (rowH + gap) * 2, colW, rowH);
  }
}

/**
 * Apply Photo Filter (Feature 3) — Canvas-based color grading
 */
function applyPhotoFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: PhotoFilter
) {
  if (filter === "none" || !filter) return;

  ctx.save();
  if (filter === "bright") {
    // Lighten overlay + soft overlay blend
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255, 255, 240, 0.06)";
    ctx.fillRect(0, 0, width, height);
  } else if (filter === "dark_moody") {
    // Deep blue tint + multiply darkness
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(15, 25, 60, 0.25)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(30, 40, 80, 0.15)";
    ctx.fillRect(0, 0, width, height);
  } else if (filter === "warm_gold") {
    // Golden warm overlay
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255, 200, 50, 0.05)";
    ctx.fillRect(0, 0, width, height);
  } else if (filter === "high_contrast") {
    // Boost contrast via overlay self-blend
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(0, 0, width, height);
  } else if (filter === "bw") {
    // Grayscale via off-screen canvas
    const offCanvas = document.createElement("canvas");
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext("2d");
    if (offCtx) {
      offCtx.filter = "grayscale(100%) contrast(110%)";
      offCtx.drawImage(ctx.canvas, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(offCanvas, 0, 0);
    }
  }
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

/**
 * Draw Promotional Overlay Badge (Feature 2) — Banner style
 */
function drawPromoOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: PromoPosition,
  color: string,
  width: number,
  height: number,
  topRightStartY?: number,
  bScale: number = 1.15,
  outerMarginX: number = 36,
  textColor?: string
) {
  if (!text || !text.trim()) return;
  const cleanText = text.trim();

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;

  const fontPx = Math.round(22 * bScale);
  ctx.font = `bold ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
  const textW = ctx.measureText(cleanText).width;
  const bannerW = Math.max(Math.round(170 * bScale), Math.round(textW + 42 * bScale));
  const bannerH = Math.round(52 * bScale);
  const cornerR = Math.round(bannerH / 2);

  let bx = 0;
  let by = 0;
  const topOffsetY = topRightStartY !== undefined ? topRightStartY : outerMarginX;

  if (position === "top_left") {
    bx = outerMarginX;
    by = outerMarginX;
  } else if (position === "top_right") {
    bx = width - outerMarginX - bannerW;
    by = topOffsetY;
  } else if (position === "bottom_left") {
    bx = outerMarginX;
    by = height - bannerH - outerMarginX;
  } else {
    bx = width - outerMarginX - bannerW;
    by = height - bannerH - outerMarginX;
  }

  // Pill capsule background matching FOR SALE badge shape & corners
  roundRect(ctx, bx, by, bannerW, bannerH, cornerR);
  ctx.fillStyle = color || "#EF4444";
  ctx.fill();

  // Text color matching font size and baseline
  ctx.shadowColor = "transparent";
  ctx.font = `bold ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = textColor || "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cleanText, bx + bannerW / 2, by + bannerH / 2);

  ctx.restore();
}

/**
 * Main Render Function
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

  // Font Size Multiplier
  const fScale = options.fontSizeScale === "sm" ? 0.85 : options.fontSizeScale === "lg" ? 1.16 : options.fontSizeScale === "xl" ? 1.30 : 1.0;
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

  // Theme Colors (Feature 1: Expanded themes + Custom)
  let primaryColor = "#F59E0B"; // Gold
  let badgeBg = "rgba(245, 158, 11, 0.95)";
  let badgeText = "#000000";

  if (options.theme === "modern") {
    primaryColor = "#38BDF8"; // Cyan/Sky
    badgeBg = "rgba(37, 99, 235, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "hotdeal") {
    primaryColor = "#EF4444"; // Red
    badgeBg = "rgba(239, 68, 68, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "emerald") {
    primaryColor = "#10B981"; // Emerald
    badgeBg = "rgba(16, 185, 129, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "purple") {
    primaryColor = "#8B5CF6"; // Purple
    badgeBg = "rgba(139, 92, 246, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "orange") {
    primaryColor = "#F97316"; // Orange
    badgeBg = "rgba(249, 115, 22, 0.95)";
    badgeText = "#FFFFFF";
  } else if (options.theme === "custom" && options.customAccentColor) {
    primaryColor = options.customAccentColor;
    // Parse hex to rgba for badge
    const hex = options.customAccentColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    badgeBg = `rgba(${r}, ${g}, ${b}, 0.95)`;
    // Auto-detect text color: use black for bright colors, white for dark
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
    if (lang === "en") return isRent ? "[Rent] " : "[Sale] ";
    if (lang === "zh") return isRent ? "[出租] " : "[出售] ";
    if (lang === "ru") return isRent ? "[Аренда] " : "[Продажа] ";
    return isRent ? "[เช่า] " : "[ขาย] ";
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

  // Zone Assignment (Zone A: บน/กลาง, Zone B: ล่าง)
  // If NOT in split_hero mode, ALL items belong to Zone B (Single Unified Card)!
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

  // Helper to check if field is in Zone A or B
  const inA = (field: keyof ElementZoneMapping) => zMap[field] === "zone_a";
  const inB = (field: keyof ElementZoneMapping) => zMap[field] === "zone_b";

  const specScale =
    options.specFontSizeScale === "xs"
      ? 0.75
      : options.specFontSizeScale === "sm"
        ? 0.88
        : options.specFontSizeScale === "lg"
          ? 1.18
          : options.specFontSizeScale === "xl"
            ? 1.4
            : options.specFontSizeScale === "2xl"
              ? 1.7
              : options.specFontSizeScale === "3xl"
                ? 2.05
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

  const hasZoneAItems = isSplitMode && zoneAContentH > 0;
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
  const hasZoneBItems = zoneBContentH > 0;
  const card2H = customCardH > 0 ? customCardH : (hasZoneBItems ? pad + zoneBContentH + pad : 0);

  // Positions of Card 1 and Card 2 (Accurate Deadzone Shift)
  const shiftY = options.cardYOffset || 0;
  const card1YOffset = isSplitMode ? (options.card1YOffset ?? shiftY) : shiftY;
  const card2YOffset = isSplitMode ? (options.card2YOffset ?? shiftY) : shiftY;

  let card1Y = 0;
  let card2Y = 0;

  if (hasZoneAItems && hasZoneBItems) {
    // Dual Zone Split Mode
    card1Y = Math.round(height * 0.36) + card1YOffset;
    const bottomMargin = isStory ? 116 : 24;
    card2Y = height - card2H - bottomMargin + card2YOffset;
  } else if (hasZoneAItems && !hasZoneBItems) {
    // Only Zone A has items
    card1Y = options.contentPosition === "center"
      ? Math.round((height - card1H) / 2) + card1YOffset
      : options.contentPosition === "top"
        ? (options.showBrandingHeader !== false ? topY + 70 : baseTopY) + card1YOffset
        : height - card1H - (isStory ? 116 : 24) + card1YOffset;
  } else {
    // Only Zone B has items (Single Unified Card)
    card2Y = options.contentPosition === "center"
      ? Math.round((height - card2H) / 2) + card2YOffset
      : options.contentPosition === "top"
        ? (options.showBrandingHeader !== false ? topY + 70 : baseTopY) + card2YOffset
        : height - card2H - (isStory ? 116 : 24) + card2YOffset;
  }

  // Draw Background Image Layout (Absolute Full Canvas)
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
  } catch (err) {
    ctx.fillStyle = options.customCanvasBgColor || "#0F172A";
    ctx.fillRect(0, 0, width, height);
  }

  // Feature 3: Apply Photo Filter (after background, before scrim)
  applyPhotoFilter(ctx, width, height, options.photoFilter || "none");

  // Scrim Gradients (Top & Bottom Darkness Control)
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
    const bottomBaseY = hasZoneBItems ? card2Y : card1Y;
    const bottomGradient = ctx.createLinearGradient(0, Math.max(0, bottomBaseY - 40), 0, height);
    bottomGradient.addColorStop(0, "rgba(10, 15, 29, 0.0)");
    bottomGradient.addColorStop(0.35, `rgba(10, 15, 29, ${0.65 * bottomSFactor})`);
    bottomGradient.addColorStop(1, `rgba(5, 8, 16, ${0.90 * bottomSFactor})`);
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, Math.max(0, bottomBaseY - 40), width, height - Math.max(0, bottomBaseY - 40));
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
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(options.companyName || "VCC ASSET", outerMarginX, topY);

    ctx.font = `500 ${Math.round(16 * hScale)}px 'Prompt', sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText("PREMIUM REAL ESTATE", outerMarginX, topY + Math.round(38 * hScale));
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

  // Feature 2: Promotional Overlay Badge (placed right underneath top listing badge when top_right)
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

  // ==========================================
  // RENDER HELPER FUNCTION FOR A ZONE
  // ==========================================
  const renderCardZone = (zone: "zone_a" | "zone_b", cardYPos: number, cardH: number, isMiddleHero: boolean) => {
    // Glass Box & Opacity Control
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

    // 1. Title (ชื่อหัวข้อ)
    if (hasTitle && matchZ("title")) {
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.round(34 * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = options.customTitleColor || "#FFFFFF";
      curY = wrapTextTop(ctx, processedTitle, alignX, curY, innerW, Math.round(44 * fScale), 2, align);
      curY += 10;
    }

    // 2. Project Name (โครงการ)
    if (hasProject && matchZ("projectName")) {
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.round((isMiddleHero ? 34 : 24) * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = options.customProjectNameColor || (isMiddleHero ? "#FFFFFF" : primaryColor);
      ctx.fillText(`🏢 ${options.projectName}`, alignX, curY);
      curY += Math.round((isMiddleHero ? 38 : 28) * fScale) + 8;
    }

    // 3. Location / Transit (ทำเล / รถไฟฟ้า)
    if (hasLoc && matchZ("location")) {
      const locStr = [options.locationText, options.transitText].filter(Boolean).join("  •  ");
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      ctx.font = `bold ${Math.round(18 * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = "#E2E8F0";
      ctx.fillText(`📍 ${locStr}`, alignX, curY);
      curY += Math.round(24 * fScale) + 12;
    }

    // 4. Headline (AI Hook)
    if (hasHeadline && matchZ("headline")) {
      ctx.save();
      ctx.font = `600 ${Math.round(20 * fScale)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = options.customHeadlineColor || primaryColor;
      curY = wrapTextTop(ctx, `✨ ${options.headline}`, alignX, curY, innerW, Math.round(28 * fScale), 1, align);
      ctx.restore();
      curY += 12;
    }

    // 5. Spec Pills & Badges (สถานะ / ค่าต่างๆ พร้อมจัดเรียงตาม Alignment)
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

    // 6. Price & Dual Price (ราคาเช่า / ราคาขาย หรือราคาลด)
    if (showPrice && matchZ("price")) {
      ctx.textAlign = align;
      ctx.textBaseline = "top";
      
      // Auto-fit font size if long dual price
      let priceFontSize = Math.round(44 * fScale);
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

  // Draw Card 1 (Zone A: บน/กลาง) if it has items
  if (hasZoneAItems) {
    renderCardZone("zone_a", card1Y, card1H, hasZoneBItems);
  }

  // Draw Card 2 (Zone B: ล่าง) if it has items
  if (hasZoneBItems) {
    renderCardZone("zone_b", card2Y, card2H, false);
  }
}

// =====================================================
// Feature 5: Carousel Page Renderers
// =====================================================

/**
 * Render Specs & Highlights Page (Page 2 of Carousel)
 */
export async function renderSpecsHighlightsPage(
  canvas: HTMLCanvasElement,
  options: BannerRenderOptions
): Promise<void> {
  const { width, height } = getDimensions(options.aspectRatio);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not supported");

  // Background: first image blurred + dark overlay
  try {
    const img = await loadImage(options.imageUrls[0] || "/hero-realestate.png");
    // Draw scaled-up blurred background
    ctx.filter = "blur(30px)";
    drawCoverImage(ctx, img, -20, -20, width + 40, height + 40, 0);
    ctx.filter = "none";
  } catch {
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, width, height);
  }

  // Dark overlay
  ctx.fillStyle = "rgba(10, 15, 29, 0.75)";
  ctx.fillRect(0, 0, width, height);

  // Apply photo filter if set
  applyPhotoFilter(ctx, width, height, options.photoFilter || "none");

  // Theme color
  let primaryColor = "#F59E0B";
  if (options.theme === "modern") primaryColor = "#38BDF8";
  else if (options.theme === "hotdeal") primaryColor = "#EF4444";
  else if (options.theme === "emerald") primaryColor = "#10B981";
  else if (options.theme === "purple") primaryColor = "#8B5CF6";
  else if (options.theme === "orange") primaryColor = "#F97316";
  else if (options.theme === "custom" && options.customAccentColor) primaryColor = options.customAccentColor;

  const pad = 48;
  const centerX = width / 2;
  let curY = pad + 40;

  // Title
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold 42px 'Prompt', 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  const lang = options.language || "th";
  const specsLabel = lang === "en" ? "Property Specs" : lang === "zh" ? "房产规格" : lang === "ru" ? "Характеристики" : "สเปกห้อง & จุดเด่น";
  ctx.fillText(specsLabel, centerX, curY);
  curY += 60;

  // Divider line
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 100, curY);
  ctx.lineTo(centerX + 100, curY);
  ctx.stroke();
  curY += 40;

  // Large Spec Pills
  const specs = options.specs;
  const specItems: { icon: string; value: string }[] = [];
  if (specs.bedrooms) specItems.push({ icon: "🛏️", value: lang === "en" ? `${specs.bedrooms} Bedrooms` : `${specs.bedrooms} ห้องนอน` });
  if (specs.bathrooms) specItems.push({ icon: "🚿", value: lang === "en" ? `${specs.bathrooms} Bathrooms` : `${specs.bathrooms} ห้องน้ำ` });
  if (specs.sizeSqm) specItems.push({ icon: "📐", value: lang === "en" ? `${specs.sizeSqm} Sqm` : `${specs.sizeSqm} ตร.ม.` });
  if (specs.floor) specItems.push({ icon: "🏢", value: lang === "en" ? `Floor ${specs.floor}` : `ชั้น ${specs.floor}` });

  const pillW = width - pad * 2;
  specItems.forEach((spec) => {
    const pillH = 72;
    const px = pad;
    roundRect(ctx, px, curY, pillW, pillH, 20);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = `bold 32px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`${spec.icon}  ${spec.value}`, px + 28, curY + 20);
    curY += pillH + 14;
  });

  curY += 20;

  // Highlights
  if (options.highlights && options.highlights.length > 0) {
    ctx.textAlign = "center";
    ctx.font = `bold 28px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = primaryColor;
    const highlightTitle = lang === "en" ? "✨ Key Highlights" : "✨ จุดเด่นที่น่าสนใจ";
    ctx.fillText(highlightTitle, centerX, curY);
    curY += 48;

    ctx.textAlign = "left";
    ctx.font = `500 24px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = "#E2E8F0";
    options.highlights.slice(0, 5).forEach((h) => {
      ctx.fillText(`•  ${h}`, pad + 20, curY);
      curY += 38;
    });
  }

  // Price at bottom
  if (options.priceText) {
    const priceY = height - pad - 80;
    ctx.textAlign = "center";
    ctx.font = `bold 48px 'Prompt', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(options.priceText, centerX, priceY);
  }

  // Company branding at very bottom
  ctx.textAlign = "center";
  ctx.font = `500 18px 'Prompt', sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.fillText(options.companyName || "VCC ASSET", centerX, height - pad - 10);
}

/**
 * Render Location Page (Page 3 of Carousel) — text-based location info
 */
export async function renderLocationPage(
  canvas: HTMLCanvasElement,
  options: BannerRenderOptions
): Promise<void> {
  const { width, height } = getDimensions(options.aspectRatio);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not supported");

  // Background: blurred image
  try {
    const img = await loadImage(options.imageUrls[0] || "/hero-realestate.png");
    ctx.filter = "blur(25px)";
    drawCoverImage(ctx, img, -20, -20, width + 40, height + 40, 0);
    ctx.filter = "none";
  } catch {
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = "rgba(10, 15, 29, 0.80)";
  ctx.fillRect(0, 0, width, height);

  applyPhotoFilter(ctx, width, height, options.photoFilter || "none");

  let primaryColor = "#F59E0B";
  if (options.theme === "modern") primaryColor = "#38BDF8";
  else if (options.theme === "hotdeal") primaryColor = "#EF4444";
  else if (options.theme === "emerald") primaryColor = "#10B981";
  else if (options.theme === "purple") primaryColor = "#8B5CF6";
  else if (options.theme === "orange") primaryColor = "#F97316";
  else if (options.theme === "custom" && options.customAccentColor) primaryColor = options.customAccentColor;

  const pad = 48;
  const centerX = width / 2;
  let curY = pad + 40;
  const lang = options.language || "th";

  // Title
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold 42px 'Prompt', 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  const locTitle = lang === "en" ? "📍 Location & Nearby" : "📍 ทำเลที่ตั้ง & สถานที่ใกล้เคียง";
  ctx.fillText(locTitle, centerX, curY);
  curY += 60;

  // Divider
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 120, curY);
  ctx.lineTo(centerX + 120, curY);
  ctx.stroke();
  curY += 50;

  // Location card
  const cardW = width - pad * 2;
  const cardH = 120;
  if (options.locationText) {
    roundRect(ctx, pad, curY, cardW, cardH, 20);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();

    ctx.textAlign = "left";
    ctx.font = `bold 28px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText("📍 " + (lang === "en" ? "Area" : "ทำเล"), pad + 28, curY + 20);
    ctx.font = `500 26px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(options.locationText, pad + 28, curY + 62);
    curY += cardH + 20;
  }

  // Transit card
  if (options.transitText) {
    roundRect(ctx, pad, curY, cardW, cardH, 20);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();

    ctx.textAlign = "left";
    ctx.font = `bold 28px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText("🚆 " + (lang === "en" ? "Transit" : "รถไฟฟ้า"), pad + 28, curY + 20);
    ctx.font = `500 26px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(options.transitText, pad + 28, curY + 62);
    curY += cardH + 20;
  }

  // Project name
  if (options.projectName) {
    roundRect(ctx, pad, curY, cardW, cardH, 20);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();

    ctx.textAlign = "left";
    ctx.font = `bold 28px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText("🏢 " + (lang === "en" ? "Project" : "โครงการ"), pad + 28, curY + 20);
    ctx.font = `500 26px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = "#E2E8F0";
    ctx.fillText(options.projectName, pad + 28, curY + 62);
    curY += cardH + 20;
  }

  // Price at bottom
  if (options.priceText) {
    const priceY = height - pad - 80;
    ctx.textAlign = "center";
    ctx.font = `bold 48px 'Prompt', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(options.priceText, centerX, priceY);
  }

  ctx.textAlign = "center";
  ctx.font = `500 18px 'Prompt', sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.fillText(options.companyName || "VCC ASSET", centerX, height - pad - 10);
}

/**
 * Render Contact CTA Page (Page 4 of Carousel)
 */
export async function renderContactCTAPage(
  canvas: HTMLCanvasElement,
  options: BannerRenderOptions
): Promise<void> {
  const { width, height } = getDimensions(options.aspectRatio);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not supported");

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#0F172A");
  grad.addColorStop(0.5, "#1E293B");
  grad.addColorStop(1, "#0F172A");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  let primaryColor = "#F59E0B";
  if (options.theme === "modern") primaryColor = "#38BDF8";
  else if (options.theme === "hotdeal") primaryColor = "#EF4444";
  else if (options.theme === "emerald") primaryColor = "#10B981";
  else if (options.theme === "purple") primaryColor = "#8B5CF6";
  else if (options.theme === "orange") primaryColor = "#F97316";
  else if (options.theme === "custom" && options.customAccentColor) primaryColor = options.customAccentColor;

  const pad = 48;
  const centerX = width / 2;
  let curY = height * 0.15;
  const lang = options.language || "th";

  // Agent avatar (large)
  if (options.agentAvatarUrl) {
    try {
      const avatarImg = await loadImage(options.agentAvatarUrl);
      const avSize = 140;
      const avX = centerX - avSize / 2;
      const avY = curY;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, avX, avY, avSize, avSize);
      ctx.restore();

      // Border ring
      ctx.beginPath();
      ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2 + 3, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = primaryColor;
      ctx.stroke();
      curY += avSize + 30;
    } catch {
      curY += 20;
    }
  }

  // Agent name
  if (options.agentName) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `bold 36px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(options.agentName, centerX, curY);
    curY += 50;
  }

  // Company name
  ctx.textAlign = "center";
  ctx.font = `500 22px 'Prompt', sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.fillText(options.companyName || "VCC ASSET", centerX, curY);
  curY += 50;

  // Divider
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 100, curY);
  ctx.lineTo(centerX + 100, curY);
  ctx.stroke();
  curY += 40;

  // Contact info cards
  const cardW = width - pad * 2;
  const contactItems: { icon: string; label: string; value: string }[] = [];
  if (options.contactPhone) contactItems.push({ icon: "📞", label: lang === "en" ? "Phone" : "โทร", value: options.contactPhone });
  if (options.contactLine) contactItems.push({ icon: "💬", label: "LINE", value: options.contactLine });

  contactItems.forEach((item) => {
    const cardH = 80;
    roundRect(ctx, pad, curY, cardW, cardH, 16);
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = `bold 22px 'Prompt', sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText(`${item.icon} ${item.label}`, pad + 24, curY + 16);
    ctx.font = `500 26px 'Prompt', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(item.value, pad + 24, curY + 44);
    curY += cardH + 14;
  });

  curY += 20;

  // QR Code
  if (options.qrCodeUrl) {
    try {
      const qrImg = await loadImage(options.qrCodeUrl);
      const qrSize = 160;
      const qrX = centerX - qrSize / 2;

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 12;
      roundRect(ctx, qrX - 6, curY - 6, qrSize + 12, qrSize + 12, 16);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.drawImage(qrImg, qrX, curY, qrSize, qrSize);
      ctx.restore();

      curY += qrSize + 14;
      ctx.textAlign = "center";
      ctx.font = `bold 16px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.fillStyle = "#94A3B8";
      const scanText = lang === "en" ? "Scan for Details" : lang === "zh" ? "扫码查看详情" : "สแกนดูรายละเอียด";
      ctx.fillText(scanText, centerX, curY);
    } catch {
      // QR load failed, skip
    }
  }

  // CTA Text at bottom
  ctx.textAlign = "center";
  ctx.font = `bold 28px 'Prompt', 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = primaryColor;
  const ctaText = lang === "en" ? "Contact us for more details!" : "ติดต่อสอบถามได้เลยค่ะ!";
  ctx.fillText(ctaText, centerX, height - pad - 30);
}
