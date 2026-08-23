"use client";

import React from "react";
import { useLanguage, Language } from "@/components/providers/LanguageProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const languages: {
  code: Language;
  label: string;
  nativeLabel: string;
  flag: string;
}[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" },
  { code: "th", label: "Thai", nativeLabel: "ไทย", flag: "🇹🇭" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  const current = languages.find((l) => l.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-500 font-semibold gap-1.5 transition-all shadow-2xs hover:shadow-xs",
            className,
          )}
          aria-label="Change Language"
        >
          <span className="text-base leading-none">{current.flag}</span>
          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
            {current.code}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 p-1.5 rounded-2xl shadow-xl border border-slate-100 bg-white/95 backdrop-blur-md z-50 animate-in fade-in-80"
      >
        <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Globe className="w-3 h-3 text-slate-400" />
          <span>Select Language</span>
        </div>
        {languages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                isSelected
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
