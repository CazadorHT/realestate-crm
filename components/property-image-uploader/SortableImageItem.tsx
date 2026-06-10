"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import {
  Star,
  StarOff,
  GripVertical,
  Loader2,
  X,
  Image as ImageIcon,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageItem } from "./types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <div className="relative w-full h-full">
            <Image
              src={image.preview_url}
              alt={`Property image ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover"
              onError={() => {
                setImages((prev) =>
                  prev.map((img) =>
                    img.id === image.id ? { ...img, hasError: true } : img,
                  ),
                );
              }}
            />
          </div>
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
            "absolute top-1 left-1 z-29 p-1.5 sm:p-2 rounded-md cursor-grab active:cursor-grabbing",
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

      {/* 3-Dots Menu for Touch Devices (Hidden on hoverable desktop screens) */}
      {!image.is_uploading && (
        <div className="absolute top-1 right-1 z-20 [@media(hover:hover)]:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7 sm:h-8 sm:w-8 bg-black/60 hover:bg-black/80 text-white border-none rounded-full shadow-md flex items-center justify-center cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-white rounded-xl shadow-lg border border-slate-100 p-1 z-50">
              <DropdownMenuItem
                disabled={image.is_cover}
                onClick={(e) => {
                  e.stopPropagation();
                  onSetCover(image.id);
                }}
                className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer py-2 px-2.5 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Star className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500" />
                ตั้งเป็นรูปปก
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(image.id);
                }}
                className="flex items-center gap-2 text-xs font-bold text-red-600 cursor-pointer py-2 px-2.5 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="h-3.5 w-3.5" />
                ลบรูปภาพ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Actions Container Overlay - Hover-only on desktop, hidden on touch screens */}
      {!image.is_uploading && (
        <div
          className={cn(
            "absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 pointer-events-none z-10",
            "hidden [@media(hover:hover)]:flex",
          )}
        >
          <div
            className={cn(
              "flex gap-1.5 sm:gap-2 pointer-events-auto transition-all duration-200",
              "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0",
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
