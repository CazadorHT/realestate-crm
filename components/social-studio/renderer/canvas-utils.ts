import type { AspectRatio } from "../types";

/**
 * Returns standard dimensions based on aspect ratio
 */
export function getDimensions(ratio: AspectRatio): { width: number; height: number } {
  switch (ratio) {
    case "9:16":
      return { width: 1080, height: 1920 };
    case "2:3":
      return { width: 1080, height: 1620 };
    case "4:5":
      return { width: 1080, height: 1350 };
    case "3:2":
      return { width: 1620, height: 1080 };
    case "1:1":
    default:
      return { width: 1080, height: 1080 };
  }
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();

/**
 * Clear cached images
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Helper to load an image safely with CORS handling and in-memory caching
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  if (!src) return Promise.reject(new Error("Empty image src"));
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = (e) => {
        imageCache.delete(src);
        reject(e);
      };
      fallbackImg.src = src;
    };
    img.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

/**
 * Helper to draw a rounded rectangle
 */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
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
 * Draw an image fitted into a bounding box with object-fit: cover and optional crop pan offsets (-100 to 100)
 */
export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 0,
  fitWithBlurredBackdrop: boolean = false,
  cropOffsetX: number = 0,
  cropOffsetY: number = 0,
  blurRadius: number = 0
): void {
  ctx.save();
  ctx.beginPath();
  if (radius > 0) {
    roundRect(ctx, x, y, w, h, radius);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.clip();

  // Normalized factors: -100 = 0 (left/top), 0 = 0.5 (center), +100 = 1.0 (right/bottom)
  const factorX = (Math.max(-100, Math.min(100, cropOffsetX || 0)) + 100) / 200;
  const factorY = (Math.max(-100, Math.min(100, cropOffsetY || 0)) + 100) / 200;

  const hasBlur = blurRadius > 0;
  if (hasBlur) {
    try {
      ctx.filter = `blur(${blurRadius}px)`;
    } catch {}
  }

  if (fitWithBlurredBackdrop) {
    // 1. Draw blurred, expanded background to fill missing margins/sides seamlessly
    ctx.save();
    const hRatio = w / img.width;
    const vRatio = h / img.height;
    const coverRatio = Math.max(hRatio, vRatio) * 1.18; // slight zoom to prevent blur edge bleeding
    const bgShiftX = x + (w - img.width * coverRatio) * factorX;
    const bgShiftY = y + (h - img.height * coverRatio) * factorY;

    try {
      ctx.filter = `blur(${Math.max(32, blurRadius)}px) brightness(0.68) saturate(1.25)`;
    } catch {
      // fallback if filter is not supported
    }
    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      bgShiftX, bgShiftY, img.width * coverRatio, img.height * coverRatio
    );
    try {
      ctx.filter = hasBlur ? `blur(${blurRadius}px)` : "none";
    } catch {}
    ctx.restore();

    // Dark ambient overlay on blurred background for elegant contrast
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(x, y, w, h);

    // 2. Draw foreground full uncropped image (contain) in the center with pan support
    const containRatio = Math.min(w / img.width, h / img.height);
    const fitW = Math.round(img.width * containRatio);
    const fitH = Math.round(img.height * containRatio);
    const fitX = Math.round(x + (w - fitW) * factorX);
    const fitY = Math.round(y + (h - fitH) * factorY);

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.50)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      fitX, fitY, fitW, fitH
    );
    ctx.restore();
  } else {
    // Bleed expansion to prevent transparent edge-bleeding caused by canvas blur filter
    const bleed = hasBlur ? Math.round(blurRadius * 2.4) : 0;
    const effectiveW = w + bleed * 2;
    const effectiveH = h + bleed * 2;

    const hRatio = effectiveW / img.width;
    const vRatio = effectiveH / img.height;
    const ratio = Math.max(hRatio, vRatio);
    const renderedW = img.width * ratio;
    const renderedH = img.height * ratio;

    const shiftX = (x - bleed) + (effectiveW - renderedW) * factorX;
    const shiftY = (y - bleed) + (effectiveH - renderedH) * factorY;

    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      shiftX,
      shiftY,
      renderedW,
      renderedH
    );
  }
  try {
    ctx.filter = "none";
  } catch {}
  ctx.restore();
}

/**
 * Draw wrapped text from top-baseline and return the bottom Y position
 */
export function wrapTextTop(
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
export function countWrapLines(
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
 * Thai-aware character / grapheme splitter for clean arc curves
 */
export function splitThaiGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter("th", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (s: any) => s.segment);
    } catch {
      // Fallback
    }
  }
  const clusters: string[] = [];
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    let cluster = chars[i];
    while (i + 1 < chars.length && /[\u0E31\u0E34-\u0E3E\u0E47-\u0E4E]/.test(chars[i + 1])) {
      cluster += chars[i + 1];
      i++;
    }
    clusters.push(cluster);
  }
  return clusters;
}

/**
 * Helper to convert hex string (#RRGGBB) to rgba string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
