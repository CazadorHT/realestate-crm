"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, PawPrint, ChevronLeft, ChevronRight, CheckSquare, Square, MoreVertical, Share2, Copy, Check } from "lucide-react";
import { IoShieldCheckmark } from "react-icons/io5";
import { getTypeLabel, getListingBadge } from "@/lib/property-utils";
import type { PropertyCardProps } from "../PropertyCard";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { MdOutlinePets } from "react-icons/md";
import { PiFireFill } from "react-icons/pi";
import { useState, useRef, useEffect, useCallback } from "react";
import { pushToDataLayer, GTM_EVENTS } from "@/lib/gtm";
import { updateAIScore } from "@/lib/analytics-utils";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface PropertyCardImageProps {
  property: PropertyCardProps;
  priority?: boolean;
  isFavorite: boolean;
  isAnimating: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  comparisonBadges: { label: string; icon: any; color: string }[];
  areaProvince: string;
  isHotDeal?: boolean;
  isInCompare: boolean;
  onCompareClick: (e: React.MouseEvent) => void;
  hideShare?: boolean;
}

export function PropertyCardImage({
  property,
  priority = false,
  isFavorite,
  isAnimating,
  onFavoriteClick,
  comparisonBadges,
  areaProvince,
  isHotDeal = false,
  isInCompare,
  onCompareClick,
  hideShare = false,
}: PropertyCardImageProps) {
  const { t, language } = useLanguage();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Quick Share States
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const isMobile = useIsMobile();
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  // Close share dropdown on click outside (Desktop only)
  useEffect(() => {
    if (!showShareMenu || isMobile) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showShareMenu, isMobile]);

  // Tracking refs (prevent duplicate fires per card instance)
  const hasTrackedSlide = useRef(false);
  const hasTrackedMid = useRef(false);
  const hasTrackedHalf = useRef(false);
  const hasTrackedDeep = useRef(false);
  const hasTrackedAll = useRef(false);
  const viewedImages = useRef(new Set<number>());

  // Touch handling refs for directional swipe detection
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Normalized images list from both possible formats (string array or object array with .url)
  const displayImages = (() => {
    const rawImages: (string | { url: string } | null | undefined)[] = 
      property.images && property.images.length > 0
        ? property.images
        : [property.image_url];
    
    return (rawImages || [])
      .filter((img): img is string | { url: string } => img !== null && img !== undefined)
      .map(img => {
        if (typeof img === 'string') return img;
        return (img as { url: string }).url;
      })
      .filter(url => typeof url === 'string' && url.trim() !== "");
  })();

  const badge = getListingBadge(property.listing_type);

  const trackImageParams = useCallback(() => ({
    item_id: property.id,
    item_name: property.title,
    content_ids: [property.id],
    content_type: "product",
  }), [property.id, property.title]);

  // Touch handlers: detect horizontal vs vertical swipe direction
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null; // reset direction
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;

    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

    // Determine direction on first significant move (threshold: 5px)
    if (isHorizontalSwipe.current === null && (dx > 5 || dy > 5)) {
      isHorizontalSwipe.current = dx > dy;
    }

    // If vertical swipe: let browser handle scrolling naturally
    if (isHorizontalSwipe.current === false) {
      scrollRef.current.style.overflowX = "hidden";
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Re-enable horizontal scroll after touch ends
    if (scrollRef.current) {
      scrollRef.current.style.overflowX = "auto";
    }
    isHorizontalSwipe.current = null;
  }, []);

  // Handle scroll for pagination dots + tracking
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      if (index !== activeImageIndex) {
        setActiveImageIndex(index);

        // Track viewed images
        viewedImages.current.add(index);
        const uniqueCount = viewedImages.current.size;

        // 1) First slide: image_slide
        if (!hasTrackedSlide.current && index > 0) {
          hasTrackedSlide.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE, {
            ...trackImageParams(),
            total_images: displayImages.length,
          });
          updateAIScore(2);
        }

        // 1.5) Viewed 3+ unique images: image_slide_mid (but less than 10)
        if (!hasTrackedMid.current && uniqueCount >= 3 && uniqueCount < 10) {
          hasTrackedMid.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE_MID, {
            ...trackImageParams(),
            images_viewed: uniqueCount,
            total_images: displayImages.length,
          });
          updateAIScore(3);
        }

        // 1.8) Viewed > 50% of images: image_slide_half
        if (!hasTrackedHalf.current && uniqueCount > displayImages.length / 2 && displayImages.length > 2) {
          hasTrackedHalf.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE_HALF, {
            ...trackImageParams(),
            images_viewed: uniqueCount,
            total_images: displayImages.length,
          });
          updateAIScore(4);
        }

        // 2) Viewed 10+ unique images: image_slide_deep
        if (!hasTrackedDeep.current && uniqueCount >= 10) {
          hasTrackedDeep.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE_DEEP, {
            ...trackImageParams(),
            images_viewed: uniqueCount,
            total_images: displayImages.length,
          });
          updateAIScore(5);
        }

        // 3) Viewed ALL images: image_slide_all
        if (!hasTrackedAll.current && uniqueCount >= displayImages.length && displayImages.length > 1) {
          hasTrackedAll.current = true;
          pushToDataLayer(GTM_EVENTS.IMAGE_SLIDE_ALL, {
            ...trackImageParams(),
            total_images: displayImages.length,
          });
          updateAIScore(8);
        }
      }
    }
  };

  const scrollPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
    // Track image click (arrow navigation)
    pushToDataLayer(GTM_EVENTS.IMAGE_CLICK, {
      ...trackImageParams(),
      direction: "prev",
      current_index: activeImageIndex,
    });
  };

  const scrollNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: scrollRef.current.clientWidth,
        behavior: "smooth",
      });
    }
    // Track image click (arrow navigation)
    pushToDataLayer(GTM_EVENTS.IMAGE_CLICK, {
      ...trackImageParams(),
      direction: "next",
      current_index: activeImageIndex,
    });
  };

  // Translate badge label if needed
  const displayBadgeLabel = badge
    ? badge.label === "ขาย"
      ? t("common.sale")
      : badge.label === "เช่า"
        ? t("common.rent")
        : badge.label === "ขาย/เช่า"
          ? `${t("common.sale")}/${t("common.rent")}`
          : badge.label
    : null;

  return (
    <div 
      className="group/image relative aspect-square sm:aspect-4/3 md:aspect-square h-auto sm:h-auto md:h-[300px] w-full overflow-hidden rounded-t-2xl sm:rounded-t-2xl md:rounded-t-3xl bg-slate-200 group-hover:after:bg-black/5"
    >
      {displayImages.length > 0 ? (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
        >
          {displayImages.map((img, index) => (
            <Link
              key={index}
              href={`/properties/${property.slug || property.id}`}
              className="relative h-full w-full shrink-0 snap-start block"
            >
              {/* Shimmer placeholder while image is loading */}
              {!loadedImages[index] && (
                <div className="absolute inset-0 z-10 bg-slate-200 animate-pulse" />
              )}
              <Image
                src={img}
                alt={`${
                  property.listing_type === "RENT"
                    ? t("common.rent")
                    : property.listing_type === "SALE"
                      ? t("common.sale")
                      : `${t("common.sale")}/${t("common.rent")}`
                } ${t(
                  `property_types.${property.property_type?.toLowerCase() || "other"}`,
                )} - ${property.title}${
                  areaProvince ? ` ${t("nav.properties")} ${areaProvince}` : ""
                } - Image ${index + 1}`}
                fill
                sizes="(max-width: 640px) 95vw, (max-width: 1024px) 48vw, (max-width: 1280px) 31vw, 23vw"
                className={`object-cover object-center transform-gpu will-change-transform transition-[filter] duration-500 ${
                  loadedImages[index] ? "blur-0" : "blur-sm"
                }`}
                priority={priority && index === 0}
                {...(!(priority && index === 0) && { loading: "lazy" })}
                onLoad={() => setLoadedImages(prev => ({ ...prev, [index]: true }))}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
          {t("recently_viewed.no_image")}
        </div>
      )}

      {/* Pagination Dots */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none opacity-100 xl:opacity-0 xl:group-hover/imgwrap:opacity-100 transition-opacity duration-300">
          {displayImages
            .slice(
              Math.floor(activeImageIndex / 10) * 10,
              Math.floor(activeImageIndex / 10) * 10 + 10
            )
            .map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === activeImageIndex % 10
                    ? "w-4 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                    : "w-1 bg-white/80 shadow-sm"
                }`}
              />
            ))}
        </div>
      )}

      {/* Navigation Arrows (Desktop Only) */}
      {displayImages.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover/imgwrap:opacity-100 transition-all duration-300 shadow-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border border-white/30 opacity-0 group-hover/imgwrap:opacity-100 transition-all duration-300 shadow-sm"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <div className="pointer-events-none absolute inset-0 rounded-t-2xl md:rounded-t-3xl bg-linear-to-t from-black/50 via-transparent to-transparent" />

      {/* Badge Overlay Container */}
      <div className="absolute top-3 left-3 flex flex-col items-start gap-2 z-20">
        {/* Hot Deal Badge */}
        {isHotDeal && (
          <div className="flex items-center gap-1 bg-red-600/95 backdrop-blur-xs text-white px-2.5 py-1 rounded-md shadow-md border border-white/10 select-none cursor-default font-bold text-[10px] md:text-xs">
            <PiFireFill className="w-3.5 h-3.5 md:w-4 md:h-4 fill-yellow-300 shrink-0" />
            <span>
              {language === "th" ? "ลดแรง" : "Hot Deal"}
            </span>
          </div>
        )}


        {/* Verified Badge */}
        {property.verified && (
          <div className={`flex items-center bg-blue-600/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-lg transition-all duration-300 cursor-default ${activeImageIndex === 0 ? "group-hover:pr-3" : ""}`}>
            <IoShieldCheckmark className="w-5 h-5" />
            <span className={`max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 ${activeImageIndex === 0 ? "group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-1.5" : ""}`}>
              VERIFIED
            </span>
          </div>
        )}

        {/* Pet Friendly Badge */}
        {property.meta_keywords?.includes("Pet Friendly") && (
          <div className={`flex items-center bg-white/90 backdrop-blur-md text-orange-600 p-1.5 rounded-full shadow-lg transition-all duration-300 cursor-default ${activeImageIndex === 0 ? "group-hover:pr-3" : ""}`}>
            <MdOutlinePets className="w-5 h-5 rotate-25" />
            <span className={`max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 uppercase ${activeImageIndex === 0 ? "group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-1.5" : ""}`}>
              Pet Friendly
            </span>
          </div>
        )}

        {/* Comparison Badges */}
        {comparisonBadges.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className={`flex items-center ${b.color} backdrop-blur-md p-1.5 rounded-full shadow-lg transition-all duration-300 cursor-default ${activeImageIndex === 0 ? "group-hover/image:pr-3" : ""}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={`max-w-0 opacity-0 overflow-hidden whitespace-nowrap text-[10px] font-bold transition-all duration-300 uppercase ${activeImageIndex === 0 ? "group-hover/image:max-w-[120px] group-hover/image:opacity-100 group-hover/image:ml-1.5" : ""}`}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>


      {/* Top Right Actions (Share, Favorite) Grouped Automatically */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 sm:gap-2 z-30">
         {/* Favorite Button */}
        <button
          onClick={onFavoriteClick}
          aria-label={isFavorite ? t("common.remove_favorite") || "Remove from favorite" : t("common.add_favorite") || "Add to favorite"}
          className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
            isFavorite
              ? "bg-red-500 text-white shadow-lg"
              : "bg-white/40 text-[#1B263B] hover:bg-red-500 hover:text-white"
          } ${isAnimating ? "scale-115" : "scale-100"}`}
        >
          <Heart
            className={`h-4 w-4 transition-all duration-500 ${
              isFavorite ? "fill-current scale-110" : "scale-100"
            } ${isAnimating ? "animate-pulse" : ""}`}
            style={{
              transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </button>

        {/* Share Button Group */}
        {!hideShare && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowShareMenu(!showShareMenu);
              }}
              aria-label="Share property"
              className={`p-2 rounded-full backdrop-blur-md transition-all duration-300 ${
                showShareMenu
                  ? "bg-[#1B263B] text-white shadow-lg"
                  : "bg-white/40 text-[#1B263B] hover:bg-[#1B263B] hover:text-white"
              }`}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Quick Share Dropdown Menu (Desktop/sm+ only) */}
            {showShareMenu && !isMobile && (
              <div
                ref={shareMenuRef}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="absolute top-11 right-0 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-1.5 z-40 animate-in fade-in slide-in-from-top-2 duration-150 flex flex-col gap-0.5 text-slate-700"
              >
                {canShare && (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      try {
                        await navigator.share({
                          title: property.title,
                          url: `${window.location.origin}/properties/${property.slug || property.id}`,
                        });
                      } catch (err) {
                        console.error("Error sharing:", err);
                      }
                      setShowShareMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <Share2 className="w-4 h-4 text-slate-500" />
                    <span>{language === "th" ? "แชร์ภายนอก" : "Share Menu"}</span>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const url = `${window.location.origin}/properties/${property.slug || property.id}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => {
                      setCopied(false);
                      setShowShareMenu(false);
                    }, 1200);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors text-left w-full"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>{copied ? (language === "th" ? "คัดลอกแล้ว!" : "Copied!") : (language === "th" ? "คัดลอกลิงก์" : "Copy Link")}</span>
                </button>

                <a
                  href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
                    `${window.location.origin}/properties/${property.slug || property.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShareMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-[#06C755] fill-current" viewBox="0 0 24 24">
                    <path d="M24 10.3c0-5.7-5.4-10.3-12-10.3S0 4.6 0 10.3c0 5.1 4.3 9.3 10.1 10.1.4.1.9.3 1 .6.1.3.1.8 0 1.1l-.4 2.3c-.1.7.3.3.7-.1l4.7-4.7c3.4-1.2 7.9-4.3 7.9-9.3zm-16.5 3.5c-.3 0-.6-.3-.6-.6v-5.2c0-.3.3-.6.6-.6s.6.3.6.6v5.2c0 .3-.3.6-.6.6zm3.3 0c-.3 0-.6-.3-.6-.6v-5.2c0-.3.3-.6.6-.6s.6.3.6.6v2.1l2-2.3c.1-.1.3-.2.5-.2.4 0 .7.3.7.7 0 .2-.1.4-.2.5l-1.5 1.7 1.8 2.5c.1.2.2.4.2.6 0 .4-.3.7-.7.7-.3 0-.5-.1-.6-.3l-1.7-2.4-.5.6v1.5c0 .3-.3.6-.6.6zm5.8 0c-.3 0-.6-.3-.6-.6v-5.2c0-.3.3-.6.6-.6s.6.3.6.6v5.2c0 .3-.3.6-.6.6zm3.5-.6c0 .3-.3.6-.6.6h-2.3c-.3 0-.6-.3-.6-.6v-5.2c0-.3.3-.6.6-.6s.6.3.6.6v4.6h1.7c.3 0 .6.3.6.6z"/>
                  </svg>
                  <span>LINE</span>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `${window.location.origin}/properties/${property.slug || property.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShareMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-[#1877F2] fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      
      {displayBadgeLabel && (
        <div className="absolute bottom-3 right-3 bg-white/85 backdrop-blur-md border border-white/30 text-[#12213b] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          {displayBadgeLabel}
        </div>
      )}

      {/* Quick Share Responsive Dialog/Drawer (Mobile only) */}
      {!hideShare && isMobile && (
        <ResponsiveDialog
          open={showShareMenu}
          onOpenChange={setShowShareMenu}
          title={language === "th" ? "แชร์อสังหาริมทรัพย์" : "Share Property"}
          description={language === "th" ? "เลือกช่องทางในการแชร์ข้อมูลอสังหาริมทรัพย์นี้" : "Choose a platform to share this property"}
          className="sm:max-w-md"
          confirmOnClose={false}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="p-6 flex flex-col gap-3 text-slate-700"
          >
            {/* 1. แชร์ระบบ (System Share) */}
            {canShare && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    await navigator.share({
                      title: property.title,
                      url: `${window.location.origin}/properties/${property.slug || property.id}`,
                    });
                  } catch (err) {
                    console.error("Error sharing:", err);
                  }
                  setShowShareMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all text-slate-800 active:scale-98"
              >
                <Share2 className="w-5 h-5 text-slate-600" />
                <span>{language === "th" ? "แชร์ภายนอก" : "System Share"}</span>
              </button>
            )}

            {/* 2. คัดลอกลิงก์ (Copy Link) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = `${window.location.origin}/properties/${property.slug || property.id}`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => {
                  setCopied(false);
                  setShowShareMenu(false);
                }, 1200);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition-all active:scale-98"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>{language === "th" ? "คัดลอกสำเร็จแล้ว!" : "Copied!"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-slate-300" />
                  <span>{language === "th" ? "คัดลอกลิงก์" : "Copy Link"}</span>
                </>
              )}
            </button>

            {/* 3. LINE */}
            <a
              href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
                `${window.location.origin}/properties/${property.slug || property.id}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                setShowShareMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl bg-[#06C755] hover:bg-[#05b34d] text-white transition-all active:scale-98"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 10.3c0-5.7-5.4-10.3-12-10.3S0 4.6 0 10.3c0 5.1 4.3 9.3 10.1 10.1.4.1.9.3 1 .6.1.3.1.8 0 1.1l-.4 2.3c-.1.7.3.3.7-.1l4.7-4.7c3.4-1.2 7.9-4.3 7.9-9.3zm-16.5 3.5c-.3 0-.6-.3-.6-.6v-5.2c0-.3.3-.6.6-.6s.6.3.6.6v5.2c0 .3-.3.6-.6.6zm3.3 0c-.3 0-.6-.3-.6-.6v-5.2c0-.3.3-.6.6-.6s.6.3.6.6v2.1l2-2.3c.1-.1.3-.2.5-.2.4 0 .7.3.7.7 0 .2-.1.4-.2.5l-1.5 1.7 1.8 2.5c.1.2.2.4.2.6 0 .4-.3.7-.7.7-.3 0-.5-.1-.6-.3l-1.7-2.4-.5.6v1.5c0 .3-.3.6-.6.6zm5.8 0c-.3 0-.6-.3-.6-.6v-5.2c0-.3.3-.6.6-.6s.6.3.6.6v5.2c0 .3-.3.6-.6.6zm3.5-.6c0 .3-.3.6-.6.6h-2.3c-.3 0-.6-.3-.6-.6v-5.2c0-.3.3-.6.6-.6s.6.3.6.6v4.6h1.7c.3 0 .6.3.6.6z"/>
              </svg>
              <span>LINE</span>
            </a>

            {/* 4. Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                `${window.location.origin}/properties/${property.slug || property.id}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                setShowShareMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl bg-[#1877F2] hover:bg-[#115fc4] text-white transition-all active:scale-98"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </a>
          </div>
        </ResponsiveDialog>
      )}
    </div>
  );
};