"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
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
  ArrowLeft,
  Sparkles,
  PawPrint,
} from "lucide-react";
import { IoShieldCheckmark } from "react-icons/io5";
import { PiFireFill } from "react-icons/pi";
import { cn } from "@/lib/utils";
import {
  useLanguage,
  dictionaries,
} from "@/components/providers/LanguageProvider";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { PropertyImage } from "@/features/properties/types";
import { MdOutlinePets } from "react-icons/md";
import { FaAirbnb } from "react-icons/fa6";
import { FaCity } from "react-icons/fa";
import { HiBuildingOffice2 } from "react-icons/hi2";

import { type Language } from "@/lib/i18n";
import { getPublicImageUrl } from "@/features/properties/image-utils";

export interface GalleryImage {
  id?: string;
  url?: string;
  image_url?: string;
  is_cover?: boolean | null;
  sort_order?: number | null;
  storage_path?: string;
}

interface PropertyGalleryProps {
  images: GalleryImage[];
  title: string;
  isHot?: boolean;
  verified?: boolean;
  isCbd?: boolean;
  petFriendly?: boolean;
  allowAirbnb?: boolean;
  isTaxRegistered?: boolean;
  propertyId?: string;
  language?: Language;
  imageAlt?: string;
}

// ImageWithFallback as a separate component to avoid re-creation on every render
const ImageWithFallback = ({
  img,
  alt,
  className,
  containerClassName,
  priority = false,
  sizes,
  fill = true,
  onImageError,
  failedImages,
  showFallback = true,
}: {
  img: GalleryImage;
  alt: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
  fill?: boolean;
  onImageError: (id: string) => void;
  failedImages: Set<string>;
  showFallback?: boolean;
}) => {
  const rawTarget = img.url || img.image_url || img.storage_path || "";
  const srcUrl = getPublicImageUrl(rawTarget);
  const imgId = img.id || img.storage_path || srcUrl || "unknown";

  // If URL is empty, show fallback immediately
  if (!srcUrl) {
    if (!showFallback) return null;
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-slate-100 text-slate-400 absolute inset-0 h-full w-full",
          containerClassName,
        )}
      >
        <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
        <span className="text-[10px] font-medium opacity-60">No Image URL</span>
      </div>
    );
  }

  const hasFailed = failedImages.has(imgId);

  if (hasFailed) {
    if (!showFallback) return null;
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-slate-100 text-slate-400 absolute inset-0 h-full w-full",
          containerClassName,
        )}
      >
        <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
        <span className="text-[10px] font-medium opacity-60">Load Error</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden",
        containerClassName,
      )}
    >
      <Image
        key={srcUrl}
        src={srcUrl}
        alt={alt}
        fill={fill}
        priority={priority}
        {...(priority ? { fetchPriority: "high" } : {})}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        className={cn("transition-all duration-500", className)}
        sizes={sizes}
        onError={() => onImageError(imgId)}
      />
    </div>
  );
};

export function PropertyGallery({
  images,
  title,
  isHot,
  verified,
  isCbd,
  petFriendly,
  allowAirbnb,
  isTaxRegistered,
  propertyId,
  language: customLanguage,
  imageAlt,
}: PropertyGalleryProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;
  const router = useRouter();

  // Custom t function for language override
  const t = (key: string) => {
    if (!customLanguage) return globalT(key);
    const dict = dictionaries[language as keyof typeof dictionaries] as any;
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };

  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inlineActiveIndex, setInlineActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [visibleMobileCount, setVisibleMobileCount] = useState(5);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Thumbnail container ref for auto-scrolling
  const thumbContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active thumbnail into view when current index or lightbox visibility changes
  useEffect(() => {
    if (open && thumbContainerRef.current) {
      const activeThumb = thumbContainerRef.current.children[
        currentIndex
      ] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex, open]);

  // Sort: Cover first
  const sortedImages = [...(images || [])].sort((a, b) => {
    if (a.is_cover) return -1;
    if (b.is_cover) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const mainImage = sortedImages[0];
  const subImages = sortedImages.slice(1, 5); // Take next 4 for grid
  const remainingCount = Math.max(0, sortedImages.length - 5);

  // Progressive loading for mobile carousel: render only visibleMobileCount initially
  const mobileImages = sortedImages.slice(0, visibleMobileCount);

  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex(
      (prev) => (prev - 1 + sortedImages.length) % sortedImages.length,
    );
  };

  // Keyboard Navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowLeft") {
        setDirection(-1);
        setCurrentIndex(
          (prev) => (prev - 1 + sortedImages.length) % sortedImages.length,
        );
      } else if (e.key === "ArrowRight") {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, sortedImages.length]);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  if (!mainImage) {
    return (
      <div className="w-full aspect-video bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center">
          <ImageIcon className="h-12 w-12 opacity-50 mb-2" />
          <span className="block font-medium">{t("common.no_images")}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative group/gallery">
        {/* Desktop Badge Overlay Container (Hidden on Mobile) */}
        <div className="hidden lg:flex absolute top-6 left-6 flex-col gap-2 z-30 pointer-events-none">
          {/* Hot Deal Badge */}
          {isHot && (
            <div className="flex items-center bg-linear-to-br from-red-500 to-orange-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 pr-1.5 xl:group-hover/gallery:pr-4 cursor-default">
              <PiFireFill className="w-5 h-5 fill-yellow-200" />
              <span className="opacity-0 max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-bold transition-all duration-300 xl:group-hover/gallery:max-w-[100px] xl:group-hover/gallery:opacity-100 xl:group-hover/gallery:ml-2">
                HOT DEAL
              </span>
            </div>
          )}

          {/* Verified Badge */}
          {verified && (
            <div className="flex items-center bg-blue-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 pr-1.5 xl:group-hover/gallery:pr-4 cursor-default">
              <IoShieldCheckmark className="w-5 h-5" />
              <span className="opacity-0 max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-bold transition-all duration-300 xl:group-hover/gallery:max-w-[100px] xl:group-hover/gallery:opacity-100 xl:group-hover/gallery:ml-2">
                VERIFIED
              </span>
            </div>
          )}

          {/* Prime CBD Badge */}
          {isCbd && (
            <div className="flex items-center bg-white/90 text-emerald-700 p-2 rounded-full shadow-lg transition-all duration-300 pr-1.5 xl:group-hover/gallery:pr-4 cursor-default">
              <FaCity className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="opacity-0 max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-bold transition-all duration-300 xl:group-hover/gallery:max-w-[100px] xl:group-hover/gallery:opacity-100 xl:group-hover/gallery:ml-2 uppercase">
                Prime CBD
              </span>
            </div>
          )}

          {/* Pet Friendly Badge */}
          {petFriendly && (
            <div className="flex items-center bg-white/90 text-orange-600 p-2 rounded-full shadow-lg transition-all duration-300 pr-1.5 xl:group-hover/gallery:pr-4 cursor-default">
              <MdOutlinePets className="w-5 h-5 rotate-25" />
              <span className="opacity-0 max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-bold transition-all duration-300 xl:group-hover/gallery:max-w-[100px] xl:group-hover/gallery:opacity-100 xl:group-hover/gallery:ml-2 uppercase">
                Pet Friendly
              </span>
            </div>
          )}

          {/* Airbnb Allowed Badge */}
          {allowAirbnb && (
            <div className="flex items-center bg-[#FF5A5F] text-white p-2 rounded-full shadow-lg transition-all duration-300 pr-1.5 xl:group-hover/gallery:pr-4 cursor-default">
              <FaAirbnb className="w-5 h-5 shrink-0" />
              <span className="opacity-0 max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-bold transition-all duration-300 xl:group-hover/gallery:max-w-[100px] xl:group-hover/gallery:opacity-100 xl:group-hover/gallery:ml-2 uppercase">
                Airbnb
              </span>
            </div>
          )}

          {/* Company Registered Badge */}
          {isTaxRegistered && (
            <div className="flex items-center bg-emerald-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 pr-1.5 xl:group-hover/gallery:pr-4 cursor-default">
              <HiBuildingOffice2 className="w-5 h-5 shrink-0" />
              <span className="opacity-0 max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-bold transition-all duration-300 xl:group-hover/gallery:max-w-[100px] xl:group-hover/gallery:opacity-100 xl:group-hover/gallery:ml-2 uppercase">
                {language === "th" ? "จดบริษัทได้" : "Company Reg."}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Carousel (Visible on Mobile and Small Tablets Only) */}
        <div className="lg:hidden relative h-[320px] sm:h-[320px] md:h-[450px] lg:h-[450px] -mx-4 xs:-mx-6 sm:mx-0 rounded-none sm:rounded-xl overflow-hidden">
          {/* Top Left: Controls & Badges Container (100% Perfectly Aligned) */}
          <div className="absolute top-3 left-3 z-35 flex flex-col items-start gap-1.5 pointer-events-none">
            {/* Floating Back Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  typeof window !== "undefined" &&
                  window.history.length > 1
                ) {
                  router.back();
                } else {
                  router.push("/properties");
                }
              }}
              className="h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white flex items-center justify-center shadow-md transition-all border border-white/15 cursor-pointer touch-manipulation pointer-events-auto"
              aria-label={t("common.back") || "Back"}
            >
              <ArrowLeft className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Mobile Badges (Directly stacked with Back Button, exact h-7 w-7 matching circles) */}
            {isHot && (
              <div
                className={`h-7 flex items-center bg-linear-to-br from-red-500 to-orange-600 text-white rounded-full shadow-lg transition-all duration-300 cursor-default ${
                  inlineActiveIndex !== 0
                    ? "w-7 justify-center p-0"
                    : "px-2 justify-start"
                }`}
              >
                <PiFireFill className="w-3.5 h-3.5 fill-yellow-200 shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap text-[9px] font-bold transition-all duration-300 ${
                    inlineActiveIndex !== 0
                      ? "max-w-0 opacity-0 ml-0"
                      : "max-w-[150px] opacity-100 ml-1"
                  }`}
                >
                  HOT DEAL
                </span>
              </div>
            )}
            {verified && (
              <div
                className={`h-7 flex items-center bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 cursor-default ${
                  inlineActiveIndex !== 0
                    ? "w-7 justify-center p-0"
                    : "px-2 justify-start"
                }`}
              >
                <IoShieldCheckmark className="w-3.5 h-3.5 shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap text-[9px] font-bold transition-all duration-300 ${
                    inlineActiveIndex !== 0
                      ? "max-w-0 opacity-0 ml-0"
                      : "max-w-[150px] opacity-100 ml-1"
                  }`}
                >
                  VERIFIED
                </span>
              </div>
            )}
            {isCbd && (
              <div
                className={`h-7 flex items-center bg-white/90 text-emerald-700 rounded-full shadow-lg transition-all duration-300 cursor-default ${
                  inlineActiveIndex !== 0
                    ? "w-7 justify-center p-0"
                    : "px-2 justify-start"
                }`}
              >
                <FaCity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap text-[9px] font-bold transition-all duration-300 uppercase ${
                    inlineActiveIndex !== 0
                      ? "max-w-0 opacity-0 ml-0"
                      : "max-w-[150px] opacity-100 ml-1"
                  }`}
                >
                  Prime CBD
                </span>
              </div>
            )}
            {petFriendly && (
              <div
                className={`h-7 flex items-center bg-white/90 text-orange-600 rounded-full shadow-lg transition-all duration-300 cursor-default ${
                  inlineActiveIndex !== 0
                    ? "w-7 justify-center p-0"
                    : "px-2 justify-start"
                }`}
              >
                <MdOutlinePets className="w-3.5 h-3.5 rotate-25 shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap text-[9px] font-bold transition-all duration-300 uppercase ${
                    inlineActiveIndex !== 0
                      ? "max-w-0 opacity-0 ml-0"
                      : "max-w-[150px] opacity-100 ml-1"
                  }`}
                >
                  Pet Friendly
                </span>
              </div>
            )}
            {allowAirbnb && (
              <div
                className={`h-7 flex items-center bg-[#FF5A5F] text-white rounded-full shadow-lg transition-all duration-300 cursor-default ${
                  inlineActiveIndex !== 0
                    ? "w-7 justify-center p-0"
                    : "px-2 justify-start"
                }`}
              >
                <FaAirbnb className="w-3.5 h-3.5 shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap text-[9px] font-bold transition-all duration-300 uppercase ${
                    inlineActiveIndex !== 0
                      ? "max-w-0 opacity-0 ml-0"
                      : "max-w-[150px] opacity-100 ml-1"
                  }`}
                >
                  Airbnb
                </span>
              </div>
            )}
            {isTaxRegistered && (
              <div
                className={`h-7 flex items-center bg-emerald-600 text-white rounded-full shadow-lg transition-all duration-300 cursor-default ${
                  inlineActiveIndex !== 0
                    ? "w-7 justify-center p-0"
                    : "px-2 justify-start"
                }`}
              >
                <HiBuildingOffice2 className="w-3.5 h-3.5 shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap text-[9px] font-bold transition-all duration-300 uppercase ${
                    inlineActiveIndex !== 0
                      ? "max-w-0 opacity-0 ml-0"
                      : "max-w-[150px] opacity-100 ml-1"
                  }`}
                >
                  {language === "th" ? "จดบริษัทได้" : "Company Reg."}
                </span>
              </div>
            )}
          </div>

          <div className="absolute top-3 right-3 z-35 flex flex-col items-end gap-2">
            <div className="h-7 px-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow-md transition-all border border-white/15 text-[10px] font-medium cursor-default select-none">
              <ImageIcon className="w-3 h-3 mr-1 shrink-0" />
              <span>
                {sortedImages.length} {t("common.images")}
              </span>
            </div>
          </div>

          {/* Pagination Dots */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none opacity-100 xl:opacity-0 xl:group-hover/gallery:opacity-100 transition-opacity duration-300">
              {sortedImages
                .slice(
                  Math.floor(inlineActiveIndex / 10) * 10,
                  Math.floor(inlineActiveIndex / 10) * 10 + 10,
                )
                .map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === inlineActiveIndex % 10
                        ? "w-4 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                        : "w-1 bg-white/80 shadow-sm"
                    }`}
                  />
                ))}
            </div>
          )}

          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory h-full w-full no-scrollbar touch-pan-x overscroll-x-contain"
            onScroll={(e) => {
              const scrollLeft = e.currentTarget.scrollLeft;
              const width = e.currentTarget.offsetWidth;
              const newIndex = Math.round(scrollLeft / width);
              if (newIndex !== inlineActiveIndex) {
                setInlineActiveIndex(newIndex);
              }
              // Progressive load: expand when user swipes near end of visible images
              if (
                newIndex >= mobileImages.length - 2 &&
                mobileImages.length < sortedImages.length
              ) {
                setVisibleMobileCount(sortedImages.length);
              }
            }}
          >
            {mobileImages.map((img, idx) => (
              <div
                key={`${img.id || img.storage_path || img.url || img.image_url || idx}-${idx}`}
                className="shrink-0 w-full h-full snap-center relative overflow-hidden"
                onClick={() => {
                  setCurrentIndex(idx);
                  setOpen(true);
                  try {
                    pushToDataLayer(GTM_EVENTS.VIEW_GALLERY_FULL, {
                      item_id: propertyId,
                      item_name: title,
                      // Meta Pixel
                      content_ids: [propertyId],
                      content_name: title,
                      content_type: "product",
                    });
                  } catch (e) {}
                }}
              >
                {/* Blurred Background */}
                <ImageWithFallback
                  img={img}
                  alt=""
                  containerClassName="absolute inset-0"
                  className="object-cover blur-xl opacity-80 scale-105"
                  sizes="10vw"
                  onImageError={handleImageError}
                  failedImages={failedImages}
                  showFallback={false}
                />
                {/* Main Content Image */}
                <ImageWithFallback
                  img={img}
                  alt={`${imageAlt || title} - ${idx + 1}`}
                  containerClassName="relative z-10 "
                  className="object-contain "
                  priority={idx === 0}
                  sizes="(max-width: 768px) 100vw, 33vw "
                  onImageError={handleImageError}
                  failedImages={failedImages}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Grid (Hidden on Mobile and Small Tablets) */}
        <div className="hidden lg:grid grid-cols-4 gap-1.5 md:gap-2 h-[350px] lg:h-[450px] xl:h-[550px] rounded-2xl lg:rounded-3xl overflow-hidden relative shadow-xl shadow-slate-200/70 ">
          {/* Main Image (Large Left) */}
          <div
            className={`${
              sortedImages.length === 1 ? "col-span-4" : "col-span-2"
            } row-span-2 relative cursor-pointer overflow-hidden group/main`}
            onClick={() => {
              setCurrentIndex(0);
              setOpen(true);
              try {
                pushToDataLayer(GTM_EVENTS.VIEW_GALLERY_FULL, {
                  item_id: propertyId,
                  item_name: title,
                  // Meta Pixel
                  content_ids: [propertyId],
                  content_name: title,
                  content_type: "product",
                });
              } catch (e) {}
            }}
          >
            {/* Blurred Background */}
            <ImageWithFallback
              img={mainImage}
              alt=""
              containerClassName="absolute inset-0"
              className="object-cover blur-xl opacity-70 scale-105 group-hover/main:scale-105 transition-transform duration-700"
              sizes="10vw"
              onImageError={handleImageError}
              failedImages={failedImages}
              showFallback={false}
            />
            {/* Main Image */}
            <ImageWithFallback
              img={mainImage}
              alt={imageAlt || title}
              containerClassName="relative z-10"
              className="object-contain group-hover/main:scale-105 transition-transform duration-700"
              priority
              sizes="50vw"
              onImageError={handleImageError}
              failedImages={failedImages}
            />
          </div>

          {/* Sub Images (Grid Right) */}
          {sortedImages.length > 1 && (
            <div
              className={`grid gap-2 col-span-2 row-span-2 max-h-full ${
                sortedImages.length === 2
                  ? "grid-cols-1"
                  : sortedImages.length === 3
                    ? "grid-cols-1 grid-rows-2"
                    : "grid-cols-2 grid-rows-2"
              }`}
            >
              {subImages.map((img, idx) => {
                const isFirstOfThree = sortedImages.length === 4 && idx === 0;
                return (
                  <div
                    key={`${img.id || img.storage_path || img.url || img.image_url || idx}-${idx}`}
                    className={`relative cursor-pointer overflow-hidden group/sub ${
                      isFirstOfThree ? "col-span-2" : ""
                    }`}
                    onClick={() => {
                      setCurrentIndex(idx + 1);
                      setOpen(true);
                      try {
                        pushToDataLayer(GTM_EVENTS.VIEW_GALLERY, {
                          item_id: propertyId,
                          item_name: title,
                          image_index: idx + 1,
                          // Meta Pixel
                          content_ids: [propertyId],
                          content_name: title,
                          content_type: "product",
                        });
                      } catch (e) {}
                    }}
                  >
                    {/* Blurred Background */}
                    <ImageWithFallback
                      img={img}
                      alt=""
                      containerClassName="absolute inset-0"
                      className="object-cover blur-lg opacity-40 scale-105 group-hover/sub:scale-110 transition-transform duration-500"
                      sizes="10vw"
                      onImageError={handleImageError}
                      failedImages={failedImages}
                      showFallback={false}
                    />
                    {/* Main Image */}
                    <ImageWithFallback
                      img={img}
                      alt={`${imageAlt || title} - ${idx + 2}`}
                      containerClassName="relative z-10"
                      className="object-cover group-hover/sub:scale-105 transition-transform duration-500"
                      sizes="25vw"
                      onImageError={handleImageError}
                      failedImages={failedImages}
                    />
                    {/* Overlay for the last visible image if more exist */}
                    {idx === 3 && remainingCount > 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg hover:bg-black/70 transition-colors">
                        +{remainingCount} {t("common.images")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Desktop View All Button */}
          <div className="absolute bottom-4 right-4 lg:bottom-6 lg:right-6 z-30">
            <Button
              variant="secondary"
              className="bg-white/80 hover:bg-white text-slate-900 shadow-md h-9 lg:h-10 px-3 lg:px-4 rounded-xl text-sm font-semibold"
              onClick={() => setOpen(true)}
            >
              <ImageIcon className="w-4 h-4 mr-1.5 lg:mr-2" />
              {t("common.view_all_images")} ({sortedImages.length})
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
              w-full! h-[100dvh]! max-h-[100dvh]!
              max-w-none!
              rounded-none!
              p-0 border-none bg-black/90
              flex flex-col items-center justify-center
              z-150 overflow-hidden"
          showCloseButton={false}
          overlayClassName="z-150"
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

          {/* Lightbox Header - Split Design with Safe Area Top */}
          <div
            className="absolute top-0 left-0 right-16 z-50 flex flex-col gap-2 p-4 pointer-events-none"
            style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 1rem))" }}
          >
            <div className="bg-black/75 px-4 py-2 rounded-lg border border-white/10 w-fit max-w-full">
              <span className="text-white font-bold text-sm md:text-base line-clamp-1">
                {title}
              </span>
            </div>
            <div className="bg-black/75 px-3 py-1 rounded-full border border-white/10 w-fit">
              <span className="text-white/90 text-[10px] md:text-xs font-bold tracking-widest">
                {currentIndex + 1} / {sortedImages.length}
              </span>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
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
                <ImageWithFallback
                  img={sortedImages[currentIndex]}
                  alt={title}
                  className="object-contain pointer-events-none"
                  priority
                  sizes="100vw"
                  fill={true}
                  onImageError={handleImageError}
                  failedImages={failedImages}
                />
              </m.div>
            </AnimatePresence>
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
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all z-50"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next image"
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-4 bg-black/50 text-white rounded-full hover:bg-black/70 transition-all z-50"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </>
          )}

          {/* Thumbnails Strip (Bottom Footer) - Elevated above iOS Safari Navigation Bar */}
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
              {sortedImages.map((img, idx) => (
                <button
                  key={`${img.id || img.storage_path || img.url || img.image_url || idx}-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "relative w-12 h-12 md:w-16 md:h-16 rounded-md md:rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                    currentIndex === idx
                      ? "border-white scale-105 md:scale-110 shadow-lg"
                      : "border-white/30 opacity-60 hover:opacity-100 hover:border-white/60",
                  )}
                >
                  <ImageWithFallback
                    img={img}
                    alt={`${imageAlt || title} thumbnail ${idx + 1}`}
                    className="object-cover"
                    sizes="10vw"
                    onImageError={handleImageError}
                    failedImages={failedImages}
                  />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
