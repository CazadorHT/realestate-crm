"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clock,
  PawPrint,
  Globe,
  Cigarette,
  Home,
  PackageCheck,
  PackageX,
  LayoutDashboard,
  Waves,
  Users,
  Sparkles,
  ShieldCheck,
  TrainFront,
  Building2,
  Leaf,
  Eye,
  MoveUp,
  Maximize,
  Box,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/database.types";
import { useLanguage } from "@/components/providers/LanguageProvider";

type PropertyRow = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyBadgesSectionProps {
  property: PropertyRow;
  language?: "th" | "en" | "cn";
}

export function PropertyBadgesSection({
  property,
  language: customLanguage,
}: PropertyBadgesSectionProps) {
  const { language: globalLanguage, t: globalT } = useLanguage();
  const language = customLanguage || globalLanguage;

  // Custom t function
  const t = (key: string) => {
    const { dictionaries } = require("@/components/providers/LanguageProvider");
    const dict = dictionaries[language];
    return key.split(".").reduce((prev, curr) => prev?.[curr], dict) || key;
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0); // For float-based smooth scrolling
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [startX, setStartX] = useState(0);
  const [initialScrollLeft, setInitialScrollLeft] = useState(0);

  // Auto-scroll logic with float-based accumulation for sub-pixel smoothness
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || isDragging || isHovered) return;

    let animationId: number;
    let lastTime = performance.now();
    const speed = 0.8; // Normalized pixels per frame (~48px/sec at 60fps)

    const scroll = (currentTime: number) => {
      if (scrollContainer) {
        // Calculate delta time for consistent speed across different refresh rates (60Hz vs 120Hz)
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // Move calculation (deltaTime / 16.67ms per frame @ 60fps)
        const move = (speed * deltaTime) / 16.67;
        scrollPosRef.current += move;

        // Loop back logic
        const maxScroll =
          scrollContainer.scrollWidth - scrollContainer.clientWidth;
        if (scrollPosRef.current >= maxScroll) {
          scrollPosRef.current = 0;
        }

        // Sync to DOM
        scrollContainer.scrollLeft = scrollPosRef.current;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isDragging, isHovered]);

  // Sync scrollPosRef when user manually scrolls or drags
  const handleScroll = () => {
    if (scrollRef.current && (isDragging || isHovered)) {
      scrollPosRef.current = scrollRef.current.scrollLeft;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = String(date.getFullYear()).slice(-4);
    return `${d}/${m}/${y}`;
  };

  const badgeItems = [
    {
      condition: property.is_pet_friendly,
      label: t("property.badges.pet_friendly"),
      icon: PawPrint,
      color: "bg-orange-100 text-orange-700",
    },
    {
      condition: property.is_foreigner_quota,
      label: t("property.badges.foreigner_quota"),
      icon: Globe,
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      condition: property.is_renovated,
      label: t("property.badges.renovated"),
      icon: Sparkles,
      color: "bg-emerald-100 text-emerald-800",
    },
    {
      condition: property.is_corner_unit,
      label: t("property.badges.corner_unit"),
      icon: LayoutDashboard,
      color: "bg-purple-100 text-purple-800",
    },
    {
      condition: property.is_fully_furnished,
      label: t("property.badges.fully_furnished"),
      icon: PackageCheck,
      color: "bg-blue-100 text-blue-800",
    },
    {
      condition: property.has_private_pool,
      label: t("property.badges.private_pool"),
      icon: Waves,
      color: "bg-cyan-100 text-cyan-800",
    },
    {
      condition: property.is_selling_with_tenant,
      label: t("property.badges.selling_with_tenant"),
      icon: Users,
      color: "bg-green-100 text-green-800",
    },
    {
      condition: property.is_exclusive,
      label: t("property.badges.exclusive"),
      icon: ShieldCheck,
      color: "bg-rose-100 text-rose-800",
    },
    {
      condition: property.near_transit,
      label: t("property.badges.near_transit"),
      icon: TrainFront,
      color: "bg-blue-50 text-blue-600",
    },
    {
      condition: property.has_river_view,
      label: t("property.badges.river_view"),
      icon: Waves,
      color: "bg-sky-50 text-sky-700",
    },
    {
      condition: property.has_city_view,
      label: t("property.badges.city_view"),
      icon: Building2,
      color: "bg-slate-100 text-slate-700",
    },
    {
      condition: property.has_garden_view,
      label: t("property.badges.garden_view"),
      icon: Leaf,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      condition: property.has_unblocked_view,
      label: t("property.badges.unblocked_view"),
      icon: Eye,
      color: "bg-amber-50 text-amber-700",
    },
    {
      condition: property.allow_smoking,
      label: t("property.badges.allow_smoking"),
      icon: Cigarette,
      color: "bg-slate-100 text-slate-600",
    },
    {
      condition: property.is_high_ceiling,
      label: t("property.badges.high_ceiling"),
      icon: MoveUp,
      color: "bg-slate-50 text-slate-600",
    },
    {
      condition: property.is_column_free,
      label: t("property.badges.column_free"),
      icon: Maximize,
      color: "bg-slate-50 text-slate-600",
    },
    {
      condition: property.is_bare_shell,
      label: t("property.badges.bare_shell"),
      icon: Box,
      color: "bg-slate-100 text-slate-700",
    },
    {
      condition: property.is_grade_a,
      label: t("property.badges.grade_a"),
      icon: Star,
      color: "bg-yellow-50 text-yellow-700",
    },
    {
      condition: property.is_tax_registered,
      label: t("property.badges.tax_registered"),
      icon: ShieldCheck,
      color: "bg-fuchsia-100 text-fuchsia-700",
    },
  ];

  const filteredBadges = badgeItems.filter((item) => item.condition);

  // Synchronize dragging with window-level events for maximum reliability
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!scrollRef.current) return;
      const x = e.pageX;
      const walk = (x - startX) * 2.0;
      scrollRef.current.scrollLeft = initialScrollLeft - walk;
      scrollPosRef.current = scrollRef.current.scrollLeft;
    };

    const handleWindowMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [isDragging, startX, initialScrollLeft]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX);
    setInitialScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    const x = e.touches[0].pageX;
    const walk = (x - startX) * 2.0;
    scrollRef.current.scrollLeft = initialScrollLeft - walk;
    scrollPosRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX);
    setInitialScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    if (!isDragging) setIsHovered(false);
  };

  return (
    <section className={`space-y-4 ${isDragging ? "select-none" : ""}`}>
      <style key="badges-style">{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3 flex-1 max-w-3xl overflow-hidden group/container">
          {/* Sale/Rent: Static */}
          <div className="shrink-0 z-20 bg-white">
            <Badge
              className={`rounded-full px-5 py-2 font-bold whitespace-nowrap shadow-sm ${
                property.listing_type === "SALE"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {property.listing_type === "SALE"
                ? t("common.for_sale")
                : t("common.for_rent")}
            </Badge>
          </div>

          {/* Others: Draggable & Ticker area */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => setIsHovered(true)}
            onScroll={handleScroll}
            className={`flex-1 overflow-x-auto no-scrollbar pb-1 flex items-center gap-2 touch-pan-y ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {filteredBadges.map((item, idx) => (
              <Badge
                key={idx}
                className={`rounded-full px-4 py-2 font-medium border-none whitespace-nowrap gap-1.5 shadow-xs transition-colors shrink-0 pointer-events-none ${item.color}`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Badge>
            ))}
            {/* End spacing for loop feel */}
            <div className="shrink-0 w-32 h-4" />
          </div>

          {/* Right side fade overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-linear-to-l from-white to-transparent pointer-events-none z-10 hidden md:block" />
        </div>

        <div className="flex items-center gap-2 text-[11px] md:text-xs font-medium text-slate-400 shrink-0 self-end md:self-center">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {t("property.created_at_label")} {formatDate(property.created_at)}
          </span>
        </div>
      </div>
    </section>
  );
}
