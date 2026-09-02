import type { BannerRenderOptions, PromoPosition, TextEffectTemplate, TextEffectPosition } from "../types";
import { roundRect, splitThaiGraphemes } from "./canvas-utils";

/**
 * Draw Promotional Overlay Badge — Banner style
 */
export function drawPromoOverlay(
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
): void {
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

  roundRect(ctx, bx, by, bannerW, bannerH, cornerR);
  ctx.fillStyle = color || "#EF4444";
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.font = `bold ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = textColor || "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(cleanText, bx + bannerW / 2, by + bannerH / 2);

  ctx.restore();
}

/**
 * Render Viral & Professional Text Effect Templates
 * Supports TikTok, CapCut, Lemon8, Minimal, Luxury Real Estate, Illustrator 3D Pop, Safe Zones & Curved Arcs
 */
export function renderTextEffect(
  ctx: CanvasRenderingContext2D,
  options: BannerRenderOptions,
  width: number,
  height: number,
  card1Y: number,
  card1H: number,
  card2Y: number,
  card2H: number,
  showCardContent: boolean
): void {
  const template = options.textEffectTemplate;
  if (!template || template === "none") return;

  const rawText =
    (options.textEffectLineConfigs && options.textEffectLineConfigs.length > 0
      ? options.textEffectLineConfigs.map((c) => c.text.trim()).filter(Boolean).join("\n")
      : "") ||
    (options.textEffectText?.trim()) ||
    (options.headline?.trim()) ||
    (options.title?.trim()) ||
    "ดีลเด็ด คอนโดพร้อมอยู่!";

  if (!rawText) return;

  ctx.save();

  // Determine Font Size based on textEffectSize
  const sizeScale =
    options.textEffectSize === "sm" ? 0.76
    : options.textEffectSize === "lg" ? 1.24
    : options.textEffectSize === "xl" ? 1.48
    : options.textEffectSize === "2xl" ? 1.78
    : 1.0;

  const baseFontPx = Math.round(38 * sizeScale);
  const isStory = options.aspectRatio === "9:16";
  // Optimal line wrap width: comfortably fits on canvas without stretching wall-to-wall
  const maxTextW = isStory ? Math.min(width * 0.78, 720) : Math.min(width * 0.82, 800);

  // Measure and wrap lines:
  // 1. First split by explicit line breaks (\n) to honor user manual returns
  ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
  const paragraphs = rawText.split(/\r?\n/).map((p) => p.trim()).filter(Boolean);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.split(" ");
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextW && currentLine) {
        lines.push(currentLine.trim());
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine.trim());
  }

  // 2. Fallback: If any single line without spaces exceeds maxTextW, wrap by characters
  const finalLines: string[] = [];
  for (const line of lines) {
    if (ctx.measureText(line).width <= maxTextW) {
      finalLines.push(line);
    } else {
      let temp = "";
      for (const char of line) {
        if (ctx.measureText(temp + char).width > maxTextW && temp) {
          finalLines.push(temp);
          temp = char;
        } else {
          temp += char;
        }
      }
      if (temp) finalLines.push(temp);
    }
  }

  lines.length = 0;
  lines.push(...(finalLines.length > 0 ? finalLines : [rawText]));

  const lineHeight = Math.round(baseFontPx * 1.32);
  const totalTextH = lines.length * lineHeight;
  const outerMarginX = isStory ? 48 : 36;
  const headerYOffset = options.headerYOffset || 0;
  const topY = (isStory ? 86 : 40) + headerYOffset;

  // Max line width for corner positioning
  let maxLineW = 0;
  lines.forEach((l) => {
    const w = ctx.measureText(l).width;
    if (w > maxLineW) maxLineW = w;
  });
  const approxBadgeW = maxLineW + Math.round(48 * sizeScale);

  const pos = options.textEffectPosition || (showCardContent ? "above_card" : "center");
  const anchor = getTextAnchorCoords(
    pos, width, height, isStory, outerMarginX, topY,
    card1Y, card1H, card2Y, card2H, showCardContent, 0, approxBadgeW,
    options.textEffectXOffset || 0, options.textEffectYOffset || 0
  );

  const targetCenterX = anchor.x;
  const targetCenterY = anchor.y;
  const defaultTilt = anchor.defaultTilt;

  // ==========================================
  // DYNAMIC MULTI-LINE / TEXT LAYERS ENGINE
  // ==========================================
  interface LineRenderItem {
    text: string;
    template: TextEffectTemplate;
    scale: number;
    fontPx: number;
    boxH: number;
    position?: TextEffectPosition;
    xOffset: number;
    yOffset: number;
    rotation: number;
    curve: number;
    customColors?: {
      textColor?: string;
      bgColor?: string;
      borderColor?: string;
      shadowColor?: string;
      bgAlpha?: number;
      borderWidth?: number;
    };
  }

  const lineItems: LineRenderItem[] = [];

  if (options.textEffectLineConfigs && options.textEffectLineConfigs.length > 0) {
    options.textEffectLineConfigs.forEach((cfg, idx) => {
      const text = cfg.text?.trim();
      if (!text) return;
      const lTemplate: TextEffectTemplate = (cfg.template && cfg.template !== "same")
        ? cfg.template
        : template;
      const itemScale = sizeScale * (cfg.sizeScale ?? (idx === 0 ? 1.0 : 0.85));
      const fontPx = Math.round(38 * itemScale);
      const boxH = Math.round(fontPx * 1.18 + Math.round(12 * itemScale) * 2);

      const hasCustomText = !!cfg.customTextColor?.trim();
      const hasCustomBg = !!cfg.customBgColor?.trim();
      const hasCustomBorder = !!cfg.customBorderColor?.trim();

      let customColors: LineRenderItem["customColors"] = undefined;
      if (lTemplate === "custom" || hasCustomText || hasCustomBg || hasCustomBorder) {
        customColors = {
          textColor: cfg.customTextColor?.trim() || (lTemplate === "custom" ? options.textEffectCustomTextColor : undefined),
          bgColor: cfg.customBgColor?.trim() || (lTemplate === "custom" ? options.textEffectCustomBgColor : undefined),
          borderColor: cfg.customBorderColor?.trim() || (lTemplate === "custom" ? options.textEffectCustomBorderColor : undefined),
          shadowColor: lTemplate === "custom" ? options.textEffectCustomShadowColor : undefined,
          bgAlpha: options.textEffectCustomBgAlpha,
          borderWidth: options.textEffectCustomBorderWidth,
        };
      }

      lineItems.push({
        text,
        template: lTemplate,
        scale: itemScale,
        fontPx,
        boxH,
        position: cfg.position,
        xOffset: cfg.xOffset ?? (idx === 0 ? (options.textEffectXOffset ?? 0) : 0),
        yOffset: cfg.yOffset ?? (idx === 0 ? (options.textEffectYOffset ?? 0) : 0),
        rotation: cfg.rotation ?? (idx === 0 ? (options.textEffectRotation ?? 0) : 0),
        curve: cfg.curve !== undefined ? cfg.curve : (idx === 0 && options.textEffectCurve !== undefined ? options.textEffectCurve : (lTemplate === "illustrator_curve" ? 28 : 0)),
        customColors,
      });
    });
  } else {
    lines.forEach((line, idx) => {
      const isLine2 = idx > 0;
      const lTemplate: TextEffectTemplate = (isLine2 && options.textEffectLine2Template && options.textEffectLine2Template !== "same")
        ? options.textEffectLine2Template
        : template;
      const itemScale = isLine2 ? (sizeScale * (options.textEffectLine2SizeScale ?? 0.85)) : sizeScale;
      const fontPx = Math.round(38 * itemScale);
      const boxH = Math.round(fontPx * 1.18 + Math.round(12 * itemScale) * 2);

      const line2HasCustomBg = !!options.textEffectLine2CustomBgColor?.trim();
      const line2HasCustomText = !!options.textEffectLine2CustomTextColor?.trim();
      const line2HasCustomBorder = !!options.textEffectLine2CustomBorderColor?.trim();

      const customColors = isLine2
        ? (lTemplate === "custom" || line2HasCustomBg || line2HasCustomText || line2HasCustomBorder
            ? {
                textColor: options.textEffectLine2CustomTextColor?.trim() || (lTemplate === "custom" ? options.textEffectCustomTextColor : undefined),
                bgColor: options.textEffectLine2CustomBgColor?.trim() || (lTemplate === "custom" ? options.textEffectCustomBgColor : undefined),
                borderColor: options.textEffectLine2CustomBorderColor?.trim() || (lTemplate === "custom" ? options.textEffectCustomBorderColor : undefined),
                shadowColor: options.textEffectLine2CustomShadowColor?.trim() || undefined,
                bgAlpha: options.textEffectCustomBgAlpha,
                borderWidth: options.textEffectCustomBorderWidth,
              }
            : undefined)
        : (lTemplate === "custom"
            ? {
                textColor: options.textEffectCustomTextColor,
                bgColor: options.textEffectCustomBgColor,
                borderColor: options.textEffectCustomBorderColor,
                shadowColor: options.textEffectCustomShadowColor,
                bgAlpha: options.textEffectCustomBgAlpha,
                borderWidth: options.textEffectCustomBorderWidth,
              }
            : undefined);

      lineItems.push({
        text: line,
        template: lTemplate,
        scale: itemScale,
        fontPx,
        boxH,
        xOffset: idx === 0 ? (options.textEffectXOffset ?? 0) : 0,
        yOffset: idx === 0 ? (options.textEffectYOffset ?? 0) : 0,
        rotation: idx === 0 ? (options.textEffectRotation ?? 0) : 0,
        curve: idx === 0 && options.textEffectCurve !== undefined ? options.textEffectCurve : (lTemplate === "illustrator_curve" ? 28 : 0),
        customColors,
      });
    });
  }

  const lineSpacing = options.textEffectLineSpacing ?? Math.round(12 * sizeScale);
  const totalCalculatedH = lineItems.reduce((a, b) => a + b.boxH, 0) + (lineItems.length - 1) * lineSpacing;
  let curStackY = -totalCalculatedH / 2;

  lineItems.forEach((item, idx) => {
    const stackY = Math.round(curStackY + item.boxH / 2);
    curStackY += item.boxH + lineSpacing;

    let lineCenterX: number;
    let lineCenterY: number;
    let lineTilt = 0;

    if (item.position && item.position !== pos) {
      const anchor = getTextAnchorCoords(
        item.position, width, height, isStory, outerMarginX, topY,
        card1Y, card1H, card2Y, card2H, showCardContent, item.boxH, approxBadgeW,
        item.xOffset, item.yOffset
      );
      lineCenterX = anchor.x;
      lineCenterY = anchor.y;
      lineTilt = anchor.defaultTilt;
    } else {
      lineCenterX = targetCenterX + item.xOffset;
      lineCenterY = targetCenterY + stackY + item.yOffset;
      lineTilt = defaultTilt;
    }

    const lineRot = item.rotation !== undefined && item.rotation !== 0
      ? item.rotation
      : (idx === 0 && options.textEffectRotation !== undefined ? options.textEffectRotation : lineTilt);

    ctx.save();
    ctx.translate(lineCenterX, lineCenterY);
    if (lineRot !== 0) {
      ctx.rotate((lineRot * Math.PI) / 180);
    }

    if (item.curve && Math.abs(item.curve) >= 4) {
      renderCurvedSingleLineEffect(ctx, item.template, item.text, item.curve, item.fontPx, item.scale, item.customColors);
    } else {
      renderSingleLineEffect(ctx, item.template, item.text, 0, item.fontPx, item.scale, item.customColors);
    }
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Calculate coordinates for given text position preset
 */
function getTextAnchorCoords(
  pos: TextEffectPosition,
  width: number,
  height: number,
  isStory: boolean,
  outerMarginX: number,
  topY: number,
  card1Y: number,
  card1H: number,
  card2Y: number,
  card2H: number,
  showCardContent: boolean,
  totalTextH: number,
  approxBadgeW: number,
  xOffset: number,
  yOffset: number
): { x: number; y: number; defaultTilt: number } {
  let targetCenterX = width / 2 + xOffset;
  let targetCenterY = height * 0.5 + yOffset;
  let defaultTilt = 0;

  if (pos === "top") {
    targetCenterY = height * 0.20 + yOffset;
  } else if (pos === "bottom") {
    targetCenterY = height * 0.84 + yOffset;
  } else if (pos === "safe_top") {
    targetCenterY = (isStory ? height * 0.16 : height * 0.12) + yOffset;
  } else if (pos === "safe_bottom") {
    targetCenterY = (isStory ? height * 0.73 : height * 0.78) + yOffset;
  } else if (pos === "above_card") {
    if (showCardContent) {
      const topOfCards = card1H > 0 ? card1Y : card2Y;
      targetCenterY = Math.max(height * 0.18, topOfCards - totalTextH / 2 - 20) + yOffset;
    } else {
      targetCenterY = height * 0.48 + yOffset;
    }
  } else if (pos === "below_card") {
    if (showCardContent) {
      const bottomOfCards = card2H > 0 ? card2Y + card2H : card1Y + card1H;
      targetCenterY = Math.min(height * 0.88, bottomOfCards + totalTextH / 2 + 20) + yOffset;
    } else {
      targetCenterY = height * 0.58 + yOffset;
    }
  } else if (pos === "top_left") {
    targetCenterX = outerMarginX + approxBadgeW / 2 + xOffset;
    targetCenterY = topY + totalTextH / 2 + 10 + yOffset;
    defaultTilt = -3;
  } else if (pos === "top_right") {
    targetCenterX = width - outerMarginX - approxBadgeW / 2 + xOffset;
    targetCenterY = topY + totalTextH / 2 + 10 + yOffset;
    defaultTilt = 3;
  } else if (pos === "bottom_left") {
    targetCenterX = outerMarginX + approxBadgeW / 2 + xOffset;
    targetCenterY = height - (isStory ? 140 : 60) - totalTextH / 2 + yOffset;
    defaultTilt = -2;
  } else if (pos === "bottom_right") {
    targetCenterX = width - outerMarginX - approxBadgeW / 2 + xOffset;
    targetCenterY = height - (isStory ? 140 : 60) - totalTextH / 2 + yOffset;
    defaultTilt = 2;
  } else {
    targetCenterX = width / 2 + xOffset;
    targetCenterY = height * 0.5 + yOffset;
  }

  return { x: targetCenterX, y: targetCenterY, defaultTilt };
}

/**
 * Render an individual line with curved arc text
 */
function renderCurvedSingleLineEffect(
  ctx: CanvasRenderingContext2D,
  template: TextEffectTemplate,
  text: string,
  curveDeg: number,
  fontPx: number,
  sizeScale: number,
  customColors?: {
    textColor?: string;
    bgColor?: string;
    borderColor?: string;
    shadowColor?: string;
    bgAlpha?: number;
    borderWidth?: number;
  }
): void {
  const graphemes = splitThaiGraphemes(text);
  ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const widths = graphemes.map((g) => ctx.measureText(g).width);
  const totalW = widths.reduce((a, b) => a + b, 0);
  if (totalW <= 0) return;

  const radAngle = (Math.abs(curveDeg) * Math.PI) / 180;
  const radius = Math.max(140, totalW / radAngle);
  const isUp = curveDeg > 0;

  const hasRibbon =
    template !== "capcut_outline" &&
    template !== "capcut_neon" &&
    template !== "minimal_underline" &&
    template !== "none";

  if (hasRibbon) {
    const padY = Math.round(14 * sizeScale);
    const halfH = fontPx * 0.74 + padY;
    const bgRadSpan = radAngle + 0.14;

    ctx.save();
    if (isUp) {
      ctx.translate(0, radius);
      ctx.beginPath();
      ctx.arc(0, 0, radius + halfH, -Math.PI / 2 - bgRadSpan / 2, -Math.PI / 2 + bgRadSpan / 2);
      ctx.arc(0, 0, radius - halfH, -Math.PI / 2 + bgRadSpan / 2, -Math.PI / 2 - bgRadSpan / 2, true);
      ctx.closePath();
    } else {
      ctx.translate(0, -radius);
      ctx.beginPath();
      ctx.arc(0, 0, radius + halfH, Math.PI / 2 - bgRadSpan / 2, Math.PI / 2 + bgRadSpan / 2);
      ctx.arc(0, 0, radius - halfH, Math.PI / 2 + bgRadSpan / 2, Math.PI / 2 - bgRadSpan / 2, true);
      ctx.closePath();
    }

    if (customColors?.bgColor) {
      ctx.fillStyle = customColors.bgColor;
      ctx.fill();
      if (customColors.borderColor && (customColors.borderWidth ?? 2) > 0) {
        ctx.lineWidth = (customColors.borderWidth ?? 2) * sizeScale;
        ctx.strokeStyle = customColors.borderColor;
        ctx.stroke();
      }
    } else if (template === "tiktok_yellow") {
      ctx.fillStyle = "#FFE600";
      ctx.fill();
    } else if (template === "tiktok_red" || template === "urgent_promo") {
      ctx.fillStyle = "#FE2C55";
      ctx.fill();
      ctx.lineWidth = 2.5 * sizeScale;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();
    } else if (template === "real_estate_badge") {
      ctx.fillStyle = "#0A192F";
      ctx.fill();
      ctx.lineWidth = 2 * sizeScale;
      ctx.strokeStyle = "#D4AF37";
      ctx.stroke();
    } else if (template === "luxury_editorial") {
      ctx.fillStyle = "rgba(18, 24, 38, 0.88)";
      ctx.fill();
      ctx.lineWidth = 1.5 * sizeScale;
      ctx.strokeStyle = "#E2D9C8";
      ctx.stroke();
    } else if (template === "price_tag") {
      ctx.fillStyle = "#059669";
      ctx.fill();
      ctx.lineWidth = 2 * sizeScale;
      ctx.strokeStyle = "#A7F3D0";
      ctx.stroke();
    } else if (template === "lemon8_highlighter") {
      ctx.fillStyle = "#FEF08A";
      ctx.fill();
    } else if (template === "lemon8_bubble") {
      ctx.fillStyle = "#FFF0F5";
      ctx.fill();
      ctx.lineWidth = 2 * sizeScale;
      ctx.strokeStyle = "#F43F5E";
      ctx.stroke();
    } else if (template === "lemon8_magazine") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.lineWidth = 2 * sizeScale;
      ctx.strokeStyle = "#000000";
      ctx.stroke();
    } else if (template === "illustrator_gold" || template === "illustrator_curve") {
      const goldGrad = ctx.createLinearGradient(-totalW / 2, 0, totalW / 2, 0);
      goldGrad.addColorStop(0, "#F59E0B");
      goldGrad.addColorStop(0.5, "#FDE68A");
      goldGrad.addColorStop(1, "#D97706");
      ctx.fillStyle = goldGrad;
      ctx.fill();
      ctx.lineWidth = 2 * sizeScale;
      ctx.strokeStyle = "#78350F";
      ctx.stroke();
    } else if (template === "custom") {
      ctx.fillStyle = customColors?.bgColor || "#0F172A";
      ctx.fill();
      if ((customColors?.borderWidth ?? 2) > 0) {
        ctx.lineWidth = (customColors?.borderWidth ?? 2) * sizeScale;
        ctx.strokeStyle = customColors?.borderColor || "#F59E0B";
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.stroke();
    }
    ctx.restore();
  }

  let currentDist = 0;
  for (let i = 0; i < graphemes.length; i++) {
    const charW = widths[i];
    const centerDist = currentDist + charW / 2;
    const phi = (centerDist / totalW - 0.5) * radAngle;
    const charAngle = isUp ? phi : -phi;

    ctx.save();
    if (isUp) {
      ctx.translate(0, radius);
      ctx.rotate(charAngle);
      ctx.translate(0, -radius);
    } else {
      ctx.translate(0, -radius);
      ctx.rotate(charAngle);
      ctx.translate(0, radius);
    }

    if (customColors?.textColor) {
      ctx.fillStyle = customColors.textColor;
      ctx.fillText(graphemes[i], 0, 0);
    } else if (template === "capcut_outline" || template === "yt_bold_stroke") {
      ctx.lineWidth = Math.round((template === "yt_bold_stroke" ? 15 : 12) * sizeScale);
      ctx.strokeStyle = "#000000";
      ctx.strokeText(graphemes[i], 0, 0);
      ctx.fillStyle = template === "yt_bold_stroke" ? "#FFFC00" : "#FFFFFF";
      ctx.fillText(graphemes[i], 0, 0);
    } else if (template === "capcut_neon") {
      ctx.shadowColor = "#00F2FE";
      ctx.shadowBlur = 24;
      ctx.fillStyle = "#00F2FE";
      ctx.fillText(graphemes[i], 0, 0);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(graphemes[i], 0, 0);
    } else if (template === "illustrator_pop") {
      ctx.lineWidth = Math.round(8 * sizeScale);
      ctx.strokeStyle = "#000000";
      ctx.strokeText(graphemes[i], 0, 0);
      ctx.fillStyle = "#FFE600";
      ctx.fillText(graphemes[i], 0, 0);
    } else if (template === "illustrator_gold" || template === "illustrator_curve") {
      ctx.lineWidth = Math.round(4 * sizeScale);
      ctx.strokeStyle = "#451A03";
      ctx.strokeText(graphemes[i], 0, 0);
      ctx.fillStyle = "#FFFBEB";
      ctx.fillText(graphemes[i], 0, 0);
    } else if (template === "tiktok_yellow") {
      ctx.fillStyle = "#000000";
      ctx.fillText(graphemes[i], 0, 0);
    } else if (template === "lemon8_highlighter" || template === "lemon8_magazine") {
      ctx.fillStyle = "#0F172A";
      ctx.fillText(graphemes[i], 0, 0);
    } else if (template === "lemon8_bubble") {
      ctx.fillStyle = "#E11D48";
      ctx.fillText(graphemes[i], 0, 0);
    } else if (template === "real_estate_badge") {
      ctx.fillStyle = "#FDE68A";
      ctx.fillText(graphemes[i], 0, 0);
    } else if (template === "luxury_editorial") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(graphemes[i], 0, 0);
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(graphemes[i], 0, 0);
    }

    ctx.restore();
    currentDist += charW;
  }
}

/**
 * Render a single line badge or text effect with its specific template, scale and colors
 */
function renderSingleLineEffect(
  ctx: CanvasRenderingContext2D,
  template: TextEffectTemplate,
  line: string,
  lineY: number,
  fontPx: number,
  scale: number,
  customColors?: {
    textColor?: string;
    bgColor?: string;
    borderColor?: string;
    shadowColor?: string;
    bgAlpha?: number;
    borderWidth?: number;
  }
): void {
  const getPillBounds = (padX: number, padY: number) => {
    const lineW = ctx.measureText(line).width;
    const boxW = Math.round(lineW + padX * 2);
    const boxH = Math.round(fontPx * 1.18 + padY * 2);
    const boxX = Math.round(-boxW / 2);
    const boxY = Math.round(lineY - boxH / 2);
    return { lineW, boxW, boxH, boxX, boxY };
  };

  switch (template) {
    // 🟡 1. TikTok Yellow Box
    case "tiktok_yellow": {
      const padX = Math.round(30 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "#FFE600";
      ctx.fill();
      if (customColors?.borderColor) {
        ctx.lineWidth = Math.round((customColors?.borderWidth || 2) * scale);
        ctx.strokeStyle = customColors.borderColor;
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🔴 2. TikTok Hot Red Tag
    case "tiktok_red": {
      const padX = Math.round(32 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(254, 44, 85, 0.55)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      if (customColors?.bgColor) {
        ctx.fillStyle = customColors.bgColor;
      } else {
        const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY);
        grad.addColorStop(0, "#FF0050");
        grad.addColorStop(1, "#FE2C55");
        ctx.fillStyle = grad;
      }
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 2.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#FFFFFF";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // ⚫ 3. TikTok Dark Contrast
    case "tiktok_dark": {
      const padX = Math.round(30 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `800 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 20;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "rgba(15, 23, 42, 0.90)";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 1.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "rgba(255, 255, 255, 0.25)";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFE600";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 📺 4. YouTube Bold Stroke (Viral Shorts Hook)
    case "yt_bold_stroke": {
      ctx.font = `900 ${Math.round(fontPx * 1.15)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.lineWidth = Math.round((customColors?.borderWidth || 15) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#000000";
      ctx.strokeText(line, 0, lineY);
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFC00";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🎬 5. CapCut Outline
    case "capcut_outline": {
      ctx.font = `900 ${Math.round(fontPx * 1.05)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.lineWidth = Math.round((customColors?.borderWidth || 12) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#000000";
      ctx.strokeText(line, 0, lineY);
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // ⚡ 6. CapCut Neon Glow
    case "capcut_neon": {
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const neonColor = customColors?.borderColor || "#00F2FE";
      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || neonColor;
      ctx.shadowBlur = 32;
      ctx.fillStyle = neonColor;
      ctx.fillText(line, 0, lineY);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = neonColor;
      ctx.shadowBlur = 14;
      ctx.lineWidth = Math.round((customColors?.borderWidth || 4) * scale);
      ctx.strokeStyle = neonColor;
      ctx.strokeText(line, 0, lineY);
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 💥 7. CapCut Fire Gradient
    case "capcut_gradient": {
      ctx.font = `900 ${Math.round(fontPx * 1.05)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(255, 65, 108, 0.6)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 4;
      ctx.lineWidth = Math.round((customColors?.borderWidth || 10) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#111827";
      ctx.strokeText(line, 0, lineY);
      ctx.restore();

      if (customColors?.textColor) {
        ctx.fillStyle = customColors.textColor;
      } else {
        const grad = ctx.createLinearGradient(0, lineY - fontPx / 2, 0, lineY + fontPx / 2);
        grad.addColorStop(0, "#FFF275");
        grad.addColorStop(0.5, "#FF8C00");
        grad.addColorStop(1, "#FF0055");
        ctx.fillStyle = grad;
      }
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🍋 8. Lemon8 Magazine Chic
    case "lemon8_magazine": {
      const padX = Math.round(32 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(18 * scale);
      ctx.font = `800 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.22)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "#FFFBEB";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 2.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#FDE68A";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#1C1917";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🖍️ 9. Lemon8 Pastel Highlighter
    case "lemon8_highlighter": {
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const lineW = ctx.measureText(line).width;
      const hlH = Math.round(fontPx * 0.58);
      const hlW = lineW + Math.round(22 * scale);
      const hlX = -hlW / 2;
      const hlY = lineY - Math.round(fontPx * 0.08);

      ctx.save();
      ctx.fillStyle = customColors?.bgColor || "rgba(254, 240, 138, 0.90)";
      roundRect(ctx, hlX, hlY, hlW, hlH, Math.round(6 * scale));
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 4;
      ctx.fillStyle = customColors?.textColor || "#0F172A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      ctx.restore();
      break;
    }

    // 🌸 10. Lemon8 Cute Bubble
    case "lemon8_bubble": {
      const padX = Math.round(34 * scale);
      const padY = Math.round(14 * scale);
      const boxR = Math.round(26 * scale);
      ctx.font = `800 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(251, 113, 133, 0.35)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "#FFF0F5";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 2.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#FDA4AF";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#881337";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🏷️ 11. Lemon8 Clean Muji Label
    case "lemon8_tag": {
      const padX = Math.round(32 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `700 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.18)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "rgba(255, 255, 255, 0.94)";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 1.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "rgba(226, 232, 240, 0.95)";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#1E293B";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // ☕ 12. Korean Cafe Aesthetic
    case "korean_cafe": {
      const padX = Math.round(32 * scale);
      const padY = Math.round(14 * scale);
      const boxR = Math.round(22 * scale);
      ctx.font = `700 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.14)";
      ctx.shadowBlur = 16;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "#F4EBD9";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 1.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#D4C3B3";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#433422";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // ✨ 13. Minimal Clean (มินิมอลเรียบหรู)
    case "minimal_clean": {
      const padX = Math.round(30 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `700 ${Math.round(fontPx * 0.92)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 16;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "rgba(15, 23, 42, 0.72)";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 1.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "rgba(255, 255, 255, 0.45)";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`✦ ${line} ✦`, 0, lineY);
      break;
    }

    // 🪟 14. Minimal Frosted Glass
    case "minimal_glass": {
      const padX = Math.round(32 * scale);
      const padY = Math.round(14 * scale);
      const boxR = Math.round(20 * scale);
      ctx.font = `800 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 24;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "rgba(255, 255, 255, 0.22)";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 1.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "rgba(255, 255, 255, 0.65)";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // ➖ 15. Minimal Underline Line Accent
    case "minimal_underline": {
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const lineW = ctx.measureText(line).width;

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      ctx.restore();

      const barW = Math.round(lineW * 0.8);
      const barY = lineY + Math.round(fontPx * 0.56);
      ctx.fillStyle = customColors?.borderColor || customColors?.bgColor || "#F59E0B";
      ctx.fillRect(-barW / 2, barY, barW, Math.round((customColors?.borderWidth || 3.5) * scale));
      break;
    }

    // 🕶️ 16. Minimal Monochrome Vogue
    case "minimal_monochrome": {
      const padX = Math.round(30 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(8 * scale);
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.55)";
      ctx.shadowBlur = 18;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "#000000";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 2) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#FFFFFF";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🏢 17. Real Estate Badge (Navy / Charcoal with Gold Accent)
    case "real_estate_badge": {
      const padX = Math.round(34 * scale);
      const padY = Math.round(14 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `800 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "#0A192F";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 2.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#D4AF37";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FDE68A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 👑 18. Luxury Editorial (High-End Editorial Typography)
    case "luxury_editorial": {
      const padX = Math.round(34 * scale);
      const padY = Math.round(14 * scale);
      const boxR = Math.round(10 * scale);
      ctx.font = `700 ${Math.round(fontPx * 0.95)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const displayLine = `— ${line.toUpperCase()} —`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 20;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "rgba(18, 24, 38, 0.88)";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 1.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#E2D9C8";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(displayLine, 0, lineY);
      break;
    }

    // 🔥 19. Urgent Promo (Flash Sale / Closing Deal)
    case "urgent_promo": {
      const padX = Math.round(32 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(14 * scale);
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(239, 68, 68, 0.6)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      if (customColors?.bgColor) {
        ctx.fillStyle = customColors.bgColor;
      } else {
        const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY);
        grad.addColorStop(0, "#EF4444");
        grad.addColorStop(1, "#F97316");
        ctx.fillStyle = grad;
      }
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 2.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#FFFFFF";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🏷️ 20. Price Tag (Emerald Green Price Badge)
    case "price_tag": {
      const padX = Math.round(32 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(5, 150, 105, 0.5)";
      ctx.shadowBlur = 20;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "#059669";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 2) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#A7F3D0";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🎨 21. Illustrator 3D Pop (Solid Offset Shadow)
    case "illustrator_pop": {
      ctx.font = `900 ${Math.round(fontPx * 1.08)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      const offsetShift = Math.round(8 * scale);
      ctx.fillStyle = customColors?.shadowColor || "#000000";
      ctx.fillText(line, offsetShift, lineY + offsetShift);

      ctx.lineWidth = Math.round((customColors?.borderWidth || 9) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#000000";
      ctx.strokeText(line, 0, lineY);

      ctx.fillStyle = customColors?.textColor || "#FFE600";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🔴 22. Illustrator Vintage Stamp
    case "illustrator_stamp": {
      const padX = Math.round(32 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(10 * scale);
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const stampText = `★ ${line.toUpperCase()} ★`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(220, 38, 38, 0.45)";
      ctx.shadowBlur = 18;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "rgba(220, 38, 38, 0.16)";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 3) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#DC2626";
      ctx.stroke();

      roundRect(ctx, boxX + 4, boxY + 4, boxW - 8, boxH - 8, boxR - 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = customColors?.borderColor || "#DC2626";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#DC2626";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(stampText, 0, lineY);
      break;
    }

    // ✂️ 23. Illustrator Dashed Border Sticker
    case "illustrator_dashed": {
      const padX = Math.round(32 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.35)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = customColors?.bgColor || "#FF6B6B";
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 2.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#FFFFFF";
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🥇 24. Illustrator Metallic Gold
    case "illustrator_gold":
    case "illustrator_curve": {
      const padX = Math.round(34 * scale);
      const padY = Math.round(14 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(245, 158, 11, 0.5)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      if (customColors?.bgColor) {
        ctx.fillStyle = customColors.bgColor;
      } else {
        const goldGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
        goldGrad.addColorStop(0, "#F59E0B");
        goldGrad.addColorStop(0.5, "#FDE68A");
        goldGrad.addColorStop(1, "#D97706");
        ctx.fillStyle = goldGrad;
      }
      ctx.fill();
      ctx.lineWidth = Math.round((customColors?.borderWidth || 2.5) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#78350F";
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#451A03";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🏷️ 25. Sticker Peel Border
    case "sticker_border": {
      ctx.font = `900 ${Math.round(fontPx * 1.05)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      ctx.save();
      ctx.shadowColor = customColors?.shadowColor || "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.lineWidth = Math.round((customColors?.borderWidth || 16) * scale);
      ctx.strokeStyle = customColors?.borderColor || "#FFFFFF";
      ctx.strokeText(line, 0, lineY);
      ctx.restore();

      ctx.fillStyle = customColors?.textColor || "#0F172A";
      ctx.fillText(line, 0, lineY);
      break;
    }

    // 🛠️ 26. Fully Custom Studio Text Effect
    case "custom":
    default: {
      const padX = Math.round(32 * scale);
      const padY = Math.round(12 * scale);
      const boxR = Math.round(16 * scale);
      ctx.font = `900 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      const { boxX, boxY, boxW, boxH } = getPillBounds(padX, padY);

      const customTextCol = customColors?.textColor || "#FFFFFF";
      const customBgHex = customColors?.bgColor || "#0F172A";
      const customBgAlpha = (customColors?.bgAlpha ?? 85) / 100;
      const customBorderCol = customColors?.borderColor || "#F59E0B";
      const customBorderW = customColors?.borderWidth ?? 2;
      const customShadow = customColors?.shadowColor || "rgba(0,0,0,0.5)";

      const h = customBgHex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16) || 15;
      const g = parseInt(h.substring(2, 4), 16) || 23;
      const b = parseInt(h.substring(4, 6), 16) || 42;

      if (customBgAlpha > 0) {
        ctx.save();
        ctx.shadowColor = customShadow;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${customBgAlpha})`;
        ctx.fill();
        if (customBorderW > 0) {
          ctx.lineWidth = customBorderW * scale;
          ctx.strokeStyle = customBorderCol;
          ctx.stroke();
        }
        ctx.restore();
      }

      ctx.fillStyle = customTextCol;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, lineY);
      break;
    }
  }
}
