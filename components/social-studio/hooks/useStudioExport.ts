"use client";

import { useState } from "react";
import { toast } from "sonner";
import JSZip from "jszip";
import type { AspectRatio, SocialStudioProperty } from "../types";

export interface UseStudioExportProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  property: SocialStudioProperty;
  aspectRatio: AspectRatio;
  caption: string;
  hashtags: string[];
  propertyUrl: string;
  imageUrls: string[];
  isEn: boolean;
}

/**
 * Fetch image blob safely with CORS fallback
 */
async function fetchImageBlob(url: string): Promise<Blob | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) return await res.blob();
  } catch {
    // Fallback: draw through proxy/canvas if needed
  }
  return null;
}

export function useStudioExport({
  canvasRef,
  property,
  aspectRatio,
  caption,
  hashtags,
  propertyUrl,
  imageUrls,
  isEn,
}: UseStudioExportProps) {
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [selectedAlbumIndices, setSelectedAlbumIndices] = useState<number[]>([]);
  const [isExportingAlbum, setIsExportingAlbum] = useState<boolean>(false);
  const [isSharingAlbum, setIsSharingAlbum] = useState<boolean>(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState<boolean>(false);
  const [shareCoverImageUrl, setShareCoverImageUrl] = useState<string | null>(null);
  const [shareCoverFile, setShareCoverFile] = useState<File | null>(null);

  // Download Single Cover Banner
  const handleDownloadSingle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `vcc-poster-${property.slug || property.id}-${aspectRatio.replace(":", "x")}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
    toast.success(isEn ? "HD Poster downloaded successfully! 📥" : "ดาวน์โหลดภาพโปสเตอร์ HD เรียบร้อยแล้ว! 📥");
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopiedImage(true);
        toast.success(
          isEn
            ? "Image copied! Press Ctrl+V to paste directly into LINE or Facebook 📋"
            : "คัดลอกรูปภาพแล้ว! สามารถกด Ctrl+V วางใน LINE หรือ Facebook ได้ทันที 📋"
        );
        setTimeout(() => setCopiedImage(false), 2000);
      }, "image/png");
    } catch (err) {
      console.error("Failed to copy image to clipboard:", err);
      toast.error(
        isEn
          ? "Browser does not support direct image copying. Please use download button."
          : "เบราว์เซอร์ไม่รองรับการก๊อปปี้รูป ให้ใช้ปุ่มดาวน์โหลดแทนครับ"
      );
    }
  };

  // Copy Caption to Clipboard
  const handleCopyCaption = async () => {
    const fullCaptionText = isEn
      ? `${caption}\n\n${hashtags.join(" ")}\n\n👉 See more photos & details: ${propertyUrl}`
      : `${caption}\n\n${hashtags.join(" ")}\n\n👉 ดูรูปเพิ่มเติม & พิกัด: ${propertyUrl}`;
    await navigator.clipboard.writeText(fullCaptionText);
    setCopiedCaption(true);
    toast.success(isEn ? "Caption & hashtags copied! ✍️" : "คัดลอกแคปชั่น & แฮชแท็กเรียบร้อยแล้ว! ✍️");
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  // Album Selection Handlers
  const handleToggleAlbumImage = (idx: number) => {
    setSelectedAlbumIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAllAlbumImages = () => {
    if (selectedAlbumIndices.length === imageUrls.length) {
      setSelectedAlbumIndices([]);
    } else {
      setSelectedAlbumIndices(imageUrls.map((_, i) => i));
    }
  };

  // Download Album as ZIP
  const handleDownloadAlbumZip = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExportingAlbum(true);
    const toastId = toast.loading(
      isEn
        ? "Packing image set (cover + real photos) as ZIP file..."
        : "กำลังจัดชุดภาพ (ภาพปก + ภาพจริง) เป็นไฟล์ ZIP..."
    );

    try {
      const zip = new JSZip();

      // 1. Cover Banner
      const coverBlob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/png", 1.0)
      );
      if (coverBlob) {
        zip.file("01_cover_banner.png", coverBlob);
      }

      // 2. Selected Real Photos
      const targetIndices =
        selectedAlbumIndices.length > 0 ? selectedAlbumIndices : imageUrls.map((_, i) => i);

      for (let i = 0; i < targetIndices.length; i++) {
        const imgIdx = targetIndices[i];
        const url = imageUrls[imgIdx];
        if (!url) continue;

        try {
          const blob = await fetchImageBlob(url);
          if (blob) {
            const ext = url.toLowerCase().endsWith(".png") ? "png" : "jpg";
            const padIndex = String(i + 2).padStart(2, "0");
            zip.file(`${padIndex}_photo_${i + 1}.${ext}`, blob);
          }
        } catch (fetchErr) {
          console.warn("Failed to fetch image for zip:", url, fetchErr);
        }
      }

      // 3. Caption file
      const fullCaptionText = isEn
        ? `${caption}\n\n${hashtags.join(" ")}\n\n👉 More Information: ${propertyUrl}`
        : `${caption}\n\n${hashtags.join(" ")}\n\n👉 ดูข้อมูลเพิ่มเติม: ${propertyUrl}`;
      zip.file("caption_and_hashtags.txt", fullCaptionText);

      // Auto-copy caption
      await navigator.clipboard.writeText(fullCaptionText);

      // 4. Generate & Trigger Download
      const content = await zip.generateAsync({ type: "blob" });
      const downloadUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `vcc-album-${property.slug || property.id}.zip`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      toast.success(
        isEn
          ? `Downloaded album set (${targetIndices.length + 1} photos) & copied caption! 📦✨`
          : `ดาวน์โหลดชุดภาพอัลบั้ม (${targetIndices.length + 1} รูป) พร้อมคัดลอกแคปชั่นแล้ว! 📦✨`,
        { id: toastId }
      );
    } catch (err) {
      console.error("ZIP export error:", err);
      toast.error(isEn ? "Error creating ZIP file" : "เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP", { id: toastId });
    } finally {
      setIsExportingAlbum(false);
    }
  };

  // Share Album / Carousel Modal Trigger
  const handleShareAlbum = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSharingAlbum(true);
    const toastId = toast.loading(
      isEn ? "Preparing image set and share window..." : "กำลังเตรียมชุดภาพและหน้าต่างแชร์..."
    );

    try {
      const coverDataUrl = canvas.toDataURL("image/png", 1.0);
      setShareCoverImageUrl(coverDataUrl);

      const coverBlob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/png", 1.0)
      );

      if (coverBlob) {
        const file = new File(
          [coverBlob],
          `vcc-cover-${property.slug || property.id}.png`,
          { type: "image/png" }
        );
        setShareCoverFile(file);
      }

      setIsShareDialogOpen(true);
      toast.dismiss(toastId);
    } catch (err) {
      console.error("Share prep error:", err);
      toast.error(isEn ? "Error preparing share dialog" : "เกิดข้อผิดพลาดในการเตรียมหน้าต่างแชร์", { id: toastId });
    } finally {
      setIsSharingAlbum(false);
    }
  };

  return {
    copiedCaption,
    copiedImage,
    selectedAlbumIndices,
    setSelectedAlbumIndices,
    isExportingAlbum,
    isSharingAlbum,
    isShareDialogOpen,
    setIsShareDialogOpen,
    shareCoverImageUrl,
    shareCoverFile,
    handleDownloadSingle,
    handleCopyImage,
    handleCopyCaption,
    handleToggleAlbumImage,
    handleSelectAllAlbumImages,
    handleDownloadAlbumZip,
    handleShareAlbum,
  };
}
