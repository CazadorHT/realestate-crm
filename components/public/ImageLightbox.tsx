"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  title?: string;
}

export function ImageLightbox({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  title,
}: ImageLightboxProps) {
  const [direction, setDirection] = useState(0);
  const thumbContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && thumbContainerRef.current) {
      const activeThumb = thumbContainerRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentIndex, isOpen]);

  const handleNext = useCallback(() => {
    setDirection(1);
    onIndexChange((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onIndexChange]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="fixed! inset-0! left-0! top-0! translate-x-0! translate-y-0! w-full! h-[100dvh]! max-h-[100dvh]! max-w-none! rounded-none! p-0 border-none bg-black/90 flex flex-col items-center justify-center z-150 overflow-hidden"
        showCloseButton={false}
        overlayClassName="z-150"
      >
        <VisuallyHidden>
          <DialogTitle>
            รูปภาพ: {title || "Image"} ({currentIndex + 1}/{images.length})
          </DialogTitle>
        </VisuallyHidden>

        {/* Header with Safe Area Top */}
        <div
          className="absolute top-0 left-0 right-16 z-50 flex flex-col gap-2 p-4 pointer-events-none"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))" }}
        >
          {title && (
            <div className="bg-black/75 px-4 py-2 rounded-lg border border-white/10 w-fit max-w-full">
              <span className="text-white font-bold text-sm md:text-base line-clamp-1">
                {title}
              </span>
            </div>
          )}
          <div className="bg-black/75 px-3 py-1 rounded-full border border-white/10 w-fit">
            <span className="text-white/90 text-[10px] md:text-xs font-bold tracking-widest">
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="absolute right-4 p-2.5 bg-black/75 border border-white/10 text-white rounded-full hover:bg-white/20 transition-all z-50 shadow-lg cursor-pointer"
          style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))" }}
        >
          <X className="h-6 w-6" />
        </button>

        <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-6 md:p-10 mb-24 md:mb-28 mt-20 md:mt-24 overflow-hidden select-none">
          <AnimatePresence initial={false} custom={direction}>
            <m.div
              key={currentIndex}
              custom={direction}
              variants={{
                enter: (direction: number) => ({
                  x: direction > 0 ? "100%" : "-100%",
                  opacity: 0,
                }),
                center: {
                  zIndex: 1,
                  x: 0,
                  opacity: 1,
                },
                exit: (direction: number) => ({
                  zIndex: 0,
                  x: direction < 0 ? "100%" : "-100%",
                  opacity: 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 350, damping: 35 },
                opacity: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe =
                  Math.abs(offset.x) > 30 || Math.abs(velocity.x) > 300;
                if (swipe) {
                  if (offset.x > 0 || velocity.x > 300) {
                    handlePrev();
                  } else if (offset.x < 0 || velocity.x < -300) {
                    handleNext();
                  }
                }
              }}
              className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16 select-none touch-pan-y"
            >
              <div className="relative w-full h-full">
                <Image
                  src={images[currentIndex]}
                  alt={`${title || "Image"} ${currentIndex + 1}`}
                  fill
                  className="object-contain pointer-events-none"
                  priority
                  sizes="100vw"
                />
              </div>
            </m.div>
          </AnimatePresence>
        </div>

        {/* Nav Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous image"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all z-50 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next image"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all z-50 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </>
        )}

        {/* Thumbnails (Bottom Footer) */}
        <div
          className="absolute bottom-0 left-0 right-0 z-50 px-2 md:px-4 pt-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-auto"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
          }}
        >
          <div
            ref={thumbContainerRef}
            className="flex justify-start md:justify-center items-center gap-1.5 md:gap-2 overflow-x-auto py-1.5 md:py-2.5 no-scrollbar max-w-full w-max mx-auto"
          >
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  onIndexChange(idx);
                }}
                className={cn(
                  "relative w-12 h-12 md:w-16 md:h-16 rounded-md md:rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                  currentIndex === idx
                    ? "border-white scale-105 md:scale-110 shadow-lg"
                    : "border-white/30 opacity-60 hover:opacity-100 hover:border-white/60",
                )}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="10vw"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
