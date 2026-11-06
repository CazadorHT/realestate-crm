"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Scale, Zap, X, Trash2, ArrowRight } from "lucide-react";
import { readCompareIds, clearCompare, removeCompareId } from "@/lib/compare-store";
import type { SlimMapPin } from "@/lib/services/map-pins";
import { cn } from "@/lib/utils";

interface MapCompareDockProps {
  pins: SlimMapPin[];
  language: string;
  langPrefix: string;
  onOpenQuickCompare: () => void;
  className?: string;
}

export function MapCompareDock({
  pins,
  language,
  langPrefix,
  onOpenQuickCompare,
  className,
}: MapCompareDockProps) {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

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
  const canQuickCompare = count >= 2;

  const titleText =
    language === "th"
      ? `เปรียบเทียบ (${count}/4)`
      : language === "cn"
        ? `对比房源 (${count}/4)`
        : language === "ru"
          ? `Сравнение (${count}/4)`
          : `Compare (${count}/4)`;

  const quickCompareLabel =
    language === "th"
      ? "⚡ เทียบระยะรถไฟฟ้า"
      : language === "cn"
        ? "⚡ 对比地铁距离"
        : language === "ru"
          ? "⚡ Сравнить метро"
          : "⚡ Transit Compare";

  const fullTableLabel =
    language === "th"
      ? "ตารางเต็ม"
      : language === "cn"
        ? "完整对比"
        : language === "ru"
          ? "Таблица"
          : "Full Table";

  return (
    <aside
      aria-label={titleText}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-full px-3 w-auto pointer-events-auto transition-all duration-300",
        className
      )}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-2xl border border-slate-200/90 p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3 text-slate-800">
        {/* Left: Icon & Count */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scale className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {titleText}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {canQuickCompare
                ? language === "th"
                  ? "พร้อมเปรียบเทียบแล้ว"
                  : "Ready to compare"
                : language === "th"
                  ? "เลือกอีก 1 โครงการ"
                  : "Select 1 more"}
            </span>
          </div>
        </div>

        {/* Middle: Mini Thumbnails of Selected Projects */}
        <div className="flex items-center -space-x-1.5 sm:space-x-1 overflow-hidden px-1">
          {selectedPins.slice(0, 4).map((pin) => (
            <div
              key={pin.id}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl overflow-hidden border-2 border-white bg-slate-100 shrink-0 group shadow-2xs"
              title={pin.project_name || pin.title}
            >
              {pin.image_url || pin.project_image_url ? (
                <Image
                  src={pin.image_url || pin.project_image_url || ""}
                  alt={pin.title || "Project"}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">
                  {pin.title?.slice(0, 2) || "PR"}
                </div>
              )}
              {/* Remove button on hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCompareId(pin.id);
                }}
                className="absolute inset-0 bg-rose-600/85 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="ลบออก"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 mx-0.5 hidden xs:block" />

        {/* Right Actions: Quick Transit Compare + Full Compare Table */}
        <div className="flex items-center gap-1.5">
          {canQuickCompare && (
            <button
              type="button"
              onClick={onOpenQuickCompare}
              className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>{quickCompareLabel}</span>
            </button>
          )}

          <Link
            href={`${langPrefix || ""}/compare?ids=${compareIds.join(",")}`}
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <span>{fullTableLabel}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={clearCompare}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            title="ล้างทั้งหมด"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
