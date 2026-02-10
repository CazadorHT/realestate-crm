"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PawPrint,
} from "lucide-react";
import { IoShieldCheckmark } from "react-icons/io5";
import { cn } from "@/lib/utils";
import { PropertyImage } from "@/features/properties/types";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
  isHot?: boolean;
  verified?: boolean;
  petFriendly?: boolean;
}

// ImageWithFallback as a separate component to avoid re-creation on every render
const ImageWithFallback = ({
  img,
  alt,
  className,
  priority = false,
  sizes,
  fill = true,
  onImageError,
  failedImages,
}: {
  img: PropertyImage;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  onImageError: (id: string) => void;
  failedImages: Set<string>;
}) => {
  // If URL is empty, show fallback immediately
  if (!img.image_url) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-slate-100 text-slate-400 absolute inset-0 h-full w-full",
          className,
        )}
      >
        <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
        <span className="text-[10px] font-medium opacity-60">No Image URL</span>
      </div>
    );
  }

  const hasFailed = failedImages.has(img.id);

  if (hasFailed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-slate-100 text-slate-400 absolute inset-0 h-full w-full",
          className,
        )}
      >
        <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
        <span className="text-[10px] font-medium opacity-60">Load Error</span>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Image
        key={img.image_url}
        src={img.image_url}
        alt={alt}
        fill={fill}
        className={cn("transition-transform duration-500", className)}
        priority={priority}
        sizes={sizes}
        // onLoad={() => {
        //   console.log(
        //     JSON.stringify({
        //       message: `[next-image] Successfully loaded`,
        //       id: img.id,
        //       url: img.image_url,
        //     }),
        //   );
        // }}
        // onError={() => {
        //   console.error(
        //     JSON.stringify({
        //       message: `[next-image] FAILED to load`,
        //       id: img.id,
        //       url: img.image_url,
        //     }),
        //   );
        //   onImageError(img.id);
        // }}
      />
    </div>
  );
};

export function PropertyGallery({
  images,
  title,
  isHot,
  verified,
  petFriendly,
}: PropertyGalleryProps) {
  // Debug log for incoming images
  // console.log(
  //   `[PropertyGallery] Received ${images?.length} images for "${title}"`,
  // );

  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Sort: Cover first
  const sortedImages = [...(images || [])].sort((a, b) => {
    if (a.is_cover) return -1;
    if (b.is_cover) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const mainImage = sortedImages[0];
  const subImages = sortedImages.slice(1, 5); // Take next 4 for grid
  const remainingCount = Math.max(0, sortedImages.length - 5);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
  }, [sortedImages.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + sortedImages.length) % sortedImages.length,
    );
  }, [sortedImages.length]);

  // Keyboard Navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleNext, handlePrev]);

  const handleImageError = useCallback((id: string) => {
    setFailedImages((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  }, []);

  if (!mainImage) {
    return (
      <div className="w-full aspect-video bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center">
          <ImageIcon className="h-12 w-12 opacity-50 mb-2" />
          <span className="block font-medium">ไม่มีรูปภาพ</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative group">
        {/* Floating Hot Badge Overlay */}
        {isHot && (
          <div className="absolute -top-3 -left-3 md:-top-5 md:-left-5 z-30 pointer-events-none">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-md opacity-50 rounded-full animate-pulse"></div>
              <div className="relative bg-linear-to-br from-red-500 to-orange-600 text-white p-1.5 md:p-2.5 rounded-full shadow-[0_4px_12px_rgba(239,68,68,0.4)] transform -rotate-12 group-hover:rotate-0 group-hover:-translate-y-1 transition-all duration-300 scale-100 md:scale-110">
                <Sparkles className="h-4 w-4 md:h-6 md:w-6 fill-yellow-200" />
              </div>
            </div>
          </div>
        )}

        {/* Verified Badge - Icon only with hover text */}
        {verified && (
          <div className="group/verified absolute top-3 left-3 md:top-4 md:left-6 z-40 flex items-center bg-blue-600/90 backdrop-blur-md text-white p-1.5 md:p-2 rounded-full shadow-lg transition-all duration-300 hover:pr-4 cursor-default">
            {/* Icon stays visible */}
            <IoShieldCheckmark className="w-4 h-4 md:w-5 md:h-5" />

            {/* Text expands from 0 width on hover */}
            <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] md:text-[11px] font-bold transition-all duration-300 group-hover/verified:max-w-[100px] group-hover/verified:opacity-100 group-hover/verified:ml-2">
              VERIFIED
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 z-40 flex gap-2">
          {petFriendly && (
            <Badge className="bg-white backdrop-blur-sm text-orange-600 border border-orange-200 rounded-full px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold gap-1 md:gap-1.5 shadow-lg hover:bg-white/90 hover:text-orange-600 hover:border-orange-200">
              <PawPrint className="w-3.5 h-3.5 md:w-5 md:h-5" />
              <span className="hidden min-[360px]:inline">Pet Friendly</span>
              <span className="inline min-[360px]:hidden">Pet</span>
            </Badge>
          )}
        </div>

        {/* Mobile Carousel (Visible on Mobile and Small Tablets Only) */}
        <div className="lg:hidden relative h-[250px] sm:h-[320px] md:h-[380px] -mx-4 sm:mx-0 rounded-none sm:rounded-2xl overflow-hidden">
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-black/60 text-white hover:bg-black/70 border-none backdrop-blur-md text-[10px] px-2 py-1">
              <ImageIcon className="w-3 h-3 mr-1" />
              {sortedImages.length} รูป
            </Badge>
          </div>

          <div
            className="flex overflow-x-auto snap-x snap-mandatory h-full w-full no-scrollbar"
            onScroll={(e) => {
              // Optional: Update current index for a dot indicator if we added one
              // const scrollLeft = e.currentTarget.scrollLeft;
              // const width = e.currentTarget.offsetWidth;
              // const newIndex = Math.round(scrollLeft / width);
            }}
          >
            {sortedImages.map((img, idx) => (
              <div
                key={img.id}
                className="shrink-0 w-full h-full snap-center relative bg-slate-200"
                onClick={() => {
                  setCurrentIndex(idx);
                  setOpen(true);
                }}
              >
                <ImageWithFallback
                  img={img}
                  alt={`${title} ${idx + 1}`}
                  className="object-cover"
                  priority={idx === 0}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  onImageError={handleImageError}
                  failedImages={failedImages}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Grid (Hidden on Mobile and Small Tablets) */}
        <div className="hidden lg:grid grid-cols-4 gap-1.5 md:gap-2 h-[350px] lg:h-[400px] xl:h-[450px] rounded-2xl lg:rounded-3xl overflow-hidden relative">
          {/* Main Image (Large Left) */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer bg-slate-200 group/main"
            onClick={() => {
              setCurrentIndex(0);
              setOpen(true);
            }}
          >
            <ImageWithFallback
              img={mainImage}
              alt={title}
              className="object-cover hover:scale-105 transition-transform duration-700"
              priority
              sizes="50vw"
              onImageError={handleImageError}
              failedImages={failedImages}
            />
          </div>

          {/* Sub Images (Grid Right) */}
          <div className="grid grid-cols-2 gap-2 col-span-2 row-span-2 max-h-full">
            {subImages.map((img, idx) => (
              <div
                key={img.id}
                className="relative bg-slate-200 cursor-pointer overflow-hidden group/sub"
                onClick={() => {
                  setCurrentIndex(idx + 1);
                  setOpen(true);
                }}
              >
                <ImageWithFallback
                  img={img}
                  alt={`${title} - ${idx + 2}`}
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="25vw"
                  onImageError={handleImageError}
                  failedImages={failedImages}
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
            {Array.from({ length: Math.max(0, 4 - subImages.length) }).map(
              (_, i) => (
                <div key={`empty-${i}`} className="bg-slate-50" />
              ),
            )}
          </div>

          {/* Desktop View All Button */}
          <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6">
            <Button
              variant="secondary"
              className="bg-white/90 hover:bg-white text-slate-900 shadow-lg backdrop-blur-sm h-9 lg:h-10 px-3 lg:px-4 rounded-xl text-sm font-semibold"
              onClick={() => setOpen(true)}
            >
              <ImageIcon className="w-4 h-4 mr-1.5 lg:mr-2" />
              ดูรูปทั้งหมด ({sortedImages.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
              fixed! inset-0!
              left-0! top-0!
              translate-x-0! translate-y-0!
              w-screen! h-screen!
              max-w-none!
              rounded-none!
              p-0 border-none bg-black/85
              flex flex-col items-center justify-center
              z-100"
          showCloseButton={false}
        >
          <VisuallyHidden>
            <DialogTitle>
              รูปภาพ: {title} ({currentIndex + 1}/{sortedImages.length})
            </DialogTitle>
            <DialogDescription>
              รูปภาพที่ {currentIndex + 1} จากทั้งหมด {sortedImages.length}{" "}
              รูปของ {title}
            </DialogDescription>
          </VisuallyHidden>

          {/* Lightbox Header - Split Design matching screenshot but refined */}
          <div className="absolute top-4 left-4 right-16 z-50 flex flex-col gap-2 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 w-fit max-w-full">
              <span className="text-white font-bold text-sm md:text-base line-clamp-1">
                {title}
              </span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit">
              <span className="text-white/90 text-[10px] md:text-xs font-bold tracking-widest">
                {currentIndex + 1} / {sortedImages.length}
              </span>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close gallery"
            className="absolute top-4 right-4 p-2.5 bg-black/60 backdrop-blur-md border border-white/10 text-white rounded-full hover:bg-white/20 transition-all z-50 shadow-lg"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8 md:p-12 lg:p-16 mb-20 mt-12">
            <div className="relative w-full h-full flex items-center justify-center">
              <ImageWithFallback
                img={sortedImages[currentIndex]}
                alt={title}
                className="object-contain"
                priority
                sizes="100vw"
                fill={true}
                onImageError={handleImageError}
                failedImages={failedImages}
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
                aria-label="Previous image"
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-white/30 text-white rounded-full hover:bg-white/20 transition-all backdrop-blur-sm z-50"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next image"
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-white/30 text-white rounded-full hover:bg-white/20 transition-all backdrop-blur-sm z-50"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </>
          )}

          {/* Thumbnails Strip (Bottom) - Compact */}
          <div className="absolute bottom-2 md:bottom-4 left-0 right-0 flex justify-center gap-1.5 md:gap-2 overflow-x-auto px-2 md:px-4 py-2 md:py-3 no-scrollbar z-50">
            {sortedImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "relative w-12 h-12 md:w-20 md:h-20 rounded-md md:rounded-lg overflow-hidden border-2 transition-all shrink-0",
                  currentIndex === idx
                    ? "border-white scale-105 md:scale-110 shadow-lg"
                    : "border-white/30 opacity-60 hover:opacity-100 hover:border-white/60",
                )}
              >
                <ImageWithFallback
                  img={img}
                  alt=""
                  className="object-cover"
                  sizes="10vw"
                  onImageError={handleImageError}
                  failedImages={failedImages}
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
