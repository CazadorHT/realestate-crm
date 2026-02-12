"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Star,
  StarOff,
  GripVertical,
  Loader2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageItem } from "./types";

interface SortableImageItemProps {
  image: ImageItem;
  index: number;
  disabled: boolean;
  onSetCover: (id: string) => void;
  onRemove: (id: string) => void;
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
}

export function SortableImageItem({
  image,
  index,
  disabled,
  onSetCover,
  onRemove,
  setImages,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: image.id,
    disabled: disabled || image.is_uploading,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group aspect-square bg-muted rounded-lg overflow-hidden border-2 transition-shadow",
        isDragging && "opacity-50 border-primary shadow-xl",
        !isDragging &&
          image.is_cover &&
          "border-primary ring-2 ring-primary/20",
        !isDragging &&
          !image.is_cover &&
          "border-transparent hover:border-slate-300",
      )}
    >
      <div className="relative w-full h-full">
        {image.hasError ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <ImageIcon className="h-8 w-8 text-slate-300" />
          </div>
        ) : image.preview_url ? (
          <img
            src={image.preview_url}
            alt={`Property image ${index + 1}`}
            className="h-full w-full object-cover"
            onError={() => {
              setImages((prev) =>
                prev.map((img) =>
                  img.id === image.id ? { ...img, hasError: true } : img,
                ),
              );
            }}
          />
        ) : null}
      </div>

      {image.is_uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}

      {/* Drag Handle - Always visible at top-left, slightly more transparent on mobile */}
      {!image.is_uploading && !disabled && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "absolute top-1 left-1 z-30 p-1.5 sm:p-2 rounded-md cursor-grab active:cursor-grabbing",
            "bg-black/40 sm:bg-black/50 hover:bg-primary text-white transition-colors",
            "touch-none select-none",
          )}
          title="ลากเพื่อจัดเรียง"
        >
          <GripVertical className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      )}

      {/* Cover Badge - Adjusted size for mobile */}
      {image.is_cover && (
        <div className="absolute top-1 left-9 sm:left-12 z-20 bg-emerald-500 text-white text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-1 shadow-md border border-white/20">
          <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
          รูปปก
        </div>
      )}

      {/* Actions Container - More visible on mobile (not just hover) */}
      {!image.is_uploading && (
        <div
          className={cn(
            "absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 pointer-events-none z-10",
            "sm:group-hover:bg-black/40",
          )}
        >
          <div
            className={cn(
              "flex gap-1.5 sm:gap-2 pointer-events-auto transition-all duration-200",
              "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0",
            )}
          >
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 sm:h-9 sm:w-9 bg-white/95 hover:bg-white shadow-xl rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onSetCover(image.id);
              }}
              disabled={image.is_cover}
              title={image.is_cover ? "รูปปกปัจจุบัน" : "ตั้งเป็นรูปปก"}
            >
              {image.is_cover ? (
                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-emerald-500 text-emerald-500" />
              ) : (
                <StarOff className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
              )}
            </Button>

            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-8 w-8 sm:h-9 sm:w-9 shadow-xl rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(image.id);
              }}
              disabled={disabled}
              title="ลบรูปนี้"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Image Number Badge - Compact and less intrusive */}
      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md font-bold backdrop-blur-sm border border-white/10">
        {index + 1}
      </div>
    </div>
  );
}
