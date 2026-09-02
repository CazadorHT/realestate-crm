import type { AspectRatio } from "../types";

/**
 * Returns standard dimensions based on aspect ratio
 */
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
export function loadImage(src: string): Promise<HTMLImageElement> {
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
 * Draw an image fitted into a bounding box with object-fit: cover
 */
export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 0
): void {
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
