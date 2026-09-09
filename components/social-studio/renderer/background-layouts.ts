import type { StudioLayout, PhotoFilter } from "../types";
import { loadImage, drawCoverImage } from "./canvas-utils";

/**
 * Draw Multi-Image Background Layout (Absolute Static Full-Canvas Background)
 */
export async function drawBackgroundLayout(
  ctx: CanvasRenderingContext2D,
  layout: StudioLayout,
  imageUrls: string[],
  width: number,
  height: number,
  gridLineWidth?: number,
  gridLineColor?: string,
  fitWithBlurredBackdrop?: boolean
): Promise<void> {
  const gap = gridLineWidth !== undefined ? gridLineWidth : 8;
  const bgColor = gridLineColor || "#000000";

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  const images = await Promise.all(
    imageUrls.map((url) => loadImage(url).catch(() => null))
  );
  const validImages = images.filter((img): img is HTMLImageElement => !!img);

  if (validImages.length === 0) return;

  const isFit = !!fitWithBlurredBackdrop;

  if (layout === "single" || validImages.length === 1) {
    drawCoverImage(ctx, validImages[0], 0, 0, width, height, 0, isFit);
  } else if (layout === "split_two") {
    const img1 = validImages[0];
    const img2 = validImages[1] || validImages[0];
    const splitH = (height - gap) / 2;

    drawCoverImage(ctx, img1, 0, 0, width, splitH, 0, isFit);
    drawCoverImage(ctx, img2, 0, splitH + gap, width, splitH, 0, isFit);
  } else if (layout === "hero_plus_two") {
    const img1 = validImages[0];
    const img2 = validImages[1] || validImages[0];
    const img3 = validImages[2] || validImages[0];

    const heroH = Math.round(height * 0.60);
    const subH = height - heroH - gap;
    const subW = (width - gap) / 2;

    drawCoverImage(ctx, img1, 0, 0, width, heroH, 0, isFit);
    drawCoverImage(ctx, img2, 0, heroH + gap, subW, subH, 0, isFit);
    drawCoverImage(ctx, img3, subW + gap, heroH + gap, subW, subH, 0, isFit);
  } else if (layout === "four_grid") {
    const img1 = validImages[0];
    const img2 = validImages[1] || validImages[0];
    const img3 = validImages[2] || validImages[0];
    const img4 = validImages[3] || validImages[1] || validImages[0];

    const rowH = (height - gap) / 2;
    const colW = (width - gap) / 2;

    drawCoverImage(ctx, img1, 0, 0, colW, rowH, 0, isFit);
    drawCoverImage(ctx, img2, colW + gap, 0, colW, rowH, 0, isFit);
    drawCoverImage(ctx, img3, 0, rowH + gap, colW, rowH, 0, isFit);
    drawCoverImage(ctx, img4, colW + gap, rowH + gap, colW, rowH, 0, isFit);
  } else if (layout === "five_grid") {
    const img1 = validImages[0];
    const img2 = validImages[1] || validImages[0];
    const img3 = validImages[2] || validImages[0];
    const img4 = validImages[3] || validImages[1] || validImages[0];
    const img5 = validImages[4] || validImages[2] || validImages[0];

    // 1 Big Hero on top + 4 photos in 2x2 grid below (as in reference image)
    const heroH = Math.round(height * 0.50);
    const bottomH = height - heroH - gap;
    const subH = (bottomH - gap) / 2;
    const subW = (width - gap) / 2;

    // Top Hero (Full Width)
    drawCoverImage(ctx, img1, 0, 0, width, heroH, 0, isFit);

    // Row 1 of 2x2 grid
    drawCoverImage(ctx, img2, 0, heroH + gap, subW, subH, 0, isFit);
    drawCoverImage(ctx, img3, subW + gap, heroH + gap, subW, subH, 0, isFit);

    // Row 2 of 2x2 grid
    drawCoverImage(ctx, img4, 0, heroH + gap + subH + gap, subW, subH, 0, isFit);
    drawCoverImage(ctx, img5, subW + gap, heroH + gap + subH + gap, subW, subH, 0, isFit);
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
    drawCoverImage(ctx, img1, 0, 0, colW, rowH, 0, isFit);
    drawCoverImage(ctx, img2, colW + gap, 0, colW, rowH, 0, isFit);
    // Row 2
    drawCoverImage(ctx, img3, 0, rowH + gap, colW, rowH, 0, isFit);
    drawCoverImage(ctx, img4, colW + gap, rowH + gap, colW, rowH, 0, isFit);
    // Row 3
    drawCoverImage(ctx, img5, 0, (rowH + gap) * 2, colW, rowH, 0, isFit);
    drawCoverImage(ctx, img6, colW + gap, (rowH + gap) * 2, colW, rowH, 0, isFit);
  }
}

/**
 * Apply Photo Filter (Canvas-based color grading)
 */
export function applyPhotoFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: PhotoFilter
): void {
  if (filter === "none" || !filter) return;

  ctx.save();
  if (filter === "bright") {
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255, 255, 240, 0.06)";
    ctx.fillRect(0, 0, width, height);
  } else if (filter === "dark_moody") {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(15, 25, 60, 0.25)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(30, 40, 80, 0.15)";
    ctx.fillRect(0, 0, width, height);
  } else if (filter === "warm_gold") {
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255, 200, 50, 0.05)";
    ctx.fillRect(0, 0, width, height);
  } else if (filter === "high_contrast") {
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(0, 0, width, height);
  } else if (filter === "bw") {
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
