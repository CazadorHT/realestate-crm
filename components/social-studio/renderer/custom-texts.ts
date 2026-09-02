import type { CustomTextItem } from "../types";
import { roundRect } from "./canvas-utils";

/**
 * Render Additional Custom Text Badges & Stickers
 * Allows user to place arbitrary custom text anywhere on the canvas banner.
 */
export function renderCustomTexts(
  ctx: CanvasRenderingContext2D,
  customTexts: CustomTextItem[] | undefined,
  width: number,
  height: number
): void {
  if (!customTexts || customTexts.length === 0) return;

  ctx.save();

  customTexts.forEach((item) => {
    const rawText = item.text?.trim();
    if (!rawText) return;

    const centerX = Math.round((item.x / 100) * width);
    const centerY = Math.round((item.y / 100) * height);
    const fontPx = item.fontSize || 30;
    const isBold = item.isBold !== false;

    ctx.font = `${isBold ? "800" : "600"} ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;

    const lines = rawText.split("\n");
    const padX = Math.round(20 * (fontPx / 28));
    const padY = Math.round(10 * (fontPx / 28));
    const lineHeight = Math.round(fontPx * 1.25);

    let maxLineW = 0;
    lines.forEach((line) => {
      const w = ctx.measureText(line).width;
      if (w > maxLineW) maxLineW = w;
    });

    const boxW = Math.round(maxLineW + padX * 2);
    const boxH = Math.round(lines.length * lineHeight + padY * 2);
    const boxX = Math.round(centerX - boxW / 2);
    const boxY = Math.round(centerY - boxH / 2);
    const boxR = item.borderRadius !== undefined ? item.borderRadius : Math.round(12 * (fontPx / 28));

    // 1. Draw Background Box if present
    const bgColor = item.bgColor || "rgba(15, 23, 42, 0.88)";
    if (bgColor !== "transparent") {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 4;
      roundRect(ctx, boxX, boxY, boxW, boxH, boxR);
      ctx.fillStyle = bgColor;
      ctx.fill();

      const borderW = item.borderWidth !== undefined ? item.borderWidth : 1.5;
      if (borderW > 0) {
        ctx.lineWidth = borderW;
        ctx.strokeStyle = item.borderColor || "#F59E0B";
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Text (Vertically & Horizontally centered)
    ctx.save();
    ctx.fillStyle = item.textColor || "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textStartY = centerY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, idx) => {
      const lineY = textStartY + idx * lineHeight;
      ctx.fillText(line, centerX, lineY);
    });
    ctx.restore();
  });

  ctx.restore();
}
