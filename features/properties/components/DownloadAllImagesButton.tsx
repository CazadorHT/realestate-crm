"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";

export interface DownloadAllImagesButtonProps {
  images: (string | { url?: string; image_url?: string; storage_path?: string })[];
  propertyId: string;
  propertyTitle?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DownloadAllImagesButton({
  images,
  propertyId,
  propertyTitle,
  className,
  variant = "outline",
  size = "sm",
}: DownloadAllImagesButtonProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Normalize image URLs
  const imageUrls = React.useMemo(() => {
    const rawList = images || [];
    const urls: string[] = [];

    rawList.forEach((item) => {
      if (typeof item === "string") {
        urls.push(item);
      } else if (item && typeof item === "object") {
        const u = item.url || item.image_url || item.storage_path;
        if (u) urls.push(u);
      }
    });

    return urls.map((u) => {
      if (u.startsWith("http://") || u.startsWith("https://")) return u;
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/${u}`;
    });
  }, [images]);

  const handleDownloadAll = async () => {
    if (imageUrls.length === 0) {
      toast.error("ไม่มีรูปภาพในทรัพย์นี้ให้ดาวน์โหลด");
      return;
    }

    setIsDownloading(true);
    setProgress({ current: 0, total: imageUrls.length });

    try {
      const zip = new JSZip();
      const folderName = `property_${propertyId.slice(0, 8)}`;
      const folder = zip.folder(folderName) || zip;

      let completed = 0;

      // Fetch images in parallel with batching to avoid overwhelming network
      const BATCH_SIZE = 5;
      for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
        const batch = imageUrls.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (url, batchIdx) => {
            const overallIdx = i + batchIdx + 1;
            try {
              const res = await fetch(url, { mode: "cors" });
              if (!res.ok) throw new Error(`HTTP error ${res.status}`);
              const blob = await res.blob();

              // Determine extension
              let ext = "webp";
              if (blob.type.includes("jpeg") || blob.type.includes("jpg")) ext = "jpg";
              else if (blob.type.includes("png")) ext = "png";

              const paddedIdx = String(overallIdx).padStart(2, "0");
              const fileName = `image_${paddedIdx}.${ext}`;
              folder.file(fileName, blob);
            } catch (fetchErr) {
              console.warn(`[DownloadZip] Failed to fetch image ${url}:`, fetchErr);
            } finally {
              completed++;
              setProgress({ current: completed, total: imageUrls.length });
            }
          })
        );
      }

      // Generate Zip
      const zipBlob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
        (metadata) => {
          // Can track compression progress if needed
        }
      );

      // Trigger file download
      const cleanTitle = (propertyTitle || "property")
        .replace(/[^a-zA-Z0-9ก-๙_-]/g, "_")
        .slice(0, 30);
      const zipFileName = `${propertyId.slice(0, 8)}_${cleanTitle}_all_images.zip`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setIsSuccess(true);
      toast.success(`ดาวน์โหลดรูปทั้งหมด (${imageUrls.length} รูป) สำเร็จแล้ว! 📥`);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      console.error("[DownloadZip] Error generating zip:", err);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsDownloading(false);
      setProgress(null);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownloadAll}
      disabled={isDownloading || imageUrls.length === 0}
      className={cn(
        "rounded-full transition-all duration-200 font-bold text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer",
        className
      )}
      title={isEn ? "Download all property images as a .ZIP file" : "ดาวน์โหลดรูปภาพทั้งหมดของทรัพย์นี้เป็นไฟล์ .ZIP"}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          <span>
            {progress ? `${progress.current}/${progress.total}` : (isEn ? "Downloading..." : "กำลังดาวน์โหลด...")}
          </span>
        </>
      ) : isSuccess ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span>{isEn ? `Downloaded (${imageUrls.length})` : `โหลดสำเร็จ (${imageUrls.length})`}</span>
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5 text-blue-600" />
          <span>{isEn ? `Download All (${imageUrls.length})` : `โหลดรูปทั้งหมด (${imageUrls.length})`}</span>
        </>
      )}
    </Button>
  );
}
