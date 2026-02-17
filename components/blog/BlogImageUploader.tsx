"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadBlogImageAction } from "@/features/blog/actions";
import imageCompression from "browser-image-compression";
import Cropper, { Area } from "react-easy-crop";
import getCroppedImg from "@/lib/utils/cropImage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

interface BlogImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function BlogImageUploader({
  value,
  onChange,
  disabled = false,
}: BlogImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");

  // Cropping State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      // Start cropping flow
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageToCrop(reader.result as string);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    },
    [disabled],
  );

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropDone = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setIsCropping(false);
    setIsUploading(true);

    try {
      // 1. Get cropped image
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Failed to crop image");

      // 2. Compress image
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        initialQuality: 0.85,
      };

      const compressedFile = await imageCompression(
        new File([croppedBlob], "cover.jpg", { type: "image/jpeg" }),
        options,
      );

      // 3. Upload
      const formData = new FormData();
      formData.append("file", compressedFile);

      const result = await uploadBlogImageAction(formData);

      if (result.success && result.data?.publicUrl) {
        onChange(result.data.publicUrl);
        setPreview(result.data.publicUrl);
        toast.success("Image uploaded successfully");
      } else {
        throw new Error(result.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to process image");
      setImageToCrop(null);
    } finally {
      setIsUploading(false);
      setImageToCrop(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    disabled: disabled || isUploading,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview("");
    onChange("");
  };

  return (
    <>
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors min-h-[200px] flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40",
          isDragActive && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          preview ? "border-solid p-0 overflow-hidden bg-background" : "",
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative w-full h-full min-h-[200px]">
            <img
              src={preview}
              alt="Cover"
              className="w-full h-full object-cover absolute inset-0"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  setImageToCrop(preview);
                  setIsCropping(true);
                }}
                disabled={disabled || isUploading}
              >
                Adjust
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 shadow-md"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            ) : (
              <div className="p-4 rounded-full bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isUploading ? "Uploading..." : "Click or drag to upload cover"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, WebP (Max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cropping Dialog - Moved outside Dropzone to prevent event bubbling */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent
          className="max-w-3xl h-[600px] flex flex-col p-0 overflow-hidden"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Adjust Image Composition</DialogTitle>
          </DialogHeader>

          <div className="flex-1 relative bg-slate-900">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-background flex flex-col gap-4">
            <div className="flex items-center gap-4 w-full">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(vals) => setZoom(vals[0])}
                className="flex-1"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCropping(false);
                  setImageToCrop(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCropDone}>Save & Upload</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
