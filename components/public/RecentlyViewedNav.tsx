import { ChevronLeft, ChevronRight } from "lucide-react";

interface RecentlyViewedNavProps {
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

export function RecentlyViewedNav({
  scrollPrev,
  scrollNext,
  canScrollLeft,
  canScrollRight,
}: RecentlyViewedNavProps) {
  return (
    <div className="flex justify-end gap-2 mb-3 md:mb-4">
      <button
        onClick={scrollPrev}
        disabled={!canScrollLeft}
        className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all! duration-300! flex items-center justify-center group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-slate-700"
        aria-label="Previous"
      >
        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-slate-700 group-hover:text-white" />
      </button>
      <button
        onClick={scrollNext}
        disabled={!canScrollRight}
        className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all! duration-300! flex items-center justify-center group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/90 disabled:hover:text-slate-700"
        aria-label="Next"
      >
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-slate-700 group-hover:text-white" />
      </button>
    </div>
  );
}
