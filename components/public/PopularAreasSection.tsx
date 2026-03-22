"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getLocaleValue } from "@/lib/utils/locale-utils";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Dynamic provinces state
  const [provinces, setProvinces] = useState<{id: string, display: string}[]>([]);
  const [activeProvIndex, setActiveProvIndex] = useState(0);
  
  const activeProvince = provinces[activeProvIndex]?.id || "กรุงเทพมหานคร";
  const activeDisplay = provinces[activeProvIndex]?.display || "Bangkok";
  
  const nextProvIndex = (activeProvIndex + 1) % (provinces.length || 1);
  const nextDisplay = provinces[nextProvIndex]?.display || "";

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
            const bkkIndex = data.findIndex((p: any) => p.display === "Bangkok" || p.id === "กรุงเทพมหานคร");
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
        const url = new URL("/api/public/popular-areas", window.location.origin);
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
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
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
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-12 py-6 mb-4 px-4">
          <div
            className="space-y-4 px-4 md:px-0 flex-1 md:max-w-2xl lg:max-w-6xl"
            data-aos="fade-right"
            suppressHydrationWarning
          >
            {/* Animated Badge with Glow */}
            <div className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-blue-500/30 to-purple-500/30  px-4 py-2 text-sm font-bold border border-blue-200/50 shadow-sm hover:shadow-md hover:shadow-blue-500/20 transition-all! duration-300! group cursor-default">
              <div className="relative">
                <MapPin className="h-4 w-4 relative z-10 text-blue-600" />
                <div className="absolute inset-0 bg-blue-500 blur-md opacity-30 group-hover:opacity-50 transition-opacity!" />
              </div>
              <span className="tracking-wide text-blue-600">
                {t("home.popular_areas.title")}
              </span>
            </div>

            {/* SEO-Optimized Gradient Heading */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              {t("home.popular_areas.subtitle")
                .split("|")
                .map((part, i) =>
                  i % 2 === 1 ? (
                    <span
                      key={i}
                      className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-blue-500 to-purple-600"
                    >
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
            </h2>

            {/* SEO-Enhanced Description with Keywords */}
            <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed">
              {t("home.popular_areas.description")}
            </p>

            {/* Province Switcher UI: Superscript Design */}
            {provinces.length > 1 && (
              <div className="flex items-center gap-6 mt-10 select-none relative">
                <div className="relative flex flex-col items-start min-w-[200px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeDisplay}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="flex flex-col items-start relative pb-4"
                    >
                      {/* The "Next" province: Faded "Superscript" above active label */}
                      <button
                        onClick={() => setActiveProvIndex(nextProvIndex)}
                        className="absolute -top-4 left-1 text-[11px] font-black tracking-[0.2em] text-slate-300 hover:text-blue-500 transition-all! duration-300 group/sup"
                      >
                        <span className="opacity-60 group-hover/sup:opacity-100 transition-opacity!">
                          {nextDisplay.toUpperCase()}
                        </span>
                        <motion.div 
                          className="w-0 group-hover/sup:w-full h-1px bg-blue-400 mt-0.5"
                          transition={{ duration: 0.3 }}
                        />
                      </button>
                      
                      {/* Active Province Heading with Motion Swap Icon */}
                      <div className="flex items-center gap-5">
                        <h3 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none pb-1">
                          {activeDisplay}
                        </h3>
                        
                        <button
                          onClick={() => setActiveProvIndex(nextProvIndex)}
                          className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-600 border border-slate-100 hover:border-blue-500 text-slate-400 hover:text-white transition-all! group-active:scale-95 shadow-xs hover:shadow-lg hover:shadow-blue-500/20"
                        >
                          <motion.div
                            animate={{ rotate: activeProvIndex * 180 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                          >
                            <RefreshCw className="h-6 w-6 sm:h-7 sm:w-7" />
                          </motion.div>
                        </button>
                      </div>

                      {/* Decorative Dynamic Underline */}
                      <motion.div 
                        layoutId="provinceUnderline"
                        initial={false}
                        className="h-2 bg-blue-600 rounded-full mt-2"
                        animate={{ width: activeDisplay.length * 25 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 md:px-0 w-full md:w-auto md:shrink-0">
            <button
              onClick={() => router.push("/?type=ALL#latest-properties")}
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
          </div>
        </div>

        {/* Content Area - Fixed height to prevent layout shift */}
        <div className="min-h-[250px] relative mx-4">
          {isLoading ? (
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
          ) : !items.length ? (
            <div
              className="rounded-[2.5rem] border-2 border-dashed border-slate-100 bg-slate-50/50 p-16 text-center"
              data-aos="fade-up"
            >
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                <MapPin className="h-8 w-8" />
              </div>
              <p className="text-slate-500 font-semibold text-xl">
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
                        <span className="hidden sm:inline truncate max-w-[80px]">{t("home.popular_areas.explore")}</span>
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
