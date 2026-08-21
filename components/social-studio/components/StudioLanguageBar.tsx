"use client";

import React from "react";
import { Globe } from "lucide-react";
import type { StudioLanguage } from "../types";

interface StudioLanguageBarProps {
  language: StudioLanguage;
  onLanguageChange: (lang: StudioLanguage) => void;
}

export function StudioLanguageBar({ language, onLanguageChange }: StudioLanguageBarProps) {
  return (
    <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
        <Globe className="h-3.5 w-3.5 text-amber-400" />
        <span>ภาษาภาพ & AI (Language)</span>
      </div>
      <div className="flex gap-1">
        {[
          { id: "th", label: "🇹🇭 ไทย" },
          { id: "en", label: "🇬🇧 EN" },
          { id: "zh", label: "🇨🇳 中文" },
          { id: "ru", label: "🇷🇺 RU" },
        ].map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onLanguageChange(l.id as StudioLanguage)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              language === l.id
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-102"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750 hover:text-slate-200"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}
