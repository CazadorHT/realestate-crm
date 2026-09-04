"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";

interface Project {
  id: string;
  name: { th: string; en: string };
  slug: string;
  developer: string | null;
  imageUrl: string | null;
  propertyCount: number;
}

interface AreaProjectsCarouselProps {
  projects: Project[];
  language: string;
  viewDetailsLabel: string;
  unitsLabel: string;
}

export function AreaProjectsCarousel({
  projects,
  language,
  viewDetailsLabel,
  unitsLabel,
}: AreaProjectsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScrollLimits = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      // Add slight padding tolerance for float rounding in zoom levels
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 15);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollLimits);
      // Run once initially
      checkScrollLimits();
      // Handle resize
      window.addEventListener("resize", checkScrollLimits);
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScrollLimits);
      }
      window.removeEventListener("resize", checkScrollLimits);
    };
  }, [projects]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group/carousel w-full">
      {/* Left Faded Overlay */}
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10 transition-opacity duration-300 hidden md:block" />
      )}

      {/* Right Faded Overlay */}
      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10 transition-opacity duration-300 hidden md:block" />
      )}

      {/* Left Arrow Button */}
      {showLeftArrow && (
        <button
          onClick={() => scroll("left")}
          className="absolute -left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg flex items-center justify-center text-slate-700 hover:text-indigo-650 hover:border-indigo-100 active:scale-95 transition-all z-20 cursor-pointer hidden md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right Arrow Button */}
      {showRightArrow && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md hover:shadow-lg flex items-center justify-center text-slate-700 hover:text-indigo-650 hover:border-indigo-100 active:scale-95 transition-all z-20 cursor-pointer hidden md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((proj) => (
          <Link
            key={proj.id}
            href={`/projects/${proj.slug}`}
            className="group bg-white rounded-3xl overflow-hidden border border-slate-200/50 hover:border-indigo-200 hover:shadow-md transition-all duration-300 flex flex-col shrink-0 w-72 md:w-80 snap-start"
          >
            {/* Project Cover Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
              {proj.imageUrl ? (
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url(${proj.imageUrl})` }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center text-indigo-400">
                  <Building2 className="w-12 h-12 stroke-[1.5]" />
                </div>
              )}
              <div className="absolute top-3 right-3 bg-white/90 px-2.5 py-1 rounded-full border border-slate-100 text-[10px] font-bold text-indigo-600 shadow-xs">
                {proj.propertyCount} {unitsLabel}
              </div>
            </div>

            {/* Project Details */}
            <div className="p-4 flex-1 flex flex-col justify-between text-left space-y-1">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-650 transition-colors line-clamp-1">
                  {proj.name[language as keyof typeof proj.name] || proj.name.th}
                </h3>
                <p className="text-xs text-slate-450 font-medium">
                  {proj.developer || "Developer"}
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                <span>{viewDetailsLabel}</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
