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
  onSetCover: (index: number) => void;
  onRemove: (index: number) => void;
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

      {/* Drag Handle - Always visible at top-left */}
      {!image.is_uploading && !disabled && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            "absolute top-1.5 left-1.5 z-20 p-2 rounded-md cursor-grab active:cursor-grabbing",
            "bg-black/50 hover:bg-primary text-white transition-colors",
            "touch-none select-none",
          )}
          title="ลากเพื่อจัดเรียง"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Cover Badge */}
      {image.is_cover && (
        <div className="absolute top-1.5 left-12 z-10 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Star className="h-3 w-3 fill-current" />
          รูปปก
        </div>
      )}

      {/* Hover Actions */}
      {!image.is_uploading && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 pointer-events-auto">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-9 w-9 bg-white/95 hover:bg-white shadow-md"
              onClick={() => onSetCover(index)}
              disabled={image.is_cover}
              title={image.is_cover ? "รูปปกปัจจุบัน" : "ตั้งเป็นรูปปก"}
            >
              {image.is_cover ? (
                <Star className="h-5 w-5 fill-primary text-primary" />
              ) : (
                <StarOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="h-9 w-9 shadow-md"
              onClick={() => onRemove(index)}
              disabled={disabled}
              title="ลบรูปนี้"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Image Number Badge */}
      <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium">
        #{index + 1}
      </div>
    </div>
  );
}
