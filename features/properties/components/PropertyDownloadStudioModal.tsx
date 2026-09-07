"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Loader2,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Sliders,
  Shield,
  Smartphone,
  Monitor,
  MessageSquare,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

export type ImageDownloadFormat = "jpg" | "png" | "webp" | "original";
export type ResolutionPreset = "original" | "social" | "chat";
export type WatermarkPosition = "bottom-right" | "bottom-left" | "center";

export interface PropertyImageItem {
  id?: string;
  url?: string;
  image_url?: string;
  storage_path?: string;
  is_cover?: boolean | null;
  sort_order?: number | null;
  caption?: string | null;
}

export interface PropertyDownloadStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: (string | PropertyImageItem)[];
  propertyId: string;
  propertyTitle?: string;
  propertyCode?: string;
  agentInfo?: {
    name?: string;
    phone?: string;
    line_id?: string;
    company_name?: string;
  };
}

/**
 * Normalizes input image items into a standard structure with full URLs.
 */
export function normalizeImageItems(
  rawList: (string | PropertyImageItem)[]
): { url: string; isCover: boolean; originalIndex: number }[] {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const result: { url: string; isCover: boolean; originalIndex: number }[] = [];

  (rawList || []).forEach((item, idx) => {
    let rawUrl = "";
    let isCover = false;

    if (typeof item === "string") {
      rawUrl = item;
      isCover = idx === 0;
    } else if (item && typeof item === "object") {
      rawUrl = item.url || item.image_url || item.storage_path || "";
      isCover = Boolean(item.is_cover || idx === 0);
    }

    if (!rawUrl) return;

    let fullUrl = rawUrl;
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      fullUrl = `${supabaseUrl}/storage/v1/object/public/${rawUrl}`;
    }

    result.push({
      url: fullUrl,
      isCover,
      originalIndex: idx + 1,
    });
  });

  return result;
}

/**
 * Calculates resized dimensions preserving aspect ratio up to maxEdge.
 */
export function calculateResizeDimensions(
  width: number,
  height: number,
  maxEdge?: number
): { width: number; height: number } {
  if (!maxEdge || (width <= maxEdge && height <= maxEdge)) {
    return { width, height };
  }

  if (width >= height) {
    const scale = maxEdge / width;
    return {
      width: Math.round(maxEdge),
      height: Math.round(height * scale),
    };
  } else {
    const scale = maxEdge / height;
    return {
      width: Math.round(width * scale),
      height: Math.round(maxEdge),
    };
  }
}

/**
 * Draws custom watermark overlay on the canvas.
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  text: string,
  position: WatermarkPosition
) {
  if (!text || !text.trim()) return;

  const fontSize = Math.max(14, Math.round(Math.min(canvasWidth, canvasHeight) * 0.032));
  ctx.save();
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.textBaseline = "middle";

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const paddingX = Math.round(fontSize * 0.8);
  const paddingY = Math.round(fontSize * 0.5);
  const boxWidth = textWidth + paddingX * 2;
  const boxHeight = fontSize + paddingY * 2;
  const margin = Math.round(fontSize * 0.9);

  let x = 0;
  let y = 0;

  if (position === "bottom-right") {
    x = canvasWidth - boxWidth - margin;
    y = canvasHeight - boxHeight - margin;
  } else if (position === "bottom-left") {
    x = margin;
    y = canvasHeight - boxHeight - margin;
  } else {
    // Center
    x = (canvasWidth - boxWidth) / 2;
    y = (canvasHeight - boxHeight) / 2;
  }

  // Draw semi-transparent pill backdrop
  ctx.fillStyle = "rgba(15, 23, 42, 0.65)"; // Dark Slate 900 with 65% opacity
  ctx.beginPath();
  const radius = Math.round(boxHeight * 0.25);
  ctx.roundRect ? ctx.roundRect(x, y, boxWidth, boxHeight, radius) : ctx.rect(x, y, boxWidth, boxHeight);
  ctx.fill();

  // Draw white text
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, x + paddingX, y + boxHeight / 2);
  ctx.restore();
}

/**
 * Converts, resizes, and applies watermark to an image blob client-side.
 */
export async function processImageBlob(
  blob: Blob,
  options: {
    targetFormat: ImageDownloadFormat;
    preset: ResolutionPreset;
    enableWatermark: boolean;
    watermarkText?: string;
    watermarkPosition: WatermarkPosition;
  }
): Promise<{ blob: Blob; ext: string }> {
  const { targetFormat, preset, enableWatermark, watermarkText, watermarkPosition } = options;

  // Max dimension per preset
  const maxEdgeMap: Record<ResolutionPreset, number | undefined> = {
    original: undefined,
    social: 1080,
    chat: 800,
  };
  const maxEdge = maxEdgeMap[preset];

  // If original format with no resize and no watermark, return directly
  if (targetFormat === "original" && !maxEdge && !enableWatermark) {
    let ext = "webp";
    if (blob.type.includes("jpeg") || blob.type.includes("jpg")) ext = "jpg";
    else if (blob.type.includes("png")) ext = "png";
    else if (blob.type.includes("webp")) ext = "webp";
    return { blob, ext };
  }

  const mimeTypeMap: Record<"jpg" | "png" | "webp", string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  const finalMime = targetFormat === "original" ? (blob.type || "image/jpeg") : mimeTypeMap[targetFormat];
  const finalExt = targetFormat === "original"
    ? (blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg")
    : targetFormat;

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    img.crossOrigin = "anonymous";

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;
        const { width, height } = calculateResizeDimensions(naturalW, naturalH, maxEdge);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve({ blob, ext: finalExt });
          return;
        }

        // Fill white background for JPEG
        if (finalMime === "image/jpeg" || targetFormat === "jpg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Watermark if enabled
        if (enableWatermark && watermarkText) {
          drawWatermark(ctx, width, height, watermarkText, watermarkPosition);
        }

        canvas.toBlob(
          (convertedBlob) => {
            if (convertedBlob) {
              resolve({ blob: convertedBlob, ext: finalExt });
            } else {
              resolve({ blob, ext: finalExt });
            }
          },
          finalMime,
          0.92
        );
      } catch (err) {
        console.warn("[ProcessImageBlob] Canvas processing failed, falling back to original:", err);
        resolve({ blob, ext: finalExt });
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      console.warn("[ProcessImageBlob] Image load failed, falling back to original:", err);
      resolve({ blob, ext: finalExt });
    };

    img.src = objectUrl;
  });
}

/**
 * Builds smart file name for each image.
 */
export function generateSmartFileName(
  propertyId: string,
  propertyTitle: string | undefined,
  index: number,
  isCover: boolean,
  useSmartNaming: boolean,
  ext: string
): string {
  const paddedIdx = String(index).padStart(2, "0");

  if (!useSmartNaming) {
    return `image_${paddedIdx}.${ext}`;
  }

  const cleanId = propertyId.slice(0, 8).toUpperCase();
  const cleanTitle = (propertyTitle || "Property")
    .replace(/[^a-zA-Z0-9ก-๙_-]/g, "_")
    .slice(0, 20);
  const coverTag = isCover ? "_COVER" : "";

  return `${cleanId}_${paddedIdx}${coverTag}_${cleanTitle}.${ext}`;
}

export function PropertyDownloadStudioModal({
  isOpen,
  onClose,
  images,
  propertyId,
  propertyTitle,
  propertyCode,
  agentInfo,
}: PropertyDownloadStudioModalProps) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const normalizedImages = useMemo(() => normalizeImageItems(images), [images]);

  // Selection state
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(
    () => new Set(normalizedImages.map((img) => img.url))
  );

  // Sync selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedUrls(new Set(normalizedImages.map((img) => img.url)));
    }
  }, [isOpen, normalizedImages]);

  // Options state
  const [format, setFormat] = useState<ImageDownloadFormat>("jpg");
  const [preset, setPreset] = useState<ResolutionPreset>("original");
  const [useSmartNaming, setUseSmartNaming] = useState<boolean>(true);

  // Watermark state
  const defaultWatermarkText = useMemo(() => {
    const parts: string[] = [];
    if (agentInfo?.company_name) parts.push(agentInfo.company_name);
    else parts.push("REAL ESTATE");

    if (agentInfo?.phone) parts.push(agentInfo.phone);
    if (propertyCode) parts.push(`REF: ${propertyCode}`);
    else parts.push(`ID: ${propertyId.slice(0, 8).toUpperCase()}`);

    return parts.join(" | ");
  }, [agentInfo, propertyCode, propertyId]);

  const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>(defaultWatermarkText);
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>("bottom-right");

  // Progress state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; stage?: string } | null>(null);

  // Toggle single image selection
  const toggleSelectImage = (url: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  // Quick Select Helpers
  const selectAll = () => setSelectedUrls(new Set(normalizedImages.map((img) => img.url)));
  const deselectAll = () => setSelectedUrls(new Set());
  const selectCoverOnly = () => {
    const coverUrls = normalizedImages.filter((img) => img.isCover).map((img) => img.url);
    setSelectedUrls(new Set(coverUrls.length ? coverUrls : [normalizedImages[0]?.url].filter(Boolean)));
  };

  // Main Batch Download Handler
  const handleStartDownload = async () => {
    const selectedList = normalizedImages.filter((img) => selectedUrls.has(img.url));

    if (selectedList.length === 0) {
      toast.error(isEn ? "Please select at least one image" : "กรุณาเลือกรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: selectedList.length, stage: isEn ? "Downloading & Processing" : "กำลังดาวน์โหลดและประมวลผล" });

    try {
      const zip = new JSZip();
      const folderName = `property_${propertyId.slice(0, 8)}`;
      const folder = zip.folder(folderName) || zip;

      let completed = 0;
      const BATCH_SIZE = 5;

      for (let i = 0; i < selectedList.length; i += BATCH_SIZE) {
        const batch = selectedList.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (item, batchIdx) => {
            const overallIdx = i + batchIdx + 1;
            try {
              const res = await fetch(item.url, { mode: "cors" });
              if (!res.ok) throw new Error(`HTTP error ${res.status}`);
              const rawBlob = await res.blob();

              // Process blob client-side
              const { blob: finalBlob, ext } = await processImageBlob(rawBlob, {
                targetFormat: format,
                preset,
                enableWatermark,
                watermarkText,
                watermarkPosition,
              });

              // Generate name
              const fileName = generateSmartFileName(
                propertyId,
                propertyTitle,
                overallIdx,
                item.isCover,
                useSmartNaming,
                ext
              );

              folder.file(fileName, finalBlob);
            } catch (err) {
              console.warn(`[DownloadStudio] Failed processing ${item.url}:`, err);
            } finally {
              completed++;
              setProgress({
                current: completed,
                total: selectedList.length,
                stage: isEn ? "Processing images" : "กำลังประมวลผลรูปภาพ",
              });
            }
          })
        );
      }

      setProgress({
        current: selectedList.length,
        total: selectedList.length,
        stage: isEn ? "Compressing ZIP file" : "กำลังบีบอัดไฟล์ ZIP",
      });

      const zipBlob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }
      );

      const cleanTitle = (propertyTitle || "property")
        .replace(/[^a-zA-Z0-9ก-๙_-]/g, "_")
        .slice(0, 25);
      const formatTag = format.toUpperCase();
      const zipFileName = `${propertyId.slice(0, 8)}_${cleanTitle}_${formatTag}_${selectedList.length}images.zip`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success(
        isEn
          ? `Downloaded ${selectedList.length} images successfully! 📥`
          : `ดาวน์โหลดรูปภาพที่เลือก (${selectedList.length} รูป) สำเร็จแล้ว! 📥`
      );
      onClose();
    } catch (err) {
      console.error("[DownloadStudio] Error:", err);
      toast.error(isEn ? "Failed to download images" : "เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ");
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-slate-200">
        {/* Header */}
        <DialogHeader className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{isEn ? "Media Download Studio" : "สตูดิโอดาวน์โหลดรูปภาพ"}</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[10px] font-bold">
                  Zero Egress
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isEn
                  ? "Select images, choose resolution presets, add custom watermarks, and export instantly."
                  : "เลือกรูปภาพที่ต้องการ, ปรับขนาดตามช่องทาง, ใส่ลายน้ำอัตโนมัติ และดาวน์โหลดในคลิกเดียว"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Selective Download Grid */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-600" />
                <Label className="text-xs font-bold text-slate-800">
                  {isEn ? "Select Images to Download" : "เลือกรูปภาพที่ต้องการดาวน์โหลด"}
                </Label>
                <Badge variant="outline" className="text-xs font-bold bg-white text-slate-700">
                  {selectedUrls.size} / {normalizedImages.length} {isEn ? "Selected" : "รูปที่เลือก"}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="h-7 px-2.5 text-[11px] font-bold text-blue-600 hover:bg-blue-50 cursor-pointer"
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  {isEn ? "Select All" : "เลือกทั้งหมด"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAll}
                  className="h-7 px-2.5 text-[11px] font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <Square className="h-3 w-3 mr-1" />
                  {isEn ? "Deselect" : "ล้างการเลือก"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectCoverOnly}
                  className="h-7 px-2.5 text-[11px] font-bold text-amber-600 hover:bg-amber-50 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {isEn ? "Cover Only" : "เฉพาะภาพปก"}
                </Button>
              </div>
            </div>

            {/* Thumbnails Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto p-2 bg-slate-50/70 border border-slate-200/80 rounded-xl">
              {normalizedImages.map((item, idx) => {
                const isSelected = selectedUrls.has(item.url);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelectImage(item.url)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200 group select-none",
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-400/30 shadow-xs"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={`Property Image ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Selection Badge */}
                    <div
                      className={cn(
                        "absolute top-1.5 right-1.5 h-5 w-5 rounded-md flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-black/40 text-transparent border border-white/60"
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>

                    {/* Cover Badge */}
                    {item.isCover && (
                      <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                        COVER
                      </span>
                    )}

                    {/* Order Number */}
                    <span className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-mono px-1 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Format & Resolution Presets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format Selection */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-blue-600" />
                {isEn ? "File Format" : "รูปแบบไฟล์ (Format)"}
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { key: "jpg", label: "JPG", desc: "Universal" },
                  { key: "png", label: "PNG", desc: "Lossless" },
                  { key: "webp", label: "WebP", desc: "Compact" },
                  { key: "original", label: "Original", desc: "As-is" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFormat(item.key as ImageDownloadFormat)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer",
                      format === item.key
                        ? "border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    )}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] opacity-70">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Presets */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 text-blue-600" />
                {isEn ? "Resolution & Optimization" : "ความละเอียดและการปรับขนาด"}
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  {
                    key: "original",
                    label: isEn ? "Full Size" : "ต้นฉบับ",
                    icon: Monitor,
                    desc: isEn ? "Original Max" : "ความละเอียดเต็ม",
                  },
                  {
                    key: "social",
                    label: "Social (1080p)",
                    icon: Smartphone,
                    desc: "FB / Instagram",
                  },
                  {
                    key: "chat",
                    label: "LINE (800p)",
                    icon: MessageSquare,
                    desc: isEn ? "Fast & Lite" : "ไฟล์เล็ก ส่งไว",
                  },
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setPreset(item.key as ResolutionPreset)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer",
                        preset === item.key
                          ? "border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-xs"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <IconComponent className="h-4 w-4 mb-1" />
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className="text-[10px] opacity-70">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Watermark Settings */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <Label htmlFor="wm-toggle" className="text-xs font-bold text-slate-800 cursor-pointer">
                  {isEn ? "Add Brand Watermark" : "ใส่ลายน้ำป้องกันการคัดลอก (Watermark)"}
                </Label>
              </div>
              <Switch
                id="wm-toggle"
                checked={enableWatermark}
                onCheckedChange={setEnableWatermark}
                className="cursor-pointer"
              />
            </div>

            {enableWatermark && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-500">
                    {isEn ? "Watermark Text" : "ข้อความลายน้ำ (ชื่อบริษัท / เบอร์โทร / รหัสทรัพย์)"}
                  </Label>
                  <Input
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="e.g. VC CONNECT | 081-xxx-xxxx | REF: CS102"
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-500">
                    {isEn ? "Position" : "ตำแหน่งลายน้ำ"}
                  </Label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { key: "bottom-right", label: isEn ? "Right" : "ขวาล่าง" },
                      { key: "bottom-left", label: isEn ? "Left" : "ซ้ายล่าง" },
                      { key: "center", label: isEn ? "Center" : "กึ่งกลาง" },
                    ].map((pos) => (
                      <button
                        key={pos.key}
                        type="button"
                        onClick={() => setWatermarkPosition(pos.key as WatermarkPosition)}
                        className={cn(
                          "h-9 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer",
                          watermarkPosition === pos.key
                            ? "border-amber-600 bg-amber-50 text-amber-800 font-bold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Smart Naming Toggle */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-600" />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {isEn ? "Smart File Naming" : "ตั้งชื่อไฟล์อย่างชาญฉลาด (Smart Naming)"}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {isEn ? "e.g. PROP1234_01_COVER_Condo.jpg" : "ตัวอย่าง: ID_01_COVER_ชื่อทรัพย์.jpg"}
                </p>
              </div>
            </div>
            <Switch
              checked={useSmartNaming}
              onCheckedChange={setUseSmartNaming}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Footer & Actions */}
        <DialogFooter className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 w-full sm:w-auto text-left">
            {isProcessing && progress ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="font-semibold text-blue-700">
                  {progress.stage} ({progress.current}/{progress.total})
                </span>
              </div>
            ) : (
              <span>
                {isEn ? "Ready to export" : "พร้อมดาวน์โหลด"}{" "}
                <strong className="text-slate-800">{selectedUrls.size}</strong>{" "}
                {isEn ? "images as ZIP" : "รูปภาพเป็นไฟล์ ZIP"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-xl h-10 px-4 text-xs font-bold cursor-pointer"
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>

            <Button
              type="button"
              variant="default"
              onClick={handleStartDownload}
              disabled={isProcessing || selectedUrls.size === 0}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 text-xs shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>{isEn ? "Generating ZIP..." : "กำลังสร้างไฟล์ ZIP..."}</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1.5" />
                  <span>
                    {isEn
                      ? `Download (${selectedUrls.size})`
                      : `ดาวน์โหลด (${selectedUrls.size} รูป)`}
                  </span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
