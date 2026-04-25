"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyCard, PropertyCardProps } from "./PropertyCard";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FaFire, FaFireBurner } from "react-icons/fa6";

type ApiProperty = PropertyCardProps;

export function HotDealsSection() {
  const { language, t } = useLanguage();
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
  };

  const handleTouchEnd = () => {
    // Re-enable horizontal scroll after touch ends
    if (scrollRef.current) {
      scrollRef.current.style.overflowX = "auto";
    }
    isHorizontalSwipe.current = null;
  };

  useEffect(() => {
    async function loadHotDeals() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/public/properties?filter=hot_deals", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        const data = json.properties || [];

        if (Array.isArray(data) && data.length > 0) {
          setProperties(data);
        } else {
          setIsEmpty(true);
        }
      } catch (_error) {
        setIsEmpty(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadHotDeals();
    setIsMounted(true);
  }, []);

  if (isEmpty && !isLoading) return null;

  return (
    <section className="py-10 md:py-16 relative overflow-hidden bg-slate-800">
      {/* === ANIMATED PREMIUM BACKGROUND === */}

      {/* Moving Gradient Blobs */}
      <div
        className="absolute top-[-10%] left-[-15%] w-[500px] h-[500px] bg-red-600/50 rounded-full mix-blend-screen filter blur-[100px] z-0"
        style={{ animation: "blob 2s ease-in-out infinite" }}
      />
      <div
        className="absolute left-[70%] top-[50%] w-[500px] h-[500px] bg-orange-600/50 rounded-full mix-blend-screen filter blur-[100px] z-0"
        style={{
          animation: "blob-horizontal 2s ease-in-out infinite",
          marginLeft: "-250px",
          marginTop: "-250px",
        }}
      />
      <div
        className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-orange-500/80 rounded-full mix-blend-screen filter blur-[100px] z-0"
        style={{
          animation: "blob-reverse 2.5s ease-in-out infinite",
          animationDelay: "2s",
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[5%] w-[600px] h-[600px] bg-fuchsia-600/60 rounded-full mix-blend-screen filter blur-[120px] z-0"
        style={{
          animation: "blob-horizontal 3s ease-in-out infinite",
          animationDelay: "4s",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-500/50 rounded-full mix-blend-screen filter blur-[100px] z-0"
        style={{
          animation: "blob-vertical 4s ease-in-out infinite",
          animationDelay: "4s",
        }}
      />

      {/* Glassmorphism Overlay Texture */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] z-1"></div>

      {/* Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[32px_32px] z-2"></div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 opacity-30 animate-pulse-slow z-3 hidden xl:block">
        <Sparkles className="h-12 w-12 text-white" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 relative z-10 lg:px-8">
        {/* === HEADER SECTION === */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2 md:px-4 md:gap-12 mb-8 md:mb-12">
          <div className="space-y-4 max-w-screen-2xl">
            {/* Badge ที่ดู Modern ขึ้น */}
            <div
              className="inline-flex items-center gap-2 bg-linear-to-r from-red-500 to-orange-500 text-white pl-2 pr-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-500/50 hover:shadow-xl hover:shadow-red-500/60 transform hover:scale-105 transition-all animate-pulse-scale"
              {...(isMounted ? { "data-aos": "fade-right" } : {})}
            >
              <div className="bg-white/20 p-1 rounded-full">
                <Flame className="h-3.5 w-3.5 fill-yellow-200 animate-pulse" />
              </div>
              <span>{t("home.hot_deals.title")}</span>
            </div>

            {/* SEO-Optimized Heading */}
            <h2
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-[1.1]"
              {...(isMounted ? { "data-aos": "fade-up", "data-aos-delay": "100" } : {})}
            >
              {t("home.hot_deals.subtitle")
                .split("!")
                .map((part, i) => (
                  <span
                    key={i}
                    className={
                      i === 1
                        ? "text-slate-200 text-2xl sm:text-3xl md:text-3xl block md:inline mt-1"
                        : ""
                    }
                  >
                    {part}
                    {i === 0 ? "!" : ""}
                  </span>
                ))}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 via-orange-400 to-amber-400 drop-shadow-sm mt-1 sm:mt-2 block">
                {language === "th"
                  ? t("home.hot_deals.description")
                      .split(" ")
                      .filter(
                        (w) => w.includes("ลดราคา") || w.includes("ขาย-เช่า"),
                      )
                      .join(" ")
                  : t("home.hot_deals.description")}
              </span>
            </h2>

            {/* SEO-Enhanced Description */}
            <div
              className="flex items-start gap-3 text-slate-300 text-sm sm:text-base md:text-base"
              {...(isMounted ? { "data-aos": "fade-up", "data-aos-delay": "200" } : {})}
            >
              <TrendingDown className="h-5 w-5  md:h-6 md:w-6 text-red-500 mt-0.5 md:mt-1 shrink-0" />
              <p>{t("home.hot_deals.description")}</p>
            </div>
          </div>

          <div
            className="flex gap-3 w-full md:w-auto"
            {...(isMounted ? { "data-aos": "fade-left", "data-aos-delay": "300" } : {})}
          >
            {/* Fixed CTA Button */}
            <Button
              asChild
              className="rounded-full bg-white text-slate-900 hover:bg-slate-100 font-semibold px-6 h-12 w-full md:w-auto md:h-10 text-sm shadow-lg hover:shadow-xl hover:scale-105 duration-300 hover:shadow-white/20 transition-all group"
            >
              <Link href="/properties?sortBy=price&sortOrder=asc&filter=hot_deals">
                {t("home.hot_deals.view_all")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>

        {/* === CARDS SECTION === */}
        {isLoading ? (
          <div className="flex md:grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4 overflow-x-auto md:overflow-visible scrollbar-hide pb-4 md:pb-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[260px] sm:min-w-[280px] md:min-w-0 shrink-0"
              >
                <PropertyCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          /* Horizontal Scroll on Mobile / Grid on Desktop */
          <div
            ref={scrollRef}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible scrollbar-hide snap-x snap-mandatory scroll-pl-4 sm:scroll-pl-6 md:scroll-pl-0 py-4 px-4 sm:px-6 md:px-6 lg:px-8 md:py-0 after:content-[''] after:w-px after:shrink-0 md:after:hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {properties.slice(0, 4).map((property, index) => (
              <div
                key={property.id}
                className="w-[85vw] max-w-[340px] sm:max-w-[360px] md:w-auto md:max-w-none snap-start shrink-0 relative group"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Card Wrapper with Premium Glow Effect */}
                <div className="rounded-2xl md:rounded-[1.5rem] p-1 md:p-0 lg:p-1 lg:bg-linear-to-b from-white/80 to-white/40 lg:shadow-xl lg:shadow-orange-900/5 group-hover:shadow-orange-600/20 transition-all duration-500 ">
                  <div className="md:group-hover:scale-[1.02] transition-all duration-500 ">
                    <PropertyCard property={property} priority={index === 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Small Decorative Footer */}
        <div className="mt-8 md:mt-16 flex justify-center">
          <div className="h-1 w-40 md:min-w-80 bg-linear-to-r from-transparent via-orange-300 to-transparent rounded-full opacity-50"></div>
        </div>
      </div>
    </section>
  );
}
