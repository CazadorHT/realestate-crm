"use client";

import { Settings, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SettingsHeaderProps {
  title?: React.ReactNode;
  description?: string;
  subPath?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function SettingsHeader({
  title,
  description,
  subPath = [],
  actions,
}: SettingsHeaderProps) {
  return (
    <div className="relative mb-6 md:mb-10 overflow-hidden rounded-[32px] bg-white p-5 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80">
      {/* Decorative Background Elements */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-50/50 blur-3xl opacity-60" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-50/50 blur-3xl opacity-60" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-12 w-12 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200"
          >
            <Settings className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </m.div>

          <div className="space-y-1.5 md:space-y-3">
            <nav className="flex flex-wrap items-center gap-1 text-[8px] md:text-[10px] font-semibold uppercase tracking-widest md:tracking-[0.2em] text-slate-400">
              <Link
                href="/protected/settings"
                className=" hover:text-blue-600 transition-colors whitespace-nowrap italic"
              >
                การตั้งค่า (Settings)
              </Link>

              <AnimatePresence mode="popLayout">
                {subPath.map((item, index) => (
                  <m.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-1.5"
                  >
                    <ChevronRight className="h-3 w-3 text-slate-300" />
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="hover:text-blue-600 transition-colors whitespace-nowrap italic"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-blue-600/80 whitespace-nowrap italic">
                        {item.label}
                      </span>
                    )}
                  </m.div>
                ))}
              </AnimatePresence>

              {subPath.length === 0 && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-300" />
                  <span className="text-blue-600/80 whitespace-nowrap italic">
                    ระบบควบคุมความปลอดภัย (System Control)
                  </span>
                </>
              )}
            </nav>

            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
                {title || (
                  <>
                    การตั้งค่าระบบ{" "}
                    <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent italic pr-1">
                      (System Settings)
                    </span>
                  </>
                )}
              </h1>
              {description && (
                <p className="text-xs md:text-sm font-medium text-slate-500 italic mt-1 max-w-2xl leading-relaxed">
                  {description}
                </p>
              )}
              {!description && (
                <p className="text-xs md:text-sm font-medium text-slate-500 italic mt-1 hidden sm:block">
                  จัดการพารามิเตอร์และฟีเจอร์ระดับองค์กร (Enterprise Control)
                  ทั้งหมดในจุดเดียว
                </p>
              )}
            </m.div>
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-3 mt-2 lg:mt-0">
          <div className="flex flex-row items-center gap-2 md:gap-3">
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2.5 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 md:px-5 py-2 md:py-2.5 text-emerald-700 shadow-sm backdrop-blur-md"
            >
              <div className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider">
                สถานะ: ปกติ (Operational)
              </span>
            </m.div>

            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/50 px-5 py-2.5 text-slate-600 shadow-sm backdrop-blur-md">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold uppercase tracking-wider italic text-slate-500">
                Elite Hardened
              </span>
            </div>
          </div>

          {actions && (
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full sm:w-auto mt-1 md:mt-2"
            >
              <div className="flex flex-col sm:flex-row gap-3">{actions}</div>
            </m.div>
          )}
        </div>
      </div>
    </div>
  );
}
