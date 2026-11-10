"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  Building2,
  UserPlus,
  Calendar,
  Handshake,
  HelpCircle,
  X,
  ChevronRight,
  Pin,
  PinOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { toast } from "sonner";

interface QuickActionItem {
  id: string;
  label: { th: string; en: string };
  desc: { th: string; en: string };
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
}

export function FloatingQuickActions() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isDocked, setIsDocked] = useState(true);
  const [hasTourOnPage, setHasTourOnPage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize preference from localStorage
  useEffect(() => {
    setIsMounted(true);
    const savedDocked = localStorage.getItem("cazador_quick_actions_docked");
    if (savedDocked !== null) {
      setIsDocked(savedDocked === "true");
    }
  }, []);

  // Save docking preference
  const toggleDock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextDocked = !isDocked;
    setIsDocked(nextDocked);
    localStorage.setItem("cazador_quick_actions_docked", String(nextDocked));
  };

  // Close when pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Check if current page has an active tour
  useEffect(() => {
    const handleTourRegistered = () => setHasTourOnPage(true);
    const handleTourUnregistered = () => setHasTourOnPage(false);

    window.addEventListener("cazador_tour_registered", handleTourRegistered);
    window.addEventListener("cazador_tour_unregistered", handleTourUnregistered);

    return () => {
      window.removeEventListener("cazador_tour_registered", handleTourRegistered);
      window.removeEventListener("cazador_tour_unregistered", handleTourUnregistered);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Trigger Tour action
  const handleTriggerTour = useCallback(() => {
    setIsOpen(false);
    if (!hasTourOnPage) {
      toast.info(isEn ? "No guide available on this page" : "หน้านี้ยังไม่มีคำแนะนำการใช้งาน");
      return;
    }
    window.dispatchEvent(new CustomEvent("cazador_start_tour"));
  }, [hasTourOnPage, isEn]);

  // Action definitions
  const actions: QuickActionItem[] = [
    {
      id: "add-property",
      label: { th: "เพิ่มทรัพย์ใหม่", en: "Add Property" },
      desc: { th: "ลงรายการทรัพย์ใหม่เข้าระบบ", en: "Create a new property listing" },
      href: "/protected/properties/new",
      icon: Building2,
      iconBg: "bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-blue-200",
    },
    {
      id: "add-lead",
      label: { th: "เพิ่มลูกค้าใหม่", en: "Add Lead" },
      desc: { th: "บันทึกข้อมูลลูกค้าผู้สนใจ", en: "Register new prospective lead" },
      href: "/protected/leads/new",
      icon: UserPlus,
      iconBg: "bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-200",
    },
    {
      id: "calendar",
      label: { th: "ตารางนัดหมาย", en: "Schedule Calendar" },
      desc: { th: "ดูและสร้างนัดหมายพาชมทรัพย์", en: "View viewings & appointments" },
      href: "/protected/calendar",
      icon: Calendar,
      iconBg: "bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-amber-200",
    },
    {
      id: "deals",
      label: { th: "ดีลการขาย", en: "Sales Deals" },
      desc: { th: "ติดตามสถานะดีลและสัญญา", en: "Track pipeline & negotiations" },
      href: "/protected/deals",
      icon: Handshake,
      iconBg: "bg-linear-to-br from-purple-600 to-indigo-700 text-white shadow-purple-200",
    },
    {
      id: "tour-help",
      label: { th: "คำแนะนำหน้านี้", en: "Page Guide & Tour" },
      desc: {
        th: hasTourOnPage ? "ดูคำแนะนำวิธีใช้งานหน้านี้" : "เปิดดูภาพรวมระบบ",
        en: hasTourOnPage ? "Replay interactive guide for this page" : "System walkthrough",
      },
      onClick: handleTriggerTour,
      icon: HelpCircle,
      iconBg: "bg-linear-to-br from-sky-500 to-blue-600 text-white shadow-sky-200",
    },
  ];

  if (!isMounted) return null;

  // Handle hover on desktop
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 250);
  };

  const isExpanded = isOpen || isHovered;

  return (
    <aside
      aria-label="Floating Quick Actions"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "fixed z-[120] transition-all duration-300 pointer-events-auto",
        isDocked
          ? "right-0 bottom-40 lg:bottom-24"
          : "right-4 sm:right-6 bottom-40 lg:bottom-24"
      )}
    >
      {/* 🚀 EXPANDED QUICK ACTIONS MENU */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ opacity: 0, scale: 0.9, y: 15, x: isDocked ? 20 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15, x: isDocked ? 20 : 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 380 }}
            className={cn(
              "absolute bottom-16 w-72 sm:w-80 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 overflow-hidden",
              isDocked ? "right-2 sm:right-3" : "right-0"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-slate-50 to-blue-50/50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-300">
                  <Zap className="h-3.5 w-3.5 fill-white" />
                </div>
                <span className="text-xs font-bold text-slate-800 tracking-tight">
                  {isEn ? "Quick Actions" : "ปุ่มลัดด่วน"}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Dock / Undock toggle button */}
                <button
                  onClick={toggleDock}
                  title={
                    isDocked
                      ? isEn
                        ? "Undock (Float freely)"
                        : "ปักหมุดลอยอิสระ"
                      : isEn
                      ? "Dock to screen edge"
                      : "แอบชิดขอบจอ"
                  }
                  className="h-6 w-6 rounded-md hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  {isDocked ? (
                    <Pin className="h-3.5 w-3.5 text-blue-600" />
                  ) : (
                    <PinOff className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  title={isEn ? "Close menu" : "ปิดเมนู"}
                  className="h-6 w-6 rounded-md hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List of Actions */}
            <div className="p-2 space-y-1">
              {actions.map((action, idx) => {
                const Icon = action.icon;
                const content = (
                  <div className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors text-left group cursor-pointer">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105",
                        action.iconBg
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                          {isEn ? action.label.en : action.label.th}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate font-medium">
                        {isEn ? action.desc.en : action.desc.th}
                      </p>
                    </div>
                  </div>
                );

                if (action.href) {
                  return (
                    <Link
                      key={action.id}
                      href={action.href}
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={action.id}
                    onClick={action.onClick}
                    className="w-full text-left"
                  >
                    {content}
                  </button>
                );
              })}
            </div>

            {/* Subtle Footer hint */}
            <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>{isEn ? "Tip: Press Esc to close" : "ทิป: กด Esc หรือคลิกข้างนอกเพื่อปิด"}</span>
              <button
                onClick={toggleDock}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                {isDocked
                  ? isEn
                    ? "Pinned to edge"
                    : "สถานะ: แอบข้างจอ"
                  : isEn
                  ? "Floating mode"
                  : "สถานะ: ลอยอิสระ"}
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ⚡ TRIGGER BUTTON / EDGE PEEKER */}
      {isDocked ? (
        // DOCKED / PEEKING STATE (แอบข้างจอ)
        <m.button
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          title={
            isEn
              ? "Quick Actions (Hover or click to open)"
              : "ปุ่มลัดด่วน (ชี้หรือคลิกเพื่อเปิด)"
          }
          className={cn(
            "flex items-center gap-1.5 pl-3 pr-2.5 py-2.5 rounded-l-2xl shadow-xl border-l border-y border-white/20 transition-all duration-300 cursor-pointer select-none",
            isExpanded
              ? "bg-slate-900 text-white shadow-slate-900/30"
              : "bg-linear-to-l from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/30 hover:pl-4"
          )}
        >
          <div className="relative flex items-center justify-center">
            <Zap className={cn("h-4 w-4 fill-current", !isExpanded && "animate-pulse")} />
            {!isExpanded && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold tracking-tight pr-0.5 hidden sm:inline-block">
            {isEn ? "Quick" : "ปุ่มลัด"}
          </span>
        </m.button>
      ) : (
        // FLOATING STATE (ลอยอิสระ)
        <m.button
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title={
            isEn
              ? "Quick Actions (Hover or click to open)"
              : "ปุ่มลัดด่วน (ชี้หรือคลิกเพื่อเปิด)"
          }
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full shadow-2xl transition-all duration-300 border border-white/30 cursor-pointer select-none",
            isExpanded
              ? "bg-slate-900 text-white shadow-slate-900/30 rotate-45"
              : "bg-linear-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-blue-500/35"
          )}
        >
          {isExpanded ? (
            <Plus className="h-5 w-5" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Zap className="h-5 w-5 fill-current animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
              </span>
            </div>
          )}
        </m.button>
      )}
    </aside>
  );
}
