"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadSiteAssetAction } from "@/features/site-settings/actions";

interface SiteAssetUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  aspectRatio?: "square" | "video" | "auto";
  folder?: string;
  className?: string;
}

export function SiteAssetUploader({
  value,
  onChange,
  disabled = false,
  label,
  aspectRatio = "auto",
  folder = "branding",
  className,
}: SiteAssetUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/x-icon",
        "image/vnd.microsoft.icon",
      ];
      if (!validTypes.includes(file.type) && !file.name.endsWith(".ico")) {
        toast.error("รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP, ICO)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadSiteAssetAction(formData, folder);

        if (result.success && result.data?.publicUrl) {
          onChange(result.data.publicUrl);
          setPreview(result.data.publicUrl);
          toast.success("อัปโหลดสำเร็จ");
        } else {
          throw new Error(result.message || "Upload failed");
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("อัปโหลดไม่สำเร็จ");
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, folder, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".ico"] },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview("");
    onChange("");
  };

  return (
    <div className="space-y-2 w-full">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}

      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden group",
          isDragActive ? "border-blue-400 bg-blue-50/50" : "border-slate-200",
          !className && !isDragActive && "bg-slate-50/50 hover:bg-slate-100/50",
          disabled && "opacity-50 cursor-not-allowed",
          aspectRatio === "square"
            ? "aspect-square w-32"
            : "min-h-[120px] w-full",
          preview ? "border-solid" : "cursor-pointer",
          className,
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={preview}
              alt="Asset Preview"
              className={cn(
                "max-w-full max-h-[100px] object-contain transition-transform duration-300 group-hover:scale-105",
                aspectRatio === "square" && "aspect-square object-cover",
              )}
            />

            <div
              className={cn(
                "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2",
                aspectRatio === "square" && "flex-col",
              )}
            >
              <Button
                type="button"
                variant="secondary"
                size={aspectRatio === "square" ? "icon" : "sm"}
                className={cn(
                  "rounded-lg shadow-sm font-bold",
                  aspectRatio === "square" ? "h-8 w-8" : "h-8",
                )}
                disabled={disabled || isUploading}
                title="เปลี่ยนรูป"
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    aspectRatio !== "square" && "mr-1.5",
                  )}
                />
                {aspectRatio !== "square" && "เปลี่ยนรูป"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-lg shadow-sm"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                title="ลบรูป"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            ) : (
              <div className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
                <Upload className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-600">
                {isUploading
                  ? "กำลังอัปโหลด..."
                  : "คลิกหรือลากรูปมาวางเพื่ออัปโหลด"}
              </p>
              <p className="text-[10px] text-slate-400">
                JPG, PNG, WebP (สูงสุด 5MB)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
