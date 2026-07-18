"use client";

import { ChevronDown } from "lucide-react";
import { m } from "framer-motion";
import { useLanguage } from "@/components/providers/LanguageProvider";

interface ScrollToPropertiesProps {
  targetId: string;
  label?: string;
  theme?: "light" | "dark" | "orange";
}

export function ScrollToProperties({ targetId, label, theme = "light" }: ScrollToPropertiesProps) {
  const { language } = useLanguage();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const themeClasses = {
    light: "border-slate-200 hover:border-blue-600 text-slate-500 hover:text-blue-600 bg-white/80 hover:bg-blue-50/50 shadow-2xs hover:shadow-md",
    dark: "border-slate-800 hover:border-amber-500 text-slate-400 hover:text-amber-500 bg-slate-900/60 hover:bg-amber-950/20 shadow-lg hover:shadow-amber-500/10",
    orange: "border-orange-100 hover:border-orange-500 text-slate-500 hover:text-orange-600 bg-white/80 hover:bg-orange-50/50 shadow-2xs hover:shadow-md"
  };

  const arrowColors = {
    light: "text-blue-600",
    dark: "text-amber-500",
    orange: "text-orange-600"
  };

  const getDefaultLabel = () => {
    if (language === "en") return "View Listings";
    if (language === "cn") return "查看房源";
    if (language === "ru") return "Посмотреть объявления";
    return "ดูทรัพย์ทั้งหมด";
  };

  return (
    <div className="flex justify-center items-center py-4 md:py-6 relative z-20">
      <button
        onClick={handleClick}
        className={`flex items-center gap-3 px-6 py-2.5 rounded-full border text-sm font-semibold transition-all duration-300 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${themeClasses[theme]}`}
      >
        <m.span
          animate={{
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {label || getDefaultLabel()}
        </m.span>
        
        {/* Premium Chevron Trail Animation */}
        <div className="flex flex-col items-center h-4 justify-center relative w-4 overflow-visible">
          <m.div
            animate={{
              y: [-4, 1, -4],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute"
          >
            <ChevronDown className={`h-4 w-4 ${arrowColors[theme] || "text-current"}`} />
          </m.div>
          <m.div
            animate={{
              y: [-1, 4, -1],
              opacity: [0.1, 0.6, 0.1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.25,
            }}
            className="absolute"
          >
            <ChevronDown className={`h-3 w-3 ${arrowColors[theme] || "text-current"}`} />
          </m.div>
        </div>
      </button>
    </div>
  );
}

