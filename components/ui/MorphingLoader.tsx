"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Building2,
  Warehouse,
  MapPin,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { siteConfig } from "@/lib/site-config";
import { m, AnimatePresence } from "framer-motion";

export function MorphingLoader({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);

  const icons = [
    { icon: Home, color: "text-blue-600" },
    { icon: Building2, color: "text-indigo-600" },
    { icon: Key, color: "text-violet-600" },
    { icon: Warehouse, color: "text-emerald-600" },
    { icon: MapPin, color: "text-rose-600" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % icons.length);
    }, 500); // Premium, smooth pace
    return () => clearInterval(interval);
  }, [icons.length]);

  const CurrentIcon = icons[index].icon;
  const currentColor = icons[index].color;

  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[350px] md:min-h-[500px] w-full transition-all duration-1000",
        className,
      )}
    >
      <div className="relative flex items-center justify-center h-28 w-28 md:h-32 md:w-32">
        {/* Soft Background Rings */}
        <div className="absolute inset-[-12px] rounded-full border border-slate-100/50 animate-pulse duration-3000" />
        <div className="absolute inset-0 rounded-full bg-white shadow-2xl shadow-slate-200/60 border border-slate-50 flex items-center justify-center overflow-hidden">
          {/* Subtle Ambient Light */}
          <div className="absolute inset-0 bg-linear-to-tr from-slate-50 to-white opacity-50" />
          
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3, ease: "easeOut" }} // Faster for 500ms interval
              className={cn("relative z-10", currentColor)}
            >
              <CurrentIcon className="h-11 w-11 md:h-12 md:w-12" />
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-10 text-center space-y-3 px-6">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.5 }}
            className="space-y-3"
          >
            <h3 className="text-xl font-medium text-slate-900 tracking-tight">
              {t("loading.search_dream_home")}
            </h3>
            <p className="text-slate-400 text-sm max-w-[300px] mx-auto leading-relaxed">
              {t("loading.subtitle", { siteName: siteConfig.name })}
            </p>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
