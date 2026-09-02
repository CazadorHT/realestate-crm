import type { CalloutPointer } from "../types";
import { roundRect } from "./canvas-utils";

/**
 * Render Hand-drawn Style Callout Feature Pointers
 * Pointers with dots, smooth curved arrows, and chic text badges (Lemon8 / TikTok style)
 */
export function renderCalloutPointers(
  ctx: CanvasRenderingContext2D,
  pointers: CalloutPointer[] | undefined,
  width: number,
  height: number
): void {
  if (!pointers || pointers.length === 0) return;

  ctx.save();

  pointers.forEach((pointer) => {
    if (!pointer.text || !pointer.text.trim()) return;

    const targetX = Math.round((pointer.x / 100) * width);
    const targetY = Math.round((pointer.y / 100) * height);
    const text = pointer.text.trim();

    // Font measurement & scale
    const fontPx = pointer.fontSize || 22;
    const arrowScale = pointer.arrowScale || 1.0;

    ctx.font = `800 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
    const textW = ctx.measureText(text).width;
    const badgePadX = Math.round(22 * (fontPx / 22));
    const badgePadY = Math.round(10 * (fontPx / 22));
    const badgeW = Math.round(textW + badgePadX * 2);
    const badgeH = Math.round(fontPx * 1.2 + badgePadY * 2);
    const badgeR = Math.round(badgeH / 2);

    // Arrow Offset length scaled by arrowScale
    const arrowLenX = Math.round(64 * arrowScale);
    const arrowLenY = Math.round(48 * arrowScale);

    let badgeCenterX = targetX;
    let badgeCenterY = targetY;
    let arrowEndX = targetX;
    let arrowEndY = targetY;

    // Direction calculation
    switch (pointer.direction) {
      case "top_right":
        badgeCenterX = targetX + arrowLenX + badgeW / 2;
        badgeCenterY = targetY - arrowLenY;
        arrowEndX = badgeCenterX - badgeW / 2;
        arrowEndY = badgeCenterY;
        break;
      case "top_left":
        badgeCenterX = targetX - arrowLenX - badgeW / 2;
        badgeCenterY = targetY - arrowLenY;
        arrowEndX = badgeCenterX + badgeW / 2;
        arrowEndY = badgeCenterY;
        break;
      case "bottom_left":
        badgeCenterX = targetX - arrowLenX - badgeW / 2;
        badgeCenterY = targetY + arrowLenY;
        arrowEndX = badgeCenterX + badgeW / 2;
        arrowEndY = badgeCenterY;
        break;
      case "bottom_right":
      default:
        badgeCenterX = targetX + arrowLenX + badgeW / 2;
        badgeCenterY = targetY + arrowLenY;
        arrowEndX = badgeCenterX - badgeW / 2;
        arrowEndY = badgeCenterY;
        break;
    }

    // Keep badge inside canvas boundaries
    const margin = 24;
    badgeCenterX = Math.max(margin + badgeW / 2, Math.min(width - margin - badgeW / 2, badgeCenterX));
    badgeCenterY = Math.max(margin + badgeH / 2, Math.min(height - margin - badgeH / 2, badgeCenterY));

    const badgeX = badgeCenterX - badgeW / 2;
    const badgeY = badgeCenterY - badgeH / 2;

    // Theme Color Tokens
    let dotColor = "#FFE600";
    let arrowColor = "#FFE600";
    let badgeBg = "#FFE600";
    let badgeBorder = "#FFFFFF";
    let textColor = "#000000";
    let shadowColor = "rgba(0, 0, 0, 0.4)";

    if (pointer.style === "clean_white") {
      dotColor = "#FFFFFF";
      arrowColor = "#FFFFFF";
      badgeBg = "#FFFFFF";
      badgeBorder = "rgba(203, 213, 225, 0.9)";
      textColor = "#0F172A";
      shadowColor = "rgba(0, 0, 0, 0.25)";
    } else if (pointer.style === "neon_glow") {
      dotColor = "#00F2FE";
      arrowColor = "#00F2FE";
      badgeBg = "#00F2FE";
      badgeBorder = "#FFFFFF";
      textColor = "#0A0F1D";
      shadowColor = "rgba(0, 242, 254, 0.6)";
    } else if (pointer.style === "dark_luxury") {
      dotColor = "#F59E0B";
      arrowColor = "#F59E0B";
      badgeBg = "rgba(15, 23, 42, 0.92)";
      badgeBorder = "#F59E0B";
      textColor = "#FDE68A";
      shadowColor = "rgba(0, 0, 0, 0.6)";
    }

    // 1. Draw Target Pointer Dot (with ripple ring)
    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 10;

    const dotR = Math.round(4.5 * Math.max(0.75, Math.min(1.5, arrowScale)));
    const rippleR = Math.round(8 * Math.max(0.75, Math.min(1.5, arrowScale)));

    // Outer ripple ring
    ctx.beginPath();
    ctx.arc(targetX, targetY, rippleR, 0, Math.PI * 2);
    ctx.fillStyle = arrowColor;
    ctx.globalAlpha = 0.35;
    ctx.fill();

    // Solid inner core
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(targetX, targetY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = dotColor;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
    ctx.restore();

    // 2. Draw Curved Hand-drawn Arrow Line
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 8;
    ctx.lineWidth = Math.max(2, Math.round(3 * arrowScale));
    ctx.strokeStyle = arrowColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Quadratic curve control point
    const midX = (targetX + arrowEndX) / 2;
    const midY = (targetY + arrowEndY) / 2;
    const ctrlX = midX;
    const ctrlY = targetY; // curve towards horizontal

    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, targetX, targetY);
    ctx.stroke();

    // Arrow Head pointing to targetX, targetY
    const headAngle = Math.atan2(targetY - ctrlY, targetX - ctrlX);
    const headLen = Math.round(11 * Math.max(0.8, Math.min(1.6, arrowScale)));
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(
      targetX - headLen * Math.cos(headAngle - Math.PI / 6),
      targetY - headLen * Math.sin(headAngle - Math.PI / 6)
    );
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(
      targetX - headLen * Math.cos(headAngle + Math.PI / 6),
      targetY - headLen * Math.sin(headAngle + Math.PI / 6)
    );
    ctx.stroke();
    ctx.restore();

    // 3. Draw Pill Capsule Badge
    ctx.save();
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;

    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeR);
    ctx.fillStyle = badgeBg;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = badgeBorder;
    ctx.stroke();
    ctx.restore();

    // 4. Badge Text
    ctx.save();
    ctx.font = `800 ${fontPx}px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, badgeCenterX, badgeCenterY);
    ctx.restore();
  });

  ctx.restore();
}
