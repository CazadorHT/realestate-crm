"use client";

import * as React from "react";
import Image from "next/image";
import { 
  Plus, 
  X, 
  Image as ImageIcon, 
  Upload, 
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useImageUpload } from "@/features/services/hooks/useImageUpload";
import { ServiceImageCropper } from "@/features/services/components/ServiceImageCropper";
import { Area } from "react-easy-crop";

interface ServiceImageUploaderProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  mode?: "single" | "gallery";
  aspectRatio?: number;
  maxCount?: number;
}

export function ServiceImageUploader({
  value,
  onChange,
  disabled = false,
  mode = "single",
  aspectRatio = 16 / 9,
  maxCount = 1,
}: ServiceImageUploaderProps) {
  const {
    isUploading,
    uploadProgress,
    imageToCrop,
    setImageToCrop,
    crop,
    setCrop,
    zoom,
    setZoom,
    onCropComplete,
    handleSingleUpload,
    handleGalleryUpload,
    handleCropSave,
  } = useImageUpload({ mode, onChange, value });

  const inputRef = React.useRef<HTMLInputElement>(null);
  const isGallery = mode === "gallery";

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isGallery) {
      handleGalleryUpload(Array.from(files));
    } else {
      handleSingleUpload(files[0]);
    }
  };

  const removeImage = (url: string) => {
    if (isGallery) {
      const current = Array.isArray(value) ? value : [];
      onChange(current.filter((i) => i !== url));
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden Input */}
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/*"
        multiple={isGallery}
        onChange={onFileChange}
        disabled={disabled || isUploading}
      />

      {/* Grid Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Gallery Items */}
        {isGallery && Array.isArray(value) && value.map((url, idx) => (
          <div key={url} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
            <div className="relative w-full h-full">
              <Image
                src={url}
                alt={`รูปภาพแกลเลอรี ${idx + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => removeImage(url)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {/* Single Item (Cover) */}
        {!isGallery && typeof value === 'string' && value && (
          <div className="relative aspect-video col-span-2 md:col-span-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group">
             <div className="relative w-full h-full">
               <Image
                 src={value}
                 alt="รูปภาพหน้าปก"
                 fill
                 className="object-cover"
                 sizes="(max-width: 1024px) 100vw, 50vw"
               />
             </div>
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-xl h-8 text-xs font-bold"
                onClick={() => setImageToCrop(value)}
              >
                <Edit className="w-4 h-4 mr-2" />
                แก้ไขรูปภาพ
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => removeImage(value)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload Trigger Button */}
        {((isGallery && (!Array.isArray(value) || value.length < maxCount)) || (!isGallery && !value)) && (
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed transition-all",
              "hover:border-indigo-400 hover:bg-indigo-50/30 group",
              isGallery ? "aspect-square" : "aspect-video col-span-2 md:col-span-3",
              isUploading ? "bg-slate-50 border-slate-200" : "bg-white border-slate-300"
            )}
          >
            {isUploading ? (
              <div className="w-full px-6 space-y-3">
                <div className="flex items-center justify-center animate-bounce">
                   <Upload className="h-6 w-6 text-indigo-500" />
                </div>
                <Progress value={45} className="h-1.5" />
                <p className="text-[10px] text-slate-400 font-bold uppercase text-center">
                   กำลังอัปโหลด...
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all">
                  <Upload className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-600">
                    อัปโหลดรูปภาพ
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-tighter mt-0.5">
                    รองรับ JPG, PNG (ไม่เกิน 2MB)
                  </p>
                </div>
              </>
            )}
          </button>
        )}
      </div>

      <ServiceImageCropper 
         open={!!imageToCrop}
         onOpenChange={(open) => !open && setImageToCrop(null)}
         image={imageToCrop}
         crop={crop}
         onCropChange={setCrop}
         zoom={zoom}
         onZoomChange={setZoom}
         aspectRatio={aspectRatio}
         onCropComplete={onCropComplete}
         onSave={handleCropSave}
         onCancel={() => setImageToCrop(null)}
      />
    </div>
  );
}
