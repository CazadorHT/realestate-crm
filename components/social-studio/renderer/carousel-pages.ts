import type { BannerRenderOptions } from "../types";
import { getDimensions, loadImage, drawCoverImage, roundRect } from "./canvas-utils";
import { applyPhotoFilter } from "./background-layouts";

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

  try {
    const img = await loadImage(options.imageUrls[0] || "/hero-realestate.png");
    ctx.filter = "blur(30px)";
    drawCoverImage(ctx, img, -20, -20, width + 40, height + 40, 0);
    ctx.filter = "none";
  } catch {
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = "rgba(10, 15, 29, 0.75)";
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

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold 42px 'Prompt', 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  const lang = options.language || "th";
  const specsLabel = lang === "en" ? "Property Specs" : lang === "zh" ? "房产规格" : lang === "ru" ? "Характеристики" : "สเปกห้อง & จุดเด่น";
  ctx.fillText(specsLabel, centerX, curY);
  curY += 60;

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 100, curY);
  ctx.lineTo(centerX + 100, curY);
  ctx.stroke();
  curY += 40;

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
 * Render Location Page (Page 3 of Carousel)
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

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold 42px 'Prompt', 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  const locTitle = lang === "en" ? "📍 Location & Nearby" : "📍 ทำเลที่ตั้ง & สถานที่ใกล้เคียง";
  ctx.fillText(locTitle, centerX, curY);
  curY += 60;

  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerX - 120, curY);
  ctx.lineTo(centerX + 120, curY);
  ctx.stroke();
  curY += 50;

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

  if (options.agentName) {
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = `bold 36px 'Prompt', 'Noto Sans Thai', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(options.agentName, centerX, curY);
    curY += 50;
  }

  ctx.textAlign = "center";
  ctx.font = `500 22px 'Prompt', sans-serif`;
  ctx.fillStyle = primaryColor;
  ctx.fillText(options.companyName || "VCC ASSET", centerX, curY);
  curY += 50;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 100, curY);
  ctx.lineTo(centerX + 100, curY);
  ctx.stroke();
  curY += 40;

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

  ctx.textAlign = "center";
  ctx.font = `bold 28px 'Prompt', 'Noto Sans Thai', sans-serif`;
  ctx.fillStyle = primaryColor;
  const ctaText = lang === "en" ? "Contact us for more details!" : "ติดต่อสอบถามได้เลยค่ะ!";
  ctx.fillText(ctaText, centerX, height - pad - 30);
}
