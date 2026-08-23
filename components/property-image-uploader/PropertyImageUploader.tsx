"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import { Upload, Image as ImageIcon, Loader2, Trash2, ArrowUpWideNarrow, ArrowDownWideNarrow } from "lucide-react";
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
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info } from "lucide-react";
import { startProcess, finishProcess } from "@/lib/process-monitor";
import { getPublicImageUrl } from "@/features/properties/image-utils";
import { useTenant } from "@/components/providers/TenantProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function PropertyImageUploader({
  sessionId,
  value = [],
  onChange,
  initialImages = [],
  maxFiles = IMAGE_UPLOAD_POLICY.maxFiles,
  maxFileSizeMB = IMAGE_UPLOAD_POLICY.maxBytes / (1024 * 1024),
  disabled = false,
  cleanupOnUnmount = true,
  allowPaste = true,
}: PropertyImageUploaderProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [errorDialog, setErrorDialog] = useState<{
    type: "warning" | "error";
    title: string;
    description: string;
    errors?: string[];
  } | null>(null);

  const { activeTenant } = useTenant();
  const currentTenantId = activeTenant?.id && activeTenant.id !== "ALL" ? activeTenant.id : undefined;

  const [isWatermarkEnabled, setIsWatermarkEnabled] = useState(true);
  const [watermarkPosition, setWatermarkPosition] = useState<
    "southeast" | "center" | "southwest" | "northeast" | "northwest"
  >("southeast");
  const [watermarkScale, setWatermarkScale] = useState<"sm" | "md" | "lg">("sm");
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  const [images, setImages] = useState<ImageItem[]>(() => {
    const valuePaths = value ? value.filter(Boolean) : [];

    if (valuePaths.length > 0) {
      // Create a map of initial images by storage path/url for quick lookup
      const initialMap = new Map<
        string,
        { image_url?: string; storage_path?: string; is_cover?: boolean }
      >();
      if (initialImages && initialImages.length > 0) {
        initialImages.forEach((img) => {
          if (img.storage_path) {
            initialMap.set(img.storage_path, img);
            initialMap.set(img.storage_path.trim(), img);
          }
          if (img.image_url) {
            initialMap.set(img.image_url, img);
            initialMap.set(img.image_url.trim(), img);
          }
        });
      }

      return valuePaths.map((path, index) => {
        const matchingInitial = initialMap.get(path);
        if (matchingInitial) {
          const preview_url =
            matchingInitial.image_url &&
            matchingInitial.image_url.startsWith("http")
              ? matchingInitial.image_url
              : matchingInitial.storage_path
                ? getPublicImageUrl(matchingInitial.storage_path)
                : "";

          return {
            id: `initial-${index}`,
            storage_path: path,
            preview_url: preview_url,
            is_cover: matchingInitial.is_cover ?? index === 0,
            origin: "initial" as const,
            originalIndex: index,
            timestamp: Date.now() - (valuePaths.length - index) * 1000,
          };
        }

        return {
          id: `value-${index}-${Date.now()}`,
          storage_path: path,
          preview_url: getPublicImageUrl(path),
          is_cover: index === 0,
          origin: "temp" as const,
          originalIndex: index,
          timestamp: Date.now() - (valuePaths.length - index) * 1000,
        };
      });
    }

    if (initialImages && initialImages.length > 0) {
      return initialImages.map(
        (
          img: {
            image_url?: string;
            storage_path?: string;
            is_cover?: boolean;
          },
          index,
        ) => {
          const preview_url =
            img.image_url && img.image_url.startsWith("http")
              ? img.image_url
              : img.storage_path
                ? getPublicImageUrl(img.storage_path)
                : "";

          return {
            id: `initial-${index}`,
            storage_path: img.storage_path,
            preview_url: preview_url,
            is_cover: img.is_cover ?? index === 0,
            origin: "initial",
            originalIndex: index,
            timestamp: Date.now() - (initialImages.length - index) * 1000,
          };
        },
      );
    }

    return [];
  });

  // keep latest snapshot for cleanup without triggering setState during render
  const imagesRef = useRef<ImageItem[]>(images);
  const prevValueRef = useRef<string[]>(value);
  const isUploadingRef = useRef(false);
  const activeUploadProcessIdRef = useRef<string | null>(null);

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
      .map((img) => img.storage_path as string);

    // Prevent infinite rendering loop by comparing generated paths with current value
    const valuePaths = value ? value.filter(Boolean) : [];
    const hasChanged =
      paths.length !== valuePaths.length ||
      paths.some((path, idx) => path !== valuePaths[idx]);

    if (hasChanged && onChange) {
      onChange(paths);
    }
  }, [images, onChange, value]);

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

      // If active upload task was running, abort/error it out in DB so it doesn't hang
      if (activeUploadProcessIdRef.current) {
        const pid = activeUploadProcessIdRef.current;
        import("@/lib/process-monitor").then(({ finishProcess }) => {
          finishProcess(pid, "ERROR", isEn ? "Upload stopped due to page navigation" : "หยุดอัปโหลดเนื่องจากออกจากหน้าเพจ");
        });
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
  }, [cleanupOnUnmount, sessionId, isEn]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;

      // Validate file count
      const remainingSlots = maxFiles - images.length;
      if (acceptedFiles.length > remainingSlots) {
        setErrorDialog({
          type: "warning",
          title: isEn ? "Image limit exceeded" : "จำนวนรูปเกินขีดจำกัด",
          description: isEn
            ? `You can upload up to ${remainingSlots} more images (max ${maxFiles} per listing). Only the first ${remainingSlots} images are selected.`
            : `คุณสามารถเพิ่มได้อีกสูงสุด ${remainingSlots} รูป (สูงสุด ${maxFiles} รูปต่อประกาศ) ระบบจะเลือกเฉพาะ ${remainingSlots} รูปแรกให้โดยอัตโนมัติ`,
        });
        acceptedFiles = acceptedFiles.slice(0, remainingSlots);
      }

      if (acceptedFiles.length === 0) return;

      // Step 1: Create immediate preview items (Non-blocking)
      isUploadingRef.current = true;
      const uploadErrors: string[] = [];

      const startIdx = images.length;
      const newItems: ImageItem[] = acceptedFiles.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        storage_path: "",
        preview_url: URL.createObjectURL(file),
        is_cover: images.length === 0 && index === 0,
        is_uploading: true,
        file,
        origin: "temp",
        originalIndex: startIdx + index,
        timestamp: file.lastModified || Date.now(),
      }));

      // Update state immediately to show skeletons/placeholders
      setImages((prev) => [...prev, ...newItems]);

      const processId = startProcess(
        isEn ? `Uploading images (${acceptedFiles.length})` : `อัปโหลดรูปภาพ (${acceptedFiles.length} รูป)`,
        {
          type: "IMAGE_UPLOAD",
        },
      );
      activeUploadProcessIdRef.current = processId;

      // Step 2: Process each file in background (Sequential to avoid overloading)
      const { validateImageFile } = await import("@/lib/file-validation");
      const { compressImage } = await import("@/lib/image-compression");

      let successCount = 0;
      for (const item of newItems) {
        const file = item.file!;
        try {
          // A. Size Validation
          if (file.size > maxFileSizeMB * 1024 * 1024) {
            throw new Error(isEn ? `File exceeds ${maxFileSizeMB}MB` : `ไฟล์ใหญ่เกิน ${maxFileSizeMB}MB`);
          }

          // B. Magic Bytes Validation
          const validation = await validateImageFile(file);
          if (!validation.valid) {
            throw new Error(validation.error || (isEn ? "Invalid file" : "ไฟล์ไม่ถูกต้อง"));
          }

          // C. Compression
          let fileToUpload = file;
          try {
            const result = await compressImage(file);
            fileToUpload = normalizeImageFileName(
              result.compressedFile,
              file.name,
            );
          } catch (err: unknown) {
            console.warn(
              `Compression failed for ${file.name}, using original.`,
              err,
            );
          }

          // D. Upload
          const formData = new FormData();
          formData.append("file", fileToUpload);
          formData.append("sessionId", sessionId);
          if (currentTenantId) {
            formData.append("tenantId", currentTenantId);
          }
          formData.append("watermark", isWatermarkEnabled ? "true" : "false");
          formData.append("watermarkPosition", watermarkPosition);
          formData.append("watermarkScale", watermarkScale);

          const result = await uploadPropertyImageAction(formData);

          if ("success" in result && result.success === false) {
            throw new Error(result.message || "Upload failed");
          }

          // Successfully uploaded
          const uploadedResult = result as { path: string; publicUrl: string };

          // Update state for this specific item
          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? {
                    ...img,
                    storage_path: uploadedResult.path,
                    preview_url: uploadedResult.publicUrl,
                    is_uploading: false,
                    file: undefined, // Clear file reference after success
                  }
                : img,
            ),
          );

          successCount++;
          finishProcess(
            processId,
            "PROCESSING",
            isEn
              ? `Uploaded ${successCount}/${acceptedFiles.length} images`
              : `อัปโหลดสำเร็จแล้ว ${successCount}/${acceptedFiles.length} รูป`,
          );
        } catch (error: unknown) {
          console.error(`Error processing ${file.name}:`, error);
          const rawMsg = error instanceof Error ? error.message : (isEn ? "Failed" : "ล้มเหลว");
          let friendlyMsg = rawMsg;

          if (
            rawMsg.includes("unexpected response") ||
            rawMsg.includes("403") ||
            rawMsg.includes("Forbidden") ||
            rawMsg.includes("Payload too large") ||
            rawMsg.includes("413")
          ) {
            friendlyMsg = isEn
              ? "The server security firewall (WAF) rejected this image due to size or risk.\n💡 Solution: Please take a screenshot of the image and upload the screenshot instead."
              : "ระบบความปลอดภัยของเซิร์ฟเวอร์ (WAF) ปฏิเสธการอัปโหลดไฟล์รูปนี้เนื่องจากโครงสร้างภาพมีความเสี่ยง หรือขนาดใหญ่เกินไป\n💡 วิธีแก้ไข: กรุณาลองแคปหน้าจอภาพนี้ (Screenshot) แล้วใช้อัพโหลดแทน";
          }

          uploadErrors.push(`${friendlyMsg}`);

          // Keep the item in state but mark as error to retain the preview
          setImages((prev) =>
            prev.map((img) =>
              img.id === item.id
                ? {
                    ...img,
                    is_uploading: false,
                    is_error: true,
                    error_message: friendlyMsg,
                  }
                : img,
            ),
          );
        }
      }

      if (uploadErrors.length > 0) {
        finishProcess(
          processId,
          "ERROR",
          isEn
            ? `${uploadErrors.length} errors occurred out of ${acceptedFiles.length} files`
            : `พบข้อผิดพลาด ${uploadErrors.length} รายการ จากทั้งหมด ${acceptedFiles.length} รายการ`,
          {
            errorDetails: uploadErrors.join("\n"),
          },
        );
        setErrorDialog({
          type: "error",
          title: isEn ? "Upload Error" : "พบข้อผิดพลาดขณะอัปโหลด",
          description: isEn ? "Some files could not be uploaded. Please verify:" : "บางไฟล์ไม่สามารถอัปโหลดได้ กรุณาตรวจสอบ:",
          errors: uploadErrors,
        });
      } else {
        finishProcess(
          processId,
          "SUCCESS",
          isEn
            ? `Uploaded ${successCount} images successfully ✨`
            : `อัปโหลดรูปภาพ ${successCount} รูปสำเร็จเรียบร้อย ✨`,
          {
            resultLink:
              typeof window !== "undefined" ? window.location.href : undefined,
          },
        );
      }

      isUploadingRef.current = false;
      activeUploadProcessIdRef.current = null;
    },
    [
      disabled,
      images.length,
      maxFiles,
      maxFileSizeMB,
      sessionId,
      isWatermarkEnabled,
    ],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (disabled || !allowPaste) return;

      // Prevent pasting images when user is typing in a text field
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true");
      if (isInput) return;

      const files: File[] = [];
      const items = e.clipboardData?.items;
      const clipboardFiles = e.clipboardData?.files;

      // 1. Try to get actual files first (e.g. copied from Finder/Explorer)
      if (clipboardFiles && clipboardFiles.length > 0) {
        for (let i = 0; i < clipboardFiles.length; i++) {
          const file = clipboardFiles[i];
          const isImageFile =
            file.type.startsWith("image/") ||
            /\.(png|jpe?g|webp)$/i.test(file.name);

          if (isImageFile && file.size > 0) {
            files.push(file);
          }
        }
      }

      // 2. Fallback to items (e.g. screenshots / inline copy-paste)
      if (files.length === 0 && items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const isImageItem =
            item.type.startsWith("image/") ||
            (item.kind === "file" && /\.(png|jpe?g|webp)$/i.test(item.type));

          if (item.kind === "file" && isImageItem) {
            const file = item.getAsFile();
            if (file && file.size > 0) {
              files.push(file);
            }
          }
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        onDrop(files);
        toast.success(
          isEn
            ? `Pasted ${files.length} images from clipboard ✨`
            : `วางรูปภาพจากคลิปบอร์ดสำเร็จ ${files.length} รูป ✨`
        );
      }
    },
    [disabled, onDrop, isEn],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // ✅ รับรูปทั้งหมดก่อน แล้วคุมเข้มด้วย validateImageFile (กันเคสชื่อไฟล์เพี้ยน)
    accept: { "image/*": [] },
    disabled,
    maxSize: maxFileSizeMB * 1024 * 1024,
    maxFiles,
  });

  const handleRemove = async (imageId: string) => {
    // 1. Find the image to remove from the CURRENT state (safer than inside updater for effects)
    const imageToRemove = images.find((img) => img.id === imageId);
    if (!imageToRemove) return;

    // 2. Perform side effects (Background cleanup) OUTSIDE of setState
    if (
      imageToRemove.origin === "temp" &&
      imageToRemove.storage_path &&
      !imageToRemove.is_uploading
    ) {
      // Trigger deletion but don't strictly await it to keep UI snappy
      deletePropertyImageFromStorage(imageToRemove.storage_path).catch(
        (error) => {
          console.error("Failed to delete from storage:", error);
        },
      );
    }

    if (imageToRemove.preview_url?.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.preview_url);
    }

    // 3. Update state to remove the item
    setImages((prev) => {
      const newImages = prev.filter((img) => img.id !== imageId);

      // If we removed the cover image, set the first available image as cover
      if (imageToRemove.is_cover && newImages.length > 0) {
        newImages[0] = { ...newImages[0], is_cover: true };
      }

      return newImages;
    });

    toast.success(isEn ? "Image deleted" : "ลบรูปสำเร็จ");
  };

  const handleClearAll = () => {
    if (disabled) return;
    setIsConfirmClearOpen(true);
  };

  const executeClearAll = async () => {
    setIsConfirmClearOpen(false);

    const tempImages = images.filter(
      (img) => img.origin === "temp" && img.storage_path && !img.is_uploading,
    );

    for (const img of images) {
      if (img.preview_url?.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(img.preview_url);
        } catch {}
      }
    }

    setImages([]);

    // Delete background files asynchronously
    for (const img of tempImages) {
      if (img.storage_path) {
        deletePropertyImageFromStorage(img.storage_path).catch((error) => {
          console.error(
            "Failed to delete from storage during clear all:",
            error,
          );
        });
      }
    }

    toast.success(isEn ? "All images cleared successfully" : "ลบรูปภาพทั้งหมดเรียบร้อยแล้ว");
  };

  const handleSetCover = (imageId: string) => {
    setImages((prev) => {
      const targetIndex = prev.findIndex((img) => img.id === imageId);
      if (targetIndex === -1) return prev;

      const target = { ...prev[targetIndex], is_cover: true };
      const rest = prev
        .filter((img) => img.id !== imageId)
        .map((img) => ({ ...img, is_cover: false }));
      return [target, ...rest];
    });
    toast.success(isEn ? "Cover photo updated" : "ตั้งรูปปกสำเร็จ");
  };

  const handleSortImages = (order: "newest" | "oldest") => {
    if (disabled || images.length <= 1) return;

    setImages((prev) => {
      const sorted = [...prev].sort((a, b) => {
        const timeA = a.timestamp ?? (a.originalIndex !== undefined ? 1000000000 + a.originalIndex : 0);
        const timeB = b.timestamp ?? (b.originalIndex !== undefined ? 1000000000 + b.originalIndex : 0);
        return order === "newest" ? timeB - timeA : timeA - timeB;
      });

      // Maintain the first image as cover
      return sorted.map((img, idx) => ({
        ...img,
        is_cover: idx === 0,
      }));
    });

    toast.success(
      isEn
        ? (order === "newest" ? "Sorted: Newest to Oldest ✨" : "Sorted: Oldest to Newest ✨")
        : (order === "newest" ? "เรียงลำดับรูปภาพ: ใหม่ไปเก่า ✨" : "เรียงลำดับรูปภาพ: เก่าไปใหม่ ✨")
    );
  };

  // @dnd-kit sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Minimum 5px drag before activating
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Require 250ms long press to start dragging on touch screens
        tolerance: 5, // Max 5px movement allowed before long press triggers
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
      toast.success(isEn ? "Images reordered" : "จัดเรียงรูปสำเร็จ");
    }
  };

  const activeImage = activeId
    ? images.find((img) => img.id === activeId)
    : null;

  return (
    <div className="space-y-4">
      {/* Premium Watermark Settings Panel */}
      <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-slate-800 select-none">
            <input
              type="checkbox"
              checked={isWatermarkEnabled}
              onChange={(e) => setIsWatermarkEnabled(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <span>{isEn ? "Apply VCC ASSET logo watermark on photos" : "ใส่ลายน้ำโลโก้ VCC ASSET บนภาพถ่าย"}</span>
          </label>
        </div>

        {isWatermarkEnabled && (
          <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Position Selector */}
            <div className="space-y-1">
              <span className="font-semibold text-slate-600 block">{isEn ? "Watermark Position" : "ตำแหน่งลายน้ำ"}</span>
              <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-slate-700">
                <button
                  type="button"
                  onClick={() => setWatermarkPosition("northwest")}
                  disabled={disabled}
                  className={`py-1 px-1 rounded-lg text-center font-medium transition-all cursor-pointer ${
                    watermarkPosition === "northwest"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {isEn ? "↖ Top Left" : "↖ ซ้ายบน"}
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkPosition("northeast")}
                  disabled={disabled}
                  className={`py-1 px-1 rounded-lg text-center font-medium transition-all cursor-pointer ${
                    watermarkPosition === "northeast"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {isEn ? "↗ Top Right" : "↗ ขวาบน"}
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkPosition("center")}
                  disabled={disabled}
                  className={`py-1 px-1 rounded-lg text-center font-medium transition-all cursor-pointer ${
                    watermarkPosition === "center"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {isEn ? "🎯 Center" : "🎯 ตรงกลาง"}
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkPosition("southwest")}
                  disabled={disabled}
                  className={`py-1 px-1 rounded-lg text-center font-medium transition-all cursor-pointer ${
                    watermarkPosition === "southwest"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {isEn ? "↙ Bottom Left" : "↙ ซ้ายล่าง"}
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkPosition("southeast")}
                  disabled={disabled}
                  className={`py-1 px-1 rounded-lg text-center font-medium transition-all cursor-pointer col-span-2 ${
                    watermarkPosition === "southeast"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {isEn ? "↘ Bottom Right (Recommended)" : "↘ ขวาล่าง (แนะนำ)"}
                </button>
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-1">
              <span className="font-semibold text-slate-600 block">{isEn ? "Watermark Size" : "ขนาดลายน้ำ"}</span>
              <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-slate-700">
                <button
                  type="button"
                  onClick={() => setWatermarkScale("sm")}
                  disabled={disabled}
                  className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all cursor-pointer ${
                    watermarkScale === "sm"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {isEn ? "Small" : "เล็ก"}
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkScale("md")}
                  disabled={disabled}
                  className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all cursor-pointer ${
                    watermarkScale === "md"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {isEn ? "Medium" : "ปานกลาง"}
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkScale("lg")}
                  disabled={disabled}
                  className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all cursor-pointer ${
                    watermarkScale === "lg"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "hover:bg-slate-100"
                  }`}
                >
                  {isEn ? "Large" : "ใหญ่"}
                </button>
              </div>
            </div>

            {/* Live Watermark Preview Box */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {isEn ? "Live Watermark Preview" : "ตัวอย่างลายน้ำบนรูปจริง (Live Preview)"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {isEn ? "Position: " : "ตำแหน่ง: "}{
                    {
                      southeast: isEn ? "Bottom Right ↘" : "มุมขวาล่าง ↘",
                      center: isEn ? "Center 🎯" : "ตรงกลาง 🎯",
                      southwest: isEn ? "Bottom Left ↙" : "มุมซ้ายล่าง ↙",
                      northeast: isEn ? "Top Right ↗" : "มุมขวาบน ↗",
                      northwest: isEn ? "Top Left ↖" : "มุมซ้ายบน ↖",
                    }[watermarkPosition]
                  } | {isEn ? "Size: " : "ขนาด: "}{
                    {
                      sm: isEn ? "Small" : "เล็ก",
                      md: isEn ? "Medium" : "ปานกลาง",
                      lg: isEn ? "Large" : "ใหญ่",
                    }[watermarkScale]
                  }
                </span>
              </div>
              
              <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200/90 shadow-inner flex items-center justify-center group/prev">
                {/* Background image mockup */}
                <Image
                  src="/images/properties-hero.webp"
                  alt="Watermark preview mockup"
                  fill
                  className="object-cover opacity-80 transition-transform duration-500 group-hover/prev:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

                {/* Simulated Watermark Overlay Badge */}
                <div
                  className={`absolute transition-all duration-300 ease-out z-20 ${
                    watermarkPosition === "northwest"
                      ? "top-3 left-3"
                      : watermarkPosition === "northeast"
                      ? "top-3 right-3"
                      : watermarkPosition === "center"
                      ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                      : watermarkPosition === "southwest"
                      ? "bottom-3 left-3"
                      : "bottom-3 right-3"
                  }`}
                >
                  <div
                    className={`bg-black/55 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/20 shadow-lg flex items-center justify-center transition-all duration-300 ease-out ${
                      watermarkScale === "sm"
                        ? "scale-80 origin-center"
                        : watermarkScale === "md"
                        ? "scale-100 origin-center"
                        : "scale-120 origin-center"
                    }`}
                  >
                    <Image
                      src="/images/branding/vcc-asset/png/logo-light.png"
                      alt="VCC ASSET Logo"
                      width={100}
                      height={24}
                      className="h-4 sm:h-5 w-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          id="tour-property-upload"
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
              ? (isEn ? "Drop files here..." : "วางไฟล์ที่นี่...")
              : (isEn ? "Drag & drop files here, or click to browse" : "ลากไฟล์มาวางหรือคลิกเพื่อเลือกรูป")}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400">
            {isEn
              ? `Supports JPG, PNG, WebP • Max ${maxFileSizeMB}MB per photo • Max ${maxFiles} photos`
              : `รองรับ JPG, PNG, WebP • ไม่เกิน ${maxFileSizeMB}MB ต่อรูป • สูงสุด ${maxFiles} รูป`}
          </p>
        </div>
      )}

      {images.length > 0 && (
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 px-1">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                {isEn ? `All Photos (${images.length}/${maxFiles})` : `รูปภาพทั้งหมด (${images.length}/${maxFiles})`}
              </p>

              {/* Sorting Buttons */}
              {images.length > 1 && (
                <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80">
                  <Button
                    type="button"
                    onClick={() => handleSortImages("newest")}
                    disabled={disabled || images.some((img) => img.is_uploading)}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] font-medium text-slate-700 hover:text-blue-600 hover:bg-white rounded-md flex items-center gap-1 transition-all"
                    title={isEn ? "Sort newest to oldest" : "เรียงจากรูปที่เพิ่มล่าสุดไปหารูปแรก"}
                  >
                    <ArrowDownWideNarrow className="w-3 h-3 text-blue-500" />
                    <span>{isEn ? "Newest First" : "ใหม่ไปเก่า"}</span>
                  </Button>
                  <div className="w-[1px] h-3.5 bg-slate-300 my-auto" />
                  <Button
                    type="button"
                    onClick={() => handleSortImages("oldest")}
                    disabled={disabled || images.some((img) => img.is_uploading)}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] font-medium text-slate-700 hover:text-blue-600 hover:bg-white rounded-md flex items-center gap-1 transition-all"
                    title={isEn ? "Sort oldest to newest" : "เรียงจากรูปแรกไปหารูปที่เพิ่มล่าสุด"}
                  >
                    <ArrowUpWideNarrow className="w-3 h-3 text-blue-500" />
                    <span>{isEn ? "Oldest First" : "เก่าไปใหม่"}</span>
                  </Button>
                </div>
              )}

              {images.length > 0 && (
                <Button
                  type="button"
                  onClick={handleClearAll}
                  disabled={disabled || images.some((img) => img.is_uploading)}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                  {isEn ? "Clear All" : "ล้างทั้งหมด"}
                </Button>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 italic">
              {isEn ? "Drag to reorder • ⭐ = Cover photo" : "ลากเพื่อจัดเรียง • ⭐ = รูปปก"}
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
              <div
                id="tour-property-images-grid"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
              >
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
          <p className="text-xs sm:text-sm font-medium">{isEn ? "No images uploaded yet" : "ยังไม่มีรูปภาพ"}</p>
        </div>
      )}

      <ResponsiveDialog
        open={!!errorDialog}
        onOpenChange={(open) => !open && setErrorDialog(null)}
        title={errorDialog?.title || (isEn ? "Error" : "เกิดข้อผิดพลาด")}
        description={errorDialog?.description}
        className="sm:max-w-md"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-3 rounded-full shrink-0",
                errorDialog?.type === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-amber-50 text-amber-600",
              )}
            >
              {errorDialog?.type === "error" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Info className="w-6 h-6" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {errorDialog?.type === "error"
                ? (isEn ? "Problem Detected" : "พบปัญหาขัดข้อง")
                : (isEn ? "Additional Guidance" : "คำแนะนำเพิ่มเติม")}
            </p>
          </div>

          {errorDialog?.errors && errorDialog.errors.length > 0 && (
            <div className="max-h-[200px] overflow-y-auto bg-slate-50 rounded-xl p-4 border border-slate-100">
              <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                {errorDialog.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-bold shadow-lg"
            onClick={() => setErrorDialog(null)}
          >
            {isEn ? "OK" : "ตกลง"}
          </Button>
        </div>
      </ResponsiveDialog>

      {/* ล้างรูปภาพทั้งหมด Confirm Dialog */}
      <ResponsiveDialog
        open={isConfirmClearOpen}
        onOpenChange={setIsConfirmClearOpen}
        title={isEn ? "Confirm Clear All Photos" : "ยืนยันการลบรูปภาพทั้งหมด"}
        description={
          isEn
            ? "Are you sure you want to delete all photos? This action cannot be undone."
            : "คุณต้องการลบรูปภาพทั้งหมดใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        }
        className="sm:max-w-md!"
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full shrink-0 bg-red-50 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {isEn
                ? "You are about to delete all uploaded photos for this listing"
                : "คุณกำลังจะลบรูปภาพทั้งหมดของประกาศนี้"}
            </p>
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl h-12 font-bold"
              onClick={() => setIsConfirmClearOpen(false)}
            >
              {isEn ? "Cancel" : "ยกเลิก"}
            </Button>
            <Button
              type="button"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold shadow-lg"
              onClick={executeClearAll}
            >
              {isEn ? "Delete All" : "ลบทั้งหมด"}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
