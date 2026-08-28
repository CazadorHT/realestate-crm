"use client";

import React from "react";
import { Globe } from "lucide-react";
import type { StudioLanguage } from "../types";
import { useLanguage } from "@/lib/i18n/language-context";

interface StudioLanguageBarProps {
  language: StudioLanguage;
  onLanguageChange: (lang: StudioLanguage) => void;
}

export function StudioLanguageBar({ language, onLanguageChange }: StudioLanguageBarProps) {
  const { language: currentLang } = useLanguage();
  const isEn = currentLang === "en";

  return (
    <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <Globe className="h-3.5 w-3.5 text-amber-400" />
        <span>{isEn ? "Banner Language & AI" : "ภาษาภาพ & AI (Language)"}</span>
      </div>
      <div className="flex gap-1">
        {[
          { id: "th", label: isEn ? "TH" : "ไทย", flag: "fi fi-th" },
          { id: "en", label: "EN", flag: "fi fi-gb" },
          { id: "zh", label: "中文", flag: "fi fi-cn" },
          { id: "ru", label: "RU", flag: "fi fi-ru" },
        ].map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onLanguageChange(l.id as StudioLanguage)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
              language === l.id
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-102"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750 hover:text-slate-200"
            }`}
          >
            <span className={`${l.flag} h-3 w-4 rounded-xs shrink-0`} />
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

