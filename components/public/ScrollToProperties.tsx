"use client";

import { ChevronDown } from "lucide-react";

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
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all duration-300 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${themeClasses[theme]}`}
      >
        <span>{label || getDefaultLabel()}</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </button>
    </div>
  );
}

