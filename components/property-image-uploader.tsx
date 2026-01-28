// property-image-uploader.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { X, Upload, Star, StarOff, GripVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  uploadPropertyImageAction,
  deletePropertyImageFromStorage,
  cleanupUploadSessionAction,
} from "@/features/properties/actions";
import { toast } from "sonner";

interface ImageItem {
  id: string;
  storage_path: string;
  preview_url: string;
  is_cover: boolean;
  is_uploading?: boolean;
  file?: File; // For new uploads
  origin?: "initial" | "temp";
}

interface PropertyImageUploaderProps {
  sessionId: string;
  value: string[]; // storage paths จาก react-hook-form
  onChange: (paths: string[]) => void;
  initialImages?: {
    image_url: string;
    storage_path: string;
    is_cover?: boolean;
  }[];
  maxFiles?: number;
  maxFileSizeMB?: number;
  disabled?: boolean;
  cleanupOnUnmount?: boolean; // ถ้า true → ออกจากหน้านี้โดยไม่ submit ให้ลบรูปทิ้ง
}
export const IMAGE_UPLOAD_POLICY = {
  maxBytes: 40 * 1024 * 1024, // ปรับตรงนี้ครั้งเดียว
  maxFiles: 20,
  allowedMime: ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const,
  // allowedExt ให้ถือจาก file-validation เป็นหลัก
};

// ✅ ทำให้ไฟล์หลังบีบอัด “มีชื่อ+นามสกุลที่ถูกต้อง” เสมอ (กัน server reject เพราะชื่อไฟล์เป็น "blob")
function normalizeImageFileName(file: File, originalName?: string): File {
  const type = file.type || "image/webp";

  const extByType: Record<string, string> = {
    "image/jpg": "jpg",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const ext = extByType[type] ?? "webp";

  const baseFromOriginal = (originalName || file.name || "image")
    .trim()
    .replace(/\.[a-z0-9]+$/i, ""); // ตัด extension เดิม

  const safeBase = baseFromOriginal.replace(/[^\w\- ]+/g, "").trim() || "image";

  const outName = `${safeBase}.${ext}`;

  // ถ้าชื่อเดิมโอเคอยู่แล้ว และมี extension ที่ถูกต้อง ก็คืนตัวเดิม
  if (file.name?.trim() && /\.([a-z0-9]+)\s*$/i.test(file.name)) {
    const currentExt = file.name.trim().match(/\.([a-z0-9]+)\s*$/i)?.[1];
    if (currentExt && currentExt.toLowerCase() === ext) return file;
  }

  return new File([file], outName, { type, lastModified: Date.now() });
}

export function PropertyImageUploader({
  sessionId,
  value,
  onChange,
  initialImages = [],
  maxFiles = IMAGE_UPLOAD_POLICY.maxFiles,
  maxFileSizeMB = IMAGE_UPLOAD_POLICY.maxBytes / (1024 * 1024),
  disabled = false,
  cleanupOnUnmount = true,
}: PropertyImageUploaderProps) {
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (initialImages.length > 0) {
      return initialImages.map((img, index) => ({
        id: `initial-${index}`,
        storage_path: img.storage_path,
        preview_url: img.image_url,
        is_cover: img.is_cover ?? index === 0,
        origin: "initial",
      }));
    }

    // If no initialImages but value has paths, generate preview URLs
    if (value.length > 0) {
      const {
        getPublicImageUrl,
      } = require("@/features/properties/image-utils");
      return value.map((path, index) => ({
        id: `value-${index}`,
        storage_path: path,
        preview_url: getPublicImageUrl(path),
        is_cover: index === 0,
        origin: "temp" as const,
      }));
    }

    return [];
  });

  // keep latest snapshot for cleanup without triggering setState during render
  const imagesRef = useRef<ImageItem[]>(images);
  const prevValueRef = useRef<string[]>(value);
  const isUploadingRef = useRef(false);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // Sync value prop changes back to images state (e.g., when navigating steps)
  useEffect(() => {
    // Don't sync if we're in the middle of uploading
    if (isUploadingRef.current) {
      return;
    }

    // Only sync if value has actual paths
    if (value.length === 0) {
      if (images.length > 0 && !images.some((img) => img.is_uploading)) {
        // Value was cleared and no uploads in progress, clear images too
        setImages([]);
      }
      prevValueRef.current = value;
      return;
    }

    const currentPaths = images.map((img) => img.storage_path).filter(Boolean);
    const valuePaths = value.filter(Boolean);

    // Check if value is different from current images
    const hasChanged =
      valuePaths.length !== currentPaths.length ||
      valuePaths.some((path, idx) => path !== currentPaths[idx]);

    // Also check if different from previous value to avoid infinite loop
    const changedFromPrev =
      prevValueRef.current.length !== valuePaths.length ||
      prevValueRef.current.some((path, idx) => path !== valuePaths[idx]);

    if (!hasChanged || !changedFromPrev) {
      prevValueRef.current = valuePaths;
      return;
    }

    // Regenerate images from value with proper preview URLs
    const { getPublicImageUrl } = require("@/features/properties/image-utils");
    const syncedImages = valuePaths.map((path, index) => ({
      id: `synced-${Date.now()}-${index}`,
      storage_path: path,
      preview_url: getPublicImageUrl(path),
      is_cover: index === 0,
      origin: "temp" as const,
    }));

    prevValueRef.current = valuePaths;
    setImages(syncedImages);
  }, [value]); // Only depend on value, not images

  // Sync images state to parent (react-hook-form)
  useEffect(() => {
    const paths = imagesRef.current
      .filter((img) => img.storage_path)
      .map((img) => img.storage_path);
    onChange(paths);
  }, [images, onChange]);

  // Cleanup on unmount: revoke blob + clean temp session
  useEffect(() => {
    return () => {
      // revoke blob urls (กัน memory leak)
      for (const img of imagesRef.current) {
        if (img.preview_url?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(img.preview_url);
          } catch {}
        }
      }

      if (!cleanupOnUnmount) return;

      // ✅ ลบเฉพาะ TEMP ใน session นี้ (ปลอดภัยสุด)
      (async () => {
        try {
          await cleanupUploadSessionAction(sessionId);
        } catch (error) {
          console.error(
            "[PropertyImageUploader] cleanup session error:",
            error,
          );
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanupOnUnmount, sessionId]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;
      // Validate file count
      const remainingSlots = maxFiles - images.length;
      if (acceptedFiles.length > remainingSlots) {
        toast.error(`สามารถเพิ่มได้อีกสูงสุด ${remainingSlots} รูป`);
        acceptedFiles = acceptedFiles.slice(0, remainingSlots);
      }

      // Step 1: Validate files (magic bytes + MIME)
      const { validateImageFile } = await import("@/lib/file-validation");

      const validatedFiles: File[] = [];
      for (const file of acceptedFiles) {
        if (file.size > maxFileSizeMB * 1024 * 1024) {
          toast.error(`${file.name} ใหญ่เกิน ${maxFileSizeMB}MB`);
          continue;
        }

        const validation = await validateImageFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
          continue;
        }

        validatedFiles.push(file);
      }

      if (validatedFiles.length === 0) {
        toast.error("ไม่มีไฟล์ที่ผ่านการตรวจสอบ");
        return;
      }

      // Step 2: Compress images
      const { compressImage } = await import("@/lib/image-compression");

      let didShowCompressToast = false;
      const compressedFiles: File[] = [];

      for (const file of validatedFiles) {
        try {
          if (!didShowCompressToast && file.size > 1.5 * 1024 * 1024) {
            didShowCompressToast = true;
            toast.info("กำลังบีบอัดรูปภาพ...");
          }

          const result = await compressImage(file);

          // ✅ สำคัญ: normalize ชื่อไฟล์หลังบีบอัด ให้ไม่กลายเป็น "blob" ไม่มี extension
          const normalized = normalizeImageFileName(
            result.compressedFile,
            file.name,
          );

          compressedFiles.push(normalized);
        } catch (error) {
          console.error(`Compression failed for ${file.name}:`, error);
          // fallback: ใช้ไฟล์เดิม (ชื่อถูกแน่นอน)
          compressedFiles.push(file);
        }
      }

      // Step 3: Create preview items
      isUploadingRef.current = true; // Mark as uploading

      const newItems: ImageItem[] = compressedFiles.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        storage_path: "",
        preview_url: URL.createObjectURL(file),
        is_cover: images.length === 0 && index === 0,
        is_uploading: true,
        file,
        origin: "temp",
      }));

      setImages((prev) => [...prev, ...newItems]);

      // Step 4: Upload files (sequential)
      for (const item of newItems) {
        try {
          const formData = new FormData();
          formData.append("file", item.file!);
          formData.append("sessionId", sessionId);

          const result = await uploadPropertyImageAction(formData);

          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? {
                    ...img,
                    storage_path: result.path,
                    preview_url: result.publicUrl,
                    is_uploading: false,
                  }
                : img,
            ),
          );

          toast.success(`อัปโหลด ${item.file!.name} สำเร็จ`);
        } catch (error) {
          console.error("Upload error:", error);
          const msg = error instanceof Error ? error.message : "อัปโหลดล้มเหลว";
          toast.error(`${item.file!.name}: ${msg}`);

          // revoke preview blob before removing
          if (item.preview_url?.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(item.preview_url);
            } catch {}
          }

          setImages((prev) => prev.filter((img) => img.id !== item.id));
        }
      }

      // Mark upload as complete
      isUploadingRef.current = false;
    },
    [disabled, images.length, maxFiles, maxFileSizeMB, sessionId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // ✅ รับรูปทั้งหมดก่อน แล้วคุมเข้มด้วย validateImageFile (กันเคสชื่อไฟล์เพี้ยน)
    accept: { "image/*": [] },
    disabled,
    maxSize: maxFileSizeMB * 1024 * 1024,
    maxFiles,
  });

  const handleRemove = async (index: number) => {
    const imageToRemove = images[index];

    // 1. Optimistic Update: Update UI Immediately
    const newImages = images.filter((_, i) => i !== index);

    // If we removed the cover image, set the first available image as cover
    if (imageToRemove.is_cover && newImages.length > 0) {
      newImages[0].is_cover = true;
    }

    setImages(newImages);
    toast.success("ลบรูปสำเร็จ"); // Show success immediately

    // 2. Cleanup Resources (Blob URLs)
    if (imageToRemove.preview_url.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.preview_url);
    }

    // 3. Background Action: Delete from storage if it's a temp file
    // We don't await this to block the UI
    if (
      imageToRemove.origin === "temp" &&
      imageToRemove.storage_path &&
      !imageToRemove.is_uploading
    ) {
      deletePropertyImageFromStorage(imageToRemove.storage_path).catch(
        (error) => {
          console.error("Failed to delete from storage:", error);
          // We silently fail here or just log, because strictly speaking the user doesn't need to know
          // that the background cleanup failed, as long as it's gone from their form.
        },
      );
    }
  };

  const handleSetCover = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_cover: i === index,
    }));
    setImages(newImages);
    toast.success("ตั้งรูปปกสำเร็จ");
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setImages(items);
    toast.success("จัดเรียงรูปสำเร็จ");
  };

  return (
    <div className="space-y-4">
      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {isDragActive
              ? "วางไฟล์ที่นี่..."
              : "ลากไฟล์มาวางหรือคลิกเพื่อเลือกรูป"}
          </p>
          <p className="text-xs text-muted-foreground">
            รองรับ JPG, PNG, WebP • ไม่เกิน {maxFileSizeMB}MB ต่อรูป • สูงสุด{" "}
            {maxFiles} รูป
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              รูปภาพทั้งหมด ({images.length}/{maxFiles})
            </p>
            <p className="text-xs text-muted-foreground">
              ลากเพื่อจัดเรียง • ⭐ = รูปปก
            </p>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="images" direction="horizontal">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  {images.map((image, index) => (
                    <Draggable
                      key={image.id}
                      draggableId={image.id}
                      index={index}
                      isDragDisabled={disabled || image.is_uploading}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "relative group aspect-square bg-muted rounded-lg overflow-hidden border-2",
                            snapshot.isDragging && "border-primary shadow-lg",
                            image.is_cover &&
                              "border-primary ring-2 ring-primary/20",
                          )}
                        >
                          <div className="relative w-full h-full">
                            {image.preview_url && (
                              <img
                                src={image.preview_url}
                                alt={`Property image ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          {image.is_uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                          )}

                          {image.is_cover && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              รูปปก
                            </div>
                          )}

                          {!image.is_uploading && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="bg-white/90 hover:bg-white p-1.5 rounded cursor-move"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7 bg-white/90 hover:bg-white"
                                  onClick={() => handleSetCover(index)}
                                  disabled={image.is_cover}
                                >
                                  {image.is_cover ? (
                                    <Star className="h-4 w-4 fill-primary text-primary" />
                                  ) : (
                                    <StarOff className="h-4 w-4" />
                                  )}
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="h-7 w-7"
                                  onClick={() => handleRemove(index)}
                                  disabled={disabled}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            #{index + 1}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Upload className="mx-auto h-12 w-12 mb-2" />
          <p className="text-sm">ยังไม่มีรูปภาพ</p>
        </div>
      )}
    </div>
  );
}
