"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Upload, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  uploadPropertyImageAction,
  deletePropertyImageFromStorage,
  cleanupUploadSessionAction,
} from "@/features/properties/actions";
import { toast } from "sonner";
import { ImageItem, PropertyImageUploaderProps } from "./types";
import { IMAGE_UPLOAD_POLICY } from "./constants";
import { normalizeImageFileName } from "./utils";
import { SortableImageItem } from "./SortableImageItem";

export function PropertyImageUploader({
  sessionId,
  value = [],
  onChange,
  initialImages = [],
  maxFiles = IMAGE_UPLOAD_POLICY.maxFiles,
  maxFileSizeMB = IMAGE_UPLOAD_POLICY.maxBytes / (1024 * 1024),
  disabled = false,
  cleanupOnUnmount = true,
}: PropertyImageUploaderProps) {
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (initialImages && initialImages.length > 0) {
      return initialImages.map((img, index) => ({
        id: `initial-${index}`,
        storage_path: img.storage_path,
        preview_url: img.image_url,
        is_cover: img.is_cover ?? index === 0,
        origin: "initial",
      }));
    }

    // If no initialImages but value has paths, generate preview URLs
    if (value && value.length > 0) {
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

    const currentPaths = images.map((img) => img.storage_path).filter(Boolean);
    const valuePaths = value ? value.filter(Boolean) : [];

    // Only sync if value has actual paths
    if (valuePaths.length === 0) {
      // FIX: Don't clear local images just because value is empty,
      // as this causes issues during re-renders or form resets/initialization
      /* if (images.length > 0 && !images.some((img) => img.is_uploading)) {
        setImages([]);
      } */
      prevValueRef.current = valuePaths;
      return;
    }

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
    try {
      const {
        getPublicImageUrl,
      } = require("@/features/properties/image-utils");
      const syncedImages = valuePaths.map((path, index) => ({
        id: `synced-${Date.now()}-${index}`,
        storage_path: path,
        preview_url: getPublicImageUrl(path),
        is_cover: index === 0,
        origin: "temp" as const,
      }));

      prevValueRef.current = valuePaths;
      setImages(syncedImages);
    } catch (err) {
      console.error("Image sync error:", err);
    }
  }, [value]); // Only depend on value, not images

  // Sync images state to parent (react-hook-form)
  useEffect(() => {
    const paths = images
      .filter((img) => img.storage_path)
      .map((img) => img.storage_path);
    if (onChange) onChange(paths);
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

  const handleRemove = async (imageId: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId);
      if (!imageToRemove) return prev;

      const newImages = prev.filter((img) => img.id !== imageId);

      // If we removed the cover image, set the first available image as cover
      if (imageToRemove.is_cover && newImages.length > 0) {
        newImages[0] = { ...newImages[0], is_cover: true };
      }

      // SIDE EFFECT: Background cleanup (can't await in functional update, but can trigger)
      if (
        imageToRemove.origin === "temp" &&
        imageToRemove.storage_path &&
        !imageToRemove.is_uploading
      ) {
        deletePropertyImageFromStorage(imageToRemove.storage_path).catch(
          (error) => {
            console.error("Failed to delete from storage:", error);
          },
        );
      }

      if (imageToRemove.preview_url.startsWith("blob:")) {
        URL.revokeObjectURL(imageToRemove.preview_url);
      }

      return newImages;
    });

    toast.success("ลบรูปสำเร็จ");
  };

  const handleSetCover = (imageId: string) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        is_cover: img.id === imageId,
      })),
    );
    toast.success("ตั้งรูปปกสำเร็จ");
  };

  // @dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum 5px drag before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setImages((prev) => {
        const oldIndex = prev.findIndex((img) => img.id === active.id);
        const newIndex = prev.findIndex((img) => img.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return prev;

        const newImages = arrayMove(prev, oldIndex, newIndex);
        return newImages;
      });
      toast.success("จัดเรียงรูปสำเร็จ");
    }
  };

  const activeImage = activeId
    ? images.find((img) => img.id === activeId)
    : null;

  return (
    <div className="space-y-4">
      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 sm:p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
          <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 font-medium">
            {isDragActive
              ? "วางไฟล์ที่นี่..."
              : "ลากไฟล์มาวางหรือคลิกเพื่อเลือกรูป"}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400">
            รองรับ JPG, PNG, WebP • ไม่เกิน {maxFileSizeMB}MB ต่อรูป • สูงสุด{" "}
            {maxFiles} รูป
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs sm:text-sm font-semibold text-slate-800">
              รูปภาพทั้งหมด ({images.length}/{maxFiles})
            </p>
            <p className="hidden sm:block text-[10px] sm:text-xs text-slate-500 italic">
              ลากเพื่อจัดเรียง • ⭐ = รูปปก
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {images.map((image, index) => (
                  <SortableImageItem
                    key={image.id}
                    image={image}
                    index={index}
                    disabled={disabled}
                    onSetCover={handleSetCover}
                    onRemove={handleRemove}
                    setImages={setImages}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Drag Overlay - Shows a preview while dragging */}
            <DragOverlay adjustScale>
              {activeImage ? (
                <div className="aspect-square bg-white rounded-lg overflow-hidden border-2 border-primary shadow-2xl opacity-90 scale-105 transition-transform">
                  {activeImage.preview_url ? (
                    <img
                      src={activeImage.preview_url}
                      alt="Dragging"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100">
                      <ImageIcon className="h-8 w-8 text-slate-300" />
                    </div>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-10 sm:py-12 text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          <ImageIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-2 opacity-20" />
          <p className="text-xs sm:text-sm font-medium">ยังไม่มีรูปภาพ</p>
        </div>
      )}
    </div>
  );
}
