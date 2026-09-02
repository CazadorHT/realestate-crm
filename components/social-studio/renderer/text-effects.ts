import type { BannerRenderOptions, PromoPosition } from "../types";
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

  const rawText = (options.textEffectText?.trim()) ||
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

  // Determine Position X and Y
  const pos = options.textEffectPosition || (showCardContent ? "above_card" : "center");
  const yOffset = options.textEffectYOffset || 0;
  const xOffset = options.textEffectXOffset || 0;
  let targetCenterX = width / 2 + xOffset;
  let targetCenterY = height * 0.5 + yOffset;
  let defaultTilt = 0;

  if (pos === "top") {
    targetCenterY = height * 0.20 + yOffset;
  } else if (pos === "bottom") {
    targetCenterY = height * 0.84 + yOffset;
  } else if (pos === "safe_top") {
    // Safe zone for TikTok / Reels / Shorts: clear top search bar & status icons
    targetCenterY = (isStory ? height * 0.16 : height * 0.12) + yOffset;
  } else if (pos === "safe_bottom") {
    // Safe zone for TikTok / Reels / Shorts: clear bottom sound ticker & creator handle
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
    // "center"
    targetCenterX = width / 2 + xOffset;
    targetCenterY = height * 0.5 + yOffset;
  }

  // Rotation tilt
  const rotDeg = options.textEffectRotation !== undefined
    ? options.textEffectRotation
    : (defaultTilt || (template === "tiktok_red" ? -2 : template === "illustrator_stamp" ? -3 : template === "lemon8_bubble" ? -1.5 : 0));

  ctx.translate(targetCenterX, targetCenterY);
  if (rotDeg !== 0) {
    ctx.rotate((rotDeg * Math.PI) / 180);
  }

  // Check Curved Text Arc Angle (-60 to +60)
  const curveDeg = options.textEffectCurve !== undefined
    ? options.textEffectCurve
    : (template === "illustrator_curve" ? 28 : 0);

  // ==========================================
  // BRANCH 1: CURVED / ARC TEXT RENDERING
  // ==========================================
  if (curveDeg !== 0) {
    const textToCurve = lines.join(" • ");
    const graphemes = splitThaiGraphemes(textToCurve);
    ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const widths = graphemes.map((g) => ctx.measureText(g).width);
    const totalW = widths.reduce((a, b) => a + b, 0);

    if (totalW > 0) {
      const radAngle = (Math.abs(curveDeg) * Math.PI) / 180;
      const radius = Math.max(140, totalW / radAngle);
      const isUp = curveDeg > 0;

      // 1. Draw Curved Background Ribbon if template has background
      const hasRibbon = template !== "capcut_outline" && template !== "capcut_neon" && template !== "minimal_underline";
      if (hasRibbon) {
        const padY = Math.round(14 * sizeScale);
        const halfH = baseFontPx * 0.74 + padY;
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

        // Ribbon background styling by template
        if (template === "tiktok_yellow") {
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
          ctx.fillStyle = options.textEffectCustomBgColor || "#0F172A";
          ctx.fill();
          if ((options.textEffectCustomBorderWidth ?? 2) > 0) {
            ctx.lineWidth = options.textEffectCustomBorderWidth ?? 2;
            ctx.strokeStyle = options.textEffectCustomBorderColor || "#F59E0B";
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

      // 2. Draw Curved Characters
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

        // Draw character style
        if (template === "capcut_outline" || template === "yt_bold_stroke") {
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
        } else if (template === "real_estate_badge") {
          ctx.fillStyle = "#FDE68A";
          ctx.fillText(graphemes[i], 0, 0);
        } else if (template === "luxury_editorial") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(graphemes[i], 0, 0);
        } else if (template === "custom") {
          ctx.fillStyle = options.textEffectCustomTextColor || "#FFFFFF";
          ctx.fillText(graphemes[i], 0, 0);
        } else {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(graphemes[i], 0, 0);
        }

        ctx.restore();
        currentDist += charW;
      }
    }

    ctx.restore();
    return;
  }

  // ==========================================
  // BRANCH 2: STRAIGHT MULTI-LINE RENDERING
  // ==========================================
  const startY = -totalTextH / 2 + lineHeight / 2;

  /**
   * Helper to calculate balanced, symmetrical multi-line badge and pill geometry.
   * Ensures vertical centering (top padding === bottom padding),
   * harmonic horizontal padding (px), and equal gap between pills.
   */
  const getBadgeItems = (
    padX: number,
    padY: number,
    gap: number,
  ) => {
    const boxH = Math.round(baseFontPx * 1.18 + padY * 2);
    const totalH = lines.length * boxH + (lines.length - 1) * gap;
    const firstPillY = -totalH / 2 + boxH / 2;

    return lines.map((line, idx) => {
      const lineY = Math.round(firstPillY + idx * (boxH + gap));
      const lineW = ctx.measureText(line).width;
      const boxW = Math.round(lineW + padX * 2);
      const boxX = Math.round(-boxW / 2);
      const boxY = Math.round(lineY - boxH / 2);
      return { line, lineY, lineW, boxX, boxY, boxW, boxH };
    });
  };

  switch (template) {
    // 🟡 1. TikTok Yellow Box
    case "tiktok_yellow": {
      const padX = Math.round(30 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "#FFE600";
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🔴 2. TikTok Hot Red Tag
    case "tiktok_red": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(254, 44, 85, 0.55)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY);
        grad.addColorStop(0, "#FF0050");
        grad.addColorStop(1, "#FE2C55");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = Math.round(2.5 * sizeScale);
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // ⚫ 3. TikTok Dark Contrast
    case "tiktok_dark": {
      const padX = Math.round(30 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `800 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
        ctx.shadowBlur = 20;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FFE600";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 📺 4. YouTube Bold Stroke (Viral Shorts Hook)
    case "yt_bold_stroke": {
      ctx.font = `900 ${Math.round(baseFontPx * 1.15)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;

      lines.forEach((line, idx) => {
        const lineY = startY + idx * Math.round(lineHeight * 1.18);
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.lineWidth = Math.round(15 * sizeScale);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(line, 0, lineY);
        ctx.restore();

        ctx.fillStyle = "#FFFC00";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🎬 5. CapCut Outline
    case "capcut_outline": {
      ctx.font = `900 ${Math.round(baseFontPx * 1.05)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      lines.forEach((line, idx) => {
        const lineY = startY + idx * Math.round(lineHeight * 1.1);
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;
        ctx.lineWidth = Math.round(12 * sizeScale);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(line, 0, lineY);
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // ⚡ 6. CapCut Neon Glow
    case "capcut_neon": {
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      lines.forEach((line, idx) => {
        const lineY = startY + idx * Math.round(lineHeight * 1.08);

        ctx.save();
        ctx.shadowColor = "#00F2FE";
        ctx.shadowBlur = 32;
        ctx.fillStyle = "#00F2FE";
        ctx.fillText(line, 0, lineY);
        ctx.restore();

        ctx.save();
        ctx.shadowColor = "#4FACFE";
        ctx.shadowBlur = 14;
        ctx.lineWidth = Math.round(4 * sizeScale);
        ctx.strokeStyle = "#00F2FE";
        ctx.strokeText(line, 0, lineY);
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 💥 7. CapCut Fire Gradient
    case "capcut_gradient": {
      ctx.font = `900 ${Math.round(baseFontPx * 1.05)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      lines.forEach((line, idx) => {
        const lineY = startY + idx * Math.round(lineHeight * 1.1);
        ctx.save();
        ctx.shadowColor = "rgba(255, 65, 108, 0.6)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 4;
        ctx.lineWidth = Math.round(10 * sizeScale);
        ctx.strokeStyle = "#111827";
        ctx.strokeText(line, 0, lineY);
        ctx.restore();

        const grad = ctx.createLinearGradient(0, lineY - baseFontPx / 2, 0, lineY + baseFontPx / 2);
        grad.addColorStop(0, "#FFF275");
        grad.addColorStop(0.5, "#FF8C00");
        grad.addColorStop(1, "#FF0055");
        ctx.fillStyle = grad;
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🍋 8. Lemon8 Magazine Chic
    case "lemon8_magazine": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(18 * sizeScale);
      ctx.font = `800 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.22)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "#FFFBEB";
        ctx.fill();
        ctx.lineWidth = Math.round(2.5 * sizeScale);
        ctx.strokeStyle = "#FDE68A";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#1C1917";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🖍️ 9. Lemon8 Pastel Highlighter
    case "lemon8_highlighter": {
      lines.forEach((line, idx) => {
        const lineY = startY + idx * Math.round(lineHeight * 1.15);
        ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
        const lineW = ctx.measureText(line).width;
        const hlH = Math.round(baseFontPx * 0.58);
        const hlW = lineW + Math.round(22 * sizeScale);
        const hlX = -hlW / 2;
        const hlY = lineY - Math.round(baseFontPx * 0.08);

        ctx.save();
        ctx.fillStyle = "rgba(254, 240, 138, 0.90)";
        roundRect(ctx, hlX, hlY, hlW, hlH, Math.round(6 * sizeScale));
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "#0F172A";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
        ctx.restore();
      });
      break;
    }

    // 🌸 10. Lemon8 Cute Bubble
    case "lemon8_bubble": {
      const padX = Math.round(34 * sizeScale);
      const padY = Math.round(14 * sizeScale);
      const gap = Math.round(14 * sizeScale);
      const boxR = Math.round(26 * sizeScale);
      ctx.font = `800 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(251, 113, 133, 0.35)";
        ctx.shadowBlur = 22;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "#FFF0F5";
        ctx.fill();
        ctx.lineWidth = Math.round(2.5 * sizeScale);
        ctx.strokeStyle = "#FDA4AF";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#881337";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🏷️ 11. Lemon8 Clean Muji Label
    case "lemon8_tag": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `700 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(226, 232, 240, 0.95)";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#1E293B";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // ☕ 12. Korean Cafe Aesthetic
    case "korean_cafe": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(14 * sizeScale);
      const gap = Math.round(14 * sizeScale);
      const boxR = Math.round(22 * sizeScale);
      ctx.font = `700 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.14)";
        ctx.shadowBlur = 16;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "#F4EBD9";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#D4C3B3";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#433422";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // ✨ 13. Minimal Clean (มินิมอลเรียบหรู)
    case "minimal_clean": {
      const padX = Math.round(30 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `700 ${Math.round(baseFontPx * 0.92)}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 16;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`✦ ${line} ✦`, 0, lineY);
      });
      break;
    }

    // 🪟 14. Minimal Frosted Glass
    case "minimal_glass": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(14 * sizeScale);
      const gap = Math.round(14 * sizeScale);
      const boxR = Math.round(20 * sizeScale);
      ctx.font = `800 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 24;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // ➖ 15. Minimal Underline Line Accent
    case "minimal_underline": {
      lines.forEach((line, idx) => {
        const lineY = startY + idx * Math.round(lineHeight * 1.25);
        ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
        const lineW = ctx.measureText(line).width;

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
        ctx.restore();

        const barW = Math.round(lineW * 0.8);
        const barY = lineY + Math.round(baseFontPx * 0.56);
        ctx.fillStyle = "#F59E0B";
        ctx.fillRect(-barW / 2, barY, barW, Math.round(3.5 * sizeScale));
      });
      break;
    }

    // 🕶️ 16. Minimal Monochrome Vogue
    case "minimal_monochrome": {
      const padX = Math.round(30 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(8 * sizeScale);
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
        ctx.shadowBlur = 18;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "#000000";
        ctx.fill();
        ctx.lineWidth = Math.round(2 * sizeScale);
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🏢 17. Real Estate Badge (Navy / Charcoal with Gold Accent)
    case "real_estate_badge": {
      const padX = Math.round(34 * sizeScale);
      const padY = Math.round(14 * sizeScale);
      const gap = Math.round(14 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `800 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "#0A192F";
        ctx.fill();
        ctx.lineWidth = Math.round(2.5 * sizeScale);
        ctx.strokeStyle = "#D4AF37";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FDE68A";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 👑 18. Luxury Editorial (High-End Editorial Typography)
    case "luxury_editorial": {
      const padX = Math.round(34 * sizeScale);
      const padY = Math.round(14 * sizeScale);
      const gap = Math.round(14 * sizeScale);
      const boxR = Math.round(10 * sizeScale);
      ctx.font = `700 ${Math.round(baseFontPx * 0.95)}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const displayLines = lines.map((l) => `— ${l.toUpperCase()} —`);
      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ lineY, boxX, boxY, boxW, boxH }, idx) => {
        const displayLine = displayLines[idx];
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 20;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "rgba(18, 24, 38, 0.88)";
        ctx.fill();
        ctx.lineWidth = 1.5 * sizeScale;
        ctx.strokeStyle = "#E2D9C8";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(displayLine, 0, lineY);
      });
      break;
    }

    // 🔥 19. Urgent Promo (Flash Sale / Closing Deal)
    case "urgent_promo": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(14 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(239, 68, 68, 0.6)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY);
        grad.addColorStop(0, "#EF4444");
        grad.addColorStop(1, "#F97316");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = Math.round(2.5 * sizeScale);
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🏷️ 20. Price Tag (Emerald Green Price Badge)
    case "price_tag": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(5, 150, 105, 0.5)";
        ctx.shadowBlur = 20;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "#059669";
        ctx.fill();
        ctx.lineWidth = 2 * sizeScale;
        ctx.strokeStyle = "#A7F3D0";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🎨 21. Illustrator 3D Pop (Solid Offset Shadow)
    case "illustrator_pop": {
      ctx.font = `900 ${Math.round(baseFontPx * 1.08)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      const offsetShift = Math.round(8 * sizeScale);

      lines.forEach((line, idx) => {
        const lineY = startY + idx * Math.round(lineHeight * 1.15);

        ctx.fillStyle = "#000000";
        ctx.fillText(line, offsetShift, lineY + offsetShift);

        ctx.lineWidth = Math.round(9 * sizeScale);
        ctx.strokeStyle = "#000000";
        ctx.strokeText(line, 0, lineY);

        ctx.fillStyle = "#FFE600";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🔴 22. Illustrator Vintage Stamp
    case "illustrator_stamp": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(10 * sizeScale);
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const stampLines = lines.map((l) => `★ ${l.toUpperCase()} ★`);
      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ lineY, boxX, boxY, boxW, boxH }, idx) => {
        const stampText = stampLines[idx];
        ctx.save();
        ctx.shadowColor = "rgba(220, 38, 38, 0.45)";
        ctx.shadowBlur = 18;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "rgba(220, 38, 38, 0.16)";
        ctx.fill();
        ctx.lineWidth = Math.round(3 * sizeScale);
        ctx.strokeStyle = "#DC2626";
        ctx.stroke();

        roundRect(ctx, boxX + 4, boxY + 4, boxW - 8, boxH - 8, boxR - 2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#DC2626";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#DC2626";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(stampText, 0, lineY);
      });
      break;
    }

    // ✂️ 23. Illustrator Dashed Border Sticker
    case "illustrator_dashed": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        ctx.fillStyle = "#FF6B6B";
        ctx.fill();
        ctx.lineWidth = Math.round(2.5 * sizeScale);
        ctx.strokeStyle = "#FFFFFF";
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🥇 24. Illustrator Metallic Gold
    case "illustrator_gold":
    case "illustrator_curve": {
      const padX = Math.round(34 * sizeScale);
      const padY = Math.round(14 * sizeScale);
      const gap = Math.round(14 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        ctx.save();
        ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 6;
        roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
        const goldGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
        goldGrad.addColorStop(0, "#F59E0B");
        goldGrad.addColorStop(0.5, "#FDE68A");
        goldGrad.addColorStop(1, "#D97706");
        ctx.fillStyle = goldGrad;
        ctx.fill();
        ctx.lineWidth = Math.round(2.5 * sizeScale);
        ctx.strokeStyle = "#78350F";
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#451A03";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🏷️ 25. Sticker Peel Border
    case "sticker_border": {
      ctx.font = `900 ${Math.round(baseFontPx * 1.05)}px 'Prompt', 'Noto Sans Thai', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      lines.forEach((line, idx) => {
        const lineY = startY + idx * Math.round(lineHeight * 1.15);
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.lineWidth = Math.round(16 * sizeScale);
        ctx.strokeStyle = "#FFFFFF";
        ctx.strokeText(line, 0, lineY);
        ctx.restore();

        ctx.fillStyle = "#0F172A";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }

    // 🛠️ 26. Fully Custom Studio Text Effect
    case "custom": {
      const padX = Math.round(32 * sizeScale);
      const padY = Math.round(12 * sizeScale);
      const gap = Math.round(12 * sizeScale);
      const boxR = Math.round(16 * sizeScale);
      ctx.font = `900 ${baseFontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

      const customTextCol = options.textEffectCustomTextColor || "#FFFFFF";
      const customBgHex = options.textEffectCustomBgColor || "#0F172A";
      const customBgAlpha = (options.textEffectCustomBgAlpha ?? 85) / 100;
      const customBorderCol = options.textEffectCustomBorderColor || "#F59E0B";
      const customBorderW = options.textEffectCustomBorderWidth ?? 2;
      const customShadow = options.textEffectCustomShadowColor || "rgba(0,0,0,0.5)";

      const h = customBgHex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16) || 15;
      const g = parseInt(h.substring(2, 4), 16) || 23;
      const b = parseInt(h.substring(4, 6), 16) || 42;

      const items = getBadgeItems(padX, padY, gap);
      items.forEach(({ line, lineY, boxX, boxY, boxW, boxH }) => {
        if (customBgAlpha > 0) {
          ctx.save();
          ctx.shadowColor = customShadow;
          ctx.shadowBlur = 20;
          ctx.shadowOffsetY = 6;
          roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${customBgAlpha})`;
          ctx.fill();
          if (customBorderW > 0) {
            ctx.lineWidth = customBorderW * sizeScale;
            ctx.strokeStyle = customBorderCol;
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.fillStyle = customTextCol;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line, 0, lineY);
      });
      break;
    }
  }

  ctx.restore();
}
