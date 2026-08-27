"use client";

import Link from "next/link";

interface AreaItem {
  name: string;
  count: number;
  name_en?: string | null;
  name_cn?: string | null;
  name_ru?: string | null;
}

interface PopularAreaTagsProps {
  popularAreas: AreaItem[];
  language: string;
  basePath: string; // e.g. "/properties/pet-friendly-condo"
  targetId: string; // e.g. "offices-list" to scroll to
  themeColor: "orange" | "blue" | "violet" | "emerald";
  isDark?: boolean;
}

export function PopularAreaTags({
  popularAreas,
  language,
  basePath,
  targetId,
  themeColor,
  isDark = false,
}: PopularAreaTagsProps) {
  if (!popularAreas || popularAreas.length === 0) return null;

  // Localized texts
  const labelPopular = 
    language === "en" ? "Popular Areas:" :
    language === "cn" ? "热门地段:" :
    language === "ru" ? "Популярные районы:" :
    "ทำเลยอดนิยม:";

  const labelMore = 
    language === "en" ? "More Areas..." :
    language === "cn" ? "更多地段..." :
    language === "ru" ? "Еще районы..." :
    "ดูทำเลเพิ่ม";

  // Helper to get localized label for an area
  const getLocalizedArea = (area: AreaItem) => {
    return language === "en" ? area.name_en || area.name :
           language === "cn" ? area.name_cn || area.name :
           language === "ru" ? area.name_ru || area.name :
           area.name;
  };

  // Scroll to search component function
  const handleScrollToSearch = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Color theme classes mapping
  const themeClasses = {
    orange: {
      hoverBg: "hover:bg-orange-600",
      textCount: isDark ? "text-orange-400" : "text-orange-600",
      borderMore: isDark 
        ? "border-orange-500/40 text-orange-400 bg-orange-950/20 hover:bg-orange-600 hover:text-white" 
        : "border-orange-200 text-orange-700 bg-orange-50/50 hover:bg-orange-600 hover:text-white",
    },
    blue: {
      hoverBg: "hover:bg-blue-600",
      textCount: isDark ? "text-blue-400" : "text-blue-600",
      borderMore: isDark 
        ? "border-blue-500/40 text-blue-400 bg-blue-950/20 hover:bg-blue-600 hover:text-white" 
        : "border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-600 hover:text-white",
    },
    violet: {
      hoverBg: "hover:bg-violet-600",
      textCount: isDark ? "text-violet-400" : "text-violet-600",
      borderMore: isDark 
        ? "border-violet-500/40 text-violet-400 bg-violet-950/20 hover:bg-violet-600 hover:text-white" 
        : "border-violet-200 text-violet-700 bg-violet-50/50 hover:bg-violet-600 hover:text-white",
    },
    emerald: {
      hoverBg: "hover:bg-emerald-600",
      textCount: isDark ? "text-emerald-400" : "text-emerald-600",
      borderMore: isDark 
        ? "border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-600 hover:text-white" 
        : "border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white",
    },
  };

  const activeTheme = themeClasses[themeColor] || themeClasses.blue;

  const bgClass = isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-100 text-slate-600";
  const labelColorClass = isDark ? "text-slate-400" : "text-slate-500";

  // Let's render a mobile list (max 4 items + More) and desktop list (max 8 items + More)
  const renderTag = (area: AreaItem, index: number) => {
    const label = getLocalizedArea(area);
    return (
      <Link 
        key={area.name || label || index}
        href={`${basePath}?popular_area=${encodeURIComponent(area.name)}`}
        className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${bgClass} ${activeTheme.hoverBg} group hover:text-white transition-all shadow-3xs flex items-center gap-1.5 shrink-0`}
      >
        <span>{label}</span>
        <span className={`text-[10px] opacity-80 group-hover:text-white transition-colors ${activeTheme.textCount}`}>({area.count})</span>
      </Link>
    );
  };

  const renderMoreButton = () => {
    return (
      <a
        href={`#${targetId}`}
        onClick={handleScrollToSearch}
        className={`px-3 py-1.5 rounded-full border border-dashed font-bold transition-all shadow-3xs flex items-center gap-1 shrink-0 ${activeTheme.borderMore}`}
      >
        <span>{labelMore}</span>
      </a>
    );
  };

  const showMoreMobile = popularAreas.length > 4;
  const showMoreDesktop = popularAreas.length > 8;

  const mobileItems = showMoreMobile ? popularAreas.slice(0, 3) : popularAreas;
  const desktopItems = showMoreDesktop ? popularAreas.slice(0, 7) : popularAreas;

  return (
    <div className={`flex flex-wrap items-center gap-2 pt-4 text-xs font-bold ${labelColorClass} animate-fade-in-up`}>
      <span>{labelPopular}</span>
      
      {/* Mobile-only view: limited tags */}
      <div className="flex flex-wrap gap-2 md:hidden">
        {mobileItems.map(renderTag)}
        {showMoreMobile && renderMoreButton()}
      </div>

      {/* Desktop-only view: more tags */}
      <div className="hidden md:flex flex-wrap gap-2">
        {desktopItems.map(renderTag)}
        {showMoreDesktop && renderMoreButton()}
      </div>
    </div>
  );
}
