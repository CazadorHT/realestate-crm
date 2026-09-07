"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PropertyDownloadStudioModal,
  PropertyImageItem,
  processImageBlob,
  generateSmartFileName,
  normalizeImageItems,
} from "./PropertyDownloadStudioModal";

export type ImageDownloadFormat = "jpg" | "png" | "webp" | "original";

export interface DownloadAllImagesButtonProps {
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
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadAllImagesButton({
  images,
  propertyId,
  propertyTitle,
  propertyCode,
  agentInfo,
  className,
  variant = "outline",
  size = "sm",
}: DownloadAllImagesButtonProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [activeFormat, setActiveFormat] = useState<ImageDownloadFormat>("jpg");
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const normalizedImages = React.useMemo(() => normalizeImageItems(images), [images]);

  const handleDownloadAll = async (format: ImageDownloadFormat) => {
    if (normalizedImages.length === 0) {
      toast.error(isEn ? "No images found for this property" : "ไม่มีรูปภาพในทรัพย์นี้ให้ดาวน์โหลด");
      return;
    }

    setIsDownloading(true);
    setActiveFormat(format);
    setProgress({ current: 0, total: normalizedImages.length });

    try {
      const zip = new JSZip();
      const folderName = `property_${propertyId.slice(0, 8)}`;
      const folder = zip.folder(folderName) || zip;

      let completed = 0;

      // Fetch and convert images in parallel with batching
      const BATCH_SIZE = 5;
      for (let i = 0; i < normalizedImages.length; i += BATCH_SIZE) {
        const batch = normalizedImages.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (item, batchIdx) => {
            const overallIdx = i + batchIdx + 1;
            try {
              const res = await fetch(item.url, { mode: "cors" });
              if (!res.ok) throw new Error(`HTTP error ${res.status}`);
              const rawBlob = await res.blob();

              // Convert to chosen format with original size & no watermark for quick download
              const { blob: finalBlob, ext } = await processImageBlob(rawBlob, {
                targetFormat: format,
                preset: "original",
                enableWatermark: false,
                watermarkPosition: "bottom-right",
              });

              const fileName = generateSmartFileName(
                propertyId,
                propertyTitle,
                overallIdx,
                item.isCover,
                true,
                ext
              );
              folder.file(fileName, finalBlob);
            } catch (fetchErr) {
              console.warn(`[DownloadZip] Failed to process image ${item.url}:`, fetchErr);
            } finally {
              completed++;
              setProgress({ current: completed, total: normalizedImages.length });
            }
          })
        );
      }

      // Generate Zip
      const zipBlob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } }
      );

      // Trigger file download
      const cleanTitle = (propertyTitle || "property")
        .replace(/[^a-zA-Z0-9ก-๙_-]/g, "_")
        .slice(0, 30);
      const formatTag = format.toUpperCase();
      const zipFileName = `${propertyId.slice(0, 8)}_${cleanTitle}_${formatTag}_all_images.zip`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setIsSuccess(true);
      const formatLabel = format === "original" ? (isEn ? "Original" : "ต้นฉบับ") : format.toUpperCase();
      toast.success(
        isEn
          ? `Downloaded all images (${normalizedImages.length} files as ${formatLabel}) successfully! 📥`
          : `ดาวน์โหลดรูปทั้งหมด (${normalizedImages.length} รูป ในรูปแบบ ${formatLabel}) สำเร็จแล้ว! 📥`
      );
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error("[DownloadZip] Error generating zip:", err);
      toast.error(isEn ? "Failed to download images. Please try again." : "เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsDownloading(false);
      setProgress(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isDownloading || normalizedImages.length === 0}
            className={cn(
              "rounded-full transition-all duration-200 font-bold text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer",
              className
            )}
            title={isEn ? "Choose format to download all property images" : "เลือกรูปแบบไฟล์เพื่อดาวน์โหลดรูปภาพทั้งหมด"}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                <span>
                  {progress
                    ? `${progress.current}/${progress.total} (${activeFormat.toUpperCase()})`
                    : isEn
                    ? "Downloading..."
                    : "กำลังดาวน์โหลด..."}
                </span>
              </>
            ) : isSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>{isEn ? `Downloaded (${normalizedImages.length})` : `โหลดสำเร็จ (${normalizedImages.length})`}</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-blue-600" />
                <span>{isEn ? `Download (${normalizedImages.length})` : `โหลดรูป (${normalizedImages.length})`}</span>
                <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-xl border-slate-100 bg-white z-50">
          <DropdownMenuItem
            onClick={() => setIsStudioOpen(true)}
            className="rounded-xl gap-2.5 py-2.5 px-2.5 font-medium cursor-pointer bg-blue-50/80 hover:bg-blue-100/80 text-blue-900 transition-colors border border-blue-100 mb-1"
          >
            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-600 text-white font-bold text-[11px] shadow-xs">
              ✨
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-blue-900">
                {isEn ? "Custom Studio (Watermark / Resize)..." : "สตูดิโอปรับแต่ง (ใส่ลายน้ำ / ย่อขนาด)..."}
              </span>
              <span className="text-[10px] text-blue-600">
                {isEn ? "Select photos, resize & watermark" : "เลือกรูป, ใส่ลายน้ำ, ปรับขนาด"}
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-100 my-1" />

          <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            {isEn ? "Quick 1-Click Download" : "ดาวน์โหลดด่วน (Quick Download)"}
          </DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() => handleDownloadAll("jpg")}
            className="rounded-xl gap-2.5 py-2 px-2.5 font-medium cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-amber-50 text-amber-700 font-bold text-[10px]">
              JPG
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800">JPG (.jpg)</span>
              <span className="text-[10px] text-slate-400">
                {isEn ? "Standard & compatible with all apps" : "เข้ากันได้กับทุกโปรแกรมและโซเชียล"}
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleDownloadAll("png")}
            className="rounded-xl gap-2.5 py-2 px-2.5 font-medium cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-50 text-blue-700 font-bold text-[10px]">
              PNG
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800">PNG (.png)</span>
              <span className="text-[10px] text-slate-400">
                {isEn ? "High quality, lossless clarity" : "คุณภาพสูง ภาพคมชัด"}
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleDownloadAll("webp")}
            className="rounded-xl gap-2.5 py-2 px-2.5 font-medium cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px]">
              WEBP
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800">WebP (.webp)</span>
              <span className="text-[10px] text-slate-400">
                {isEn ? "Compact file size, fast web loading" : "ขนาดไฟล์เล็ก โหลดเร็วพิเศษ"}
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-100 my-1" />

          <DropdownMenuItem
            onClick={() => handleDownloadAll("original")}
            className="rounded-xl gap-2.5 py-2 px-2.5 font-medium cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px]">
              ORIG
            </span>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800">
                {isEn ? "Original format" : "ไฟล์ต้นฉบับ (Original)"}
              </span>
              <span className="text-[10px] text-slate-400">
                {isEn ? "Keep original uploaded formats" : "ตามชนิดไฟล์ดั้งเดิมที่อัปโหลด"}
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full Studio Modal */}
      {isStudioOpen && (
        <PropertyDownloadStudioModal
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          images={images}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          propertyCode={propertyCode}
          agentInfo={agentInfo}
        />
      )}
    </>
  );
}
