"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageLightboxProps {
  images: { image_url: string; is_cover?: boolean }[];
  propertyTitle: string;
}

export function ImageLightbox({ images, propertyTitle }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setOpen(true);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") setOpen(false);
  };

  if (images.length === 0) return null;

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">
          รูปภาพทั้งหมด ({images.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              onClick={() => openLightbox(index)}
              className={cn(
                "relative aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer border-2 transition-all hover:scale-105",
                image.is_cover && "border-primary ring-2 ring-primary/20"
              )}
            >
              <img
                src={image.image_url}
                alt={`${propertyTitle} - รูปที่ ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              {image.is_cover && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <span>⭐</span> รูปปก
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}/{images.length}
              </div>
              
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none"
          onKeyDown={handleKeyDown}
          tabIndex={0} // เพิ่มบรรทัดนี้
        >
          <VisuallyHidden>
            <DialogTitle>{`${propertyTitle} — รูปที่ ${currentIndex + 1} จาก ${images.length}`}</DialogTitle>
          </VisuallyHidden>
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {/* Close Button */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>

            {/* Previous Button */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Current Image */}
            <img
              src={images[currentIndex].image_url}
              alt={`${propertyTitle} - รูปที่ ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Next Button */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNext}
                className="absolute right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>

            {/* Cover Badge */}
            {images[currentIndex].is_cover && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full flex items-center gap-2">
                <span>⭐</span> รูปปก
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
