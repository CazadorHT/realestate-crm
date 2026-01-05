"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PropertyImage } from "@/features/properties/types";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sort: Cover first
  const sortedImages = [...(images || [])].sort((a, b) => {
    if (a.is_cover) return -1;
    if (b.is_cover) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const mainImage = sortedImages[0];
  const subImages = sortedImages.slice(1, 5); // Take next 4 for grid
  const remainingCount = Math.max(0, sortedImages.length - 5);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + sortedImages.length) % sortedImages.length
    );
  };

  if (!mainImage) {
    return (
      <div className="w-full aspect-video bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
        <ImageIcon className="h-12 w-12 opacity-50 mb-2" />
        <span className="block">ไม่มีรูปภาพ</span>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[450px] rounded-3xl overflow-hidden relative group">
        {/* Main Image (Large Left) */}
        <div
          className="md:col-span-2 md:row-span-2 relative cursor-pointer bg-slate-200 "
          onClick={() => {
            setCurrentIndex(0);
            setOpen(true);
          }}
        >
          <Image
            src={mainImage.image_url}
            alt={title}
            fill
            className="object-cover hover:scale-105 transition-transform duration-700"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Sub Images (Grid Right) */}
        <div className="hidden md:grid grid-cols-2 gap-2 col-span-2 row-span-2 max-h-full">
          {subImages.map((img, idx) => (
            <div
              key={img.id}
              className="relative bg-slate-200 cursor-pointer overflow-hidden"
              onClick={() => {
                setCurrentIndex(idx + 1);
                setOpen(true);
              }}
            >
              <Image
                src={img.image_url}
                alt={`${title} - ${idx + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                sizes="25vw"
              />
              {/* Overlay for the last visible image if more exist */}
              {idx === 3 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg backdrop-blur-[2px] hover:bg-black/60 transition-colors">
                  +{remainingCount} รูป
                </div>
              )}
            </div>
          ))}
          {/* Fallback for empty slots to keep grid shape if < 5 images */}
          {Array.from({ length: 4 - subImages.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-50" />
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6">
          <Button
            variant="secondary"
            className="bg-white/90 hover:bg-white text-slate-900 shadow-lg backdrop-blur-sm h-10 px-4 rounded-xl font-semibold"
            onClick={() => setOpen(true)}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            ดูรูปทั้งหมด ({sortedImages.length})
          </Button>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[100vw] h-[100dvh] p-0 border-none bg-black/95 flex flex-col items-center justify-center z-[100]"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <DialogTitle>
              รูปภาพ: {title} ({currentIndex + 1}/{sortedImages.length})
            </DialogTitle>
          </VisuallyHidden>

          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors z-50"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-10">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={sortedImages[currentIndex].image_url}
                alt={title}
                fill
                className="object-contain"
                quality={100}
                priority
                sizes="100vw"
              />
            </div>
          </div>

          {/* Navigation */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all backdrop-blur-md"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all backdrop-blur-md"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Thumbnails Strip (Bottom) */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
            {sortedImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0",
                  currentIndex === idx
                    ? "border-white scale-110"
                    : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                <Image
                  src={img.image_url}
                  alt=""
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
