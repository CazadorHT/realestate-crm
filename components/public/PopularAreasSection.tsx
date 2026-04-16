"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { getProvinceName } from "@/lib/utils/provinces";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ApiPopularArea = {
  popular_area: string;
  popular_area_en: string | null;
  popular_area_cn: string | null;
  province: string;
  count: number;
  cover?: string | null;
};

type AreaItem = {
  key: string;
  popular_area: string; // ชื่อทำเล (Default/Thai)
  popular_area_en: string | null;
  popular_area_cn: string | null;
  count: number; // จำนวนทรัพย์
  cover?: string | null; // รูปภาพ
};

const LOADING = Array.from({ length: 6 });

export function PopularAreasSection() {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<AreaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic provinces state
  const [provinces, setProvinces] = useState<{ id: string; display: string }[]>(
    [],
  );
  const [activeProvIndex, setActiveProvIndex] = useState(0);

  const activeProvince = provinces[activeProvIndex]?.id || "กรุงเทพมหานคร";
  const activeDisplay = provinces[activeProvIndex]
    ? getProvinceName(provinces[activeProvIndex].id, language)
    : "Bangkok";

  const nextProvIndex = (activeProvIndex + 1) % (provinces.length || 1);
  const nextDisplay = provinces[nextProvIndex]
    ? getProvinceName(provinces[nextProvIndex].id, language)
    : "";

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Touch handling refs for directional swipe detection
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  // Touch handlers: detect horizontal vs vertical swipe direction
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null; // reset direction
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;

    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

    // Determine direction on first significant move (threshold: 5px)
    if (isHorizontalSwipe.current === null && (dx > 5 || dy > 5)) {
      isHorizontalSwipe.current = dx > dy;
    }

    // If vertical swipe: let browser handle scrolling naturally
    if (isHorizontalSwipe.current === false) {
      scrollContainerRef.current.style.overflowX = "hidden";
    }
  };

  const handleTouchEnd = () => {
    // Re-enable horizontal scroll after touch ends
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.overflowX = "auto";
    }
    isHorizontalSwipe.current = null;
  };

  // Initialize AOS & Fetch Provinces
  useEffect(() => {
    // Delay AOS init
    const timer = setTimeout(() => {
      AOS.init({ duration: 800, easing: "ease-out-cubic", once: true });
    }, 100);

    // Fetch initial provinces
    async function fetchProvinces() {
      try {
        const res = await fetch("/api/public/popular-areas?mode=provinces");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setProvinces(data);
            // Default to Bangkok if found, else first
            const bkkIndex = data.findIndex(
              (p: any) => p.display === "Bangkok" || p.id === "กรุงเทพมหานคร",
            );
            if (bkkIndex !== -1) setActiveProvIndex(bkkIndex);
          }
        }
      } catch (err) {
        console.error("Fetch provinces error:", err);
      }
    }

    fetchProvinces();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (provinces.length === 0) return;

    const controller = new AbortController();
    async function load() {
      try {
        setIsLoading(true);
        const url = new URL(
          "/api/public/popular-areas",
          window.location.origin,
        );
        url.searchParams.set("province", activeProvince);

        const res = await fetch(url.toString(), {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("failed");
        const data: ApiPopularArea[] = await res.json();
        const list = (Array.isArray(data) ? data : []).map(
          (item: ApiPopularArea) => ({
            key: `${item.popular_area}__${item.province}`,
            popular_area: item.popular_area,
            popular_area_en: item.popular_area_en,
            popular_area_cn: item.popular_area_cn,
            province: item.province,
            count: item.count,
            cover: item.cover,
          }),
        );
        setItems(list);
        setHasError(false);
        // Refresh AOS after items change to ensure dynamic content starts animating
        setTimeout(() => AOS.refresh(), 100);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setHasError(true);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [activeProvince, provinces.length]);


  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="pt-8 bg-white">
      <div className="max-w-screen-2xl mx-auto sm:px-4 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between px-4 ">
          <div
            className="space-y-4 px-4 md:px-0 flex-1"
            data-aos="fade-right"
            suppressHydrationWarning
          >
            {/* Animated Badge with Glass Effect */}
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 backdrop-blur-md px-4 py-2 text-sm font-bold border border-blue-200/50 shadow-[0_4px_12px_rgba(59,130,246,0.1)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.2)] transition-all! duration-300! group cursor-default">
              <div className="relative">
                <MapPin className="h-4 w-4 relative z-10 text-blue-600" />
                <div className="absolute inset-0 bg-blue-400 blur-md opacity-20 group-hover:opacity-40 transition-opacity!" />
              </div>
              <span className="tracking-wide text-blue-700 font-extrabold">
                {t("home.popular_areas.title")}
              </span>
            </div>

            {/* SEO-Optimized Gradient Heading - Unified Flow for Responsive support */}
            <h2 className="font-bold text-slate-900 leading-relaxed flex flex-wrap items-center gap-x-3 xs:gap-x-4 gap-y-2 xs:gap-y-3 max-w-screen-2xl">
              <span className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl flex flex-wrap items-center gap-x-2 xs:gap-x-3">
                {t("home.popular_areas.subtitle")
                  .split("|")
                  .map((part, i) =>
                    i % 2 === 1 ? (
                      <span
                        key={i}
                        className="text-transparent inline-block leading-relaxed bg-clip-text bg-linear-to-r from-blue-600 via-blue-500 to-purple-600"
                      >
                        {part}
                      </span>
                    ) : (
                      <span key={i} className="inline-block leading-relaxed">
                        {part}
                      </span>
                    ),
                  )}
              </span>

              {/* Province Switcher UI: Integrated Inline */}
              {provinces.length > 1 && (
                /* 1. ใช้ flex-1 เพื่อให้กินพื้นที่ที่เหลือ 
                   2. ใช้ min-w-full ในหน้าจอเล็ก (xs/sm) เพื่อบังคับขึ้นบรรทัดใหม่แล้วเต็มจอ 
                   3. md:min-w-[200px] กลับไปเป็นขนาดปกติในจอใหญ่ 
                */
                <div className="flex-1 min-w-full sm:min-w-[250px] md:min-w-[300px] select-none relative my-4  xl:my-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeDisplay}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onAnimationComplete={() => {
                        // Ensure AOS refreshes after the title transition too
                        AOS.refresh();
                      }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="flex items-center w-full"
                    >
                      {/* Elite Superscript Label (Next Province) */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setActiveProvIndex(nextProvIndex)}
                              className="absolute -top-4 md:-top-7 left-0 flex items-center gap-2 group/sup cursor-pointer"
                            >
                              <span className="text-[10px] md:text-xs font-black tracking-[0.3em] text-blue-400/40 uppercase transition-all duration-500 group-hover/sup:text-blue-500 group-hover/sup:tracking-[0.5em] group-hover/sup:scale-110 origin-left italic">
                                NEXT: {nextDisplay}
                              </span>
                              <div className="h-px w-0 bg-blue-400/20 group-hover/sup:w-12 transition-all duration-700" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white border-none shadow-xl">
                            <p className="text-xs font-bold font-heading">Switch to {nextDisplay}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Active Label & Switcher */}
                      <div className="flex items-center justify-between xl:justify-start w-full gap-3 group/label  ">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 uppercase leading-tight block truncate transition-all duration-300 shadow-[0_4px_0_0_transparent] group-hover/label:shadow-[0_4px_0_0_#3b82f6]">
                                {activeDisplay}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="text-md ">
                              {activeDisplay}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <button
                          onClick={() => setActiveProvIndex(nextProvIndex)}
                          disabled={isLoading}
                          className="p-1.5 xs:p-2 rounded-lg xs:rounded-xl bg-slate-100 hover:bg-blue-600 text-blue-400 hover:text-white transition-all! group-active:scale-90 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <motion.div
                            animate={
                              isLoading
                                ? { rotate: 360 }
                                : { rotate: activeProvIndex * 180 }
                            }
                            transition={
                              isLoading
                                ? {
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }
                                : {
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                  }
                            }
                          >
                            <RefreshCw className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6" />
                          </motion.div>
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </h2>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 px-4! md:px-0">
          {" "}
          {/* min-w-0 สำคัญมากเพื่อให้ truncate ทำงาน */}
          {/* Subtitle Part 2: Separated line as requested */}
          <div
            className="flex flex-col px-4 md:px-0 "
            data-aos="fade-right"
            suppressHydrationWarning
          >
            <h2 className="text-base xs:text-base sm:text-xl md:text-2xl lg:text-3xl font-medium text-slate-600 leading-relaxed">
              {t("home.popular_areas.subtitle-2")}
            </h2>
            {/* SEO-Enhanced Description with Keywords */}
            <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed">
              {t("home.popular_areas.description")}
            </p>
          </div>
          <div className=" w-full md:w-auto md:shrink-0 px-4 md:px-0 ">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      const provinceId = provinces[activeProvIndex]?.id;
                      const qp = new URLSearchParams({ type: "ALL" });
                      if (provinceId) qp.set("province", provinceId);
                      router.push(`/?${qp.toString()}#latest-properties`);
                      document
                        .getElementById("latest-properties")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    data-aos="fade-left"
                    suppressHydrationWarning
                    className="group relative h-12 w-full md:w-auto px-8 overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all! duration-300! hover:scale-105 flex items-center justify-center"
                  >
                    {/* Animated gradient overlay */}
                    <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity! duration-500!" />

                    {/* Shine effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform! duration-700! bg-linear-to-r from-transparent via-white/20 to-transparent" />

                    {/* Button content */}
                    <div className="relative flex items-center gap-2">
                      <span>{t("common.view_all")}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform! duration-300!" />
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-sm font-medium">
                  {t("common.view_all")} {activeDisplay}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Content Area - Fixed height to prevent layout shift */}
        <div className="min-h-[250px] relative mx-4">
          {isLoading ? (
            <div className="relative">
              {/* Centered Loading Overlay */}
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-[2.5rem]">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600  animate-spin" />
                  </div>
                  <span className="text-blue-600 font-semibold animate-pulse">
                    {t("common.loading")}
                  </span>
                </div>
              </div>

              <div className="flex gap-4 overflow-hidden py-4 px-4 md:px-0">
                {LOADING.map((_, i) => (
                  <div
                    key={i}
                    className="h-[160px] sm:h-[180px] w-[220px] sm:w-[260px] shrink-0 rounded-4xl overflow-hidden"
                  >
                    <div className="h-full w-full animate-shimmer bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ) : hasError ? (
            <div
              className="rounded-[2.5rem] border-2 border-dashed border-red-200 bg-red-50/50 p-12 md:p-16 md:mb-10 text-center"
              data-aos="fade-up"
            >
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-red-500">
                <RefreshCw className="h-8 w-8" />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-2">
                {t("common.error_loading") || "Error Loading Data"}
              </h3>
              <p className="text-slate-500 font-medium mb-6">
                {t("common.search_error") || "Something went wrong. Please try again."}
              </p>
              <button
                onClick={() => {
                  // Manual reload trigger: re-running useEffect dependency trick
                  setActiveProvIndex(prev => prev); // Or just call fetch logic directly if extracted
                  window.location.reload(); // Simple retry for now
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all active:scale-95"
              >
                {t("common.retry") || "Retry"}
              </button>
            </div>
          ) : !items.length ? (
            <div
              className="rounded-[2.5rem] border-2 border-dashed border-blue-200 bg-blue-50/80 p-12 mb-8 md:p-16 text-center shadow-xs"
              data-aos="fade-up"
            >
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-blue-300">
                <MapPin className="h-8 w-8" />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-2">
                {activeDisplay}
              </h3>
              <p className="text-slate-500 font-medium">
                {t("home.popular_areas.no_data")}
              </p>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`flex w-full gap-4 sm:gap-5 overflow-x-auto pb-8 pt-4 px-4 md:px-0  snap-x snap-mandatory scrollbar-none transition-all!  ${
                isDragging ? "cursor-grabbing scale-[0.99]" : "cursor-grab"
              }`}
            >
              {items.map((it, index) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={(e) => {
                    if (isDragging) return e.preventDefault();
                    const qp = new URLSearchParams({
                      area: it.popular_area,
                    });
                    router.push(`/?${qp.toString()}#latest-properties`);
                  }}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                  className="group w-[220px] sm:w-[260px] relative isolate shrink-0 rounded-xl sm:rounded-4xl overflow-hidden bg-slate-900 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all! duration-500 text-left snap-start "
                >
                  {/* Image & Overlays */}
                  <div className="absolute inset-0 -z-10">
                    <Image
                      src={it.cover || "/images/area-placeholder1.jpg"}
                      alt={it.popular_area}
                      fill
                      sizes="260px"
                      className="object-cover transition-transform! duration-1000! group-hover:scale-110 "
                    />
                    {/* Double Gradient for readability */}
                    <div className="absolute inset-0 bg-black/10 transition-opacity! duration-500! group-hover:opacity-40" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent opacity-90" />
                  </div>

                  <div className="relative p-5 sm:p-6 h-[160px] sm:h-[180px] flex flex-col justify-end">
                    {/* ชื่อทำเล: ขยับขึ้นเสมอในมือถือ และขยับเมื่อ Hover ใน Desktop */}
                    <div className="transform transition-transform! duration-500! -translate-y-10 lg:translate-y-0 lg:group-hover:-translate-y-10">
                      <h3 className="text-white text-xl sm:text-2xl font-semibold tracking-tight drop-shadow-lg">
                        {getLocaleValue(
                          {
                            name: it.popular_area,
                            name_en: it.popular_area_en,
                            name_cn: it.popular_area_cn,
                          },
                          "name",
                          language,
                        )}
                      </h3>
                    </div>
                    {/* แถวข้อมูล: แสดงเลยในมือถือ และแสดงเมื่อ Hover ใน Desktop */}
                    <div className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 right-5 sm:right-6 flex items-center justify-between opacity-100 lg:opacity-0 lg:group-hover:opacity-100 translate-y-0 lg:translate-y-2 lg:group-hover:translate-y-0 transition-all! duration-300! gap-4">
                      <p className="bg-white/30 backdrop-blur-md border border-white/30 text-white/90 text-[10px] sm:text-[11px] font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-xl truncate max-w-[60%]">
                        {it.count.toLocaleString()}{" "}
                        {t("property_listing.found_suffix")}
                      </p>
                      <div className="flex items-center gap-1 text-white text-[10px] sm:text-xs font-semibold uppercase tracking-wider shrink-0">
                        <span className="hidden sm:inline truncate max-w-[80px]">
                          {t("home.popular_areas.explore")}
                        </span>
                        <ArrowRight className="h-3 w-3 shrink-0 transition-transform! lg:group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
