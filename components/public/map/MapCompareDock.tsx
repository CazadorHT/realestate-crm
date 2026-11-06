"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Scale, X } from "lucide-react";
import { readCompareIds, clearCompare, removeCompareId } from "@/lib/compare-store";
import type { SlimMapPin } from "@/lib/services/map-pins";
import { cn } from "@/lib/utils";

interface MapCompareDockProps {
  pins: SlimMapPin[];
  language: string;
  langPrefix: string;
  onOpenQuickCompare?: () => void;
  className?: string;
}

export function MapCompareDock({
  pins,
  language,
  langPrefix,
  className,
}: MapCompareDockProps) {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    setCompareIds(readCompareIds());
    const onUpdate = () => setCompareIds(readCompareIds());
    window.addEventListener("compare-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("compare-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const selectedPins = useMemo(() => {
    if (compareIds.length === 0) return [];
    const pinMap = new Map<string, SlimMapPin>();
    for (const p of pins) {
      pinMap.set(p.id, p);
    }
    return compareIds
      .map((id) => pinMap.get(id))
      .filter((p): p is SlimMapPin => Boolean(p));
  }, [compareIds, pins]);

  if (compareIds.length === 0) return null;

  const count = compareIds.length;

  const compareLabel =
    language === "th"
      ? `เปรียบเทียบ (${count})`
      : language === "cn"
        ? `对比 (${count})`
        : language === "ru"
          ? `Сравнить (${count})`
          : `Compare (${count})`;

  return (
    <aside
      aria-label="Comparison Dock"
      className={cn(
        "absolute inset-x-0 mx-auto w-fit max-w-[calc(100%-24px)] z-40 pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 bottom-4 sm:bottom-6",
        className
      )}
    >
      <div className="bg-white rounded-full shadow-2xl border border-slate-200/90 p-1.5 sm:p-2 px-2.5 sm:px-3.5 flex items-center gap-2 sm:gap-2.5 text-slate-800 w-fit max-w-full">
        {/* Left: Overlapping Thumbnails */}
        <div className="flex items-center -space-x-2 pl-1 pr-0.5">
          {selectedPins.slice(0, 3).map((pin) => (
            <div
              key={pin.id}
              className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-white bg-slate-100 shrink-0 shadow-xs group"
              title={pin.project_name || pin.title}
            >
              {pin.image_url || pin.project_image_url ? (
                <Image
                  src={pin.image_url || pin.project_image_url || ""}
                  alt={pin.title || "Project"}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                  {pin.title?.slice(0, 2) || "PR"}
                </div>
              )}
              {/* Quick remove on hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCompareId(pin.id);
                }}
                className="absolute inset-0 bg-rose-600/85 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="ลบออก"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {count > 3 && (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-xs">
              +{count - 3}
            </div>
          )}
        </div>

        {/* Primary Compare CTA Button */}
        <Link
          href={`${langPrefix || ""}/compare?ids=${compareIds.join(",")}`}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Scale className="w-3.5 h-3.5 shrink-0" />
          <span>{compareLabel}</span>
        </Link>

        {/* Clear All Button */}
        <button
          type="button"
          onClick={clearCompare}
          className="p-1 sm:p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
          title={language === "th" ? "ล้างทั้งหมด" : "Clear all"}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
