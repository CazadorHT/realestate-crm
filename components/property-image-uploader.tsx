"use client";

import { useState, useCallback, useEffect } from "react";
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
} from "@/features/properties/actions";
import { toast } from "sonner";

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

interface ImageItem {
  id: string;
  storage_path: string;
  preview_url: string;
  is_cover: boolean;
  is_uploading?: boolean;
  file?: File; // For new uploads
}

interface PropertyImageUploaderProps {
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

export function PropertyImageUploader({
  value,
  onChange,
  initialImages = [],
  maxFiles = MAX_FILES,
  maxFileSizeMB = MAX_FILE_SIZE_MB,
  disabled = false,
  cleanupOnUnmount = true, // ค่าเริ่มต้น
}: PropertyImageUploaderProps) {
  // Initialize images from initialImages or value
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (initialImages.length > 0) {
      return initialImages.map((img, index) => ({
        id: `initial-${index}`,
        storage_path: img.storage_path,
        preview_url: img.image_url, // ใช้ public URL ที่มาจาก DB
        is_cover: img.is_cover ?? index === 0,
      }));
    }
    return value.map((path, index) => ({
      id: `value-${index}`,
      storage_path: path,
      preview_url: "", // ถ้าไม่มี initialImages จะไม่มี preview (ไม่น่าเกิด)
      is_cover: index === 0,
    }));
  });

  // Sync images state to parent (react-hook-form) via useEffect
  // เพื่อไม่ให้เกิด setState during render
  useEffect(() => {
    const paths = images
      .filter((img) => img.storage_path) // เอาแค่ที่อัปโหลดเสร็จแล้ว
      .map((img) => img.storage_path);
    onChange(paths);
  }, [images, onChange]);

  // 🔥 Cleanup ตอน component ถูก unmount
  useEffect(() => {
    return () => {
      if (!cleanupOnUnmount) {
        // ฟอร์ม submit สำเร็จแล้ว → ไม่ต้องลบ
        return;
      }

      const pathsToDelete = images
        .filter((img) => img.storage_path && !img.is_uploading)
        .map((img) => img.storage_path);

      if (pathsToDelete.length === 0) return;

      // fire-and-forget
      (async () => {
        try {
          for (const path of pathsToDelete) {
            await deletePropertyImageFromStorage(path);
          }
          console.log(
            "[PropertyImageUploader] cleaned up unused images:",
            pathsToDelete
          );
        } catch (error) {
          console.error("[PropertyImageUploader] cleanup error:", error);
        }
      })();
    };
    // ใช้ snapshot ล่าสุดของ images เมื่อ unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanupOnUnmount]);
  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;

      // Validate file count
      const remainingSlots = maxFiles - images.length;
      if (acceptedFiles.length > remainingSlots) {
        toast.error(`สามารถเพิ่มได้อีกสูงสุด ${remainingSlots} รูป`);
        acceptedFiles = acceptedFiles.slice(0, remainingSlots);
      }

      // 🔥 Step 1: Validate files (MIME type + magic bytes)
      const validatedFiles: File[] = [];
      for (const file of acceptedFiles) {
        // Basic size check
        if (file.size > maxFileSizeMB * 1024 * 1024) {
          toast.error(`${file.name} ใหญ่เกิน ${maxFileSizeMB}MB`);
          continue;
        }

        // Advanced validation (magic bytes + MIME check)
        const { validateImageFile } = await import("@/lib/file-validation");
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

      // 🔥 Step 2: Compress images
      toast.info("กำลังบีบอัดรูปภาพ...");
      const compressedFiles: File[] = [];

      for (let i = 0; i < validatedFiles.length; i++) {
        const file = validatedFiles[i];
        const { compressImage } = await import("@/lib/image-compression");

        try {
          const result = await compressImage(file);
          compressedFiles.push(result.compressedFile);

          if (result.compressionRatio > 10) {
            console.log(
              `📦 ${file.name}: ${result.compressionRatio.toFixed(1)}% smaller`
            );
          }
        } catch (error) {
          console.error(`Compression failed for ${file.name}:`, error);
          compressedFiles.push(file); // Use original if compression fails
        }
      }

      // 🔥 Step 3: Create preview items
      const newItems: ImageItem[] = compressedFiles.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        storage_path: "", // Will be set after upload
        preview_url: URL.createObjectURL(file), // blob URL ใช้กับ <img> ได้
        is_cover: images.length === 0 && index === 0,
        is_uploading: true,
        file,
      }));

      setImages((prev) => [...prev, ...newItems]);

      // Upload files
      for (const item of newItems) {
        try {
          const formData = new FormData();
          formData.append("file", item.file!);

          const result = await uploadPropertyImageAction(formData);

          // อัปเดต state ด้วย public URL (useEffect จะ sync ไป form เอง)
          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? {
                    ...img,
                    storage_path: result.path,
                    preview_url: result.publicUrl,
                    is_uploading: false,
                  }
                : img
            )
          );

          toast.success(`อัปโหลด ${item.file!.name} สำเร็จ`);
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`อัปโหลด ${item.file!.name} ล้มเหลว`);
          // Remove failed upload (useEffect จะ sync)
          setImages((prev) => prev.filter((img) => img.id !== item.id));
        }
      }
    },
    [disabled, images.length, maxFiles, maxFileSizeMB]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_IMAGE_TYPES,
    disabled,
    maxSize: MAX_FILE_SIZE_BYTES,
  });

  // Remove image
  const handleRemove = async (index: number) => {
    const imageToRemove = images[index];

    // Delete from storage if already uploaded
    if (imageToRemove.storage_path && !imageToRemove.is_uploading) {
      try {
        await deletePropertyImageFromStorage(imageToRemove.storage_path);
      } catch (error) {
        console.error("Failed to delete from storage:", error);
        toast.error("ลบรูปจาก storage ไม่สำเร็จ");
        return;
      }
    }

    // Revoke object URL if it's a blob
    if (imageToRemove.preview_url.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.preview_url);
    }

    const newImages = images.filter((_, i) => i !== index);

    // If removed image was cover, make first image the new cover
    if (imageToRemove.is_cover && newImages.length > 0) {
      newImages[0].is_cover = true;
    }

    setImages(newImages);
    toast.success("ลบรูปสำเร็จ");
  };

  // Set cover image
  const handleSetCover = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_cover: i === index,
    }));
    setImages(newImages);
    toast.success("ตั้งรูปปกสำเร็จ");
  };

  // Handle drag end
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
      {/* Upload Zone */}
      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
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

      {/* Images Grid with Drag & Drop */}
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
                              "border-primary ring-2 ring-primary/20"
                          )}
                        >
                          {/* Image */}
                          <div className="relative w-full h-full">
                            {image.preview_url && (
                              <img
                                src={image.preview_url}
                                alt={`Property image ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          {/* Uploading Overlay */}
                          {image.is_uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                          )}

                          {/* Cover Badge */}
                          {image.is_cover && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              รูปปก
                            </div>
                          )}

                          {/* Controls */}
                          {!image.is_uploading && (
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {/* Drag Handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="bg-white/90 hover:bg-white p-1.5 rounded cursor-move"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>

                                {/* Set Cover Button */}
                                <Button
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

                                {/* Remove Button */}
                                <Button
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

                          {/* Index Badge */}
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

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Upload className="mx-auto h-12 w-12 mb-2" />
          <p className="text-sm">ยังไม่มีรูปภาพ</p>
        </div>
      )}
    </div>
  );
}
